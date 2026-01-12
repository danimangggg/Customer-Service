const db = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

// Get health program analytics
const getHealthProgramAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    
    console.log('Health Program Analytics request:', { startDate, endDate, month, year });

    // Simple fallback data structure
    const defaultResponse = {
      summary: {
        totalFacilities: 0,
        totalProcesses: 0,
        totalODNs: 0,
        completedProcesses: 0,
        processCompletionRate: 0,
        odnCompletionRate: 0
      },
      distributions: {
        facilitiesByRegion: [],
        processStatus: [],
        odnStatus: []
      },
      trends: {
        monthlyProcesses: []
      },
      topFacilities: []
    };

    try {
      // Check if tables exist and have data
      const facilitiesCount = await db.sequelize.query(`
        SELECT COUNT(*) as count FROM facilities
      `, { type: db.sequelize.QueryTypes.SELECT });

      console.log('Facilities count:', facilitiesCount);

      if (facilitiesCount[0]?.count > 0) {
        // Get HP facilities count
        const hpFacilitiesCount = await db.sequelize.query(`
          SELECT COUNT(*) as count 
          FROM facilities 
          WHERE facility_type = 'Health Program' OR facility_name LIKE '%HP%' OR facility_name LIKE '%Health%'
        `, { type: db.sequelize.QueryTypes.SELECT });

        // Get all facilities by region for basic data
        const facilitiesByRegion = await db.sequelize.query(`
          SELECT 
            COALESCE(region_name, 'Unknown') as region_name, 
            COUNT(*) as count 
          FROM facilities 
          GROUP BY region_name
          ORDER BY count DESC
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.summary.totalFacilities = hpFacilitiesCount[0]?.count || 0;
        defaultResponse.distributions.facilitiesByRegion = facilitiesByRegion || [];
      }

      // Try to get process data if table exists
      try {
        const processCount = await db.sequelize.query(`
          SELECT COUNT(*) as count FROM processes
        `, { type: db.sequelize.QueryTypes.SELECT });

        if (processCount[0]?.count > 0) {
          // Get process status distribution
          const processStatus = await db.sequelize.query(`
            SELECT status, COUNT(*) as count 
            FROM processes 
            GROUP BY status
          `, { type: db.sequelize.QueryTypes.SELECT });

          defaultResponse.summary.totalProcesses = processCount[0]?.count || 0;
          defaultResponse.distributions.processStatus = processStatus || [];
        }
      } catch (processError) {
        console.log('Processes table not available:', processError.message);
      }

      // Try to get ODN data if table exists
      try {
        const odnCount = await db.sequelize.query(`
          SELECT COUNT(*) as count FROM odns
        `, { type: db.sequelize.QueryTypes.SELECT });

        if (odnCount[0]?.count > 0) {
          defaultResponse.summary.totalODNs = odnCount[0]?.count || 0;
        }
      } catch (odnError) {
        console.log('ODNs table not available:', odnError.message);
      }

    } catch (tableError) {
      console.log('Database tables not fully available:', tableError.message);
    }

    res.json(defaultResponse);

  } catch (error) {
    console.error('Error fetching health program analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch health program analytics',
      details: error.message 
    });
  }
};

// Get detailed HP facility performance
const getHPFacilityPerformance = async (req, res) => {
  try {
    const { month, year, region } = req.query;
    
    console.log('HP Facility Performance request:', { month, year, region });

    try {
      // Check if facilities table exists
      const facilitiesExist = await db.sequelize.query(`
        SELECT COUNT(*) as count FROM facilities LIMIT 1
      `, { type: db.sequelize.QueryTypes.SELECT });

      if (facilitiesExist[0]?.count >= 0) {
        let whereClause = "WHERE (facility_type = 'Health Program' OR facility_name LIKE '%HP%' OR facility_name LIKE '%Health%')";
        let replacements = [];
        
        if (region) {
          whereClause += ' AND region_name = ?';
          replacements.push(region);
        }

        const facilityPerformance = await db.sequelize.query(`
          SELECT 
            id,
            facility_name,
            COALESCE(region_name, 'Unknown') as region_name,
            COALESCE(zone_name, 'Unknown') as zone_name,
            COALESCE(woreda_name, 'Unknown') as woreda_name,
            COALESCE(route, 'Not Assigned') as route,
            0 as total_processes,
            0 as completed_processes,
            0 as total_odns,
            0 as confirmed_pods,
            0 as quality_confirmed,
            0 as completion_rate,
            0 as pod_rate,
            updated_at as last_activity
          FROM facilities 
          ${whereClause}
          ORDER BY facility_name
        `, { 
          replacements,
          type: db.sequelize.QueryTypes.SELECT 
        });

        res.json(facilityPerformance);
      } else {
        res.json([]);
      }

    } catch (tableError) {
      console.log('Facilities table not available:', tableError.message);
      res.json([]);
    }

  } catch (error) {
    console.error('Error fetching HP facility performance:', error);
    res.status(500).json({ 
      error: 'Failed to fetch HP facility performance',
      details: error.message 
    });
  }
};

module.exports = {
  getHealthProgramAnalytics,
  getHPFacilityPerformance
};