const db = require('../../models');

const getBestOfWeek = async (req, res) => {
  try {
    console.log('=== FETCHING BEST OF WEEK ===');

    let startDate, endDate;

    if (req.query.startDate && req.query.endDate) {
      startDate = req.query.startDate;
      endDate   = req.query.endDate;
    } else {
      const today = new Date();
      const currentDay = today.getDay();
      const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - daysSinceMonday - 7);
      lastMonday.setHours(0, 0, 0, 0);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);
      startDate = lastMonday.toISOString().split('T')[0];
      endDate   = lastSunday.toISOString().split('T')[0];
    }

    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const queryBranch  = req.query.branch_code || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
    const branchWhere  = branchCode ? `AND e.branch_code = '${branchCode}'` : '';
    const branchWhereNoAlias = branchCode ? `AND branch_code = '${branchCode}'` : '';

    console.log('Date range:', { startDate, endDate });

    const o2cResults = await db.sequelize.query(`
      SELECT 
        e.full_name,
        e.jobTitle as role,
        COUNT(DISTINCT cq.id) as process_count
      FROM customer_queue cq
      INNER JOIN employees e ON cq.assigned_officer_id = e.id
      WHERE DATE(cq.completed_at) >= :startDate
        AND DATE(cq.completed_at) <= :endDate
        AND cq.status = 'Completed'
        ${branchWhere}
      GROUP BY e.id, e.full_name, e.jobTitle
      ORDER BY process_count DESC
      LIMIT 1
    `, { replacements: { startDate, endDate }, type: db.sequelize.QueryTypes.SELECT });

    const ewmResults = await db.sequelize.query(`
      SELECT 
        ewm_officer_name as full_name,
        'EWM Officer' as role,
        COUNT(DISTINCT id) as process_count
      FROM odns_rdf
      WHERE DATE(ewm_completed_at) >= :startDate
        AND DATE(ewm_completed_at) <= :endDate
        AND ewm_status = 'completed'
        AND ewm_officer_name IS NOT NULL
        ${branchCode ? `AND store_id IN (SELECT id FROM stores WHERE branch_code = '${branchCode}')` : ''}
      GROUP BY ewm_officer_name
      ORDER BY process_count DESC
      LIMIT 1
    `, { replacements: { startDate, endDate }, type: db.sequelize.QueryTypes.SELECT });

    const wimResults = await db.sequelize.query(`
      SELECT 
        e.full_name,
        e.jobTitle as role,
        COUNT(DISTINCT p.id) as process_count
      FROM picklist p
      INNER JOIN employees e ON p.operator_id = e.id
      WHERE p.status = 'completed'
        ${branchWhere}
      GROUP BY e.id, e.full_name, e.jobTitle
      ORDER BY process_count DESC
      LIMIT 1
    `, { replacements: { startDate, endDate }, type: db.sequelize.QueryTypes.SELECT });

    const dispatchResults = await db.sequelize.query(`
      SELECT 
        st.officer_name as full_name,
        'Dispatcher' as role,
        COUNT(DISTINCT st.process_id) as process_count
      FROM service_time st
      ${branchCode ? `INNER JOIN employees e ON st.officer_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci` : ''}
      WHERE st.service_unit LIKE 'Dispatcher -%'
        AND DATE(st.end_time) >= :startDate
        AND DATE(st.end_time) <= :endDate
        AND st.officer_name IS NOT NULL
        AND st.officer_name != ''
        ${branchCode ? `AND e.branch_code = '${branchCode}'` : ''}
      GROUP BY st.officer_name
      ORDER BY process_count DESC
      LIMIT 1
    `, { replacements: { startDate, endDate }, type: db.sequelize.QueryTypes.SELECT });

    const docResults = await db.sequelize.query(`
      SELECT 
        st.officer_name as full_name,
        'Dispatch-Documentation' as role,
        COUNT(DISTINCT st.process_id) as process_count
      FROM service_time st
      ${branchCode ? `INNER JOIN employees e ON st.officer_name COLLATE utf8mb4_unicode_ci = e.full_name COLLATE utf8mb4_unicode_ci` : ''}
      WHERE st.service_unit LIKE 'Dispatch-Documentation -%'
        AND DATE(st.end_time) >= :startDate
        AND DATE(st.end_time) <= :endDate
        AND st.officer_name IS NOT NULL
        AND st.officer_name != ''
        ${branchCode ? `AND e.branch_code = '${branchCode}'` : ''}
      GROUP BY st.officer_name
      ORDER BY process_count DESC
      LIMIT 1
    `, { replacements: { startDate, endDate }, type: db.sequelize.QueryTypes.SELECT });

    const securityResults = await db.sequelize.query(`
      SELECT 
        gate_processed_by_name as full_name,
        'Gate Keeper' as role,
        COUNT(DISTINCT id) as process_count
      FROM odns_rdf
      WHERE DATE(gate_processed_at) >= :startDate
        AND DATE(gate_processed_at) <= :endDate
        AND gate_status = 'allowed'
        AND gate_processed_by_name IS NOT NULL
        ${branchCode ? `AND store_id IN (SELECT id FROM stores WHERE branch_code = '${branchCode}')` : ''}
      GROUP BY gate_processed_by_name
      ORDER BY process_count DESC
      LIMIT 1
    `, { replacements: { startDate, endDate }, type: db.sequelize.QueryTypes.SELECT });

    const bestOfWeek = {
      dateRange: { start: startDate, end: endDate },
      employees: {
        o2c:           o2cResults.length      > 0 ? o2cResults[0]      : null,
        ewm:           ewmResults.length      > 0 ? ewmResults[0]      : null,
        wim:           wimResults.length      > 0 ? wimResults[0]      : null,
        dispatch:      dispatchResults.length > 0 ? dispatchResults[0] : null,
        documentation: docResults.length      > 0 ? docResults[0]      : null,
        security:      securityResults.length > 0 ? securityResults[0] : null,
      }
    };

    console.log('Best of week results:', bestOfWeek);
    res.json({ success: true, data: bestOfWeek });

  } catch (error) {
    console.error('=== ERROR FETCHING BEST OF WEEK ===', error);
    res.status(500).json({ success: false, error: 'Failed to fetch best of week', details: error.message });
  }
};

module.exports = { getBestOfWeek };
