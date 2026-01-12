const db = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

// Get comprehensive dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    
    console.log('Dashboard Analytics request:', { startDate, endDate, month, year });

    // Default response structure
    const defaultResponse = {
      summary: {
        totalFacilities: 0,
        totalProcesses: 0,
        totalODNs: 0,
        totalPicklists: 0,
        processCompletionRate: 0,
        odnCompletionRate: 0,
        picklistCompletionRate: 0
      },
      distributions: {
        processStatus: [],
        odnStatus: [],
        facilitiesByRegion: [],
        routeAssignments: [],
        picklistStatus: []
      },
      trends: {
        monthlyProcesses: []
      }
    };

    try {
      // Get facilities count
      const facilitiesCount = await db.sequelize.query(`
        SELECT COUNT(*) as count FROM facilities
      `, { type: db.sequelize.QueryTypes.SELECT });

      defaultResponse.summary.totalFacilities = facilitiesCount[0]?.count || 0;

      // Get facilities by region
      if (facilitiesCount[0]?.count > 0) {
        const facilitiesByRegion = await db.sequelize.query(`
          SELECT 
            COALESCE(region_name, 'Unknown') as region_name, 
            COUNT(*) as count 
          FROM facilities 
          GROUP BY region_name
          ORDER BY count DESC
          LIMIT 10
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.distributions.facilitiesByRegion = facilitiesByRegion || [];
      }

      // Try to get processes data
      try {
        const processesCount = await db.sequelize.query(`
          SELECT COUNT(*) as count FROM processes
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.summary.totalProcesses = processesCount[0]?.count || 0;

        if (processesCount[0]?.count > 0) {
          const processStatus = await db.sequelize.query(`
            SELECT status, COUNT(*) as count 
            FROM processes
            GROUP BY status
          `, { type: db.sequelize.QueryTypes.SELECT });

          defaultResponse.distributions.processStatus = processStatus || [];

          // Get monthly trend
          const monthlyTrend = await db.sequelize.query(`
            SELECT 
              COALESCE(reporting_month, 'Unknown') as reporting_month,
              COUNT(*) as count
            FROM processes
            GROUP BY reporting_month
            ORDER BY id DESC
            LIMIT 6
          `, { type: db.sequelize.QueryTypes.SELECT });

          defaultResponse.trends.monthlyProcesses = monthlyTrend || [];
        }
      } catch (processError) {
        console.log('Processes table not available:', processError.message);
      }

      // Try to get ODNs data
      try {
        const odnsCount = await db.sequelize.query(`
          SELECT COUNT(*) as count FROM odns
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.summary.totalODNs = odnsCount[0]?.count || 0;
      } catch (odnError) {
        console.log('ODNs table not available:', odnError.message);
      }

      // Try to get picklists data
      try {
        const picklistsCount = await db.sequelize.query(`
          SELECT COUNT(*) as count FROM picklists
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.summary.totalPicklists = picklistsCount[0]?.count || 0;

        if (picklistsCount[0]?.count > 0) {
          const picklistStatus = await db.sequelize.query(`
            SELECT status, COUNT(*) as count 
            FROM picklists
            GROUP BY status
          `, { type: db.sequelize.QueryTypes.SELECT });

          defaultResponse.distributions.picklistStatus = picklistStatus || [];
        }
      } catch (picklistError) {
        console.log('Picklists table not available:', picklistError.message);
      }

      // Try to get route assignments data
      try {
        const routeAssignments = await db.sequelize.query(`
          SELECT status, COUNT(*) as count 
          FROM route_assignments
          GROUP BY status
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.distributions.routeAssignments = routeAssignments || [];
      } catch (routeError) {
        console.log('Route assignments table not available:', routeError.message);
      }

    } catch (error) {
      console.log('Database error:', error.message);
    }

    res.json(defaultResponse);

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard analytics',
      details: error.message 
    });
  }
};

// Get system performance metrics
const getSystemPerformance = async (req, res) => {
  try {
    console.log('System Performance request');

    const defaultPerformance = {
      performance: {
        avgProcessingTime: 0,
        totalUsers: 0,
        activeUsers: 0
      },
      recentActivity: []
    };

    try {
      // Get user stats
      const userStats = await db.sequelize.query(`
        SELECT COUNT(*) as total_users,
               SUM(CASE WHEN account_status = 'Active' THEN 1 ELSE 0 END) as active_users
        FROM users
      `, { type: db.sequelize.QueryTypes.SELECT });

      defaultPerformance.performance.totalUsers = userStats[0]?.total_users || 0;
      defaultPerformance.performance.activeUsers = userStats[0]?.active_users || 0;

      // Try to get processing time from processes
      try {
        const avgProcessingTime = await db.sequelize.query(`
          SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours
          FROM processes 
          WHERE updated_at IS NOT NULL
          LIMIT 1
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultPerformance.performance.avgProcessingTime = avgProcessingTime[0]?.avg_hours || 0;
      } catch (processTimeError) {
        console.log('Cannot calculate processing time:', processTimeError.message);
      }

    } catch (userError) {
      console.log('Users table error:', userError.message);
    }

    res.json(defaultPerformance);

  } catch (error) {
    console.error('Error fetching system performance:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system performance',
      details: error.message 
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getSystemPerformance
};