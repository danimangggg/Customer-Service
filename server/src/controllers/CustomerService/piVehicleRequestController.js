const db = require('../../models');
const { Op } = require('sequelize');

// Get routes ready for PI vehicle requests (where all facilities have EWM completed status)
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

    // Query to find routes that have at least one facility with EWM completed
    // Show all such routes, but only enable "Request Vehicle" button when ALL facilities are ewm_completed
    const query = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities_in_route,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities,
        CASE WHEN pvr.route_id IS NOT NULL OR MAX(CASE WHEN p.status = 'vehicle_requested' THEN 1 ELSE 0 END) = 1 THEN 1 ELSE 0 END as vehicle_requested,
        CASE WHEN COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) = COUNT(DISTINCT f.id) THEN 1 ELSE 0 END as all_facilities_ready
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      LEFT JOIN pi_vehicle_requests pvr ON pvr.route_id = r.id AND pvr.month = ? AND pvr.year = ?
      WHERE f.route IS NOT NULL 
        AND f.period IS NOT NULL
        ${search ? 'AND r.route_name LIKE ?' : ''}
      GROUP BY r.id, r.route_name, pvr.route_id
      HAVING total_facilities_in_route > 0 
        AND (ewm_completed_facilities > 0 OR vehicle_requested_facilities > 0)
      ORDER BY all_facilities_ready DESC, r.route_name
      LIMIT ? OFFSET ?
    `;

    let queryParams = [reportingMonth, month, year];

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
      console.log(`Route: ${route.route_name}, Total Facilities: ${route.total_facilities_in_route}, EWM Completed: ${route.ewm_completed_facilities}, Vehicle Requested: ${route.vehicle_requested_facilities}`);
    });

    // For each route, get the facilities and their ODNs
    const routesWithDetails = await Promise.all(routes.map(async (route) => {
      // Get ALL facilities for this route with their process status
      const facilitiesQuery = `
        SELECT DISTINCT 
          f.id,
          f.facility_name,
          p.status as process_status
        FROM facilities f
        INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
        WHERE f.route = ?
        ORDER BY f.facility_name
      `;

      const facilities = await db.sequelize.query(facilitiesQuery, {
        replacements: [reportingMonth, route.route_name],
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
        INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
        WHERE f.route IS NOT NULL 
          AND f.period IS NOT NULL
          ${search ? 'AND r.route_name LIKE ?' : ''}
        GROUP BY r.id
        HAVING COUNT(DISTINCT f.id) > 0 
          AND (COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) > 0 
               OR COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) > 0)
      ) as route_count
    `;

    let countParams = [reportingMonth];
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
      'SELECT id FROM pi_vehicle_requests WHERE route_id = ? AND month = ? AND year = ?',
      {
        replacements: [route_id, month, year],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (existingRequest.length > 0) {
      return res.status(400).json({ 
        error: 'Vehicle request already exists for this route and period' 
      });
    }

    // Verify that ALL facilities in this route (for the current period) have EWM completed status
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
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed_facilities,
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

    // Check if ALL facilities have ewm_completed status (not vehicle_requested yet)
    if (verification[0].total_facilities !== verification[0].ewm_completed_facilities) {
      return res.status(400).json({ 
        error: `Not all facilities in this route have completed EWM process. Total: ${verification[0].total_facilities}, EWM Completed: ${verification[0].ewm_completed_facilities}`,
        details: {
          total_facilities: verification[0].total_facilities,
          ewm_completed: verification[0].ewm_completed_facilities,
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

    // Update all processes for facilities in this route to add vehicle_requested status
    const updateProcessesQuery = `
      UPDATE processes p
      INNER JOIN facilities f ON f.id = p.facility_id
      INNER JOIN routes r ON r.route_name = f.route
      SET p.status = 'vehicle_requested'
      WHERE r.id = ? AND p.reporting_month = ? AND p.status = 'ewm_completed'
    `;

    await db.sequelize.query(updateProcessesQuery, {
      replacements: [route_id, reportingMonth],
      type: db.sequelize.QueryTypes.UPDATE
    });

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

    // Revert all processes for facilities in this route back to ewm_completed status
    const reportingMonth = `${month} ${year}`;
    const revertProcessesQuery = `
      UPDATE processes p
      INNER JOIN facilities f ON f.id = p.facility_id
      INNER JOIN routes r ON r.route_name = f.route
      SET p.status = 'ewm_completed'
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

module.exports = {
  getPIVehicleRequests,
  getPIVehicleRequestStats,
  submitVehicleRequest,
  deleteVehicleRequest
};