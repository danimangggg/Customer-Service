const db = require('../../models');
const { Op } = require('sequelize');

// Get routes assigned for dispatch (routes with vehicle assignments)
const getDispatchRoutes = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = '', process_type = 'regular' } = req.query;
    const offset = (page - 1) * limit;

    const isEmergencyOrBreakdown = process_type === 'emergency' || process_type === 'breakdown' || process_type === 'vaccine';

    if (isEmergencyOrBreakdown) {
      // Emergency/Breakdown: no route join, no reporting_month filter
      const query = `
        SELECT 
          p.id as process_id,
          NULL as route_id,
          f.facility_name as route_name,
          p.status as process_status,
          p.created_at as assigned_at,
          p.vehicle_name,
          v.plate_number,
          p.driver_name,
          p.deliverer_name,
          f.facility_name,
          f.id as facility_id
        FROM processes p
        INNER JOIN facilities f ON p.facility_id = f.id
        LEFT JOIN vehicles v ON p.vehicle_id = v.id
        WHERE p.process_type = ?
          AND p.status IN ('driver_assigned', 'dispatch_completed')
          AND p.driver_id IS NOT NULL
          AND p.vehicle_id IS NOT NULL
          ${search ? 'AND f.facility_name LIKE ?' : ''}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      let queryParams = [process_type];
      if (search) queryParams.push(`%${search}%`);
      queryParams.push(parseInt(limit), parseInt(offset));

      const routes = await db.sequelize.query(query, {
        replacements: queryParams,
        type: db.sequelize.QueryTypes.SELECT
      });

      // Each row is its own "route" (single facility)
      const routesWithFacilities = routes.map(r => ({
        ...r,
        facilities: [{ id: r.facility_id, facility_name: r.facility_name }]
      }));

      return res.json({ routes: routesWithFacilities, totalCount: routes.length, currentPage: parseInt(page), totalPages: 1 });
    }

    // Regular: existing route-based logic
    const reportingMonth = `${month} ${year}`;
    console.log('Dispatch routes request:', { month, year, page, limit, search });
    console.log('Looking for reporting month:', reportingMonth);

    const query = `
      SELECT DISTINCT 
        p.id as process_id,
        r.id as route_id,
        r.route_name,
        p.status as process_status,
        p.created_at as assigned_at,
        p.vehicle_name,
        v.plate_number,
        p.driver_name,
        p.deliverer_name,
        f.facility_name,
        f.id as facility_id,
        COUNT(DISTINCT f.id) as total_facilities
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.reporting_month = ?
        AND p.status = 'driver_assigned'
        AND p.driver_id IS NOT NULL
        AND p.vehicle_id IS NOT NULL
        ${search ? 'AND (r.route_name LIKE ? OR f.facility_name LIKE ?)' : ''}
      GROUP BY p.id, r.id, r.route_name, p.status, p.created_at, p.vehicle_name, v.plate_number, p.driver_name, p.deliverer_name, f.facility_name, f.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      WHERE p.reporting_month = ?
        AND p.status = 'driver_assigned'
        AND p.driver_id IS NOT NULL
        AND p.vehicle_id IS NOT NULL
        ${search ? 'AND (r.route_name LIKE ? OR f.facility_name LIKE ?)' : ''}
    `;

    let queryParams = [reportingMonth];
    let countParams = [reportingMonth];

    if (search) {
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    queryParams.push(parseInt(limit), parseInt(offset));

    const routes = await db.sequelize.query(query, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${routes.length} routes`);

    const routesWithFacilities = await Promise.all(routes.map(async (route) => {
      const facilitiesQuery = `
        SELECT DISTINCT 
          f.id,
          f.facility_name
        FROM facilities f
        INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
        WHERE f.route = ? AND p.status = 'driver_assigned'
        ORDER BY f.facility_name
      `;

      const facilities = await db.sequelize.query(facilitiesQuery, {
        replacements: [reportingMonth, route.route_name],
        type: db.sequelize.QueryTypes.SELECT
      });

      return { ...route, facilities };
    }));

    const countResult = await db.sequelize.query(countQuery, {
      replacements: countParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    const totalCount = countResult[0]?.total || 0;

    res.json({
      routes: routesWithFacilities,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });

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
// Complete dispatch for a process (HP workflow) - NEW VERSION
const completeDispatchHP = async (req, res) => {
  try {
    const { id } = req.params; // This is now process_id
    const { completed_by } = req.body;

    console.log('=== COMPLETING DISPATCH (HP) ===');
    console.log('Process ID:', id);
    console.log('Completed by:', completed_by);

    // Validation
    if (!completed_by) {
      return res.status(400).json({ 
        error: 'completed_by is required' 
      });
    }

    // Check if process exists
    const Process = db.process;
    const process = await Process.findByPk(id);

    if (!process) {
      return res.status(404).json({ 
        error: 'Process not found' 
      });
    }

    if (process.status === 'dispatch_completed') {
      return res.status(400).json({ 
        error: 'Dispatch already completed' 
      });
    }

    // Update process status to dispatch_completed
    await Process.update({
      status: 'dispatch_completed',
      dispatch_completed_at: new Date()
    }, {
      where: { id: id }
    });

    console.log('✓ Process status updated to dispatch_completed');

    // Record service time for Dispatcher - HP
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
          replacements: [id],
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

      const insertQuery = `
        INSERT INTO service_time_hp 
        (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
        VALUES (?, ?, NOW(), ?, ?, ?, ?)
      `;
      
      await db.sequelize.query(insertQuery, {
        replacements: [
          id,
          'Dispatcher - HP',
          completed_by,
          officerName,
          'completed',
          `Dispatch completed, waiting time: ${waitingMinutes} minutes`
        ],
        type: db.sequelize.QueryTypes.INSERT
      });

      console.log(`✅ Dispatcher - HP service time recorded: ${waitingMinutes} minutes`);
    } catch (err) {
      console.error('❌ Failed to record Dispatcher service time:', err);
      // Don't fail the completion if service time recording fails
    }

    res.json({
      success: true,
      message: 'Dispatch completed successfully',
      process_id: id
    });

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
