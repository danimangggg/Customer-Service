const db = require('../../models');
const Process = db.process;
const ODN = db.odn;
const Facility = db.facility;
const { Op } = require('sequelize');

const getHPDashboardData = async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportingMonth = month && year ? `${month} ${year}` : null;

    // Get total HP facilities (only facilities that have routes) - NOT month dependent
    const totalFacilities = await Facility.count({
      where: {
        route: { [Op.ne]: null },
        route: { [Op.ne]: '' }
      }
    });

    // For month-dependent metrics, filter by reporting month
    const odnWhere = {
      odn_number: { [Op.ne]: 'RRF not sent' } // Exclude "RRF not sent" from ODN count
    };
    if (reportingMonth) {
      // Find processes for the specific month/year and get their ODNs
      const processes = await Process.findAll({
        where: { reporting_month: reportingMonth },
        attributes: ['id']
      });
      const processIds = processes.map(p => p.id);
      if (processIds.length > 0) {
        odnWhere.process_id = { [Op.in]: processIds };
      } else {
        odnWhere.process_id = -1; // No processes found, return 0 ODNs
      }
    }

    // Get total ODNs (month dependent if filter applied, excluding "RRF not sent")
    const totalODNs = await ODN.count({ where: odnWhere });

    // Get RRF Sent count (facilities that have processes but NOT "RRF not sent" ODN)
    // Only count HP facilities (those with routes) and filter by month if specified
    let rrfSentQuery = `
      SELECT COUNT(DISTINCT p.facility_id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE f.route IS NOT NULL AND f.route != ''
    `;
    
    const rrfQueryParams = [];
    if (reportingMonth) {
      rrfSentQuery += ` AND p.reporting_month = ?
        AND p.facility_id NOT IN (
          SELECT DISTINCT p2.facility_id 
          FROM processes p2 
          INNER JOIN odns o ON p2.id = o.process_id 
          WHERE o.odn_number = 'RRF not sent' AND p2.reporting_month = ?
        )`;
      rrfQueryParams.push(reportingMonth, reportingMonth);
    } else {
      rrfSentQuery += `
        AND p.facility_id NOT IN (
          SELECT DISTINCT p2.facility_id 
          FROM processes p2 
          INNER JOIN odns o ON p2.id = o.process_id 
          WHERE o.odn_number = 'RRF not sent'
        )`;
    }

    const [rrfResult] = await db.sequelize.query(rrfSentQuery, {
      replacements: rrfQueryParams,
      type: db.sequelize.QueryTypes.SELECT
    });
    const rrfSent = rrfResult.count;

    // Get dispatched ODNs (ODNs from processes that have vehicle assigned/dispatched)
    // Count ODNs where the route has been assigned and dispatched, excluding "RRF not sent"
    let dispatchedODNsQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      WHERE p.status IN ('vehicle_requested', 'ewm_completed')
        AND ra.status IN ('Dispatched', 'Completed')
        AND o.odn_number != 'RRF not sent'
    `;
    
    const dispatchedQueryParams = [];
    if (reportingMonth) {
      dispatchedODNsQuery += ' AND p.reporting_month = ? AND ra.ethiopian_month = ?';
      dispatchedQueryParams.push(reportingMonth, month);
    }

    const [dispatchedResult] = await db.sequelize.query(dispatchedODNsQuery, {
      replacements: dispatchedQueryParams,
      type: db.Sequelize.QueryTypes.SELECT
    });
    const dispatchedODNs = dispatchedResult.count;

    // Get POD confirmed ODNs (have pod_confirmed = true)
    const podConfirmed = await ODN.count({
      where: {
        ...odnWhere,
        pod_confirmed: true
      }
    });

    // Get quality evaluated ODNs (have quality_confirmed = true)
    const qualityEvaluated = await ODN.count({
      where: {
        ...odnWhere,
        quality_confirmed: true
      }
    });

    // Expected vs Done calculation
    // Expected: All HP facilities should process
    // Done: HP facilities that have completed processes (filtered by month if specified)
    const expected = totalFacilities;
    
    // Count HP facilities with completed processes (quality evaluated means process is finished)
    // Use raw query to count distinct facilities with quality evaluated ODNs
    let completedFacilitiesQuery = `
      SELECT COUNT(DISTINCT p.facility_id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id 
      INNER JOIN odns o ON p.id = o.process_id
      WHERE f.route IS NOT NULL 
        AND f.route != ''
        AND o.quality_confirmed = true
    `;
    
    const queryParams = [];
    if (reportingMonth) {
      completedFacilitiesQuery += ' AND p.reporting_month = ?';
      queryParams.push(reportingMonth);
    }

    const [completedResult] = await db.sequelize.query(completedFacilitiesQuery, {
      replacements: queryParams,
      type: db.Sequelize.QueryTypes.SELECT
    });
    const done = completedResult.count;

    const dashboardData = {
      totalODNs,
      totalFacilities,
      rrfSent,
      dispatchedODNs,
      podConfirmed,
      qualityEvaluated,
      expectedVsDone: {
        expected,
        done
      },
      reportingPeriod: reportingMonth || 'All Time'
    };

    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Error fetching HP dashboard data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch HP dashboard data', 
      error: error.message 
    });
  }
};

module.exports = {
  getHPDashboardData
};