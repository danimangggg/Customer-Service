const db = require('../../models');
const { Op } = require('sequelize');

// Get dispatched ODNs for POD confirmation (grouped by facility)
const getDispatchedODNs = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = '', process_type = 'regular' } = req.query;
    const offset = (page - 1) * limit;

    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const queryBranch  = req.query.branch_code || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
    const branchFilter = branchCode ? `AND f.branch_code = '${branchCode}'` : '';

    const isEmergencyOrBreakdown = process_type === 'emergency' || process_type === 'breakdown' || process_type === 'vaccine';

    const processTypeFilter = isEmergencyOrBreakdown
      ? `AND p.process_type = '${process_type}'`
      : `AND p.reporting_month = '${month} ${year}' AND p.process_type = '${process_type}'`;

    if (!isEmergencyOrBreakdown && (!month || !year)) {
      return res.status(400).json({ error: 'Month and year are required for regular type' });
    }

    const reportingMonth = `${month} ${year}`;

    const query = `
      SELECT 
        p.facility_id,
        COALESCE(f.facility_name, 'Unknown Facility') as facility_name,
        COALESCE(f.region_name, 'Unknown Region') as region_name,
        COALESCE(f.zone_name, 'Unknown Zone') as zone_name,
        COALESCE(f.woreda_name, 'Unknown Woreda') as woreda_name,
        COALESCE(r.route_name, 'N/A') as route_name,
        r.id as route_id,
        p.reporting_month,
        ra.id as route_assignment_id,
        ra.arrival_kilometer,
        COUNT(DISTINCT o.id) as total_odns,
        SUM(CASE WHEN o.pod_confirmed = 1 THEN 1 ELSE 0 END) as confirmed_pods,
        SUM(CASE WHEN o.pod_confirmed = 1 AND o.documents_signed = 1 AND o.documents_handover = 1 THEN 1 ELSE 0 END) as fully_completed_odns,
        GROUP_CONCAT(DISTINCT o.id ORDER BY o.odn_number) as odn_ids,
        GROUP_CONCAT(DISTINCT o.odn_number ORDER BY o.odn_number) as odn_numbers,
        GROUP_CONCAT(DISTINCT o.pod_number ORDER BY o.pod_number SEPARATOR ', ') as pod_numbers,
        MAX(o.pod_confirmed_at) as last_pod_confirmed_at,
        MAX(ra.completed_at) as dispatch_completed_at
      FROM processes p
      INNER JOIN odns o ON o.process_id = p.id
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      LEFT JOIN route_assignments ra ON ra.id = (
        SELECT ra_sub.id FROM route_assignments ra_sub
        WHERE ra_sub.route_id = r.id AND ra_sub.ethiopian_month = ?
        ORDER BY ra_sub.created_at DESC
        LIMIT 1
      )
      WHERE p.status IN ('vehicle_requested', 'driver_assigned', 'dispatch_completed', 'completed')
        ${processTypeFilter}
        ${branchFilter}
        ${search ? 'AND (COALESCE(f.facility_name, \'\') LIKE ? OR COALESCE(r.route_name, \'\') LIKE ?)' : ''}
      GROUP BY p.facility_id, f.facility_name, f.region_name, f.zone_name, f.woreda_name, 
               r.route_name, r.id, p.reporting_month, ra.id, ra.arrival_kilometer
      HAVING fully_completed_odns < total_odns
      ORDER BY dispatch_completed_at DESC, facility_name
      LIMIT ? OFFSET ?
    `;

    let queryParams = [month];
    if (search) {
      const s = `%${search}%`;
      queryParams.push(s, s);
    }
    queryParams.push(parseInt(limit), parseInt(offset));

    const facilities = await db.sequelize.query(query, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      facilities,
      totalCount: facilities.length,
      currentPage: parseInt(page),
      totalPages: 1
    });

  } catch (error) {
    console.error('Error fetching dispatched facilities:', error);
    res.status(500).json({ error: 'Failed to fetch dispatched facilities', details: error.message });
  }
};

// Get statistics for documentation management
const getDocumentationStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Month and year are required parameters',
        received: { month, year }
      });
    }

    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const queryBranch  = req.query.branch_code || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
    const branchFilter = branchCode ? `AND f.branch_code = '${branchCode}'` : '';

    const reportingMonth = `${month} ${year}`;
    console.log('Fetching documentation stats for:', reportingMonth);

    const totalDispatchedQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      LEFT JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE p.reporting_month = ? AND p.status = 'vehicle_requested'
      ${branchFilter}
    `;

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
      ${branchFilter}
    `;

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
      ${branchFilter}
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
      const { odn_id, pod_confirmed, pod_reason, pod_number, arrival_kilometer, route_assignment_id, route_id } = update;

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

          // Save arrival_kilometer directly on the process record
          if (arrival_kilometer !== undefined && arrival_kilometer !== null) {
            // Get process_id from ODN
            const [odnRow] = await db.sequelize.query(
              `SELECT process_id FROM odns WHERE id = ?`,
              { replacements: [odn_id], type: db.sequelize.QueryTypes.SELECT, transaction }
            );
            if (odnRow) {
              await db.sequelize.query(
                `UPDATE processes SET arrival_kilometer = ? WHERE id = ?`,
                { replacements: [arrival_kilometer, odnRow.process_id], type: db.sequelize.QueryTypes.UPDATE, transaction }
              );
              routeKilometerUpdates.set(odnRow.process_id, arrival_kilometer);
              console.log(`Updated process ${odnRow.process_id} with arrival_kilometer: ${arrival_kilometer}`);
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

    // Record service times for Documentation Phase and update process status
    try {
      // Get officer name from users table
      const userQuery = `SELECT CONCAT(first_name, ' ', last_name) as full_name FROM users WHERE id = ?`;
      const [user] = await db.sequelize.query(userQuery, {
        replacements: [confirmed_by],
        type: db.sequelize.QueryTypes.SELECT
      });
      const officerName = user?.full_name || 'Documentation Officer';

      for (const update of updates) {
        const { odn_id, pod_confirmed } = update;
        
        if (!odn_id || !pod_confirmed) continue;

        try {
          // Get process_id from ODN
          const processQuery = `
            SELECT process_id FROM odns WHERE id = ?
          `;
          
          const [odn] = await db.sequelize.query(processQuery, {
            replacements: [odn_id],
            type: db.sequelize.QueryTypes.SELECT
          });

          if (!odn) continue;

          // Update process status to documentation_completed
          const updateProcessQuery = `
            UPDATE processes 
            SET status = 'documentation_completed'
            WHERE id = ?
          `;
          
          console.log(`📝 Updating process ${odn.process_id} status to documentation_completed`);
          
          await db.sequelize.query(updateProcessQuery, {
            replacements: [odn.process_id],
            type: db.sequelize.QueryTypes.UPDATE
          });
          
          console.log(`✅ Process ${odn.process_id} status updated to documentation_completed`);

          let waitingMinutes = 0;
          try {
            // Look for the last service time recorded (should be Dispatch - Route Completed)
            const lastServiceQuery = `
              SELECT end_time 
              FROM service_time_hp
              WHERE process_id = ?
              ORDER BY created_at DESC 
              LIMIT 1
            `;
            
            const [lastService] = await db.sequelize.query(lastServiceQuery, {
              replacements: [odn.process_id],
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
            console.error('Failed to calculate Documentation waiting time:', err);
          }
          
          // Fetch officer name: try employees table first, then users table
          let finalOfficerName = 'Unknown Officer';
          if (confirmed_by) {
            try {
              const employeeQuery = `SELECT full_name FROM employees WHERE id = ?`;
              const [employee] = await db.sequelize.query(employeeQuery, {
                replacements: [confirmed_by],
                type: db.sequelize.QueryTypes.SELECT
              });
              if (employee && employee.full_name) {
                finalOfficerName = employee.full_name;
              } else {
                const userQuery = `SELECT full_name FROM users WHERE id = ?`;
                const [user] = await db.sequelize.query(userQuery, {
                  replacements: [confirmed_by],
                  type: db.sequelize.QueryTypes.SELECT
                });
                if (user && user.full_name) finalOfficerName = user.full_name;
              }
            } catch (err) {
              console.error('Failed to fetch Documentation officer name:', err);
            }
          }
          
          const insertQuery = `
            INSERT INTO service_time_hp 
            (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
            VALUES (?, ?, NOW(), ?, ?, ?, ?)
          `;
          
          await db.sequelize.query(insertQuery, {
            replacements: [
              odn.process_id,
              'Documentation - POD Confirmed',
              confirmed_by,
              finalOfficerName,
              'completed',
              `Documentation Phase completed, waiting time: ${waitingMinutes} minutes`
            ],
            type: db.sequelize.QueryTypes.INSERT
          });
        } catch (err) {
          console.error(`Failed to record service time for ODN ${odn_id}:`, err);
        }
      }
      
      console.log(`✅ Documentation service times recorded and process status updated`);
    } catch (err) {
      console.error('❌ Failed to record Documentation service times:', err);
      // Don't fail the update if service time recording fails
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

// Bulk update POD confirmations for facility (multiple PODs per facility)
const bulkUpdateFacilityPODConfirmation = async (req, res) => {
  try {
    const { facility_id, reporting_month, pod_numbers, arrival_kilometer, route_assignment_id, confirmed_by } = req.body;

    // Validation
    if (!facility_id || !reporting_month || !confirmed_by) {
      return res.status(400).json({ 
        error: 'facility_id, reporting_month, and confirmed_by are required' 
      });
    }

    // Get all ODNs for this facility
    const getODNsQuery = `
      SELECT o.id as odn_id
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      WHERE p.facility_id = ? AND p.reporting_month = ?
    `;

    const odns = await db.sequelize.query(getODNsQuery, {
      replacements: [facility_id, reporting_month],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (odns.length === 0) {
      return res.status(404).json({ 
        error: 'No ODNs found for this facility and reporting month' 
      });
    }

    // Start a transaction
    const transaction = await db.sequelize.transaction();

    try {
      // Update all ODNs for this facility
      const odnUpdateQuery = `
        UPDATE odns o
        INNER JOIN processes p ON o.process_id = p.id
        SET o.pod_confirmed = 1,
            o.pod_number = ?,
            o.pod_confirmed_by = ?,
            o.pod_confirmed_at = NOW(),
            o.pod_reason = NULL
        WHERE p.facility_id = ? AND p.reporting_month = ?
      `;

      await db.sequelize.query(odnUpdateQuery, {
        replacements: [pod_numbers || '', confirmed_by, facility_id, reporting_month],
        type: db.sequelize.QueryTypes.UPDATE,
        transaction
      });

      // Update route_assignments table if we have arrival_kilometer and route_assignment_id
      if (arrival_kilometer !== undefined && route_assignment_id) {
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

        console.log(`Updated route assignment ${route_assignment_id} with destination kilometer: ${arrival_kilometer}`);
      }

      // Commit the transaction
      await transaction.commit();

      res.json({
        message: 'Facility POD confirmation updated successfully',
        facility_id,
        odns_updated: odns.length,
        pod_numbers,
        arrival_kilometer
      });

    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error updating facility POD confirmation:', error);
    res.status(500).json({ error: 'Failed to update facility POD confirmation' });
  }
};

module.exports = {
  getDispatchedODNs,
  getDocumentationStats,
  updatePODConfirmation,
  bulkUpdatePODConfirmation,
  bulkUpdateFacilityPODConfirmation,
  getAvailableMonths
};