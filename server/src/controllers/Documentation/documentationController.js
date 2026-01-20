const db = require('../../models');
const { Op } = require('sequelize');

// Get dispatched ODNs for POD confirmation
const getDispatchedODNs = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    console.log('Fetching dispatched ODNs with params:', { month, year, page, limit, search });

    // Validate required parameters
    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Month and year are required parameters',
        received: { month, year }
      });
    }

    // Build the reporting month string
    const reportingMonth = `${month} ${year}`;

    // First, let's try a simpler query to check if we have any ODNs at all
    const simpleCheckQuery = `
      SELECT COUNT(*) as total_odns FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      WHERE p.reporting_month = ?
    `;

    const simpleCheck = await db.sequelize.query(simpleCheckQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log('Simple ODN check result:', simpleCheck[0]);

    // If no ODNs found for this month, return empty result
    if (simpleCheck[0].total_odns === 0) {
      console.log('No ODNs found for reporting month:', reportingMonth);
      return res.json({
        odns: [],
        totalCount: 0,
        currentPage: parseInt(page),
        totalPages: 0,
        message: `No ODNs found for ${reportingMonth}`
      });
    }

    // Use LEFT JOINs to be more forgiving of missing data
    const query = `
      SELECT DISTINCT 
        o.id as odn_id,
        o.odn_number,
        o.status as odn_status,
        COALESCE(o.pod_confirmed, 0) as pod_confirmed,
        o.pod_reason,
        o.pod_number,
        o.pod_confirmed_by,
        o.pod_confirmed_at,
        o.created_at,
        COALESCE(f.facility_name, 'Unknown Facility') as facility_name,
        COALESCE(f.region_name, 'Unknown Region') as region_name,
        COALESCE(f.zone_name, 'Unknown Zone') as zone_name,
        COALESCE(f.woreda_name, 'Unknown Woreda') as woreda_name,
        COALESCE(r.route_name, 'Unknown Route') as route_name,
        r.id as route_id,
        p.reporting_month,
        COALESCE(ra.status, 'Unknown') as dispatch_status,
        ra.completed_at as dispatch_completed_at,
        ra.arrival_kilometer,
        ra.id as route_assignment_id
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id 
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      LEFT JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE p.reporting_month = ?
        AND p.status = 'vehicle_requested'
        ${search ? 'AND (o.odn_number LIKE ? OR COALESCE(f.facility_name, \'\') LIKE ?)' : ''}
      ORDER BY dispatch_completed_at DESC, facility_name, o.odn_number
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      LEFT JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE p.reporting_month = ?
        AND p.status = 'vehicle_requested'
        ${search ? 'AND (o.odn_number LIKE ? OR COALESCE(f.facility_name, \'\') LIKE ?)' : ''}
    `;

    let queryParams = [month, reportingMonth];
    let countParams = [month, reportingMonth];

    if (search) {
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    queryParams.push(parseInt(limit), parseInt(offset));

    console.log('Executing main query with params:', queryParams);

    const odns = await db.sequelize.query(query, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    const countResult = await db.sequelize.query(countQuery, {
      replacements: countParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    const totalCount = countResult[0]?.total || 0;

    console.log(`Found ${odns.length} ODNs out of ${totalCount} total`);

    res.json({
      odns,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error('Error fetching dispatched ODNs:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch dispatched ODNs',
      details: error.message,
      params: { month: req.query.month, year: req.query.year }
    });
  }
};

// Get statistics for documentation management
const getDocumentationStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Validate required parameters
    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Month and year are required parameters',
        received: { month, year }
      });
    }

    const reportingMonth = `${month} ${year}`;

    console.log('Fetching documentation stats for:', reportingMonth);

    // Use LEFT JOINs and COALESCE for more robust queries
    // Get total dispatched ODNs
    const totalDispatchedQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      LEFT JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE p.reporting_month = ? AND p.status = 'vehicle_requested'
    `;

    // Get confirmed PODs
    const confirmedPODsQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      LEFT JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE p.reporting_month = ? 
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = TRUE
    `;

    // Get pending PODs
    const pendingPODsQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      LEFT JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE p.reporting_month = ? 
        AND p.status = 'vehicle_requested'
        AND (o.pod_confirmed = FALSE OR o.pod_confirmed IS NULL)
    `;

    const [totalResult, confirmedResult, pendingResult] = await Promise.all([
      db.sequelize.query(totalDispatchedQuery, {
        replacements: [month, reportingMonth],
        type: db.sequelize.QueryTypes.SELECT
      }),
      db.sequelize.query(confirmedPODsQuery, {
        replacements: [month, reportingMonth],
        type: db.sequelize.QueryTypes.SELECT
      }),
      db.sequelize.query(pendingPODsQuery, {
        replacements: [month, reportingMonth],
        type: db.sequelize.QueryTypes.SELECT
      })
    ]);

    const stats = {
      totalDispatched: parseInt(totalResult[0]?.count) || 0,
      confirmedPODs: parseInt(confirmedResult[0]?.count) || 0,
      pendingPODs: parseInt(pendingResult[0]?.count) || 0
    };

    console.log('Documentation stats:', stats);

    res.json(stats);

  } catch (error) {
    console.error('Error fetching documentation stats:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch documentation stats',
      details: error.message,
      params: { month: req.query.month, year: req.query.year }
    });
  }
};

// Update POD confirmation status
const updatePODConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    const { pod_confirmed, pod_reason, confirmed_by } = req.body;

    // Validation
    if (pod_confirmed === undefined || !confirmed_by) {
      return res.status(400).json({ 
        error: 'pod_confirmed and confirmed_by are required' 
      });
    }

    // If not confirmed, reason is required
    if (!pod_confirmed && !pod_reason) {
      return res.status(400).json({ 
        error: 'pod_reason is required when POD is not confirmed' 
      });
    }

    // Check if ODN exists
    const odn = await db.sequelize.query(
      'SELECT * FROM odns WHERE id = ?',
      {
        replacements: [id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (odn.length === 0) {
      return res.status(404).json({ 
        error: 'ODN not found' 
      });
    }

    // Update POD confirmation
    const updateQuery = `
      UPDATE odns 
      SET pod_confirmed = ?, 
          pod_reason = ?,
          pod_confirmed_by = ?,
          pod_confirmed_at = NOW()
      WHERE id = ?
    `;

    await db.sequelize.query(updateQuery, {
      replacements: [pod_confirmed, pod_reason || null, confirmed_by, id],
      type: db.sequelize.QueryTypes.UPDATE
    });

    res.json({
      message: 'POD confirmation updated successfully',
      odn_id: id,
      pod_confirmed,
      pod_reason: pod_reason || null
    });

  } catch (error) {
    console.error('Error updating POD confirmation:', error);
    res.status(500).json({ error: 'Failed to update POD confirmation' });
  }
};

// Bulk update POD confirmations
const bulkUpdatePODConfirmation = async (req, res) => {
  try {
    const { updates, confirmed_by } = req.body;

    // Validation
    if (!updates || !Array.isArray(updates) || !confirmed_by) {
      return res.status(400).json({ 
        error: 'updates array and confirmed_by are required' 
      });
    }

    // Process each update
    const results = [];
    const routeKilometerUpdates = new Map(); // Track route-wide kilometer updates

    for (const update of updates) {
      const { odn_id, pod_confirmed, pod_reason, pod_number, arrival_kilometer, route_assignment_id } = update;

      if (odn_id === undefined || pod_confirmed === undefined) {
        continue; // Skip invalid updates
      }

      // If not confirmed, reason should be provided
      if (!pod_confirmed && !pod_reason) {
        continue; // Skip updates without reason when not confirmed
      }

      try {
        // Start a transaction for updating both tables
        const transaction = await db.sequelize.transaction();

        try {
          // Update ODN table
          const odnUpdateQuery = `
            UPDATE odns 
            SET pod_confirmed = ?, 
                pod_reason = ?,
                pod_number = ?,
                pod_confirmed_by = ?,
                pod_confirmed_at = NOW()
            WHERE id = ?
          `;

          await db.sequelize.query(odnUpdateQuery, {
            replacements: [
              pod_confirmed, 
              pod_reason || null, 
              pod_number || null,
              confirmed_by, 
              odn_id
            ],
            type: db.sequelize.QueryTypes.UPDATE,
            transaction
          });

          // Update route_assignments table if we have arrival_kilometer and route_assignment_id
          // This ensures the destination kilometer is applied to the entire route
          if (arrival_kilometer !== undefined && route_assignment_id) {
            // Check if we've already updated this route assignment in this batch
            if (!routeKilometerUpdates.has(route_assignment_id)) {
              const raUpdateQuery = `
                UPDATE route_assignments 
                SET arrival_kilometer = ?
                WHERE id = ?
              `;

              await db.sequelize.query(raUpdateQuery, {
                replacements: [arrival_kilometer, route_assignment_id],
                type: db.sequelize.QueryTypes.UPDATE,
                transaction
              });

              // Mark this route as updated to avoid duplicate updates
              routeKilometerUpdates.set(route_assignment_id, arrival_kilometer);

              console.log(`Updated route assignment ${route_assignment_id} with destination kilometer: ${arrival_kilometer}`);
            }
          }

          // Commit the transaction
          await transaction.commit();

          results.push({
            odn_id,
            success: true,
            pod_confirmed,
            pod_reason: pod_reason || null,
            pod_number: pod_number || null,
            arrival_kilometer: arrival_kilometer || null,
            route_assignment_id: route_assignment_id || null
          });
        } catch (error) {
          // Rollback the transaction on error
          await transaction.rollback();
          throw error;
        }
      } catch (error) {
        results.push({
          odn_id,
          success: false,
          error: error.message
        });
      }
    }

    // Log route-wide updates for debugging
    if (routeKilometerUpdates.size > 0) {
      console.log('Route-wide destination kilometer updates:', Array.from(routeKilometerUpdates.entries()));
    }

    res.json({
      message: 'Bulk POD confirmation update completed',
      results,
      total_processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      route_updates: routeKilometerUpdates.size
    });

  } catch (error) {
    console.error('Error bulk updating POD confirmations:', error);
    res.status(500).json({ error: 'Failed to bulk update POD confirmations' });
  }
};

// Get available reporting months with data
const getAvailableMonths = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT 
        p.reporting_month,
        COUNT(DISTINCT o.id) as odn_count
      FROM processes p
      INNER JOIN odns o ON o.process_id = p.id
      WHERE p.reporting_month IS NOT NULL
        AND p.status = 'vehicle_requested'
      GROUP BY p.reporting_month
      HAVING COUNT(DISTINCT o.id) > 0
      ORDER BY p.reporting_month DESC
    `;

    const months = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json(months);

  } catch (error) {
    console.error('Error fetching available months:', error);
    res.status(500).json({ error: 'Failed to fetch available months' });
  }
};

module.exports = {
  getDispatchedODNs,
  getDocumentationStats,
  updatePODConfirmation,
  bulkUpdatePODConfirmation,
  getAvailableMonths
};