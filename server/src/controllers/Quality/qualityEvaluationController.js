const db = require('../../models');
const { Op } = require('sequelize');

// Get ODNs with completed document follow-up for quality evaluation
const getODNsForQualityEvaluation = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build the reporting month string
    const reportingMonth = `${month} ${year}`;

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
      INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
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
      INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE ra.status = 'Completed'
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = TRUE
        AND o.documents_signed = TRUE
        AND o.documents_handover = TRUE
        ${search ? 'AND (o.odn_number LIKE ? OR f.facility_name LIKE ?)' : ''}
    `;

    let queryParams = [reportingMonth, month];
    let countParams = [reportingMonth, month];

    if (search) {
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern);
    }

    queryParams.push(parseInt(limit), parseInt(offset));

    const odns = await db.sequelize.query(query, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.SELECT
    });

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
    const { updates, evaluated_by } = req.body;

    // Validation
    if (!updates || !Array.isArray(updates) || !evaluated_by) {
      return res.status(400).json({ 
        error: 'updates array and evaluated_by are required' 
      });
    }

    // Process each update
    const results = [];
    for (const update of updates) {
      const { odn_id, quality_confirmed, quality_feedback } = update;

      if (odn_id === undefined) {
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

        await db.sequelize.query(updateQuery, {
          replacements: [
            quality_confirmed || false, 
            quality_feedback || null, 
            evaluated_by, 
            odn_id
          ],
          type: db.sequelize.QueryTypes.UPDATE
        });

        results.push({
          odn_id,
          success: true,
          quality_confirmed: quality_confirmed || false,
          quality_feedback: quality_feedback || null
        });
      } catch (error) {
        results.push({
          odn_id,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk quality evaluation update completed',
      results,
      total_processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Error bulk updating quality evaluation:', error);
    res.status(500).json({ error: 'Failed to bulk update quality evaluation' });
  }
};

module.exports = {
  getODNsForQualityEvaluation,
  getQualityEvaluationStats,
  updateQualityEvaluation
};