const db = require('../../models');
const Process = db.process;
const Facility = db.facility;

// Get processes ready for TM Phase 1 (ewm_completed status)
exports.getTMProcesses = async (req, res) => {
  try {
    const { month, year, process_type = 'regular' } = req.query;
    
    const whereClause = { status: 'ewm_completed', process_type };
    if (process_type === 'regular') {
      whereClause.reporting_month = `${month} ${year}`;
    }
    
    const processes = await Process.findAll({
      where: whereClause,
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['id', 'facility_name', 'region_name', 'route'],
        required: false
      }],
      order: [['created_at', 'DESC']]
    });
    
    res.json({ success: true, processes });
  } catch (error) {
    console.error('Get TM processes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Notify TM that goods are ready
exports.notifyTM = async (req, res) => {
  try {
    const { process_id } = req.body;
    
    await Process.update({
      tm_notified_at: new Date(),
      status: 'tm_notified'
    }, {
      where: { id: process_id }
    });
    
    res.json({ success: true, message: 'TM notified successfully' });
  } catch (error) {
    console.error('Notify TM error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// TM Phase 1: Assign vehicle only
exports.createFreightOrder = async (req, res) => {
  try {
    const { process_id, vehicle_id, vehicle_name, tm_officer_id, tm_officer_name } = req.body;
    
    console.log('=== TM PHASE 1: VEHICLE ASSIGNMENT ===');
    console.log('Process ID:', process_id);
    console.log('Vehicle:', vehicle_name);
    console.log('TM Officer:', tm_officer_name);
    console.log('Setting status to: tm_confirmed');
    
    await Process.update({
      vehicle_id,
      vehicle_name,
      tm_confirmed_at: new Date(),
      tm_officer_id,
      tm_officer_name,
      status: 'tm_confirmed'
    }, {
      where: { id: process_id }
    });
    
    // Record service time for TM Phase 1 - Vehicle Assignment
    try {
      // Fetch officer name from employees table, fall back to tm_officer_name param
      let finalOfficerName = 'Unknown Officer';
      if (tm_officer_id) {
        try {
          const employeeQuery = `SELECT full_name FROM employees WHERE id = ?`;
          const [employee] = await db.sequelize.query(employeeQuery, {
            replacements: [tm_officer_id],
            type: db.sequelize.QueryTypes.SELECT
          });
          if (employee && employee.full_name) {
            finalOfficerName = employee.full_name;
          } else if (tm_officer_name && tm_officer_name !== 'null') {
            finalOfficerName = tm_officer_name;
          }
        } catch (err) {
          console.error('Failed to fetch TM officer name:', err);
          if (tm_officer_name && tm_officer_name !== 'null') finalOfficerName = tm_officer_name;
        }
      } else if (tm_officer_name && tm_officer_name !== 'null') {
        finalOfficerName = tm_officer_name;
      }
      let waitingMinutes = 0;
      try {
        const lastServiceQuery = `
          SELECT end_time 
          FROM service_time_hp
          WHERE process_id = ? AND service_unit = 'EWM - Passed to TM Manager'
          ORDER BY created_at DESC 
          LIMIT 1
        `;
        
        const [lastService] = await db.sequelize.query(lastServiceQuery, {
          replacements: [process_id],
          type: db.sequelize.QueryTypes.SELECT
        });
        
        if (lastService && lastService.end_time) {
          const prevTime = new Date(lastService.end_time);
          const currTime = new Date();
          const diffMs = currTime - prevTime;
          waitingMinutes = Math.floor(diffMs / 60000);
          waitingMinutes = waitingMinutes > 0 ? waitingMinutes : 0;
        }
      } catch (err) {
        console.error('Failed to calculate TM Phase 1 waiting time:', err);
      }
      
      const insertQuery = `
        INSERT INTO service_time_hp 
        (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
        VALUES (?, ?, NOW(), ?, ?, ?, ?)
      `;
      
      await db.sequelize.query(insertQuery, {
        replacements: [
          process_id,
          'TM - Vehicle Assignment',
          tm_officer_id,
          finalOfficerName,
          'completed',
          `Vehicle: ${vehicle_name}, waiting time: ${waitingMinutes} minutes`
        ],
        type: db.sequelize.QueryTypes.INSERT
      });
      
      console.log(`✅ TM Phase 1 service time recorded: ${waitingMinutes} minutes`);
    } catch (err) {
      console.error('❌ Failed to record TM Phase 1 service time:', err);
      // Don't fail the confirmation if service time recording fails
    }
    
    console.log('✓ TM Phase 1 vehicle assignment completed');
    
    res.json({ success: true, message: 'Vehicle assigned successfully' });
  } catch (error) {
    console.error('TM Phase 1 error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send freight order back to EWM
exports.sendToEWM = async (req, res) => {
  try {
    const { process_id } = req.body;
    
    await Process.update({
      freight_order_sent_to_ewm_at: new Date(),
      status: 'freight_order_sent_to_ewm'
    }, {
      where: { id: process_id }
    });
    
    res.json({ success: true, message: 'Freight order sent to EWM successfully' });
  } catch (error) {
    console.error('Send to EWM error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get processes ready for vehicle assignment (PI Officer has requested vehicle)
exports.getVehicleAssignmentProcesses = async (req, res) => {
  try {
    const { month, year, process_type = 'regular' } = req.query;

    if (process_type === 'regular') {
      // Regular: only show processes whose routes have a PI vehicle request
      const piRequestsQuery = `
        SELECT DISTINCT pvr.route_id, r.route_name, pvr.requested_at
        FROM pi_vehicle_requests pvr
        INNER JOIN routes r ON r.id = pvr.route_id
        WHERE pvr.month = ? AND pvr.year = ?
        ORDER BY pvr.requested_at DESC
      `;
      const piRequests = await db.sequelize.query(piRequestsQuery, {
        replacements: [month, year],
        type: db.sequelize.QueryTypes.SELECT
      });

      if (piRequests.length === 0) return res.json({ success: true, processes: [] });

      const routeNames = piRequests.map(r => r.route_name);

      const processes = await Process.findAll({
        where: { status: 'biller_completed', process_type: 'regular', reporting_month: `${month} ${year}` },
        include: [{
          model: Facility,
          as: 'facility',
          attributes: ['id', 'facility_name', 'region_name', 'route'],
          where: { route: routeNames },
          required: true
        }],
        order: [['created_at', 'DESC']]
      });

      return res.json({ success: true, processes });
    }

    // Emergency / Breakdown: show processes that have a PI vehicle request (by process_id)
    const piRequestsQuery = `
      SELECT pvr.process_id
      FROM pi_vehicle_requests pvr
      WHERE pvr.process_id IS NOT NULL
    `;
    const piRequests = await db.sequelize.query(piRequestsQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    const requestedProcessIds = piRequests.map(r => r.process_id);

    if (requestedProcessIds.length === 0) return res.json({ success: true, processes: [] });

    const { Op } = require('sequelize');
    const processes = await Process.findAll({
      where: {
        status: 'biller_completed',
        process_type,
        id: { [Op.in]: requestedProcessIds }
      },
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['id', 'facility_name', 'region_name', 'route'],
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, processes });
  } catch (error) {
    console.error('Get vehicle assignment processes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// TM Phase 2: Assign driver and deliverer
exports.assignVehicle = async (req, res) => {
  try {
    const { process_id, driver_id, driver_name, deliverer_id, deliverer_name, departure_kilometer, tm_officer_id, tm_officer_name } = req.body;
    
    console.log('=== TM PHASE 2: DRIVER & DELIVERER ASSIGNMENT ===');
    console.log('Process ID:', process_id);
    console.log('Driver:', driver_name);
    console.log('Deliverer:', deliverer_name);
    console.log('Departure Kilometer:', departure_kilometer);
    console.log('TM Officer:', tm_officer_name);
    
    await Process.update({
      driver_id,
      driver_name,
      deliverer_id,
      deliverer_name,
      departure_kilometer: departure_kilometer ? parseFloat(departure_kilometer) : null,
      driver_assigned_at: new Date(),
      status: 'driver_assigned'
    }, {
      where: { id: process_id }
    });
    
    // Record service time for TM Phase 2 - Driver & Deliverer Assignment
    try {
      // Fetch officer name from employees table, fall back to tm_officer_name param
      let finalOfficerName = 'Unknown Officer';
      if (tm_officer_id) {
        try {
          const employeeQuery = `SELECT full_name FROM employees WHERE id = ?`;
          const [employee] = await db.sequelize.query(employeeQuery, {
            replacements: [tm_officer_id],
            type: db.sequelize.QueryTypes.SELECT
          });
          if (employee && employee.full_name) {
            finalOfficerName = employee.full_name;
          } else if (tm_officer_name && tm_officer_name !== 'null') {
            finalOfficerName = tm_officer_name;
          }
        } catch (err) {
          console.error('Failed to fetch TM officer name:', err);
          if (tm_officer_name && tm_officer_name !== 'null') finalOfficerName = tm_officer_name;
        }
      } else if (tm_officer_name && tm_officer_name !== 'null') {
        finalOfficerName = tm_officer_name;
      }
      
      // Calculate waiting time from EWM Phase 2 completion
      let waitingMinutes = 0;
      try {
        const lastServiceQuery = `
          SELECT end_time 
          FROM service_time_hp
          WHERE process_id = ? AND service_unit = 'EWM - Goods Issue'
          ORDER BY created_at DESC 
          LIMIT 1
        `;
        
        const [lastService] = await db.sequelize.query(lastServiceQuery, {
          replacements: [process_id],
          type: db.sequelize.QueryTypes.SELECT
        });
        
        if (lastService && lastService.end_time) {
          const prevTime = new Date(lastService.end_time);
          const currTime = new Date();
          const diffMs = currTime - prevTime;
          waitingMinutes = Math.floor(diffMs / 60000);
          waitingMinutes = waitingMinutes > 0 ? waitingMinutes : 0;
        }
      } catch (err) {
        console.error('Failed to calculate TM Phase 2 waiting time:', err);
      }
      
      const insertQuery = `
        INSERT INTO service_time_hp 
        (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
        VALUES (?, ?, NOW(), ?, ?, ?, ?)
      `;
      
      await db.sequelize.query(insertQuery, {
        replacements: [
          process_id,
          'TM - Driver & Deliverer Assignment',
          tm_officer_id,
          finalOfficerName,
          'completed',
          `Driver: ${driver_name}, Deliverer: ${deliverer_name}, waiting time: ${waitingMinutes} minutes`
        ],
        type: db.sequelize.QueryTypes.INSERT
      });
      
      console.log(`✅ TM Phase 2 service time recorded: ${waitingMinutes} minutes`);
    } catch (err) {
      console.error('❌ Failed to record TM Phase 2 service time:', err);
    }
    
    console.log('✓ TM Phase 2 driver & deliverer assignment completed');
    
    res.json({ success: true, message: 'Driver and deliverer assigned successfully' });
  } catch (error) {
    console.error('TM Phase 2 error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
