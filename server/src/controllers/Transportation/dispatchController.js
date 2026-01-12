const db = require('../../models');
const { Op } = require('sequelize');

// Get routes assigned for dispatch (routes with vehicle assignments)
const getDispatchRoutes = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    console.log('Dispatch routes request:', { month, year, page, limit, search });

    // Build the reporting month string
    const reportingMonth = `${month} ${year}`;
    console.log('Looking for reporting month:', reportingMonth);

    // Query to find routes that have been assigned vehicles and are ready for dispatch
    const query = `
      SELECT DISTINCT 
        ra.id as assignment_id,
        r.id as route_id,
        r.route_name,
        ra.status as assignment_status,
        ra.notes,
        ra.created_at as assigned_at,
        v.vehicle_name,
        v.plate_number,
        d.full_name as driver_name,
        del.full_name as deliverer_name,
        COUNT(DISTINCT f.id) as total_facilities
      FROM route_assignments ra
      INNER JOIN routes r ON ra.route_id = r.id
      INNER JOIN vehicles v ON ra.vehicle_id = v.id
      INNER JOIN employees d ON ra.driver_id = d.id
      LEFT JOIN employees del ON ra.deliverer_id = del.id
      INNER JOIN facilities f ON f.route = r.route_name
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE ra.ethiopian_month = ?
        AND p.status = 'vehicle_requested'
        AND ra.vehicle_id IS NOT NULL
        AND ra.driver_id IS NOT NULL
        ${search ? 'AND (r.route_name LIKE ? OR f.facility_name LIKE ?)' : ''}
      GROUP BY ra.id, r.id, r.route_name, ra.status, ra.notes, ra.created_at, v.vehicle_name, v.plate_number, d.full_name, del.full_name
      ORDER BY ra.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT ra.id) as total
      FROM route_assignments ra
      INNER JOIN routes r ON ra.route_id = r.id
      INNER JOIN facilities f ON f.route = r.route_name
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE ra.ethiopian_month = ?
        AND p.status = 'vehicle_requested'
        AND ra.vehicle_id IS NOT NULL
        AND ra.driver_id IS NOT NULL
        ${search ? 'AND (r.route_name LIKE ? OR f.facility_name LIKE ?)' : ''}
    `;

    let queryParams = [reportingMonth, month];
    let countParams = [reportingMonth, month];

    if (search) {
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    queryParams.push(parseInt(limit), parseInt(offset));

    console.log('Executing query with params:', queryParams);

    const routes = await db.sequelize.query(query, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${routes.length} routes`);

    // For each route, get the detailed facility information
    const routesWithFacilities = await Promise.all(routes.map(async (route) => {
      const facilitiesQuery = `
        SELECT DISTINCT 
          f.id,
          f.facility_name
        FROM facilities f
        INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
        WHERE f.route = ? AND p.status = 'vehicle_requested'
        ORDER BY f.facility_name
      `;

      const facilities = await db.sequelize.query(facilitiesQuery, {
        replacements: [reportingMonth, route.route_name],
        type: db.sequelize.QueryTypes.SELECT
      });

      return {
        ...route,
        facilities: facilities
      };
    }));

    const countResult = await db.sequelize.query(countQuery, {
      replacements: countParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    const totalCount = countResult[0]?.total || 0;

    console.log(`Returning ${routesWithFacilities.length} routes with facilities, total count: ${totalCount}`);

    res.json({
      routes: routesWithFacilities,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error('Error fetching dispatch routes:', error);
    console.error('Error stack:', error.stack);
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
      SELECT COUNT(DISTINCT ra.id) as count
      FROM route_assignments ra
      INNER JOIN facilities f ON f.route = (SELECT route_name FROM routes WHERE id = ra.route_id)
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE ra.ethiopian_month = ? 
        AND p.status = 'vehicle_requested'
        AND ra.vehicle_id IS NOT NULL
        AND ra.driver_id IS NOT NULL
    `;

    // Get completed dispatches (with vehicles)
    const completedDispatchesQuery = `
      SELECT COUNT(DISTINCT ra.id) as count
      FROM route_assignments ra
      INNER JOIN facilities f ON f.route = (SELECT route_name FROM routes WHERE id = ra.route_id)
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE ra.ethiopian_month = ? 
        AND ra.status = 'Completed' 
        AND p.status = 'vehicle_requested'
        AND ra.vehicle_id IS NOT NULL
        AND ra.driver_id IS NOT NULL
    `;

    const totalResult = await db.sequelize.query(totalAssignedQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const completedResult = await db.sequelize.query(completedDispatchesQuery, {
      replacements: [reportingMonth, month],
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

    res.json({
      message: 'Dispatch completed successfully',
      assignment_id: id
    });

  } catch (error) {
    console.error('Error completing dispatch:', error);
    res.status(500).json({ error: 'Failed to complete dispatch' });
  }
};

module.exports = {
  getDispatchRoutes,
  getDispatchStats,
  completeDispatch
};