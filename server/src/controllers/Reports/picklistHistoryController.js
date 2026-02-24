const db = require('../../models');

const getPicklistHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = '',
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build search condition
    let searchCondition = '';
    if (search) {
      searchCondition = `
        AND (
          p.odn LIKE '%${search}%' OR
          p.url LIKE '%${search}%' OR
          e.full_name LIKE '%${search}%' OR
          p.store LIKE '%${search}%'
        )
      `;
    }

    // Validate sort column
    const allowedSortColumns = ['id', 'odn', 'store', 'operator_name'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'id';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM picklist p
      LEFT JOIN Employees e ON p.operator_id = e.id
      WHERE p.status = 'completed'
      ${searchCondition}
    `;

    const totalResult = await db.sequelize.query(countQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });
    const total = totalResult[0].total;

    // Get picklist history with facility information
    const query = `
      SELECT 
        p.id,
        p.odn,
        p.url,
        p.store,
        p.process_id,
        p.status,
        e.full_name as operator_name,
        e.id as operator_id,
        COALESCE(f_hp.id, f_aa.id) as facility_id,
        COALESCE(f_hp.facility_name, f_aa.facility_name) as facility_name,
        COALESCE(f_hp.woreda_name, f_aa.woreda_name) as woreda_name,
        COALESCE(f_hp.zone_name, f_aa.zone_name) as zone_name,
        COALESCE(f_hp.region_name, f_aa.region_name) as region_name
      FROM picklist p
      LEFT JOIN Employees e ON p.operator_id = e.id
      LEFT JOIN processes pr ON CAST(p.process_id AS UNSIGNED) = pr.id AND p.store = 'HP'
      LEFT JOIN facilities f_hp ON pr.facility_id = f_hp.id
      LEFT JOIN customer_queue cq ON CAST(p.process_id AS UNSIGNED) = cq.id AND p.store != 'HP'
      LEFT JOIN facilities f_aa ON cq.facility_id = f_aa.id
      WHERE p.status = 'completed'
      ${searchCondition}
      ORDER BY ${validSortBy === 'operator_name' ? 'e.full_name' : 'p.' + validSortBy} ${validSortOrder}
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    const picklists = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });

    // Format the results to include facility object
    const formatted = picklists.map(row => ({
      id: row.id,
      odn: row.odn,
      url: row.url,
      store: row.store,
      process_id: row.process_id,
      status: row.status,
      operator_name: row.operator_name,
      operator_id: row.operator_id,
      facility: row.facility_id ? {
        id: row.facility_id,
        facility_name: row.facility_name,
        woreda_name: row.woreda_name,
        zone_name: row.zone_name,
        region_name: row.region_name
      } : null
    }));

    res.json({
      success: true,
      picklists: formatted,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('=== PICKLIST HISTORY ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('SQL Error:', error.sql);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch picklist history',
      details: error.message,
      sql: error.sql
    });
  }
};

module.exports = {
  getPicklistHistory
};
