const db = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

// Get dispatch reports and analytics
const getDispatchReports = async (req, res) => {
  try {
    const { month, year, startDate, endDate, route_id } = req.query;
    
    let dateFilter = '';
    let replacements = [];
    
    if (month && year) {
      dateFilter = 'WHERE ethiopian_month = ?';
      replacements.push(month);
    } else if (startDate && endDate) {
      dateFilter = 'WHERE created_at BETWEEN ? AND ?';
      replacements.push(new Date(startDate), new Date(endDate));
    } else {
      dateFilter = 'WHERE 1=1';
    }
    
    if (route_id) {
      dateFilter += ' AND route_id = ?';
      replacements.push(route_id);
    }

    // Get dispatch statistics
    const dispatchStats = await db.sequelize.query(`
      SELECT 
        COUNT(*) as total_assignments,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_dispatches,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as assigned,
        ROUND(
          (SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
          1
        ) as completion_rate
      FROM route_assignments
      ${dateFilter}
    `, { 
      replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get dispatch by route
    const dispatchByRoute = await db.sequelize.query(`
      SELECT 
        COALESCE(r.route_name, CONCAT('Route ', ra.route_id)) as route_name,
        COUNT(ra.id) as total_assignments,
        SUM(CASE WHEN ra.status = 'Completed' THEN 1 ELSE 0 END) as completed,
        ROUND(
          (SUM(CASE WHEN ra.status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(ra.id)), 
          1
        ) as completion_rate
      FROM route_assignments ra
      LEFT JOIN routes r ON ra.route_id = r.id
      ${dateFilter.replace('WHERE', 'WHERE')}
      GROUP BY ra.route_id, r.route_name
      ORDER BY completion_rate DESC, total_assignments DESC
      LIMIT 10
    `, { 
      replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get monthly dispatch trend
    const monthlyTrend = await db.sequelize.query(`
      SELECT 
        ethiopian_month,
        COUNT(*) as total_assignments,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
      FROM route_assignments
      WHERE ethiopian_month IS NOT NULL
      GROUP BY ethiopian_month
      ORDER BY MAX(id) DESC
      LIMIT 6
    `, { type: db.sequelize.QueryTypes.SELECT });

    res.json({
      stats: dispatchStats[0] || { total_assignments: 0, completed_dispatches: 0, in_progress: 0, assigned: 0, completion_rate: 0 },
      routePerformance: dispatchByRoute || [],
      monthlyTrend: monthlyTrend || []
    });

  } catch (error) {
    console.error('Error fetching dispatch reports:', error);
    res.status(500).json({ error: 'Failed to fetch dispatch reports', details: error.message });
  }
};

// Get documentation reports
const getDocumentationReports = async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    
    let dateFilter = '';
    let replacements = [];
    
    if (month && year) {
      const reportingMonth = `${month} ${year}`;
      dateFilter = 'AND p.reporting_month = ?';
      replacements.push(reportingMonth);
    } else if (startDate && endDate) {
      dateFilter = 'AND p.created_at BETWEEN ? AND ?';
      replacements.push(new Date(startDate), new Date(endDate));
    }

    // Get documentation statistics
    const docStats = await db.sequelize.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_odns,
        SUM(CASE WHEN o.pod_confirmed = 1 THEN 1 ELSE 0 END) as pod_confirmed,
        SUM(CASE WHEN o.pod_confirmed = 0 THEN 1 ELSE 0 END) as pod_pending,
        ROUND(
          (SUM(CASE WHEN o.pod_confirmed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT o.id)), 
          1
        ) as confirmation_rate
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      WHERE ra.status = 'Completed' AND p.status = 'vehicle_requested' ${dateFilter}
    `, { 
      replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get documentation by region
    const docByRegion = await db.sequelize.query(`
      SELECT 
        f.region_name,
        COUNT(DISTINCT o.id) as total_odns,
        SUM(CASE WHEN o.pod_confirmed = 1 THEN 1 ELSE 0 END) as confirmed,
        ROUND(
          (SUM(CASE WHEN o.pod_confirmed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT o.id)), 
          1
        ) as confirmation_rate
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      WHERE ra.status = 'Completed' AND p.status = 'vehicle_requested' ${dateFilter}
      GROUP BY f.region_name
      ORDER BY confirmation_rate DESC
    `, { 
      replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get POD reasons analysis
    const podReasons = await db.sequelize.query(`
      SELECT 
        o.pod_reason,
        COUNT(*) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      WHERE o.pod_confirmed = 0 AND o.pod_reason IS NOT NULL AND o.pod_reason != '' ${dateFilter}
      GROUP BY o.pod_reason
      ORDER BY count DESC
      LIMIT 10
    `, { 
      replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    res.json({
      stats: docStats[0] || {},
      regionPerformance: docByRegion,
      podReasons
    });

  } catch (error) {
    console.error('Error fetching documentation reports:', error);
    res.status(500).json({ error: 'Failed to fetch documentation reports' });
  }
};

// Get document follow-up reports
const getFollowupReports = async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    
    let dateFilter = '';
    let replacements = [];
    
    if (month && year) {
      const reportingMonth = `${month} ${year}`;
      dateFilter = 'AND p.reporting_month = ?';
      replacements.push(reportingMonth);
    } else if (startDate && endDate) {
      dateFilter = 'AND p.created_at BETWEEN ? AND ?';
      replacements.push(new Date(startDate), new Date(endDate));
    }

    // Get follow-up statistics
    const followupStats = await db.sequelize.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_confirmed_pods,
        SUM(CASE WHEN o.documents_signed = 1 THEN 1 ELSE 0 END) as documents_signed,
        SUM(CASE WHEN o.documents_handover = 1 THEN 1 ELSE 0 END) as documents_handover,
        SUM(CASE WHEN o.documents_signed = 1 AND o.documents_handover = 1 THEN 1 ELSE 0 END) as completed_followup,
        ROUND(
          (SUM(CASE WHEN o.documents_signed = 1 AND o.documents_handover = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT o.id)), 
          1
        ) as followup_completion_rate
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      WHERE ra.status = 'Completed' AND p.status = 'vehicle_requested' AND o.pod_confirmed = 1 ${dateFilter}
    `, { 
      replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get follow-up by region
    const followupByRegion = await db.sequelize.query(`
      SELECT 
        f.region_name,
        COUNT(DISTINCT o.id) as total_pods,
        SUM(CASE WHEN o.documents_signed = 1 AND o.documents_handover = 1 THEN 1 ELSE 0 END) as completed,
        ROUND(
          (SUM(CASE WHEN o.documents_signed = 1 AND o.documents_handover = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT o.id)), 
          1
        ) as completion_rate
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      WHERE ra.status = 'Completed' AND p.status = 'vehicle_requested' AND o.pod_confirmed = 1 ${dateFilter}
      GROUP BY f.region_name
      ORDER BY completion_rate DESC
    `, { 
      replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    res.json({
      stats: followupStats[0] || {},
      regionPerformance: followupByRegion
    });

  } catch (error) {
    console.error('Error fetching follow-up reports:', error);
    res.status(500).json({ error: 'Failed to fetch follow-up reports' });
  }
};

// Get quality evaluation reports
const getQualityReports = async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    
    let dateFilter = '';
    let replacements = [];
    
    if (month && year) {
      const reportingMonth = `${month} ${year}`;
      dateFilter = 'AND p.reporting_month = ?';
      replacements.push(reportingMonth);
    } else if (startDate && endDate) {
      dateFilter = 'AND p.created_at BETWEEN ? AND ?';
      replacements.push(new Date(startDate), new Date(endDate));
    }

    // Get quality evaluation statistics
    const qualityStats = await db.sequelize.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_ready_for_quality,
        SUM(CASE WHEN o.quality_confirmed = 1 THEN 1 ELSE 0 END) as quality_confirmed,
        SUM(CASE WHEN o.quality_feedback IS NOT NULL AND o.quality_feedback != '' THEN 1 ELSE 0 END) as with_feedback,
        ROUND(
          (SUM(CASE WHEN o.quality_confirmed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT o.id)), 
          1
        ) as quality_confirmation_rate
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      WHERE ra.status = 'Completed' 
        AND p.status = 'vehicle_requested' 
        AND o.pod_confirmed = 1 
        AND o.documents_signed = 1 
        AND o.documents_handover = 1 ${dateFilter}
    `, { 
      replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get quality by region
    const qualityByRegion = await db.sequelize.query(`
      SELECT 
        f.region_name,
        COUNT(DISTINCT o.id) as total_ready,
        SUM(CASE WHEN o.quality_confirmed = 1 THEN 1 ELSE 0 END) as confirmed,
        ROUND(
          (SUM(CASE WHEN o.quality_confirmed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT o.id)), 
          1
        ) as confirmation_rate
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      WHERE ra.status = 'Completed' 
        AND p.status = 'vehicle_requested' 
        AND o.pod_confirmed = 1 
        AND o.documents_signed = 1 
        AND o.documents_handover = 1 ${dateFilter}
      GROUP BY f.region_name
      ORDER BY confirmation_rate DESC
    `, { 
      replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    res.json({
      stats: qualityStats[0] || {},
      regionPerformance: qualityByRegion
    });

  } catch (error) {
    console.error('Error fetching quality reports:', error);
    res.status(500).json({ error: 'Failed to fetch quality reports' });
  }
};

// Get comprehensive workflow reports
const getWorkflowReports = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let dateFilter = '';
    let replacements = [];
    
    if (month && year) {
      const reportingMonth = `${month} ${year}`;
      dateFilter = 'AND p.reporting_month = ?';
      replacements.push(reportingMonth);
    }

    // Get complete workflow statistics
    const workflowStats = await db.sequelize.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_processes,
        COUNT(DISTINCT ra.id) as total_route_assignments,
        SUM(CASE WHEN ra.status = 'Completed' THEN 1 ELSE 0 END) as completed_dispatches,
        COUNT(DISTINCT o.id) as total_odns,
        SUM(CASE WHEN o.pod_confirmed = 1 THEN 1 ELSE 0 END) as pod_confirmed,
        SUM(CASE WHEN o.documents_signed = 1 AND o.documents_handover = 1 THEN 1 ELSE 0 END) as followup_completed,
        SUM(CASE WHEN o.quality_confirmed = 1 THEN 1 ELSE 0 END) as quality_confirmed,
        SUM(CASE WHEN o.pod_confirmed = 1 AND o.documents_signed = 1 AND o.documents_handover = 1 AND o.quality_confirmed = 1 THEN 1 ELSE 0 END) as fully_completed
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      LEFT JOIN route_assignments ra ON ra.route_id = r.id
      LEFT JOIN odns o ON o.process_id = p.id
      WHERE p.status = 'vehicle_requested' ${dateFilter}
    `, { 
      replacements: replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get workflow funnel data - using separate queries to avoid UNION parameter issues
    const processesCreated = await db.sequelize.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE p.status = 'vehicle_requested' ${dateFilter}
    `, { 
      replacements: replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    const routesDispatched = await db.sequelize.query(`
      SELECT COUNT(DISTINCT ra.id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      WHERE p.status = 'vehicle_requested' AND ra.status = 'Completed' ${dateFilter}
    `, { 
      replacements: replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    const podConfirmed = await db.sequelize.query(`
      SELECT COUNT(DISTINCT o.id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      INNER JOIN odns o ON o.process_id = p.id
      WHERE p.status = 'vehicle_requested' AND ra.status = 'Completed' AND o.pod_confirmed = 1 ${dateFilter}
    `, { 
      replacements: replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    const followupCompleted = await db.sequelize.query(`
      SELECT COUNT(DISTINCT o.id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      INNER JOIN odns o ON o.process_id = p.id
      WHERE p.status = 'vehicle_requested' 
        AND ra.status = 'Completed' 
        AND o.pod_confirmed = 1 
        AND o.documents_signed = 1 
        AND o.documents_handover = 1 ${dateFilter}
    `, { 
      replacements: replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    const qualityConfirmed = await db.sequelize.query(`
      SELECT COUNT(DISTINCT o.id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      INNER JOIN odns o ON o.process_id = p.id
      WHERE p.status = 'vehicle_requested' 
        AND ra.status = 'Completed' 
        AND o.pod_confirmed = 1 
        AND o.documents_signed = 1 
        AND o.documents_handover = 1 
        AND o.quality_confirmed = 1 ${dateFilter}
    `, { 
      replacements: replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Build funnel data
    const workflowFunnel = [
      { stage: 'Processes Created', count: processesCreated[0]?.count || 0, stage_order: 1 },
      { stage: 'Routes Dispatched', count: routesDispatched[0]?.count || 0, stage_order: 2 },
      { stage: 'POD Confirmed', count: podConfirmed[0]?.count || 0, stage_order: 3 },
      { stage: 'Follow-up Completed', count: followupCompleted[0]?.count || 0, stage_order: 4 },
      { stage: 'Quality Confirmed', count: qualityConfirmed[0]?.count || 0, stage_order: 5 }
    ];

    res.json({
      stats: workflowStats[0] || {},
      funnel: workflowFunnel
    });

  } catch (error) {
    console.error('Error fetching workflow reports:', error);
    res.status(500).json({ error: 'Failed to fetch workflow reports' });
  }
};

module.exports = {
  getDispatchReports,
  getDocumentationReports,
  getFollowupReports,
  getQualityReports,
  getWorkflowReports
};