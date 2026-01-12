const db = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

// Get comprehensive dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (month && year) {
      // Ethiopian calendar month filter
      const reportingMonth = `${month} ${year}`;
      dateFilter = { reporting_month: reportingMonth };
    }

    // Get total facilities
    const totalFacilities = await db.sequelize.query(`
      SELECT COUNT(*) as count FROM facilities
    `, { type: db.sequelize.QueryTypes.SELECT });

    // Get total processes
    const totalProcesses = await db.sequelize.query(`
      SELECT COUNT(*) as count FROM processes
      ${Object.keys(dateFilter).length > 0 ? 'WHERE ' + Object.keys(dateFilter).map(key => 
        key === 'reporting_month' ? `${key} = ?` : `${key} BETWEEN ? AND ?`
      ).join(' AND ') : ''}
    `, { 
      replacements: Object.keys(dateFilter).length > 0 ? 
        (dateFilter.reporting_month ? [dateFilter.reporting_month] : 
         [dateFilter.createdAt[Op.between][0], dateFilter.createdAt[Op.between][1]]) : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get total ODNs
    const totalODNs = await db.sequelize.query(`
      SELECT COUNT(o.id) as count 
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      ${Object.keys(dateFilter).length > 0 ? 'WHERE ' + Object.keys(dateFilter).map(key => 
        key === 'reporting_month' ? `p.${key} = ?` : `p.${key} BETWEEN ? AND ?`
      ).join(' AND ') : ''}
    `, { 
      replacements: Object.keys(dateFilter).length > 0 ? 
        (dateFilter.reporting_month ? [dateFilter.reporting_month] : 
         [dateFilter.createdAt[Op.between][0], dateFilter.createdAt[Op.between][1]]) : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get total picklists
    const totalPicklists = await db.sequelize.query(`
      SELECT COUNT(*) as count FROM picklists
      ${Object.keys(dateFilter).length > 0 && !dateFilter.reporting_month ? 'WHERE createdAt BETWEEN ? AND ?' : ''}
    `, { 
      replacements: Object.keys(dateFilter).length > 0 && !dateFilter.reporting_month ? 
        [dateFilter.createdAt[Op.between][0], dateFilter.createdAt[Op.between][1]] : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get process status distribution
    const processStatusDistribution = await db.sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM processes
      ${Object.keys(dateFilter).length > 0 ? 'WHERE ' + Object.keys(dateFilter).map(key => 
        key === 'reporting_month' ? `${key} = ?` : `${key} BETWEEN ? AND ?`
      ).join(' AND ') : ''}
      GROUP BY status
    `, { 
      replacements: Object.keys(dateFilter).length > 0 ? 
        (dateFilter.reporting_month ? [dateFilter.reporting_month] : 
         [dateFilter.createdAt[Op.between][0], dateFilter.createdAt[Op.between][1]]) : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get ODN status distribution
    const odnStatusDistribution = await db.sequelize.query(`
      SELECT 
        CASE 
          WHEN o.pod_confirmed = 1 AND o.documents_signed = 1 AND o.documents_handover = 1 AND o.quality_confirmed = 1 THEN 'Fully Completed'
          WHEN o.pod_confirmed = 1 AND o.documents_signed = 1 AND o.documents_handover = 1 THEN 'Quality Pending'
          WHEN o.pod_confirmed = 1 AND (o.documents_signed = 1 OR o.documents_handover = 1) THEN 'Document Follow-up'
          WHEN o.pod_confirmed = 1 THEN 'POD Confirmed'
          ELSE 'In Progress'
        END as status,
        COUNT(*) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      ${Object.keys(dateFilter).length > 0 ? 'WHERE ' + Object.keys(dateFilter).map(key => 
        key === 'reporting_month' ? `p.${key} = ?` : `p.${key} BETWEEN ? AND ?`
      ).join(' AND ') : ''}
      GROUP BY 
        CASE 
          WHEN o.pod_confirmed = 1 AND o.documents_signed = 1 AND o.documents_handover = 1 AND o.quality_confirmed = 1 THEN 'Fully Completed'
          WHEN o.pod_confirmed = 1 AND o.documents_signed = 1 AND o.documents_handover = 1 THEN 'Quality Pending'
          WHEN o.pod_confirmed = 1 AND (o.documents_signed = 1 OR o.documents_handover = 1) THEN 'Document Follow-up'
          WHEN o.pod_confirmed = 1 THEN 'POD Confirmed'
          ELSE 'In Progress'
        END
    `, { 
      replacements: Object.keys(dateFilter).length > 0 ? 
        (dateFilter.reporting_month ? [dateFilter.reporting_month] : 
         [dateFilter.createdAt[Op.between][0], dateFilter.createdAt[Op.between][1]]) : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get facilities by region
    const facilitiesByRegion = await db.sequelize.query(`
      SELECT region_name, COUNT(*) as count 
      FROM facilities 
      GROUP BY region_name
      ORDER BY count DESC
      LIMIT 10
    `, { type: db.sequelize.QueryTypes.SELECT });

    // Get route assignments status
    const routeAssignmentStats = await db.sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM route_assignments
      ${month ? 'WHERE ethiopian_month = ?' : ''}
      GROUP BY status
    `, { 
      replacements: month ? [month] : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get picklist status distribution
    const picklistStatusDistribution = await db.sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM picklists
      ${Object.keys(dateFilter).length > 0 && !dateFilter.reporting_month ? 'WHERE createdAt BETWEEN ? AND ?' : ''}
      GROUP BY status
    `, { 
      replacements: Object.keys(dateFilter).length > 0 && !dateFilter.reporting_month ? 
        [dateFilter.createdAt[Op.between][0], dateFilter.createdAt[Op.between][1]] : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get monthly trend (last 6 months of processes)
    const monthlyTrend = await db.sequelize.query(`
      SELECT 
        reporting_month,
        COUNT(*) as count
      FROM processes
      WHERE reporting_month IS NOT NULL
      GROUP BY reporting_month
      ORDER BY id DESC
      LIMIT 6
    `, { type: db.sequelize.QueryTypes.SELECT });

    // Calculate completion rates
    const completedProcesses = processStatusDistribution.find(p => p.status === 'vehicle_requested')?.count || 0;
    const totalProcessCount = totalProcesses[0]?.count || 0;
    const processCompletionRate = totalProcessCount > 0 ? ((completedProcesses / totalProcessCount) * 100).toFixed(1) : 0;

    const fullyCompletedODNs = odnStatusDistribution.find(o => o.status === 'Fully Completed')?.count || 0;
    const totalODNCount = totalODNs[0]?.count || 0;
    const odnCompletionRate = totalODNCount > 0 ? ((fullyCompletedODNs / totalODNCount) * 100).toFixed(1) : 0;

    const completedPicklists = picklistStatusDistribution.find(p => p.status === 'Completed')?.count || 0;
    const totalPicklistCount = totalPicklists[0]?.count || 0;
    const picklistCompletionRate = totalPicklistCount > 0 ? ((completedPicklists / totalPicklistCount) * 100).toFixed(1) : 0;

    res.json({
      summary: {
        totalFacilities: totalFacilities[0]?.count || 0,
        totalProcesses: totalProcessCount,
        totalODNs: totalODNCount,
        totalPicklists: totalPicklistCount,
        processCompletionRate,
        odnCompletionRate,
        picklistCompletionRate
      },
      distributions: {
        processStatus: processStatusDistribution,
        odnStatus: odnStatusDistribution,
        facilitiesByRegion,
        routeAssignments: routeAssignmentStats,
        picklistStatus: picklistStatusDistribution
      },
      trends: {
        monthlyProcesses: monthlyTrend
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
};

// Get system performance metrics
const getSystemPerformance = async (req, res) => {
  try {
    // Get average processing time
    const avgProcessingTime = await db.sequelize.query(`
      SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours
      FROM processes 
      WHERE status = 'vehicle_requested' AND updated_at IS NOT NULL
    `, { type: db.sequelize.QueryTypes.SELECT });

    // Get user activity stats
    const userStats = await db.sequelize.query(`
      SELECT COUNT(*) as total_users,
             SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users
      FROM users
    `, { type: db.sequelize.QueryTypes.SELECT });

    // Get recent activity
    const recentActivity = await db.sequelize.query(`
      SELECT 'Process' as type, status, created_at, updated_at
      FROM processes 
      ORDER BY updated_at DESC 
      LIMIT 10
    `, { type: db.sequelize.QueryTypes.SELECT });

    res.json({
      performance: {
        avgProcessingTime: avgProcessingTime[0]?.avg_hours || 0,
        totalUsers: userStats[0]?.total_users || 0,
        activeUsers: userStats[0]?.active_users || 0
      },
      recentActivity
    });

  } catch (error) {
    console.error('Error fetching system performance:', error);
    res.status(500).json({ error: 'Failed to fetch system performance' });
  }
};

module.exports = {
  getDashboardAnalytics,
  getSystemPerformance
};