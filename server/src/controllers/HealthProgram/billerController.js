const db = require('../../models');
const Process = db.process;
const Facility = db.facility;
const { Op } = require('sequelize');

// Get processes ready for Biller (EWM goods issued), scoped to the Biller's store
exports.getBillerProcesses = async (req, res) => {
  try {
    const { month, year, process_type = 'regular' } = req.query;
    const billerStore = req.headers['x-store'] || null;

    // Vaccine can come from tm_confirmed (skips EWM goods issue step)
    const validStatuses = process_type === 'vaccine'
      ? ['ewm_goods_issued', 'tm_confirmed']
      : ['ewm_goods_issued'];

    const whereClause = { status: { [Op.in]: validStatuses }, process_type };
    if (process_type === 'regular') {
      whereClause.reporting_month = `${month} ${year}`;
    }

    // If a store is provided, filter processes whose EWM officer belongs to that store
    if (billerStore) {
      // Get employee IDs that belong to this store
      const storeEmployeesQuery = `
        SELECT e.id FROM employees e
        INNER JOIN stores s ON e.store_id = s.id
        WHERE s.store_name = ?
      `;
      const storeEmployees = await db.sequelize.query(storeEmployeesQuery, {
        replacements: [billerStore],
        type: db.sequelize.QueryTypes.SELECT
      });
      const employeeIds = storeEmployees.map(e => e.id);

      if (employeeIds.length > 0) {
        whereClause.ewm_goods_issued_by_id = { [Op.in]: employeeIds };
      } else {
        // No employees in this store — return empty
        return res.json({ success: true, processes: [] });
      }
    }

    const processes = await Process.findAll({
      where: whereClause,
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['id', 'facility_name', 'region_name', 'route']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, processes });
  } catch (error) {
    console.error('Get Biller processes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Receive goods at Biller
exports.receiveGoods = async (req, res) => {
  try {
    const { process_id, biller_officer_id, biller_officer_name } = req.body;
    
    await Process.update({
      biller_received_at: new Date(),
      biller_officer_id,
      biller_officer_name,
      biller_status: 'pending',
      status: 'biller_received'
    }, {
      where: { id: process_id }
    });
    
    // Record service time for Biller Phase - Goods Received
    try {
      // Fetch officer name from employees table, fall back to biller_officer_name param
      let finalOfficerName = 'Unknown Officer';
      if (biller_officer_id) {
        try {
          const employeeQuery = `SELECT full_name FROM employees WHERE id = ?`;
          const [employee] = await db.sequelize.query(employeeQuery, {
            replacements: [biller_officer_id],
            type: db.sequelize.QueryTypes.SELECT
          });
          if (employee && employee.full_name) {
            finalOfficerName = employee.full_name;
          } else if (biller_officer_name && biller_officer_name !== 'null') {
            finalOfficerName = biller_officer_name;
          }
        } catch (err) {
          console.error('Failed to fetch Biller officer name:', err);
          if (biller_officer_name && biller_officer_name !== 'null') finalOfficerName = biller_officer_name;
        }
      } else if (biller_officer_name && biller_officer_name !== 'null') {
        finalOfficerName = biller_officer_name;
      }
      
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
        console.error('Failed to calculate Biller waiting time:', err);
      }
      
      const insertQuery = `
        INSERT INTO service_time_hp 
        (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
        VALUES (?, ?, NOW(), ?, ?, ?, ?)
      `;
      
      await db.sequelize.query(insertQuery, {
        replacements: [
          process_id,
          'Biller - Goods Received',
          biller_officer_id,
          finalOfficerName,
          'completed',
          `Biller Phase 1 completed, waiting time: ${waitingMinutes} minutes`
        ],
        type: db.sequelize.QueryTypes.INSERT
      });
      
      console.log(`✅ Biller Phase 1 service time recorded: ${waitingMinutes} minutes`);
    } catch (err) {
      console.error('❌ Failed to record Biller Phase 1 service time:', err);
      // Don't fail the completion if service time recording fails
    }
    
    res.json({ success: true, message: 'Goods received at Biller successfully' });
  } catch (error) {
    console.error('Receive goods error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Print documents - NO service time tracking for this phase
exports.printDocuments = async (req, res) => {
  try {
    const { process_id } = req.body;
    
    await Process.update({
      biller_printed_at: new Date(),
      biller_status: 'completed',
      status: 'biller_completed'
    }, {
      where: { id: process_id }
    });
    
    res.json({ success: true, message: 'Documents printed successfully' });
  } catch (error) {
    console.error('Print documents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
