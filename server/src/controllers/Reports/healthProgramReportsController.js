const db = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

// Get health program analytics
const getHealthProgramAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    
    // Build date filter for processes
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (month && year) {
      const reportingMonth = `${month} ${year}`;
      dateFilter.reporting_month = reportingMonth;
    }

    // Get total HP facilities
    const totalHPFacilities = await db.sequelize.query(`
      SELECT COUNT(*) as count 
      FROM facilities 
      WHERE facility_type = 'Health Program' OR facility_name LIKE '%HP%' OR facility_name LIKE '%Health%'
    `, { type: db.sequelize.QueryTypes.SELECT });

    // Get total HP processes
    const totalHPProcesses = await db.sequelize.query(`
      SELECT COUNT(p.id) as count 
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE (f.facility_type = 'Health Program' OR f.facility_name LIKE '%HP%' OR f.facility_name LIKE '%Health%')
      ${Object.keys(dateFilter).length > 0 ? 'AND ' + Object.keys(dateFilter).map(key => 
        key === 'reporting_month' ? `p.${key} = ?` : `p.${key} BETWEEN ? AND ?`
      ).join(' AND ') : ''}
    `, { 
      replacements: Object.keys(dateFilter).length > 0 ? 
        (dateFilter.reporting_month ? [dateFilter.reporting_month] : 
         [dateFilter.created_at[Op.between][0], dateFilter.created_at[Op.between][1]]) : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get HP ODNs
    const totalHPODNs = await db.sequelize.query(`
      SELECT COUNT(o.id) as count 
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE (f.facility_type = 'Health Program' OR f.facility_name LIKE '%HP%' OR f.facility_name LIKE '%Health%')
      ${Object.keys(dateFilter).length > 0 ? 'AND ' + Object.keys(dateFilter).map(key => 
        key === 'reporting_month' ? `p.${key} = ?` : `p.${key} BETWEEN ? AND ?`
      ).join(' AND ') : ''}
    `, { 
      replacements: Object.keys(dateFilter).length > 0 ? 
        (dateFilter.reporting_month ? [dateFilter.reporting_month] : 
         [dateFilter.created_at[Op.between][0], dateFilter.created_at[Op.between][1]]) : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get completed HP processes
    const completedHPProcesses = await db.sequelize.query(`
      SELECT COUNT(p.id) as count 
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE (f.facility_type = 'Health Program' OR f.facility_name LIKE '%HP%' OR f.facility_name LIKE '%Health%')
        AND p.status = 'vehicle_requested'
      ${Object.keys(dateFilter).length > 0 ? 'AND ' + Object.keys(dateFilter).map(key => 
        key === 'reporting_month' ? `p.${key} = ?` : `p.${key} BETWEEN ? AND ?`
      ).join(' AND ') : ''}
    `, { 
      replacements: Object.keys(dateFilter).length > 0 ? 
        (dateFilter.reporting_month ? [dateFilter.reporting_month] : 
         [dateFilter.created_at[Op.between][0], dateFilter.created_at[Op.between][1]]) : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get HP facilities by region
    const facilitiesByRegion = await db.sequelize.query(`
      SELECT region_name, COUNT(*) as count 
      FROM facilities 
      WHERE facility_type = 'Health Program' OR facility_name LIKE '%HP%' OR facility_name LIKE '%Health%'
      GROUP BY region_name
      ORDER BY count DESC
    `, { type: db.sequelize.QueryTypes.SELECT });

    // Get HP process status distribution
    const processStatusDistribution = await db.sequelize.query(`
      SELECT p.status, COUNT(*) as count 
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE (f.facility_type = 'Health Program' OR f.facility_name LIKE '%HP%' OR f.facility_name LIKE '%Health%')
      ${Object.keys(dateFilter).length > 0 ? 'AND ' + Object.keys(dateFilter).map(key => 
        key === 'reporting_month' ? `p.${key} = ?` : `p.${key} BETWEEN ? AND ?`
      ).join(' AND ') : ''}
      GROUP BY p.status
    `, { 
      replacements: Object.keys(dateFilter).length > 0 ? 
        (dateFilter.reporting_month ? [dateFilter.reporting_month] : 
         [dateFilter.created_at[Op.between][0], dateFilter.created_at[Op.between][1]]) : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get HP ODN completion status
    const odnCompletionStatus = await db.sequelize.query(`
      SELECT 
        CASE 
          WHEN o.pod_confirmed = 1 AND o.documents_signed = 1 AND o.documents_handover = 1 AND o.quality_confirmed = 1 THEN 'Fully Completed'
          WHEN o.pod_confirmed = 1 AND o.documents_signed = 1 AND o.documents_handover = 1 THEN 'Quality Pending'
          WHEN o.pod_confirmed = 1 THEN 'POD Confirmed'
          ELSE 'In Progress'
        END as status,
        COUNT(*) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE (f.facility_type = 'Health Program' OR f.facility_name LIKE '%HP%' OR f.facility_name LIKE '%Health%')
      ${Object.keys(dateFilter).length > 0 ? 'AND ' + Object.keys(dateFilter).map(key => 
        key === 'reporting_month' ? `p.${key} = ?` : `p.${key} BETWEEN ? AND ?`
      ).join(' AND ') : ''}
      GROUP BY 
        CASE 
          WHEN o.pod_confirmed = 1 AND o.documents_signed = 1 AND o.documents_handover = 1 AND o.quality_confirmed = 1 THEN 'Fully Completed'
          WHEN o.pod_confirmed = 1 AND o.documents_signed = 1 AND o.documents_handover = 1 THEN 'Quality Pending'
          WHEN o.pod_confirmed = 1 THEN 'POD Confirmed'
          ELSE 'In Progress'
        END
    `, { 
      replacements: Object.keys(dateFilter).length > 0 ? 
        (dateFilter.reporting_month ? [dateFilter.reporting_month] : 
         [dateFilter.created_at[Op.between][0], dateFilter.created_at[Op.between][1]]) : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Get monthly HP process trend
    const monthlyTrend = await db.sequelize.query(`
      SELECT 
        p.reporting_month,
        COUNT(*) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE (f.facility_type = 'Health Program' OR f.facility_name LIKE '%HP%' OR f.facility_name LIKE '%Health%')
        AND p.reporting_month IS NOT NULL
      GROUP BY p.reporting_month
      ORDER BY p.id DESC
      LIMIT 6
    `, { type: db.sequelize.QueryTypes.SELECT });

    // Get top performing HP facilities
    const topFacilities = await db.sequelize.query(`
      SELECT 
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        COUNT(p.id) as total_processes,
        SUM(CASE WHEN p.status = 'vehicle_requested' THEN 1 ELSE 0 END) as completed_processes,
        ROUND(
          (SUM(CASE WHEN p.status = 'vehicle_requested' THEN 1 ELSE 0 END) * 100.0 / COUNT(p.id)), 
          1
        ) as completion_rate
      FROM facilities f
      LEFT JOIN processes p ON f.id = p.facility_id
      WHERE (f.facility_type = 'Health Program' OR f.facility_name LIKE '%HP%' OR f.facility_name LIKE '%Health%')
      ${Object.keys(dateFilter).length > 0 ? 'AND ' + Object.keys(dateFilter).map(key => 
        key === 'reporting_month' ? `p.${key} = ?` : `p.${key} BETWEEN ? AND ?`
      ).join(' AND ') : ''}
      GROUP BY f.id, f.facility_name, f.region_name, f.zone_name, f.woreda_name
      HAVING COUNT(p.id) > 0
      ORDER BY completion_rate DESC, total_processes DESC
      LIMIT 10
    `, { 
      replacements: Object.keys(dateFilter).length > 0 ? 
        (dateFilter.reporting_month ? [dateFilter.reporting_month] : 
         [dateFilter.created_at[Op.between][0], dateFilter.created_at[Op.between][1]]) : [],
      type: db.sequelize.QueryTypes.SELECT 
    });

    // Calculate completion rates
    const totalProcessCount = totalHPProcesses[0]?.count || 0;
    const completedProcessCount = completedHPProcesses[0]?.count || 0;
    const processCompletionRate = totalProcessCount > 0 ? ((completedProcessCount / totalProcessCount) * 100).toFixed(1) : 0;

    const fullyCompletedODNs = odnCompletionStatus.find(o => o.status === 'Fully Completed')?.count || 0;
    const totalODNCount = totalHPODNs[0]?.count || 0;
    const odnCompletionRate = totalODNCount > 0 ? ((fullyCompletedODNs / totalODNCount) * 100).toFixed(1) : 0;

    res.json({
      summary: {
        totalFacilities: totalHPFacilities[0]?.count || 0,
        totalProcesses: totalProcessCount,
        totalODNs: totalODNCount,
        completedProcesses: completedProcessCount,
        processCompletionRate,
        odnCompletionRate
      },
      distributions: {
        facilitiesByRegion,
        processStatus: processStatusDistribution,
        odnStatus: odnCompletionStatus
      },
      trends: {
        monthlyProcesses: monthlyTrend
      },
      topFacilities
    });

  } catch (error) {
    console.error('Error fetching health program analytics:', error);
    res.status(500).json({ error: 'Failed to fetch health program analytics' });
  }
};

// Get detailed HP facility performance
const getHPFacilityPerformance = async (req, res) => {
  try {
    const { month, year, region } = req.query;
    
    let dateFilter = '';
    let replacements = [];
    
    if (month && year) {
      const reportingMonth = `${month} ${year}`;
      dateFilter = 'AND p.reporting_month = ?';
      replacements.push(reportingMonth);
    }
    
    if (region) {
      dateFilter += ' AND f.region_name = ?';
      replacements.push(region);
    }

    const facilityPerformance = await db.sequelize.query(`
      SELECT 
        f.id,
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        f.route,
        COUNT(p.id) as total_processes,
        SUM(CASE WHEN p.status = 'vehicle_requested' THEN 1 ELSE 0 END) as completed_processes,
        COUNT(o.id) as total_odns,
        SUM(CASE WHEN o.pod_confirmed = 1 THEN 1 ELSE 0 END) as confirmed_pods,
        SUM(CASE WHEN o.quality_confirmed = 1 THEN 1 ELSE 0 END) as quality_confirmed,
        ROUND(
          (SUM(CASE WHEN p.status = 'vehicle_requested' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(p.id), 0)), 
          1
        ) as completion_rate,
        ROUND(
          (SUM(CASE WHEN o.pod_confirmed = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(o.id), 0)), 
          1
        ) as pod_rate,
        MAX(p.updated_at) as last_activity
      FROM facilities f
      LEFT JOIN processes p ON f.id = p.facility_id ${dateFilter}
      LEFT JOIN odns o ON p.id = o.process_id
      WHERE (f.facility_type = 'Health Program' OR f.facility_name LIKE '%HP%' OR f.facility_name LIKE '%Health%')
      GROUP BY f.id, f.facility_name, f.region_name, f.zone_name, f.woreda_name, f.route
      ORDER BY completion_rate DESC, total_processes DESC
    `, { 
      replacements,
      type: db.sequelize.QueryTypes.SELECT 
    });

    res.json(facilityPerformance);

  } catch (error) {
    console.error('Error fetching HP facility performance:', error);
    res.status(500).json({ error: 'Failed to fetch HP facility performance' });
  }
};

module.exports = {
  getHealthProgramAnalytics,
  getHPFacilityPerformance
};