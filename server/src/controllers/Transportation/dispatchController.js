const db = require('../../models');
const { Op } = require('sequelize');

// Get routes assigned for dispatch — grouped by route (all process types combined)
const getDispatchRoutes = async (req, res) => {
  try {
    const { month, year } = req.query;
    const branchCode = req.headers['x-branch-code'] || null;
    const accountType = req.headers['x-account-type'] || null;
    const reportingMonth = `${month} ${year}`;
    const branchFilter = (accountType !== 'Super Admin' && branchCode) ? `AND f.branch_code = '${branchCode}'` : '';

    const ETH_MONTHS = ['Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'];
    const monthIndex = ETH_MONTHS.indexOf(month);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';

    // Group by route — show routes that have at least one driver_assigned process
    const routesQuery = `
      SELECT
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'driver_assigned' THEN f.id END) as ready_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'dispatch_completed' THEN f.id END) as completed_facilities,
        MAX(p.vehicle_name) as vehicle_name,
        MAX(p.driver_name) as driver_name,
        MAX(p.deliverer_name) as deliverer_name
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
        AND (f.period = 'Monthly' OR f.period = ?)
        ${branchFilter}
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
        AND p.status IN ('driver_assigned', 'dispatch_completed')
      WHERE f.route IS NOT NULL
      GROUP BY r.id, r.route_name
      HAVING ready_facilities > 0
      ORDER BY r.route_name
    `;

    const routes = await db.sequelize.query(routesQuery, {
      replacements: [currentPeriod, reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    const routesWithFacilities = await Promise.all(routes.map(async (route) => {
      const facilitiesQuery = `
        SELECT
          f.id, f.facility_name,
          COALESCE(p_reg.status, p_vac.status, 'no_process') as process_status,
          CASE WHEN p_vac.id IS NOT NULL AND p_reg.id IS NULL THEN 'vaccine'
               WHEN p_reg.id IS NOT NULL THEN 'regular'
               ELSE NULL END as process_type
        FROM facilities f
        LEFT JOIN processes p_reg ON p_reg.facility_id = f.id AND p_reg.reporting_month = ? AND p_reg.process_type = 'regular'
        LEFT JOIN processes p_vac ON p_vac.facility_id = f.id AND p_vac.reporting_month = ? AND p_vac.process_type = 'vaccine'
        WHERE f.route = ? AND (f.period = 'Monthly' OR f.period = ?)
        ${branchFilter}
        ORDER BY f.facility_name
      `;
      const facilities = await db.sequelize.query(facilitiesQuery, {
        replacements: [reportingMonth, reportingMonth, route.route_name, currentPeriod],
        type: db.sequelize.QueryTypes.SELECT
      });
      return { ...route, facilities };
    }));

    res.json({ routes: routesWithFacilities });
  } catch (error) {
    console.error('Error fetching dispatch routes:', error);
    res.status(500).json({ error: 'Failed to fetch dispatch routes', details: error.message });
  }
};

// Get statistics for dispatch management
const getDispatchStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportingMonth = `${month} ${year}`;

    console.log('Dispatch stats request:', { month, year, reportingMonth });

    // Get total assigned routes (with vehicles)
    const totalAssignedQuery = `
      SELECT COUNT(DISTINCT p.id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE p.reporting_month = ? 
        AND p.status = 'driver_assigned'
        AND p.vehicle_id IS NOT NULL
        AND p.driver_id IS NOT NULL
    `;

    // Get completed dispatches (with vehicles)
    const completedDispatchesQuery = `
      SELECT COUNT(DISTINCT p.id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE p.reporting_month = ? 
        AND p.status = 'dispatch_completed'
        AND p.vehicle_id IS NOT NULL
        AND p.driver_id IS NOT NULL
    `;

    const totalResult = await db.sequelize.query(totalAssignedQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    const completedResult = await db.sequelize.query(completedDispatchesQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    const stats = {
      totalAssigned: totalResult[0]?.count || 0,
      completedDispatches: completedResult[0]?.count || 0
    };

    console.log('Dispatch stats result:', stats);

    res.json(stats);

  } catch (error) {
    console.error('Error fetching dispatch stats:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch dispatch stats', details: error.message });
  }
};

// Complete dispatch for a route assignment
const completeDispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed_by } = req.body;

    // Validation
    if (!completed_by) {
      return res.status(400).json({ 
        error: 'completed_by is required' 
      });
    }

    // Check if assignment exists
    const assignment = await db.sequelize.query(
      'SELECT * FROM route_assignments WHERE id = ?',
      {
        replacements: [id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (assignment.length === 0) {
      return res.status(404).json({ 
        error: 'Route assignment not found' 
      });
    }

    if (assignment[0].status === 'Completed') {
      return res.status(400).json({ 
        error: 'Dispatch already completed' 
      });
    }

    // Update assignment status to completed
    const updateQuery = `
      UPDATE route_assignments 
      SET status = 'Completed', 
          completed_at = NOW(),
          completed_by = ?
      WHERE id = ?
    `;

    await db.sequelize.query(updateQuery, {
      replacements: [completed_by, id],
      type: db.sequelize.QueryTypes.UPDATE
    });

    // Also update all processes for this route assignment to dispatch_completed
    const updateProcessesQuery = `
      UPDATE processes p
      INNER JOIN facilities f ON f.id = p.facility_id
      INNER JOIN routes r ON r.route_name = f.route
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      SET p.status = 'dispatch_completed', p.dispatch_completed_at = NOW()
      WHERE ra.id = ? AND p.status = 'driver_assigned'
    `;
    await db.sequelize.query(updateProcessesQuery, {
      replacements: [id],
      type: db.sequelize.QueryTypes.UPDATE
    });

    // Record service time for Dispatch Phase
    try {
      // Get all processes for this route to record service times
      const processesQuery = `
        SELECT DISTINCT p.id, p.facility_id
        FROM processes p
        INNER JOIN facilities f ON f.id = p.facility_id
        INNER JOIN routes r ON r.route_name = f.route
        INNER JOIN route_assignments ra ON ra.route_id = r.id
        WHERE ra.id = ? AND p.status = 'driver_assigned'
      `;

      const processes = await db.sequelize.query(processesQuery, {
        replacements: [id],
        type: db.sequelize.QueryTypes.SELECT
      });

      // Fetch officer name: try employees table first, then users table
      let officerName = 'Unknown Officer';
      try {
        const employeeQuery = `SELECT full_name FROM employees WHERE id = ?`;
        const [employee] = await db.sequelize.query(employeeQuery, {
          replacements: [completed_by],
          type: db.sequelize.QueryTypes.SELECT
        });
        if (employee && employee.full_name) {
          officerName = employee.full_name;
        } else {
          const userQuery = `SELECT full_name FROM users WHERE id = ?`;
          const [user] = await db.sequelize.query(userQuery, {
            replacements: [completed_by],
            type: db.sequelize.QueryTypes.SELECT
          });
          if (user && user.full_name) officerName = user.full_name;
        }
      } catch (err) {
        console.error('Failed to fetch Dispatcher name:', err);
      }

      // Record service time for each process
      for (const process of processes) {
        try {
          let waitingMinutes = 0;
          try {
            // Look for the last service time recorded (should be TM - Driver & Deliverer Assignment)
            const lastServiceQuery = `
              SELECT end_time 
              FROM service_time_hp
              WHERE process_id = ?
              ORDER BY created_at DESC 
              LIMIT 1
            `;
            
            const [lastService] = await db.sequelize.query(lastServiceQuery, {
              replacements: [process.id],
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
            console.error('Failed to calculate Dispatch waiting time:', err);
          }
          
          const insertQuery = `
            INSERT INTO service_time_hp 
            (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
            VALUES (?, ?, NOW(), ?, ?, ?, ?)
          `;
          
          await db.sequelize.query(insertQuery, {
            replacements: [
              process.id,
              'Dispatch - Route Completed',
              completed_by,
              officerName,
              'completed',
              `Dispatch Phase completed, waiting time: ${waitingMinutes} minutes`
            ],
            type: db.sequelize.QueryTypes.INSERT
          });
        } catch (err) {
          console.error(`Failed to record service time for process ${process.id}:`, err);
        }
      }
      
      console.log(`✅ Dispatch service times recorded for ${processes.length} processes`);
    } catch (err) {
      console.error('❌ Failed to record Dispatch service times:', err);
      // Don't fail the completion if service time recording fails
    }

    res.json({
      message: 'Dispatch completed successfully',
      assignment_id: id
    });

  } catch (error) {
    console.error('Error completing dispatch:', error);
    res.status(500).json({ error: 'Failed to complete dispatch' });
  }
};
// Complete dispatch for ALL processes in a route (HP workflow)
const completeDispatchHP = async (req, res) => {
  try {
    const { route_name, reporting_month, completed_by } = req.body;

    if (!route_name || !reporting_month || !completed_by) {
      return res.status(400).json({ error: 'route_name, reporting_month, and completed_by are required' });
    }

    // Fetch officer name
    let officerName = 'Unknown Officer';
    try {
      const [emp] = await db.sequelize.query(`SELECT full_name FROM employees WHERE id = ?`, {
        replacements: [completed_by], type: db.sequelize.QueryTypes.SELECT
      });
      if (emp?.full_name) { officerName = emp.full_name; }
      else {
        const [usr] = await db.sequelize.query(`SELECT full_name FROM users WHERE id = ?`, {
          replacements: [completed_by], type: db.sequelize.QueryTypes.SELECT
        });
        if (usr?.full_name) officerName = usr.full_name;
      }
    } catch (e) {}

    // Get all driver_assigned processes in this route
    const processes = await db.sequelize.query(`
      SELECT p.id FROM processes p
      INNER JOIN facilities f ON f.id = p.facility_id
      WHERE f.route = ? AND p.reporting_month = ? AND p.status = 'driver_assigned'
    `, { replacements: [route_name, reporting_month], type: db.sequelize.QueryTypes.SELECT });

    if (processes.length === 0) {
      return res.status(404).json({ error: 'No driver_assigned processes found for this route' });
    }

    const processIds = processes.map(p => p.id);

    // Update all to dispatch_completed
    await db.sequelize.query(`
      UPDATE processes SET status = 'dispatch_completed', dispatch_completed_at = NOW()
      WHERE id IN (${processIds.map(() => '?').join(',')})
    `, { replacements: processIds, type: db.sequelize.QueryTypes.UPDATE });

    // Record service time for each
    for (const p of processes) {
      try {
        let waitingMinutes = 0;
        const [last] = await db.sequelize.query(
          `SELECT end_time FROM service_time_hp WHERE process_id = ? ORDER BY created_at DESC LIMIT 1`,
          { replacements: [p.id], type: db.sequelize.QueryTypes.SELECT }
        );
        if (last?.end_time) {
          waitingMinutes = Math.max(0, Math.floor((new Date() - new Date(last.end_time)) / 60000));
        }
        await db.sequelize.query(
          `INSERT INTO service_time_hp (process_id, service_unit, end_time, officer_id, officer_name, status, notes) VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
          { replacements: [p.id, 'Dispatcher - HP', completed_by, officerName, 'completed', `Dispatch completed for route: ${route_name}, waiting: ${waitingMinutes} min`], type: db.sequelize.QueryTypes.INSERT }
        );
      } catch (e) { console.error('Service time error for process', p.id, e); }
    }

    res.json({ success: true, message: `Dispatch completed for ${processIds.length} processes in route ${route_name}` });
  } catch (error) {
    console.error('Error completing dispatch:', error);
    res.status(500).json({ success: false, error: 'Failed to complete dispatch', details: error.message });
  }
};

module.exports = {
  getDispatchRoutes,
  getDispatchStats,
  completeDispatch,
  completeDispatchHP
};
