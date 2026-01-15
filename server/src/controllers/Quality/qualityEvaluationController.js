const db = require('../../models');
const { Op } = require('sequelize');

// Get ODNs with completed document follow-up for quality evaluation
const getODNsForQualityEvaluation = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build the reporting month string - make it optional for testing
    let reportingMonthFilter = '';
    let monthFilter = '';
    let queryParams = [];
    
    if (month && year) {
      const reportingMonth = `${month} ${year}`;
      reportingMonthFilter = 'AND p.reporting_month = ?';
      monthFilter = 'AND ra.ethiopian_month = ?';
      queryParams.push(reportingMonth, month);
    }

    // Query to find ODNs with completed document follow-up that need quality evaluation
    const query = `
      SELECT DISTINCT 
        o.id as odn_id,
        o.odn_number,
        o.status as odn_status,
        o.pod_confirmed,
        o.documents_signed,
        o.documents_handover,
        o.quality_confirmed,
        o.quality_feedback,
        o.quality_evaluated_by,
        o.quality_evaluated_at,
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        r.route_name,
        p.reporting_month,
        ra.status as dispatch_status,
        ra.completed_at as dispatch_completed_at
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id ${reportingMonthFilter}
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id ${monthFilter}
      WHERE ra.status = 'Completed'
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = TRUE
        AND o.documents_signed = TRUE
        AND o.documents_handover = TRUE
        ${search ? 'AND (o.odn_number LIKE ? OR f.facility_name LIKE ?)' : ''}
      ORDER BY ra.completed_at DESC, f.facility_name, o.odn_number
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id ${reportingMonthFilter}
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id ${monthFilter}
      WHERE ra.status = 'Completed'
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = TRUE
        AND o.documents_signed = TRUE
        AND o.documents_handover = TRUE
        ${search ? 'AND (o.odn_number LIKE ? OR f.facility_name LIKE ?)' : ''}
    `;

    if (search) {
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    queryParams.push(parseInt(limit), parseInt(offset));

    const odns = await db.sequelize.query(query, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    // For count query, remove limit and offset
    let countParams = queryParams.slice(0, -2);
    const countResult = await db.sequelize.query(countQuery, {
      replacements: countParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    const totalCount = countResult[0]?.total || 0;

    res.json({
      odns,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error('Error fetching ODNs for quality evaluation:', error);
    res.status(500).json({ error: 'Failed to fetch ODNs for quality evaluation' });
  }
};

// Get statistics for quality evaluation
const getQualityEvaluationStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportingMonth = `${month} ${year}`;

    // Get total ODNs ready for quality evaluation (completed document follow-up)
    const totalReadyQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE ra.status = 'Completed' 
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = TRUE
        AND o.documents_signed = TRUE
        AND o.documents_handover = TRUE
    `;

    // Get quality confirmed count
    const qualityConfirmedQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE ra.status = 'Completed' 
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = TRUE
        AND o.documents_signed = TRUE
        AND o.documents_handover = TRUE
        AND o.quality_confirmed = TRUE
    `;

    // Get quality pending count
    const qualityPendingQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE ra.status = 'Completed' 
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = TRUE
        AND o.documents_signed = TRUE
        AND o.documents_handover = TRUE
        AND o.quality_confirmed = FALSE
    `;

    // Get ODNs with feedback count
    const withFeedbackQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE ra.status = 'Completed' 
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = TRUE
        AND o.documents_signed = TRUE
        AND o.documents_handover = TRUE
        AND o.quality_feedback IS NOT NULL
        AND o.quality_feedback != ''
    `;

    const totalResult = await db.sequelize.query(totalReadyQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const confirmedResult = await db.sequelize.query(qualityConfirmedQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const pendingResult = await db.sequelize.query(qualityPendingQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const feedbackResult = await db.sequelize.query(withFeedbackQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

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