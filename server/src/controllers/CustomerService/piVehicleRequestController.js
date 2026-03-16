const db = require('../../models');
const { Op } = require('sequelize');

// Get PI vehicle requests - only show routes where ALL facilities have biller_completed status
const getPIVehicleRequests = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build the reporting month string
    const reportingMonth = `${month} ${year}`;

    console.log('=== PI Vehicle Requests API Called ===');
    console.log('Request params:', { month, year, page, limit, search });
    console.log('Reporting month:', reportingMonth);
    console.log('==========================================');

    // Check if pi_vehicle_requests table exists
    try {
      await db.sequelize.query('SELECT 1 FROM pi_vehicle_requests LIMIT 1', {
        type: db.sequelize.QueryTypes.SELECT
      });
      console.log('✓ pi_vehicle_requests table exists');
    } catch (tableError) {
      console.error('❌ pi_vehicle_requests table does not exist:', tableError.message);
      return res.status(500).json({ 
        error: 'Database table missing',
        details: 'pi_vehicle_requests table does not exist. Please run database migrations.'
      });
    }

    // Determine current period for filtering facilities
    const ethiopianMonths = [
      'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
    ];
    const monthIndex = ethiopianMonths.indexOf(month);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';

    // Query to show ALL routes with their current status
    // PI should only see routes where ALL facilities have biller_completed status
    const query = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities_in_route,
        COUNT(DISTINCT CASE WHEN p.status = 'biller_completed' THEN f.id END) as biller_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities,
        COUNT(DISTINCT CASE WHEN p.status IS NULL OR (p.status != 'biller_completed' AND p.status != 'vehicle_requested') THEN f.id END) as pending_facilities,
        CASE WHEN pvr.route_id IS NOT NULL OR MAX(CASE WHEN p.status = 'vehicle_requested' THEN 1 ELSE 0 END) = 1 THEN 1 ELSE 0 END as vehicle_requested,
        CASE WHEN COUNT(DISTINCT f.id) = COUNT(DISTINCT CASE WHEN p.status = 'biller_completed' THEN f.id END) + COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) THEN 1 ELSE 0 END as all_facilities_ready
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
        AND (f.period = 'Monthly' OR f.period = ?)
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      LEFT JOIN pi_vehicle_requests pvr ON pvr.route_id = r.id AND pvr.month = ? AND pvr.year = ?
      WHERE f.route IS NOT NULL 
        ${search ? 'AND r.route_name LIKE ?' : ''}
      GROUP BY r.id, r.route_name, pvr.route_id
      HAVING total_facilities_in_route > 0
      ORDER BY all_facilities_ready DESC, r.route_name
      LIMIT ? OFFSET ?
    `;

    let queryParams = [currentPeriod, reportingMonth, month, year];

    if (search) {
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern);
    }

    queryParams.push(parseInt(limit), parseInt(offset));

    console.log('Executing query with params:', queryParams);

    const routes = await db.sequelize.query(query, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${routes.length} routes`);
    
    // Add detailed logging for debugging
    routes.forEach(route => {
      console.log(`Route: ${route.route_name}, Total Facilities: ${route.total_facilities_in_route}, Biller Completed: ${route.biller_completed_facilities}, Vehicle Requested: ${route.vehicle_requested_facilities}`);
    });

    // For each route, get the facilities and their ODNs
    const routesWithDetails = await Promise.all(routes.map(async (route) => {
      // Get ALL facilities for this route with their process status (including those without processes)
      const facilitiesQuery = `
        SELECT DISTINCT 
          f.id,
          f.facility_name,
          COALESCE(p.status, 'no_process') as process_status
        FROM facilities f
        LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
        WHERE f.route = ?
          AND (f.period = 'Monthly' OR f.period = ?)
        ORDER BY f.facility_name
      `;

      const facilities = await db.sequelize.query(facilitiesQuery, {
        replacements: [reportingMonth, route.route_name, currentPeriod],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log(`Route ${route.route_name} facilities:`, facilities.map(f => `${f.facility_name} (${f.process_status})`).join(', '));

      // For each facility, get its ODNs
      const facilitiesWithODNs = await Promise.all(facilities.map(async (facility) => {
        const odnsQuery = `
          SELECT odn_number
          FROM odns o
          INNER JOIN processes p ON p.id = o.process_id
          WHERE p.facility_id = ? AND p.reporting_month = ?
          ORDER BY o.odn_number
        `;

        const odns = await db.sequelize.query(odnsQuery, {
          replacements: [facility.id, reportingMonth],
          type: db.sequelize.QueryTypes.SELECT
        });

        return {
          id: facility.id,
          facility_name: facility.facility_name,
          process_status: facility.process_status,
          odns: odns
        };
      }));

      return {
        ...route,
        facilities: facilitiesWithODNs
      };
    }));

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM (
        SELECT r.id
        FROM routes r
        INNER JOIN facilities f ON f.route = r.route_name
          AND (f.period = 'Monthly' OR f.period = ?)
        WHERE f.route IS NOT NULL 
          ${search ? 'AND r.route_name LIKE ?' : ''}
        GROUP BY r.id
        HAVING COUNT(DISTINCT f.id) > 0
      ) as route_count
    `;

    let countParams = [currentPeriod];
    if (search) {
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern);
    }

    const countResult = await db.sequelize.query(countQuery, {
      replacements: countParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    const totalCount = countResult[0]?.total || 0;

    console.log(`Returning ${routesWithDetails.length} routes with details, total count: ${totalCount}`);

    res.json({
      routes: routesWithDetails,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error('Error fetching PI vehicle requests:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch PI vehicle requests',
      details: error.message
    });
  }
};

// Get statistics for PI vehicle requests
const getPIVehicleRequestStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportingMonth = `${month} ${year}`;

    console.log('PI Vehicle Request Stats - Request params:', { month, year, reportingMonth });

    // Determine current period
    const ethiopianMonths = [
      'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
    ];
    const monthIndex = ethiopianMonths.indexOf(month);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';

    // Get total routes ready for vehicle request (ALL facilities ewm_completed) or already requested (ALL facilities vehicle_requested)
    const totalRoutesQuery = `
      SELECT COUNT(*) as count
      FROM (
        SELECT r.id
        FROM routes r
        INNER JOIN facilities f ON f.route = r.route_name
          AND (f.period = 'Monthly' OR f.period = ?)
        LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
        WHERE f.route IS NOT NULL
        GROUP BY r.id
        HAVING COUNT(DISTINCT f.id) > 0
      ) as route_count
    `;

    // Get requested routes count
    const requestedRoutesQuery = `
      SELECT COUNT(DISTINCT route_id) as count
      FROM pi_vehicle_requests
      WHERE month = ? AND year = ?
    `;

    const [totalResult, requestedResult] = await Promise.all([
      db.sequelize.query(totalRoutesQuery, {
        replacements: [currentPeriod, reportingMonth],
        type: db.sequelize.QueryTypes.SELECT
      }),
      db.sequelize.query(requestedRoutesQuery, {
        replacements: [month, year],
        type: db.sequelize.QueryTypes.SELECT
      })
    ]);

    const stats = {
      totalRoutes: totalResult[0]?.count || 0,
      requestedRoutes: requestedResult[0]?.count || 0
    };

    console.log('PI Vehicle Request Stats result:', stats);

    res.json(stats);

  } catch (error) {
    console.error('Error fetching PI vehicle request stats:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message
    });
  }
};

// Submit vehicle request for a route
const submitVehicleRequest = async (req, res) => {
  try {
    const { route_id, month, year, requested_by } = req.body;

    // Validation
    if (!route_id || !month || !year || !requested_by) {
      return res.status(400).json({ 
        error: 'Route ID, month, year, and requested_by are required' 
      });
    }

    // Check if request already exists
    const existingRequest = await db.sequelize.query(
      'SELECT id FROM pi_vehicle_requests WHERE route_id = ? AND month = ? AND year = ? AND status IN ("pending", "approved")',
      {
        replacements: [route_id, month, year],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (existingRequest.length > 0) {
      return res.status(400).json({ 
        error: 'An active vehicle request already exists for this route and period. Please wait for approval or cancel the previous request.',
        existingRequestId: existingRequest[0].id
      });
    }

    // Verify that ALL facilities in this route (for the current period) have biller_completed status
    const reportingMonth = `${month} ${year}`;
    
    // Determine current period
    const ethiopianMonths = [
      'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
    ];
    const monthIndex = ethiopianMonths.indexOf(month);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';
    
    const verificationQuery = `
      SELECT 
        COUNT(DISTINCT f.id) as total_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'biller_completed' THEN f.id END) as biller_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
        AND (f.period = 'Monthly' OR f.period = ?)
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE r.id = ? AND f.route IS NOT NULL
    `;

    const verification = await db.sequelize.query(verificationQuery, {
      replacements: [currentPeriod, reportingMonth, route_id],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('Vehicle request verification:', verification[0]);

    if (!verification[0] || verification[0].total_facilities === 0) {
      return res.status(400).json({ 
        error: 'No facilities found for this route in the specified period' 
      });
    }

    // Check if ALL facilities have biller_completed status (not vehicle_requested yet)
    if (verification[0].total_facilities !== verification[0].biller_completed_facilities) {
      return res.status(400).json({ 
        error: `Not all facilities in this route have completed Biller process. Total: ${verification[0].total_facilities}, Biller Completed: ${verification[0].biller_completed_facilities}`,
        details: {
          total_facilities: verification[0].total_facilities,
          biller_completed: verification[0].biller_completed_facilities,
          vehicle_requested: verification[0].vehicle_requested_facilities
        }
      });
    }

    // Create the vehicle request record
    const insertQuery = `
      INSERT INTO pi_vehicle_requests (route_id, month, year, requested_by, requested_at, status)
      VALUES (?, ?, ?, ?, NOW(), 'requested')
    `;

    await db.sequelize.query(insertQuery, {
      replacements: [route_id, month, year, requested_by],
      type: db.sequelize.QueryTypes.INSERT
    });

    // DO NOT update process status - PI Officer only records service time, doesn't change status
    // The process remains at biller_completed for TM Manager Phase 2 to find it

    // Record service time for PI Officer Phase - Vehicle Requested
    try {
      console.log(`\n=== PI OFFICER SERVICE TIME RECORDING ===`);
      console.log(`Route ID: ${route_id}`);
      console.log(`Reporting Month: ${reportingMonth}`);
      
      // Get all processes for this route to record service times
      // First get the route name
      const routeNameQuery = `SELECT route_name FROM routes WHERE id = ?`;
      const [routeRecord] = await db.sequelize.query(routeNameQuery, {
        replacements: [route_id],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      if (!routeRecord) {
        console.log(`❌ Route ID ${route_id} not found in routes table`);
        throw new Error(`Route ID ${route_id} not found`);
      }
      
      const routeName = routeRecord.route_name;
      console.log(`Route Name: ${routeName}`);
      
      const processesQuery = `
        SELECT DISTINCT p.id, p.facility_id
        FROM processes p
        INNER JOIN facilities f ON f.id = p.facility_id
        WHERE f.route = ? AND p.reporting_month = ? AND p.status = 'biller_completed'
      `;

      console.log(`Executing query to find processes with biller_completed status...`);
      const processes = await db.sequelize.query(processesQuery, {
        replacements: [routeName, reportingMonth],
        type: db.sequelize.QueryTypes.SELECT
      });

      console.log(`Found ${processes.length} processes with biller_completed status`);
      processes.forEach(p => console.log(`  - Process ID: ${p.id}`));

      if (processes.length === 0) {
        console.log(`⚠️  No processes found with biller_completed status for this route`);
        console.log(`Checking what processes exist for this route...`);
        
        // Debug: check all processes for this route
        const debugQuery = `
          SELECT DISTINCT p.id, p.status, f.facility_name
          FROM processes p
          INNER JOIN facilities f ON f.id = p.facility_id
          WHERE f.route = ? AND p.reporting_month = ?
          ORDER BY p.id
        `;
        
        const debugProcesses = await db.sequelize.query(debugQuery, {
          replacements: [routeName, reportingMonth],
          type: db.sequelize.QueryTypes.SELECT
        });
        
        console.log(`All processes for route ${routeName}:`);
        if (debugProcesses.length === 0) {
          console.log(`  ❌ No processes found at all for this route`);
        } else {
          debugProcesses.forEach(p => {
            console.log(`  - Process ${p.id}: ${p.facility_name} (Status: ${p.status})`);
          });
        }
      }

      // Fetch officer name: try employees table first, then users table
      let officerName = 'Unknown Officer';
      try {
        const employeeQuery = `SELECT full_name FROM employees WHERE id = ?`;
        const [employee] = await db.sequelize.query(employeeQuery, {
          replacements: [requested_by],
          type: db.sequelize.QueryTypes.SELECT
        });
        if (employee && employee.full_name) {
          officerName = employee.full_name;
        } else {
          // Fall back to users table (FullName stored as full_name or first+last)
          const userQuery = `SELECT full_name FROM users WHERE id = ?`;
          const [user] = await db.sequelize.query(userQuery, {
            replacements: [requested_by],
            type: db.sequelize.QueryTypes.SELECT
          });
          if (user && user.full_name) officerName = user.full_name;
        }
      } catch (err) {
        console.error('Failed to fetch PI officer name:', err);
      }
      console.log(`Officer Name: ${officerName}`);

      // Record service time for each process
      for (const process of processes) {
        try {
          console.log(`\nRecording service time for process ${process.id}...`);
          
          let waitingMinutes = 0;
          try {
            // Look for the last service time recorded (should be Biller - Goods Received)
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
            
            console.log(`  Last service time:`, lastService);
            
            if (lastService && lastService.end_time) {
              const prevTime = new Date(lastService.end_time);
              const currTime = new Date();
              const diffMs = currTime - prevTime;
              waitingMinutes = Math.floor(diffMs / 60000);
              waitingMinutes = waitingMinutes > 0 ? waitingMinutes : 0;
              console.log(`  Calculated waiting time: ${waitingMinutes} minutes`);
            } else {
              console.log(`  No previous service time found`);
            }
          } catch (err) {
            console.error('  Failed to calculate waiting time:', err.message);
          }
          
          const insertQuery = `
            INSERT INTO service_time_hp 
            (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
            VALUES (?, ?, NOW(), ?, ?, ?, ?)
          `;
          
          console.log(`  Inserting service time record...`);
          
          await db.sequelize.query(insertQuery, {
            replacements: [
              process.id,
              'PI Officer - Vehicle Requested',
              requested_by,
              officerName,
              'completed',
              `PI Officer Phase completed, waiting time: ${waitingMinutes} minutes`
            ],
            type: db.sequelize.QueryTypes.INSERT
          });
          
          console.log(`  ✅ Service time recorded successfully`);
        } catch (err) {
          console.error(`  ❌ Failed to record service time:`, err.message);
        }
      }
      
      console.log(`\n✅ PI Officer service times recorded for ${processes.length} processes`);
      console.log(`=== END PI OFFICER SERVICE TIME RECORDING ===\n`);
    } catch (err) {
      console.error('❌ Failed to record PI Officer service times:', err);
      // Don't fail the submission if service time recording fails
    }

    res.json({
      message: 'Vehicle request submitted successfully',
      route_id,
      month,
      year
    });

  } catch (error) {
    console.error('Error submitting vehicle request:', error);
    res.status(500).json({ error: 'Failed to submit vehicle request' });
  }
};

// Delete vehicle request for a route
const deleteVehicleRequest = async (req, res) => {
  try {
    const { route_id } = req.params;
    const { month, year } = req.query;

    // Validation
    if (!route_id || !month || !year) {
      return res.status(400).json({ 
        error: 'Route ID, month, and year are required' 
      });
    }

    // Check if request exists
    const existingRequest = await db.sequelize.query(
      'SELECT id FROM pi_vehicle_requests WHERE route_id = ? AND month = ? AND year = ?',
      {
        replacements: [route_id, month, year],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (existingRequest.length === 0) {
      return res.status(404).json({ 
        error: 'Vehicle request not found' 
      });
    }

    // Delete the vehicle request record
    const deleteQuery = `
      DELETE FROM pi_vehicle_requests 
      WHERE route_id = ? AND month = ? AND year = ?
    `;

    await db.sequelize.query(deleteQuery, {
      replacements: [route_id, month, year],
      type: db.sequelize.QueryTypes.DELETE
    });

    // Revert all processes for facilities in this route back to biller_completed status
    const reportingMonth = `${month} ${year}`;
    const revertProcessesQuery = `
      UPDATE processes p
      INNER JOIN facilities f ON f.id = p.facility_id
      INNER JOIN routes r ON r.route_name = f.route
      SET p.status = 'biller_completed'
      WHERE r.id = ? AND p.reporting_month = ? AND p.status = 'vehicle_requested'
    `;

    await db.sequelize.query(revertProcessesQuery, {
      replacements: [route_id, reportingMonth],
      type: db.sequelize.QueryTypes.UPDATE
    });

    res.json({
      message: 'Vehicle request deleted successfully',
      route_id,
      month,
      year
    });

  } catch (error) {
    console.error('Error deleting vehicle request:', error);
    res.status(500).json({ error: 'Failed to delete vehicle request' });
  }
};

// Get facilities with biller_completed status for emergency/breakdown processes
const getPIVehicleRequestsByFacility = async (req, res) => {
  try {
    const { process_type } = req.query;

    if (!process_type || !['emergency', 'breakdown', 'vaccine'].includes(process_type)) {
      return res.status(400).json({ error: 'process_type must be emergency, breakdown, or vaccine' });
    }

    const query = `
      SELECT
        p.id as process_id,
        f.facility_name,
        p.created_at as started_at,
        p.process_type,
        CASE WHEN pvr.process_id IS NOT NULL THEN 1 ELSE 0 END as vehicle_requested
      FROM processes p
      INNER JOIN facilities f ON f.id = p.facility_id
      LEFT JOIN pi_vehicle_requests pvr ON pvr.process_id = p.id
      WHERE p.process_type = ? AND p.status = 'biller_completed'
      ORDER BY p.created_at DESC
    `;

    const facilities = await db.sequelize.query(query, {
      replacements: [process_type],
      type: db.sequelize.QueryTypes.SELECT
    });

    // Get ODNs for each process
    const facilitiesWithODNs = await Promise.all(facilities.map(async (item) => {
      const odns = await db.sequelize.query(
        'SELECT odn_number FROM odns WHERE process_id = ? ORDER BY odn_number',
        { replacements: [item.process_id], type: db.sequelize.QueryTypes.SELECT }
      );
      return { ...item, odns };
    }));

    res.json({ facilities: facilitiesWithODNs });
  } catch (error) {
    console.error('Error fetching facility-based PI requests:', error);
    res.status(500).json({ error: 'Failed to fetch facility data', details: error.message });
  }
};

// Submit vehicle request for a single process (emergency/breakdown)
const submitVehicleRequestByProcess = async (req, res) => {
  try {
    const { process_id, requested_by } = req.body;

    if (!process_id || !requested_by) {
      return res.status(400).json({ error: 'process_id and requested_by are required' });
    }

    // Check process exists and is at biller_completed
    const [process] = await db.sequelize.query(
      'SELECT id, status, process_type FROM processes WHERE id = ?',
      { replacements: [process_id], type: db.sequelize.QueryTypes.SELECT }
    );

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }
    if (process.status !== 'biller_completed') {
      return res.status(400).json({ error: 'Process is not at biller_completed stage' });
    }

    // Check if already requested
    const existing = await db.sequelize.query(
      'SELECT id FROM pi_vehicle_requests WHERE process_id = ?',
      { replacements: [process_id], type: db.sequelize.QueryTypes.SELECT }
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Vehicle already requested for this process' });
    }

    await db.sequelize.query(
      'INSERT INTO pi_vehicle_requests (process_id, month, year, requested_by, requested_at, status) VALUES (?, NULL, NULL, ?, NOW(), "requested")',
      { replacements: [process_id, requested_by], type: db.sequelize.QueryTypes.INSERT }
    );

    // Record service time
    try {
      let officerName = 'Unknown Officer';
      const [employee] = await db.sequelize.query(
        'SELECT full_name FROM employees WHERE id = ?',
        { replacements: [requested_by], type: db.sequelize.QueryTypes.SELECT }
      );
      if (employee?.full_name) {
        officerName = employee.full_name;
      } else {
        const [user] = await db.sequelize.query(
          'SELECT full_name FROM users WHERE id = ?',
          { replacements: [requested_by], type: db.sequelize.QueryTypes.SELECT }
        );
        if (user?.full_name) officerName = user.full_name;
      }

      await db.sequelize.query(
        `INSERT INTO service_time_hp (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
         VALUES (?, 'PI Officer - Vehicle Requested', NOW(), ?, ?, 'completed', ?)`,
        {
          replacements: [process_id, requested_by, officerName, `Vehicle requested for ${process.process_type} process`],
          type: db.sequelize.QueryTypes.INSERT
        }
      );
    } catch (err) {
      console.error('Failed to record service time:', err);
    }

    res.json({ message: 'Vehicle request submitted successfully', process_id });
  } catch (error) {
    console.error('Error submitting process-based vehicle request:', error);
    res.status(500).json({ error: 'Failed to submit vehicle request', details: error.message });
  }
};

module.exports = {
  getPIVehicleRequests,
  getPIVehicleRequestStats,
  getPIVehicleRequestsByFacility,
  submitVehicleRequest,
  submitVehicleRequestByProcess,
  deleteVehicleRequest
};