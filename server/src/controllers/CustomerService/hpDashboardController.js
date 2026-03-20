const db = require('../../models');
const Process = db.process;
const ODN = db.odn;
const Facility = db.facility;
const { Op } = require('sequelize');

const getHPDashboardData = async (req, res) => {
  try {
    const { month, year, process_type } = req.query;
    const reportingMonth = month && year ? `${month} ${year}` : null;

    // Get total HP facilities - NOT month dependent
    const totalFacilities = process_type === 'vaccine'
      ? await Facility.count({ where: { is_vaccine_site: true } })
      : await Facility.count({ where: { is_hp_site: true } });

    // For month-dependent metrics, filter by reporting month and process_type
    const processWhere = {};
    if (reportingMonth) processWhere.reporting_month = reportingMonth;
    if (process_type) processWhere.process_type = process_type;

    const odnWhere = {
      odn_number: { [Op.ne]: 'RRF not sent' }
    };
    if (reportingMonth || process_type) {
      const processes = await Process.findAll({
        where: Object.keys(processWhere).length > 0 ? processWhere : {},
        attributes: ['id']
      });
      const processIds = processes.map(p => p.id);
      odnWhere.process_id = processIds.length > 0 ? { [Op.in]: processIds } : -1;
    }

    // Get total ODNs (month dependent if filter applied, excluding "RRF not sent")
    const totalODNs = await ODN.count({ where: odnWhere });

    // Get RRF Sent count (facilities that have processes but NOT "RRF not sent" ODN)
    // Only count HP facilities (those with routes) and filter by month if specified
    let rrfSentQuery = `
      SELECT COUNT(DISTINCT p.facility_id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE f.is_hp_site = 1
    `;
    
    const rrfQueryParams = [];
    if (reportingMonth) {
      rrfSentQuery += ` AND p.reporting_month = ?`;
      rrfQueryParams.push(reportingMonth);
    }
    if (process_type) {
      rrfSentQuery += ` AND p.process_type = ?`;
      rrfQueryParams.push(process_type);
    }
    if (reportingMonth) {
      rrfSentQuery += `
        AND p.facility_id NOT IN (
          SELECT DISTINCT p2.facility_id 
          FROM processes p2 
          INNER JOIN odns o ON p2.id = o.process_id 
          WHERE o.odn_number = 'RRF not sent' AND p2.reporting_month = ?
        )`;
      rrfQueryParams.push(reportingMonth);
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

    // Get dispatched ODNs - use pod_confirmed as the dispatch indicator
    // pod_confirmed is set when the facility receives the goods (after physical dispatch)
    // This ensures dispatched >= quality_evaluated always holds true
    const dispatchedODNs = await ODN.count({
      where: {
        ...odnWhere,
        pod_confirmed: true
      }
    });

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

    // Expected This Month: depends on process type and period
    // - vaccine: all vaccine sites
    // - regular: HP sites filtered by period (Monthly always, Odd/Even alternating by month)
    const ethiopianMonths = ['Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'];
    let expectedThisMonth = totalFacilities;
    if (process_type === 'vaccine') {
      expectedThisMonth = await Facility.count({ where: { is_vaccine_site: true } });
    } else if (month) {
      const monthIndex = ethiopianMonths.indexOf(month) + 1; // 1-based
      const isOddMonth = monthIndex % 2 !== 0;
      const periodFilter = isOddMonth
        ? { [Op.in]: ['Monthly', 'Odd'] }
        : { [Op.in]: ['Monthly', 'Even'] };
      expectedThisMonth = await Facility.count({
        where: { is_hp_site: true, period: periodFilter }
      });
    }

    // Expected vs Done calculation
    const expected = totalFacilities;
    
    // Count HP facilities with completed processes (quality evaluated means process is finished)
    // Use raw query to count distinct facilities with quality evaluated ODNs
    let completedFacilitiesQuery = `
      SELECT COUNT(DISTINCT p.facility_id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id 
      INNER JOIN odns o ON p.id = o.process_id
      WHERE f.is_hp_site = 1
        AND o.quality_confirmed = true
    `;
    
    const queryParams = [];
    if (reportingMonth) {
      completedFacilitiesQuery += ' AND p.reporting_month = ?';
      queryParams.push(reportingMonth);
    }
    if (process_type) {
      completedFacilitiesQuery += ' AND p.process_type = ?';
      queryParams.push(process_type);
    }

    const [completedResult] = await db.sequelize.query(completedFacilitiesQuery, {
      replacements: queryParams,
      type: db.Sequelize.QueryTypes.SELECT
    });
    const done = completedResult.count;

    const dashboardData = {
      totalODNs,
      totalFacilities,
      expectedThisMonth,
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