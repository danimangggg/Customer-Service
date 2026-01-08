const db = require('../../models');
const { Op } = require('sequelize');

// Get dispatched ODNs for POD confirmation
const getDispatchedODNs = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build the reporting month string
    const reportingMonth = `${month} ${year}`;

    // Query to find ODNs from dispatched routes (completed assignments)
    const query = `
      SELECT DISTINCT 
        o.id as odn_id,
        o.odn_number,
        o.status as odn_status,
        o.pod_confirmed,
        o.pod_reason,
        o.pod_confirmed_by,
        o.pod_confirmed_at,
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
    console.error('Error fetching dispatched ODNs:', error);
    res.status(500).json({ error: 'Failed to fetch dispatched ODNs' });
  }
};

// Get statistics for documentation management
const getDocumentationStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportingMonth = `${month} ${year}`;

    // Get total dispatched ODNs
    const totalDispatchedQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE ra.status = 'Completed' AND p.status = 'vehicle_requested'
    `;

    // Get confirmed PODs
    const confirmedPODsQuery = `
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

    // Get pending PODs
    const pendingPODsQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE ra.status = 'Completed' 
        AND p.status = 'vehicle_requested'
        AND o.pod_confirmed = FALSE
    `;

    const totalResult = await db.sequelize.query(totalDispatchedQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const confirmedResult = await db.sequelize.query(confirmedPODsQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const pendingResult = await db.sequelize.query(pendingPODsQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      totalDispatched: totalResult[0]?.count || 0,
      confirmedPODs: confirmedResult[0]?.count || 0,
      pendingPODs: pendingResult[0]?.count || 0
    });

  } catch (error) {
    console.error('Error fetching documentation stats:', error);
    res.status(500).json({ error: 'Failed to fetch documentation stats' });
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
    for (const update of updates) {
      const { odn_id, pod_confirmed, pod_reason } = update;

      if (odn_id === undefined || pod_confirmed === undefined) {
        continue; // Skip invalid updates
      }

      // If not confirmed, reason should be provided
      if (!pod_confirmed && !pod_reason) {
        continue; // Skip updates without reason when not confirmed
      }

      try {
        const updateQuery = `
          UPDATE odns 
          SET pod_confirmed = ?, 
              pod_reason = ?,
              pod_confirmed_by = ?,
              pod_confirmed_at = NOW()
          WHERE id = ?
        `;

        await db.sequelize.query(updateQuery, {
          replacements: [pod_confirmed, pod_reason || null, confirmed_by, odn_id],
          type: db.sequelize.QueryTypes.UPDATE
        });

        results.push({
          odn_id,
          success: true,
          pod_confirmed,
          pod_reason: pod_reason || null
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
      message: 'Bulk POD confirmation update completed',
      results,
      total_processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Error bulk updating POD confirmations:', error);
    res.status(500).json({ error: 'Failed to bulk update POD confirmations' });
  }
};

module.exports = {
  getDispatchedODNs,
  getDocumentationStats,
  updatePODConfirmation,
  bulkUpdatePODConfirmation
};