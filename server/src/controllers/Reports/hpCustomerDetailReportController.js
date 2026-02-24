const db = require('../../models');

const getHPCustomersDetailReport = async (req, res) => {
  try {
    console.log('Fetching real HP customer data from processes table...');
    
    // Extract query parameters
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      statusFilter = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build search conditions
    let searchCondition = '';
    if (search) {
      searchCondition = `
        AND (
          p.id LIKE '%${search}%' OR
          f.facility_name LIKE '%${search}%' OR
          f.region_name LIKE '%${search}%' OR
          f.zone_name LIKE '%${search}%' OR
          f.woreda_name LIKE '%${search}%' OR
          f.route LIKE '%${search}%' OR
          p.status LIKE '%${search}%' OR
          p.service_point LIKE '%${search}%' OR
          p.reporting_month LIKE '%${search}%'
        )
      `;
    }

    // Build status filter condition
    let statusFilterCondition = '';
    if (statusFilter) {
      if (statusFilter === 'In Progress') {
        statusFilterCondition = `AND p.status = 'in_progress'`;
      } else if (statusFilter === 'Completed') {
        statusFilterCondition = `AND p.status = 'completed'`;
      } else if (statusFilter === 'Vehicle Requested') {
        statusFilterCondition = `AND p.status = 'vehicle_requested'`;
      }
    }

    // Validate sort column
    const allowedSortColumns = ['id', 'created_at', 'facility_name', 'region_name', 'zone_name', 'woreda_name', 'route', 'status', 'service_point', 'reporting_month'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM processes p
      LEFT JOIN facilities f ON p.facility_id = f.id
      WHERE f.route IS NOT NULL AND f.route != ''
      ${searchCondition}
      ${statusFilterCondition}
    `;

    const totalResult = await db.sequelize.query(countQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });
    const total = totalResult[0].total;

    // Query real HP customers from processes table
    const query = `
      SELECT 
        p.id,
        p.facility_id,
        p.service_point,
        p.status,
        p.o2c_officer_id,
        p.reporting_month,
        p.created_at,
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        f.route,
        f.facility_type,
        -- Service unit statuses based on service_point and status
        CASE 
          WHEN p.service_point = 'registration' AND p.status = 'completed' THEN 'completed'
          WHEN p.service_point = 'registration' THEN 'in_progress'
          ELSE 'not_started'
        END as registration_status,
        
        CASE 
          WHEN p.service_point = 'o2c' AND p.status = 'completed' THEN 'completed'
          WHEN p.service_point = 'o2c' THEN 'in_progress'
          ELSE 'not_started'
        END as o2c_status,
        
        CASE 
          WHEN p.service_point = 'ewm' AND p.status = 'completed' THEN 'completed'
          WHEN p.service_point = 'ewm' THEN 'in_progress'
          ELSE 'not_started'
        END as ewm_status,
        
        CASE 
          WHEN p.service_point = 'dispatch' AND p.status = 'completed' THEN 'completed'
          WHEN p.service_point = 'dispatch' THEN 'in_progress'
          ELSE 'not_started'
        END as dispatch_status,
        
        CASE 
          WHEN p.status = 'vehicle_requested' THEN 'Vehicle Requested'
          WHEN p.status = 'completed' THEN 'Completed'
          WHEN p.status = 'in_progress' THEN 'In Progress'
          ELSE p.status
        END as process_status
        
      FROM processes p
      LEFT JOIN facilities f ON p.facility_id = f.id
      WHERE f.route IS NOT NULL AND f.route != ''
      ${searchCondition}
      ${statusFilterCondition}
      ORDER BY ${validSortBy === 'facility_name' ? 'f.facility_name' : 'p.' + validSortBy} ${validSortOrder}
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    console.log('Executing HP processes query...');

    const customers = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log('Query successful, found', customers.length, 'real HP processes');

    res.json({
      success: true,
      customers: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching HP processes data:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HP customer detail report',
      details: error.message
    });
  }
};

const getHPCustomerServiceDetails = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Query HP service time from service_time table
    const query = `
      SELECT 
        st.service_unit,
        st.end_time,
        st.officer_name,
        st.status,
        st.notes,
        st.created_at
      FROM service_time st
      WHERE st.process_id = :customerId
      ORDER BY st.created_at ASC
    `;

    const serviceDetails = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: { customerId }
    });

    res.json({
      success: true,
      serviceDetails: serviceDetails
    });

  } catch (error) {
    console.error('Error fetching HP process service details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HP process service details',
      details: error.message
    });
  }
};

module.exports = {
  getHPCustomersDetailReport,
  getHPCustomerServiceDetails
};