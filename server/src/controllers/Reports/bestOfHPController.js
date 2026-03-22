const db = require('../../models');

const getBestOfHP = async (req, res) => {
  try {
    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const queryBranch  = req.query.branch_code || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
    const branchJoin   = branchCode ? `INNER JOIN processes p2 ON sth.process_id = p2.id INNER JOIN facilities f2 ON p2.facility_id = f2.id` : '';
    const branchWhere  = branchCode ? `AND f2.branch_code = '${branchCode}'` : '';

    const querySingle = (serviceUnit) => db.sequelize.query(`
      SELECT
        sth.officer_name as full_name,
        b.branch_name,
        COUNT(DISTINCT sth.process_id) as process_count
      FROM service_time_hp sth
      LEFT JOIN employees e ON sth.officer_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci
      LEFT JOIN epss_branches b ON e.branch_code = b.branch_code
      ${branchJoin}
      WHERE sth.service_unit = :serviceUnit
        AND sth.officer_name IS NOT NULL
        AND sth.officer_name != ''
        AND sth.officer_name != 'Unknown Officer'
        ${branchWhere}
      GROUP BY sth.officer_name, b.branch_name
      ORDER BY process_count DESC
      LIMIT 1
    `, { replacements: { serviceUnit }, type: db.sequelize.QueryTypes.SELECT });

    const queryMultiple = (serviceUnits) => db.sequelize.query(`
      SELECT
        sth.officer_name as full_name,
        b.branch_name,
        COUNT(DISTINCT sth.process_id) as process_count
      FROM service_time_hp sth
      LEFT JOIN employees e ON sth.officer_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci
      LEFT JOIN epss_branches b ON e.branch_code = b.branch_code
      ${branchJoin}
      WHERE sth.service_unit IN (:serviceUnits)
        AND sth.officer_name IS NOT NULL
        AND sth.officer_name != ''
        AND sth.officer_name != 'Unknown Officer'
        ${branchWhere}
      GROUP BY sth.officer_name, b.branch_name
      ORDER BY process_count DESC
      LIMIT 1
    `, { replacements: { serviceUnits }, type: db.sequelize.QueryTypes.SELECT });

    // Use the EXACT service_unit strings stored by each server controller
    const [o2cRes, ewmRes, billerRes, tmRes, piRes, dispatchRes, docRes, qualityRes] = await Promise.all([
      querySingle('O2C Officer - HP'),
      querySingle('EWM Officer - HP'),
      querySingle('Biller - Goods Received'),                                          // billerController.js
      queryMultiple(['TM - Vehicle Assignment', 'TM - Driver & Deliverer Assignment']), // tmController.js
      querySingle('PI Officer - Vehicle Requested'),                                   // piVehicleRequestController.js
      querySingle('Dispatcher - HP'),                                                  // dispatchController.js
      querySingle('Documentation - POD Confirmed'),                                    // documentationController.js
      querySingle('Quality Evaluator - Confirmed'),                                    // qualityEvaluationController.js
    ]);

    res.json({
      success: true,
      data: {
        employees: {
          o2c:           o2cRes.length      > 0 ? o2cRes[0]      : null,
          ewm:           ewmRes.length      > 0 ? ewmRes[0]      : null,
          biller:        billerRes.length   > 0 ? billerRes[0]   : null,
          tm:            tmRes.length       > 0 ? tmRes[0]       : null,
          pi:            piRes.length       > 0 ? piRes[0]       : null,
          dispatcher:    dispatchRes.length > 0 ? dispatchRes[0] : null,
          documentation: docRes.length      > 0 ? docRes[0]      : null,
          quality:       qualityRes.length  > 0 ? qualityRes[0]  : null,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching HP best of:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch HP best of', details: error.message });
  }
};

module.exports = { getBestOfHP };
