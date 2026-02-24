const db = require('../../models');

const getCustomersDetailReport = async (req, res) => {
  try {
    console.log('=== CUSTOMER DETAIL REPORT REQUEST ===');
    console.log('Query params:', req.query);
    
    // Extract query parameters
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'started_at',
      sortOrder = 'DESC',
      statusFilter = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build search conditions
    let searchCondition = '';
    if (search) {
      searchCondition = `
        AND (
          cq.id LIKE '%${search}%' OR
          cq.delegate LIKE '%${search}%' OR
          f.facility_name LIKE '%${search}%' OR
          f.region_name LIKE '%${search}%' OR
          f.zone_name LIKE '%${search}%' OR
          f.woreda_name LIKE '%${search}%' OR
          cq.status LIKE '%${search}%'
        )
      `;
    }

    // Build status filter condition
    let statusFilterCondition = '';
    if (statusFilter) {
      if (statusFilter === 'completed') {
        statusFilterCondition = `AND cq.status = 'completed'`;
      } else if (statusFilter === 'registration') {
        statusFilterCondition = `AND cq.next_service_point = 'registration'`;
      } else if (statusFilter === 'o2c') {
        statusFilterCondition = `AND cq.next_service_point = 'o2c'`;
      } else if (statusFilter === 'ewm') {
        statusFilterCondition = `AND cq.next_service_point = 'ewm'`;
      } else if (statusFilter === 'dispatch') {
        statusFilterCondition = `AND cq.next_service_point = 'dispatch'`;
      }
    }

    // Validate sort column
    const allowedSortColumns = ['id', 'started_at', 'facility_name', 'region_name', 'zone_name', 'woreda_name', 'status'];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'started_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    console.log('=== EXECUTING COUNT QUERY ===');
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM customer_queue cq
      LEFT JOIN facilities f ON cq.facility_id = f.id
      WHERE 1=1
      ${searchCondition}
      ${statusFilterCondition}
    `;

    const totalResult = await db.sequelize.query(countQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });
    const total = totalResult[0].total;

    console.log('Count query successful, total records:', total);
    console.log('=== EXECUTING MAIN QUERY ===');

    // Simplified query with only essential columns
    // Note: total_waiting_time removed since waiting_minutes column no longer exists
    const query = `
      SELECT 
        cq.id,
        COALESCE(cq.delegate, 'Unknown') as facility_name,
        COALESCE(cq.customer_type, 'Unknown') as customer_type,
        COALESCE(cq.status, 'Unknown') as status,
        COALESCE(cq.next_service_point, 'Unknown') as next_service_point,
        cq.started_at as created_at,
        cq.completed_at,
        COALESCE(f.facility_name, cq.delegate, 'Unknown') as actual_facility_name,
        COALESCE(f.region_name, 'Unknown') as region_name,
        COALESCE(f.zone_name, 'Unknown') as zone_name,
        COALESCE(f.woreda_name, 'Unknown') as woreda_name,
        TIMESTAMPDIFF(MINUTE, cq.started_at, COALESCE(cq.completed_at, NOW())) as total_waiting_time
      FROM customer_queue cq
      LEFT JOIN facilities f ON cq.facility_id = f.id
      WHERE 1=1
      ${searchCondition}
      ${statusFilterCondition}
      ORDER BY ${validSortBy === 'facility_name' ? 'COALESCE(f.facility_name, cq.delegate)' : validSortBy === 'started_at' ? 'cq.started_at' : 'cq.' + validSortBy} ${validSortOrder}
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    console.log('Executing main query...');

    const customers = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log('Query successful, found', customers.length, 'customers');

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
    console.error('=== CUSTOMER DETAIL REPORT ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Query params:', req.query);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer detail report',
      details: error.message,
      query_params: req.query
    });
  }
};

const getCustomerServiceDetails = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    console.log('=== GET CUSTOMER SERVICE DETAILS ===');
    console.log('Customer ID:', customerId);

    // Get customer queue record to get registration time
    const customerQuery = `
      SELECT started_at
      FROM customer_queue
      WHERE id = :customerId
    `;
    
    const [customer] = await db.sequelize.query(customerQuery, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: { customerId }
    });
    
    console.log('Customer record:', customer);

    // Get all service time records
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

    const allServiceDetails = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: { customerId }
    });
    
    console.log('All service records found:', allServiceDetails.length);

    // Deduplicate: keep only the latest record for each service unit
    const serviceMap = new Map();
    allServiceDetails.forEach(service => {
      const existing = serviceMap.get(service.service_unit);
      if (!existing || new Date(service.created_at) > new Date(existing.created_at)) {
        serviceMap.set(service.service_unit, service);
      }
    });
    
    console.log('After deduplication:', serviceMap.size, 'unique service units');
    
    // Convert back to array and sort by created_at
    const serviceDetails = Array.from(serviceMap.values())
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Calculate waiting times
    const enrichedDetails = serviceDetails.map((service, index) => {
      let waitingMinutes = 0;
      let startTime = null;
      
      if (index === 0) {
        // First service: waiting time from registration
        const registrationTime = customer?.started_at;
        if (registrationTime && service.end_time) {
          const start = new Date(registrationTime);
          const end = new Date(service.end_time);
          waitingMinutes = Math.round((end - start) / (1000 * 60));
          startTime = registrationTime;
        }
      } else {
        // Subsequent services: waiting time from previous service end
        const previousService = serviceDetails[index - 1];
        if (previousService.end_time && service.end_time) {
          const start = new Date(previousService.end_time);
          const end = new Date(service.end_time);
          waitingMinutes = Math.round((end - start) / (1000 * 60));
          startTime = previousService.end_time;
        }
      }
      
      return {
        ...service,
        start_time: startTime,
        waiting_minutes: Math.max(0, waitingMinutes),
        duration_minutes: waitingMinutes
      };
    });
    
    console.log('Enriched details:', enrichedDetails.length, 'records');
    console.log('Response:', JSON.stringify(enrichedDetails, null, 2));

    res.json({
      success: true,
      serviceDetails: enrichedDetails
    });

  } catch (error) {
    console.error('Error fetching customer service details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer service details',
      details: error.message
    });
  }
};

module.exports = {
  getCustomersDetailReport,
  getCustomerServiceDetails
};