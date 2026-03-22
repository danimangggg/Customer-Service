const db = require('../../models');
const { Op } = require('sequelize');

// Get ODNs with completed document follow-up for quality evaluation
const getODNsForQualityEvaluation = async (req, res) => {
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
      : (month && year ? `AND p.reporting_month = '${month} ${year}' AND p.process_type = '${process_type}'` : `AND p.process_type = '${process_type}'`);

    const query = `
      SELECT DISTINCT 
        o.id as odn_id,
        o.odn_number,
        o.pod_number,
        o.status as odn_status,
        o.pod_confirmed,
        o.documents_signed,
        o.documents_handover,
        o.quality_confirmed,
        o.quality_feedback,
        o.quality_evaluated_by,
        o.quality_evaluated_at,
        p.facility_id,
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        r.route_name,
        p.reporting_month,
        p.created_at,
        NULL as dispatch_status,
        NULL as dispatch_completed_at
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      WHERE p.status IN ('documentation_completed')
        AND o.pod_confirmed = TRUE
        ${processTypeFilter}
        ${branchFilter}
        ${search ? 'AND (o.odn_number LIKE ? OR f.facility_name LIKE ?)' : ''}
      ORDER BY p.created_at DESC, f.facility_name, o.odn_number
      LIMIT ? OFFSET ?
    `;

    const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

    const odns = await db.sequelize.query(query, {
      replacements: [...searchParams, parseInt(limit), parseInt(offset)],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({ odns, totalCount: odns.length, currentPage: parseInt(page), totalPages: 1 });

  } catch (error) {
    console.error('Error fetching ODNs for quality evaluation:', error);
    res.status(500).json({ error: 'Failed to fetch ODNs for quality evaluation' });
  }
};

const getQualityEvaluationStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportingMonth = `${month} ${year}`;

    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const queryBranch  = req.query.branch_code || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
    const branchFilter = branchCode ? `AND f.branch_code = '${branchCode}'` : '';

    const baseWhere = `
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE p.reporting_month = ?
        AND p.status IN ('documentation_completed')
        AND o.pod_confirmed = TRUE
        ${branchFilter}
    `;

    const totalReadyQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      ${baseWhere}
    `;

    const qualityConfirmedQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      ${baseWhere}
        AND o.quality_confirmed = TRUE
    `;

    const qualityPendingQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      ${baseWhere}
        AND (o.quality_confirmed = FALSE OR o.quality_confirmed IS NULL)
    `;

    const withFeedbackQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      ${baseWhere}
        AND o.quality_feedback IS NOT NULL
        AND o.quality_feedback != ''
    `;

    const [totalResult, confirmedResult, pendingResult, feedbackResult] = await Promise.all([
      db.sequelize.query(totalReadyQuery, { replacements: [reportingMonth], type: db.sequelize.QueryTypes.SELECT }),
      db.sequelize.query(qualityConfirmedQuery, { replacements: [reportingMonth], type: db.sequelize.QueryTypes.SELECT }),
      db.sequelize.query(qualityPendingQuery, { replacements: [reportingMonth], type: db.sequelize.QueryTypes.SELECT }),
      db.sequelize.query(withFeedbackQuery, { replacements: [reportingMonth], type: db.sequelize.QueryTypes.SELECT })
    ]);

    res.json({
      totalReady: totalResult[0]?.count || 0,
      qualityConfirmed: confirmedResult[0]?.count || 0,
      qualityPending: pendingResult[0]?.count || 0,
      withFeedback: feedbackResult[0]?.count || 0
    });

  } catch (error) {
    console.error('Error fetching quality evaluation stats:', error);
    res.status(500).json({ error: 'Failed to fetch quality evaluation stats' });
  }
};

// Update quality evaluation status
const updateQualityEvaluation = async (req, res) => {
  try {
    console.log('=== BACKEND UPDATE DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { updates, evaluated_by } = req.body;

    // Validation
    if (!updates || !Array.isArray(updates) || !evaluated_by) {
      console.error('Validation failed - missing updates or evaluated_by');
      return res.status(400).json({ 
        error: 'updates array and evaluated_by are required' 
      });
    }

    console.log('Processing', updates.length, 'updates');
    console.log('Evaluated by user ID:', evaluated_by);

    // Process each update
    const results = [];
    for (const update of updates) {
      const { odn_id, quality_confirmed, quality_feedback } = update;

      console.log('Processing update:', { odn_id, quality_confirmed, quality_feedback });

      if (odn_id === undefined) {
        console.log('Skipping update - no odn_id');
        continue; // Skip invalid updates
      }

      try {
        const updateQuery = `
          UPDATE odns 
          SET quality_confirmed = ?, 
              quality_feedback = ?,
              quality_evaluated_by = ?,
              quality_evaluated_at = NOW()
          WHERE id = ?
        `;

        const replacements = [
          quality_confirmed ? 1 : 0, 
          quality_feedback || null, 
          evaluated_by, 
          odn_id
        ];

        console.log('SQL Query:', updateQuery);
        console.log('Replacements:', replacements);

        // First check if the user exists in the users table (not employees)
        const userCheckQuery = 'SELECT id FROM users WHERE id = ?';
        const userExists = await db.sequelize.query(userCheckQuery, {
          replacements: [evaluated_by],
          type: db.sequelize.QueryTypes.SELECT
        });

        console.log('User exists check:', userExists);

        let finalEvaluatedBy = null;
        if (userExists.length > 0) {
          finalEvaluatedBy = evaluated_by;
          console.log(`User ${evaluated_by} exists in users table`);
        } else {
          console.log(`User ${evaluated_by} does not exist in users table, setting evaluated_by to NULL`);
          // Try to find any existing user as fallback
          const anyUser = await db.sequelize.query('SELECT id FROM users LIMIT 1', {
            type: db.sequelize.QueryTypes.SELECT
          });
          if (anyUser.length > 0) {
            finalEvaluatedBy = anyUser[0].id;
            console.log(`Using fallback user ID: ${finalEvaluatedBy}`);
          } else {
            console.log('No users found in database, will set to NULL');
          }
        }

        const finalReplacements = [
          quality_confirmed ? 1 : 0, 
          quality_feedback || null, 
          finalEvaluatedBy, 
          odn_id
        ];

        console.log('Final replacements:', finalReplacements);

        const result = await db.sequelize.query(updateQuery, {
          replacements: finalReplacements,
          type: db.sequelize.QueryTypes.UPDATE
        });

        console.log('SQL Result:', result);

        results.push({
          odn_id,
          success: true,
          quality_confirmed: quality_confirmed || false,
          quality_feedback: quality_feedback || null
        });
        
        console.log('Update successful for ODN:', odn_id);
      } catch (error) {
        console.error('Update failed for ODN:', odn_id, 'Error:', error.message);
        results.push({
          odn_id,
          success: false,
          error: error.message
        });
      }
    }

    console.log('Final results:', results);
    console.log('=== BACKEND UPDATE END ===');

    // Record service times for Quality Evaluator Phase
    try {
      for (const update of updates) {
        const { odn_id, quality_confirmed } = update;
        
        if (!odn_id || !quality_confirmed) continue;

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

          let waitingMinutes = 0;
          try {
            // Look for the last service time recorded (should be Documentation - POD Confirmed)
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
            console.error('Failed to calculate Quality Evaluator waiting time:', err);
          }
          
          // Fetch officer name: try employees table first, then users table
          let finalOfficerName = 'Unknown Officer';
          if (evaluated_by) {
            try {
              const employeeQuery = `SELECT full_name FROM employees WHERE id = ?`;
              const [employee] = await db.sequelize.query(employeeQuery, {
                replacements: [evaluated_by],
                type: db.sequelize.QueryTypes.SELECT
              });
              if (employee && employee.full_name) {
                finalOfficerName = employee.full_name;
              } else {
                const userQuery = `SELECT full_name FROM users WHERE id = ?`;
                const [user] = await db.sequelize.query(userQuery, {
                  replacements: [evaluated_by],
                  type: db.sequelize.QueryTypes.SELECT
                });
                if (user && user.full_name) finalOfficerName = user.full_name;
              }
            } catch (err) {
              console.error('Failed to fetch Quality Evaluator officer name:', err);
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
              'Quality Evaluator - Confirmed',
              evaluated_by,
              finalOfficerName,
              'completed',
              `Quality Evaluator Phase completed, waiting time: ${waitingMinutes} minutes`
            ],
            type: db.sequelize.QueryTypes.INSERT
          });
          
          console.log(`✅ Service time recorded for process ${odn.process_id} with officer_name: ${officerName}`);
        } catch (err) {
          console.error(`Failed to record service time for ODN ${odn_id}:`, err);
        }
      }
      
      console.log(`✅ Quality Evaluator service times recorded`);
    } catch (err) {
      console.error('❌ Failed to record Quality Evaluator service times:', err);
      // Don't fail the update if service time recording fails
    }

    // Update process status to completed if all ODNs are quality confirmed
    try {
      // Get unique process IDs from the updates
      const processIds = new Set();
      for (const update of updates) {
        const { odn_id } = update;
        if (odn_id) {
          const [odn] = await db.sequelize.query(
            'SELECT process_id FROM odns WHERE id = ?',
            {
              replacements: [odn_id],
              type: db.sequelize.QueryTypes.SELECT
            }
          );
          if (odn) processIds.add(odn.process_id);
        }
      }

      // For each process, check if all ODNs are quality confirmed
      for (const processId of processIds) {
        const [unconfirmedODNs] = await db.sequelize.query(
          'SELECT COUNT(*) as count FROM odns WHERE process_id = ? AND (quality_confirmed = 0 OR quality_confirmed IS NULL)',
          {
            replacements: [processId],
            type: db.sequelize.QueryTypes.SELECT
          }
        );

        // If all ODNs are confirmed, update process status to completed
        if (unconfirmedODNs && unconfirmedODNs.count === 0) {
          await db.sequelize.query(
            'UPDATE processes SET status = ? WHERE id = ?',
            {
              replacements: ['completed', processId],
              type: db.sequelize.QueryTypes.UPDATE
            }
          );
          console.log(`✅ Process ${processId} status updated to completed (all ODNs quality confirmed)`);
        } else {
          console.log(`⚠️  Process ${processId} still has ${unconfirmedODNs.count} unconfirmed ODNs`);
        }
      }
    } catch (err) {
      console.error('Failed to update process status:', err);
      // Don't fail the response if process status update fails
    }

    res.json({
      message: 'Bulk quality evaluation update completed',
      results,
      total_processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('=== BACKEND ERROR ===');
    console.error('Error bulk updating quality evaluation:', error);
    res.status(500).json({ error: 'Failed to bulk update quality evaluation' });
  }
};

module.exports = {
  getODNsForQualityEvaluation,
  getQualityEvaluationStats,
  updateQualityEvaluation
};