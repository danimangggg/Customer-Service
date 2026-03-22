const db = require('../../models');
const Process = db.process;
const ODN = db.odn;
const Facility = db.facility;
const { Op } = require('sequelize');

const getHPDashboardData = async (req, res) => {
  try {
    const { month, year, process_type } = req.query;
    const reportingMonth = month && year ? `${month} ${year}` : null;

    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const queryBranch  = req.query.branch_code || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
    const branchWhere  = branchCode ? { branch_code: branchCode } : {};
    const branchFilter = branchCode ? `AND f.branch_code = '${branchCode}'` : '';

    // Get total HP facilities - NOT month dependent
    const totalFacilities = process_type === 'vaccine'
      ? await Facility.count({ where: { is_vaccine_site: true, ...branchWhere } })
      : await Facility.count({ where: { is_hp_site: true, ...branchWhere } });

    // For month-dependent metrics, filter by reporting month and process_type
    const processWhere = {};
    if (reportingMonth) processWhere.reporting_month = reportingMonth;
    if (process_type) processWhere.process_type = process_type;

    const odnWhere = {
      [Op.and]: [
        { odn_number: { [Op.notLike]: 'RRF not sent%' } },
        { odn_number: { [Op.notLike]: 'VRF not sent%' } }
      ]
    };
    if (reportingMonth || process_type) {
      const processes = await Process.findAll({
        where: Object.keys(processWhere).length > 0 ? processWhere : {},
        attributes: ['id'],
        include: branchCode ? [{
          model: Facility,
          as: 'facility',
          where: { branch_code: branchCode },
          attributes: []
        }] : []
      });
      const processIds = processes.map(p => p.id);
      odnWhere.process_id = processIds.length > 0 ? { [Op.in]: processIds } : -1;
    } else if (branchCode) {
      // No month filter but branch filter needed
      const processes = await Process.findAll({
        attributes: ['id'],
        include: [{
          model: Facility,
          as: 'facility',
          where: { branch_code: branchCode },
          attributes: []
        }]
      });
      const processIds = processes.map(p => p.id);
      odnWhere.process_id = processIds.length > 0 ? { [Op.in]: processIds } : -1;
    }

    const totalODNs = await ODN.count({ where: odnWhere });

    const facilityTypeFilter = process_type === 'vaccine' ? `f.is_vaccine_site = 1` : `f.is_hp_site = 1`;
    const rrfNotSentPattern = process_type === 'vaccine' ? 'VRF not sent%' : 'RRF not sent%';

    // RRF/VRF Not Sent — count distinct facilities whose process has that label
    let rrfNotSentQuery = `
      SELECT COUNT(DISTINCT p.facility_id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN odns o ON o.process_id = p.id
      WHERE ${facilityTypeFilter}
      AND o.odn_number LIKE '${rrfNotSentPattern}'
      ${branchFilter}
    `;
    const rrfNotSentParams = [];
    if (reportingMonth) { rrfNotSentQuery += ` AND p.reporting_month = ?`; rrfNotSentParams.push(reportingMonth); }
    if (process_type)   { rrfNotSentQuery += ` AND p.process_type = ?`;    rrfNotSentParams.push(process_type); }
    const [rrfNotSentResult] = await db.sequelize.query(rrfNotSentQuery, {
      replacements: rrfNotSentParams,
      type: db.sequelize.QueryTypes.SELECT
    });
    const rrfNotSentCount = rrfNotSentResult.count;

    let rrfSentQuery = `
      SELECT COUNT(DISTINCT p.facility_id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN odns o ON o.process_id = p.id
      WHERE ${facilityTypeFilter}
      AND (o.odn_number NOT LIKE 'RRF not sent%' AND o.odn_number NOT LIKE 'VRF not sent%')
      ${branchFilter}
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

    const [rrfResult] = await db.sequelize.query(rrfSentQuery, {
      replacements: rrfQueryParams,
      type: db.sequelize.QueryTypes.SELECT
    });
    const rrfSent = rrfResult.count;

    const dispatchedODNs = await ODN.count({ where: { ...odnWhere, pod_confirmed: true } });
    const qualityEvaluated = await ODN.count({ where: { ...odnWhere, quality_confirmed: true } });

    // POD Confirmed — count distinct facilities that have at least one pod_confirmed ODN
    let podConfirmedQuery = `
      SELECT COUNT(DISTINCT p.facility_id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN odns o ON o.process_id = p.id
      WHERE ${facilityTypeFilter}
        AND o.pod_confirmed = 1
        AND o.odn_number NOT LIKE 'RRF not sent%'
        AND o.odn_number NOT LIKE 'VRF not sent%'
        ${branchFilter}
    `;
    const podParams = [];
    if (reportingMonth) { podConfirmedQuery += ` AND p.reporting_month = ?`; podParams.push(reportingMonth); }
    if (process_type)   { podConfirmedQuery += ` AND p.process_type = ?`;    podParams.push(process_type); }
    const [podResult] = await db.sequelize.query(podConfirmedQuery, {
      replacements: podParams,
      type: db.sequelize.QueryTypes.SELECT
    });
    const podConfirmed = podResult.count;

    const ethiopianMonths = ['Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'];
    let expectedThisMonth = totalFacilities;
    if (process_type === 'vaccine') {
      expectedThisMonth = await Facility.count({ where: { is_vaccine_site: true, ...branchWhere } });
    } else if (month) {
      const monthIndex = ethiopianMonths.indexOf(month) + 1;
      const isOddMonth = monthIndex % 2 !== 0;
      const periodFilter = isOddMonth ? { [Op.in]: ['Monthly', 'Odd'] } : { [Op.in]: ['Monthly', 'Even'] };
      expectedThisMonth = await Facility.count({
        where: { is_hp_site: true, period: periodFilter, ...branchWhere }
      });
    }

    const expected = totalFacilities;

    let completedFacilitiesQuery = `
      SELECT COUNT(DISTINCT p.facility_id) as count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE ${facilityTypeFilter}
        AND (
          EXISTS (
            SELECT 1 FROM odns o WHERE o.process_id = p.id AND o.quality_confirmed = 1
          )
          OR EXISTS (
            SELECT 1 FROM odns o WHERE o.process_id = p.id AND (o.odn_number LIKE 'RRF not sent%' OR o.odn_number LIKE 'VRF not sent%')
          )
        )
        ${branchFilter}
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

    res.status(200).json({
      totalODNs, totalFacilities, expectedThisMonth,
      rrfSent, rrfNotSentCount, dispatchedODNs, podConfirmed, qualityEvaluated,
      expectedVsDone: { expected, done },
      reportingPeriod: reportingMonth || 'All Time'
    });

  } catch (error) {
    console.error('Error fetching HP dashboard data:', error);
    res.status(500).json({ message: 'Failed to fetch HP dashboard data', error: error.message });
  }
};

module.exports = { getHPDashboardData };
