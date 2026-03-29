const db = require('../../models');

const getBestOfWeek = async (req, res) => {
  try {
    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const queryBranch  = req.query.branch_code || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);

    const o2cResults = await db.sequelize.query(`
      SELECT st.officer_name as full_name, 'O2C Officer' as role,
        b.branch_name, COUNT(DISTINCT st.process_id) as process_count
      FROM service_time st
      LEFT JOIN employees e ON st.officer_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci
      LEFT JOIN epss_branches b ON e.branch_code = b.branch_code
      WHERE st.service_unit = 'O2C'
        AND st.officer_name IS NOT NULL AND st.officer_name != ''
        ${branchCode ? `AND e.branch_code = '${branchCode}'` : ''}
      GROUP BY st.officer_name, b.branch_name
      ORDER BY process_count DESC LIMIT 1
    `, { type: db.sequelize.QueryTypes.SELECT });

    const ewmResults = await db.sequelize.query(`
      SELECT st.officer_name as full_name, 'EWM Officer' as role,
        b.branch_name, COUNT(DISTINCT st.process_id) as process_count
      FROM service_time st
      LEFT JOIN employees e ON st.officer_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci
      LEFT JOIN epss_branches b ON e.branch_code = b.branch_code
      WHERE st.service_unit LIKE 'EWM %'
        AND st.officer_name IS NOT NULL AND st.officer_name != ''
        ${branchCode ? `AND e.branch_code = '${branchCode}'` : ''}
      GROUP BY st.officer_name, b.branch_name
      ORDER BY process_count DESC LIMIT 1
    `, { type: db.sequelize.QueryTypes.SELECT });

    const wimResults = await db.sequelize.query(`
      SELECT e.full_name, 'WIM Operator' as role,
        b.branch_name, COUNT(DISTINCT p.id) as process_count
      FROM picklist p
      INNER JOIN employees e ON p.operator_id = e.id
      LEFT JOIN epss_branches b ON e.branch_code = b.branch_code
      WHERE p.status = 'completed'
        AND p.operator_id IS NOT NULL
        ${branchCode ? `AND e.branch_code = '${branchCode}'` : ''}
      GROUP BY e.id, e.full_name, b.branch_name
      ORDER BY process_count DESC LIMIT 1
    `, { type: db.sequelize.QueryTypes.SELECT });

    const dispatchResults = await db.sequelize.query(`
      SELECT st.officer_name as full_name, 'Dispatcher' as role,
        b.branch_name, COUNT(DISTINCT st.process_id) as process_count
      FROM service_time st
      LEFT JOIN employees e ON st.officer_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci
      LEFT JOIN epss_branches b ON e.branch_code = b.branch_code
      WHERE st.service_unit LIKE 'Dispatcher -%'
        AND st.officer_name IS NOT NULL AND st.officer_name != ''
        ${branchCode ? `AND e.branch_code = '${branchCode}'` : ''}
      GROUP BY st.officer_name, b.branch_name
      ORDER BY process_count DESC LIMIT 1
    `, { type: db.sequelize.QueryTypes.SELECT });

    const docResults = await db.sequelize.query(`
      SELECT st.officer_name as full_name, 'Dispatch-Documentation' as role,
        b.branch_name, COUNT(DISTINCT st.process_id) as process_count
      FROM service_time st
      LEFT JOIN employees e ON st.officer_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci
      LEFT JOIN epss_branches b ON e.branch_code = b.branch_code
      WHERE st.service_unit LIKE 'Dispatch-Documentation -%'
        AND st.officer_name IS NOT NULL AND st.officer_name != ''
        ${branchCode ? `AND e.branch_code = '${branchCode}'` : ''}
      GROUP BY st.officer_name, b.branch_name
      ORDER BY process_count DESC LIMIT 1
    `, { type: db.sequelize.QueryTypes.SELECT });

    const securityResults = await db.sequelize.query(`
      SELECT o.gate_processed_by_name as full_name, 'Gate Keeper' as role,
        b.branch_name, COUNT(DISTINCT o.id) as process_count
      FROM odns_rdf o
      LEFT JOIN employees e ON o.gate_processed_by_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci
      LEFT JOIN epss_branches b ON e.branch_code = b.branch_code
      WHERE o.gate_status = 'allowed' AND o.gate_processed_by_name IS NOT NULL
        ${branchCode ? `AND o.store_id IN (SELECT id FROM stores WHERE branch_code = '${branchCode}')` : ''}
      GROUP BY o.gate_processed_by_name, b.branch_name
      ORDER BY process_count DESC LIMIT 1
    `, { type: db.sequelize.QueryTypes.SELECT });

    const csResults = await db.sequelize.query(`
      SELECT st.officer_name as full_name, 'CS Officer' as role,
        b.branch_name, COUNT(DISTINCT st.process_id) as process_count
      FROM service_time st
      LEFT JOIN employees e ON st.officer_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci
      LEFT JOIN epss_branches b ON e.branch_code = b.branch_code
      WHERE st.service_unit = 'Customer Service Officer'
        AND st.officer_name IS NOT NULL AND st.officer_name != ''
        ${branchCode ? `AND e.branch_code = '${branchCode}'` : ''}
      GROUP BY st.officer_name, b.branch_name
      ORDER BY process_count DESC LIMIT 1
    `, { type: db.sequelize.QueryTypes.SELECT });

    const cashierResults = await db.sequelize.query(`
      SELECT st.officer_name as full_name, 'Cashier' as role,
        b.branch_name, COUNT(DISTINCT st.process_id) as process_count
      FROM service_time st
      LEFT JOIN employees e ON st.officer_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci
      LEFT JOIN epss_branches b ON e.branch_code = b.branch_code
      WHERE st.service_unit = 'Cashier'
        AND st.officer_name IS NOT NULL AND st.officer_name != ''
        ${branchCode ? `AND e.branch_code = '${branchCode}'` : ''}
      GROUP BY st.officer_name, b.branch_name
      ORDER BY process_count DESC LIMIT 1
    `, { type: db.sequelize.QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        employees: {
          cs:            csResults.length       > 0 ? csResults[0]       : null,
          o2c:           o2cResults.length      > 0 ? o2cResults[0]      : null,
          ewm:           ewmResults.length      > 0 ? ewmResults[0]      : null,
          wim:           wimResults.length      > 0 ? wimResults[0]      : null,
          cashier:       cashierResults.length  > 0 ? cashierResults[0]  : null,
          dispatch:      dispatchResults.length > 0 ? dispatchResults[0] : null,
          documentation: docResults.length      > 0 ? docResults[0]      : null,
          security:      securityResults.length > 0 ? securityResults[0] : null,
        }
      }
    });

  } catch (error) {
    console.error('=== ERROR FETCHING BEST OF ALL TIME ===', error);
    res.status(500).json({ success: false, error: 'Failed to fetch best of all time', details: error.message });
  }
};

module.exports = { getBestOfWeek };
