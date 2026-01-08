const db = require('../../models');
const { Op } = require('sequelize');

// Get ODNs with confirmed POD for document follow-up
const getODNsForFollowup = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build the reporting month string
    const reportingMonth = `${month} ${year}`;

    // Query to find ODNs with confirmed POD that need document follow-up
    const query = `
      SELECT DISTINCT 
        o.id as odn_id,
        o.odn_number,
        o.status as odn_status,
        o.pod_confirmed,
        o.pod_reason,
        o.documents_signed,
        o.documents_handover,
        o.followup_completed_by,
        o.followup_completed_at,
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
    console.error('Error fetching ODNs for follow-up:', error);
    res.status(500).json({ error: 'Failed to fetch ODNs for follow-up' });
  }
};

// Get statistics for document follow-up
const getFollowupStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportingMonth = `${month} ${year}`;

    // Get total ODNs with confirmed POD
    const totalConfirmedQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE ra.status = 'Completed' 
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = TRUE
    `;

    // Get documents signed count
    const documentsSignedQuery = `
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
    `;

    // Get documents handover count
    const documentsHandoverQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE ra.status = 'Completed' 
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = TRUE
        AND o.documents_handover = TRUE
    `;

    // Get completed follow-up count (both checkboxes checked)
    const completedFollowupQuery = `
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

    const totalResult = await db.sequelize.query(totalConfirmedQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const signedResult = await db.sequelize.query(documentsSignedQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const handoverResult = await db.sequelize.query(documentsHandoverQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const completedResult = await db.sequelize.query(completedFollowupQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      totalConfirmed: totalResult[0]?.count || 0,
      documentsSigned: signedResult[0]?.count || 0,
      documentsHandover: handoverResult[0]?.count || 0,
      completedFollowup: completedResult[0]?.count || 0,
      pendingFollowup: (totalResult[0]?.count || 0) - (completedResult[0]?.count || 0)
    });

  } catch (error) {
    console.error('Error fetching follow-up stats:', error);
    res.status(500).json({ error: 'Failed to fetch follow-up stats' });
  }
};

// Update document follow-up status
const updateDocumentFollowup = async (req, res) => {
  try {
    const { updates, completed_by } = req.body;

    // Validation
    if (!updates || !Array.isArray(updates) || !completed_by) {
      return res.status(400).json({ 
        error: 'updates array and completed_by are required' 
      });
    }

    // Process each update
    const results = [];
    for (const update of updates) {
      const { odn_id, documents_signed, documents_handover } = update;

      if (odn_id === undefined) {
        continue; // Skip invalid updates
      }

      try {
        const updateQuery = `
          UPDATE odns 
          SET documents_signed = ?, 
              documents_handover = ?,
              followup_completed_by = ?,
              followup_completed_at = NOW()
          WHERE id = ?
        `;

        await db.sequelize.query(updateQuery, {
          replacements: [
            documents_signed || false, 
            documents_handover || false, 
            completed_by, 
            odn_id
          ],
          type: db.sequelize.QueryTypes.UPDATE
        });

        results.push({
          odn_id,
          success: true,
          documents_signed: documents_signed || false,
          documents_handover: documents_handover || false
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
      message: 'Bulk document follow-up update completed',
      results,
      total_processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Error bulk updating document follow-up:', error);
    res.status(500).json({ error: 'Failed to bulk update document follow-up' });
  }
};

module.exports = {
  getODNsForFollowup,
  getFollowupStats,
  updateDocumentFollowup
};