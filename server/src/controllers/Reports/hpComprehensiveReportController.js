const db = require('../../models');
const { Op } = require('sequelize');

// Get comprehensive HP report data
const getComprehensiveHPReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportingMonth = month && year ? `${month} ${year}` : null;

    if (!reportingMonth) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // 1. Total Facilities (HP facilities with routes)
    const totalFacilitiesQuery = `
      SELECT COUNT(DISTINCT f.id) as total
      FROM facilities f
      WHERE f.route IS NOT NULL AND f.route != ''
    `;
    const [totalFacilitiesResult] = await db.sequelize.query(totalFacilitiesQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    // 2. Expected Facilities (should report in current month)
    const expectedFacilities = totalFacilitiesResult.total;

    // 3. RRF Sent (facilities that created processes but NOT "RRF not sent" ODN)
    const rrfSentQuery = `
      SELECT COUNT(DISTINCT p.facility_id) as total
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE p.reporting_month = ?
        AND f.route IS NOT NULL AND f.route != ''
        AND p.facility_id NOT IN (
          SELECT DISTINCT p2.facility_id 
          FROM processes p2 
          INNER JOIN odns o ON p2.id = o.process_id 
          WHERE o.odn_number = 'RRF not sent' AND p2.reporting_month = ?
        )
    `;
    const [rrfSentResult] = await db.sequelize.query(rrfSentQuery, {
      replacements: [reportingMonth, reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    // 4. RRF Not Sent
    const rrfNotSent = expectedFacilities - rrfSentResult.total;

    // 5. Facilities with RRF Sent - Details (excluding facilities with "RRF not sent" ODNs)
    const rrfSentFacilitiesQuery = `
      SELECT 
        f.id,
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        f.route,
        p.id as process_id,
        p.status as process_status,
        p.reporting_month
      FROM facilities f
      INNER JOIN processes p ON p.facility_id = f.id
      WHERE p.reporting_month = ?
        AND f.route IS NOT NULL AND f.route != ''
        AND p.facility_id NOT IN (
          SELECT DISTINCT p2.facility_id 
          FROM processes p2 
          INNER JOIN odns o ON p2.id = o.process_id 
          WHERE o.odn_number = 'RRF not sent' AND p2.reporting_month = ?
        )
      ORDER BY f.route, f.facility_name
    `;
    const rrfSentFacilities = await db.sequelize.query(rrfSentFacilitiesQuery, {
      replacements: [reportingMonth, reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    // 6. Facilities with RRF Not Sent - Details
    const rrfNotSentFacilitiesQuery = `
      SELECT 
        f.id,
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        f.route
      FROM facilities f
      WHERE f.route IS NOT NULL AND f.route != ''
        AND (
          -- Facilities with no processes at all
          f.id NOT IN (
            SELECT DISTINCT facility_id 
            FROM processes 
            WHERE reporting_month = ?
          )
          OR
          -- Facilities with processes but all ODNs are "RRF not sent"
          f.id IN (
            SELECT DISTINCT p.facility_id 
            FROM processes p 
            INNER JOIN odns o ON p.id = o.process_id 
            WHERE p.reporting_month = ? 
            AND o.odn_number = 'RRF not sent'
          )
        )
      ORDER BY f.route, f.facility_name
    `;
    const rrfNotSentFacilities = await db.sequelize.query(rrfNotSentFacilitiesQuery, {
      replacements: [reportingMonth, reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    // 7. ODN Statistics (excluding "RRF not sent")
    const odnStatsQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as total_odns,
        COUNT(DISTINCT CASE WHEN o.status = 'dispatched' THEN o.id END) as dispatched_odns,
        COUNT(DISTINCT CASE WHEN o.pod_confirmed = 1 THEN o.id END) as pod_confirmed_odns,
        COUNT(DISTINCT CASE WHEN o.quality_confirmed = 1 THEN o.id END) as quality_evaluated_odns
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      WHERE p.reporting_month = ?
        AND o.odn_number != 'RRF not sent'
    `;
    const [odnStats] = await db.sequelize.query(odnStatsQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    // 8. Route Statistics (excluding "RRF not sent")
    const routeStatsQuery = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as facilities_count,
        COUNT(DISTINCT CASE WHEN o.odn_number != 'RRF not sent' THEN o.id END) as odns_count,
        COUNT(DISTINCT CASE WHEN o.status = 'dispatched' AND o.odn_number != 'RRF not sent' THEN o.id END) as dispatched_count,
        COUNT(DISTINCT CASE WHEN o.pod_confirmed = 1 AND o.odn_number != 'RRF not sent' THEN o.id END) as pod_confirmed_count,
        COALESCE(SUM(
          CASE 
            WHEN ra.arrival_kilometer IS NOT NULL AND ra.departure_kilometer IS NOT NULL 
            THEN (ra.arrival_kilometer - ra.departure_kilometer)
            ELSE 0 
          END
        ), 0) as total_kilometers,
        e.full_name as assigned_by_name
      FROM routes r
      LEFT JOIN facilities f ON f.route = r.route_name
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      LEFT JOIN odns o ON o.process_id = p.id
      LEFT JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      LEFT JOIN employees e ON e.id = ra.assigned_by
      GROUP BY r.id, r.route_name, e.full_name
      HAVING facilities_count > 0
      ORDER BY r.route_name
    `;
    const routeStats = await db.sequelize.query(routeStatsQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    // 9. POD Details with Kilometer (excluding "RRF not sent")
    const podDetailsQuery = `
      SELECT 
        o.id as odn_id,
        o.odn_number,
        o.pod_number,
        o.pod_confirmed,
        o.pod_confirmed_at,
        f.facility_name,
        f.route,
        r.route_name,
        ra.arrival_kilometer,
        ra.status as dispatch_status
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      LEFT JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE p.reporting_month = ?
        AND o.pod_confirmed = 1
        AND o.odn_number != 'RRF not sent'
      ORDER BY f.route, f.facility_name, o.odn_number
    `;
    const podDetails = await db.sequelize.query(podDetailsQuery, {
      replacements: [month, reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    // 10. Workflow Progress by Stage (ODN-based, cumulative counts, excluding "RRF not sent")
    const workflowProgressQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN p.status IN ('completed', 'o2c_started', 'o2c_completed', 'ewm_completed', 'vehicle_requested') AND o.odn_number != 'RRF not sent' THEN o.id END) as o2c_stage,
        COUNT(DISTINCT CASE WHEN p.status IN ('o2c_completed', 'ewm_completed', 'vehicle_requested') AND o.odn_number != 'RRF not sent' THEN o.id END) as ewm_stage,
        COUNT(DISTINCT CASE WHEN p.status IN ('ewm_completed', 'vehicle_requested') AND o.odn_number != 'RRF not sent' THEN o.id END) as pi_stage,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' AND o.odn_number != 'RRF not sent' THEN o.id END) as tm_stage,
        COUNT(DISTINCT CASE 
          WHEN p.status = 'vehicle_requested' 
          AND o.odn_number != 'RRF not sent' 
          AND EXISTS (
            SELECT 1 FROM route_assignments ra 
            WHERE ra.route_id IN (
              SELECT r.id FROM routes r WHERE r.route_name = f.route
            ) 
            AND ra.ethiopian_month = SUBSTRING_INDEX(?, ' ', 1)
            AND ra.status IN ('Assigned', 'In Progress', 'Completed')
          )
          THEN o.id 
        END) as dispatched_stage,
        COUNT(DISTINCT CASE WHEN o.pod_confirmed = 1 AND o.odn_number != 'RRF not sent' THEN o.id END) as documentation_stage,
        COUNT(DISTINCT CASE WHEN o.documents_signed = 1 AND o.odn_number != 'RRF not sent' THEN o.id END) as doc_followup_stage,
        COUNT(DISTINCT CASE WHEN o.quality_confirmed = 1 AND o.odn_number != 'RRF not sent' THEN o.id END) as quality_stage
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN odns o ON o.process_id = p.id
      WHERE p.reporting_month = ?
        AND f.route IS NOT NULL AND f.route != ''
    `;
    const [workflowProgress] = await db.sequelize.query(workflowProgressQuery, {
      replacements: [reportingMonth, reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      reportingPeriod: reportingMonth,
      summary: {
        totalFacilities: expectedFacilities,
        expectedFacilities,
        rrfSent: rrfSentResult.total,
        rrfNotSent,
        totalODNs: odnStats.total_odns || 0,
        dispatchedODNs: odnStats.dispatched_odns || 0,
        podConfirmed: odnStats.pod_confirmed_odns || 0,
        qualityEvaluated: odnStats.quality_evaluated_odns || 0
      },
      rrfSentFacilities,
      rrfNotSentFacilities,
      routeStats,
      podDetails,
      workflowProgress
    });

  } catch (error) {
    console.error('Error fetching comprehensive HP report:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comprehensive HP report',
      message: error.message 
    });
  }
};

// Get time trend data (multiple months)
const getTimeTrendData = async (req, res) => {
  try {
    const { startMonth, startYear, endMonth, endYear } = req.query;

    // For simplicity, get last 6 months of data (excluding "RRF not sent")
    const trendQuery = `
      SELECT 
        p.reporting_month,
        COUNT(DISTINCT p.facility_id) as facilities_reported,
        COUNT(DISTINCT CASE WHEN o.odn_number != 'RRF not sent' THEN o.id END) as total_odns,
        COUNT(DISTINCT CASE WHEN o.status = 'dispatched' AND o.odn_number != 'RRF not sent' THEN o.id END) as dispatched_odns,
        COUNT(DISTINCT CASE WHEN o.pod_confirmed = 1 AND o.odn_number != 'RRF not sent' THEN o.id END) as pod_confirmed,
        COUNT(DISTINCT CASE WHEN o.quality_confirmed = 1 AND o.odn_number != 'RRF not sent' THEN o.id END) as quality_evaluated
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN odns o ON o.process_id = p.id
      WHERE f.route IS NOT NULL AND f.route != ''
      GROUP BY p.reporting_month
      ORDER BY p.reporting_month
    `;

    const trendData = await db.sequelize.query(trendQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      trendData
    });

  } catch (error) {
    console.error('Error fetching time trend data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch time trend data',
      message: error.message 
    });
  }
};

// Get detailed ODN and POD information
const getODNPODDetails = async (req, res) => {
  try {
    const { reporting_month } = req.query;

    if (!reporting_month) {
      return res.status(400).json({ error: 'Reporting month is required' });
    }

    const odnDetailsQuery = `
      SELECT 
        o.id,
        o.odn_number,
        o.pod_number,
        o.status,
        o.pod_confirmed,
        o.pod_confirmed_at,
        o.created_at as odn_created_at,
        f.id as facility_id,
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        f.route,
        p.id as process_id,
        p.reporting_month,
        p.status as process_status
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE p.reporting_month = ?
        AND f.route IS NOT NULL AND f.route != ''
        AND o.odn_number != 'RRF not sent'
      ORDER BY f.route, f.facility_name, o.odn_number
    `;

    const odnDetails = await db.sequelize.query(odnDetailsQuery, {
      replacements: [reporting_month],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      reportingPeriod: reporting_month,
      odnDetails
    });

  } catch (error) {
    console.error('Error fetching ODN/POD details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ODN/POD details',
      message: error.message 
    });
  }
};

// Get all ODN and POD information (no month filter)
const getAllODNPODDetails = async (req, res) => {
  try {
    const odnDetailsQuery = `
      SELECT 
        o.id,
        o.odn_number,
        o.pod_number,
        o.status,
        o.pod_confirmed,
        o.pod_confirmed_at,
        o.created_at as odn_created_at,
        f.id as facility_id,
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        f.route,
        p.id as process_id,
        p.reporting_month,
        p.status as process_status
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE f.route IS NOT NULL AND f.route != ''
        AND o.odn_number != 'RRF not sent'
      ORDER BY p.reporting_month DESC, f.route, f.facility_name, o.odn_number
    `;

    const odnDetails = await db.sequelize.query(odnDetailsQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      reportingPeriod: 'All',
      odnDetails
    });

  } catch (error) {
    console.error('Error fetching all ODN/POD details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch all ODN/POD details',
      message: error.message 
    });
  }
};

module.exports = {
  getComprehensiveHPReport,
  getTimeTrendData,
  getODNPODDetails,
  getAllODNPODDetails
};
