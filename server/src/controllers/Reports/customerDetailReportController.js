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
      statusFilter = '',
      dateFrom = '',
      dateTo = '',
      branch_code: queryBranch = ''
    } = req.query;

    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
    const branchCondition = branchCode ? `AND f.branch_code = '${branchCode}'` : '';

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
      } else if (statusFilter === 'Canceled') {
        statusFilterCondition = `AND cq.status = 'Canceled' AND (cq.next_service_point IS NULL OR cq.next_service_point != 'Auto-Canceled')`;
      } else if (statusFilter === 'Auto-Canceled') {
        statusFilterCondition = `AND cq.status = 'Canceled' AND cq.next_service_point = 'Auto-Canceled'`;
      } else if (statusFilter === 'o2c') {
        statusFilterCondition = `AND (cq.next_service_point = 'o2c' OR cq.status IN ('o2c_started','o2c_completed','notifying'))`;
      } else if (statusFilter === 'ewm') {
        statusFilterCondition = `AND (cq.next_service_point IN ('ewm','EWM') OR cq.status = 'ewm_completed')`;
      } else if (statusFilter === 'dispatch') {
        statusFilterCondition = `AND (cq.next_service_point = 'dispatch' OR cq.status = 'dispatch_completed')`;
      } else if (statusFilter === 'finance') {
        statusFilterCondition = `AND cq.next_service_point = 'finance'`;
      } else if (statusFilter === 'Exit-Permit') {
        statusFilterCondition = `AND cq.next_service_point = 'Exit-Permit'`;
      } else if (statusFilter === 'archived') {
        statusFilterCondition = `AND cq.status = 'archived'`;
      } else if (statusFilter === 'started') {
        statusFilterCondition = `AND cq.status = 'started'`;
      }
    }

    // Build date range filter condition
    let periodCondition = '';
    if (dateFrom && dateTo) {
      periodCondition = `AND DATE(cq.started_at) BETWEEN '${dateFrom}' AND '${dateTo}'`;
    } else if (dateFrom) {
      periodCondition = `AND DATE(cq.started_at) >= '${dateFrom}'`;
    } else if (dateTo) {
      periodCondition = `AND DATE(cq.started_at) <= '${dateTo}'`;
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
      ${periodCondition}
      ${branchCondition}
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
        cq.delegate,
        cq.delegate_phone,
        cq.letter_number,
        COALESCE(cq.customer_type, 'Unknown') as customer_type,
        COALESCE(cq.status, 'Unknown') as status,
        COALESCE(cq.next_service_point, 'Unknown') as next_service_point,
        cq.started_at as created_at,
        cq.completed_at,
        COALESCE(f.facility_name, cq.delegate, 'Unknown') as actual_facility_name,
        COALESCE(f.region_name, 'Unknown') as region_name,
        COALESCE(f.zone_name, 'Unknown') as zone_name,
        COALESCE(f.woreda_name, 'Unknown') as woreda_name,
        GREATEST(0, TIMESTAMPDIFF(MINUTE, cq.started_at, COALESCE(cq.completed_at, NOW()))) as total_waiting_time,
        cq.cancellation_reason,
        cq.cancelled_by_id,
        cq.cancelled_by_name,
        cq.cancelled_at
      FROM customer_queue cq
      LEFT JOIN facilities f ON cq.facility_id = f.id
      WHERE 1=1
      ${searchCondition}
      ${statusFilterCondition}
      ${periodCondition}
      ${branchCondition}
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

    // Deduplicate: keep only the latest record for each service unit,
    // EXCEPT for O2C — if there are multiple O2C records (Cashier flow),
    // merge them into one entry with combined duration.
    const serviceMap = new Map();
    const o2cRecords = [];

    allServiceDetails.forEach(service => {
      if (service.service_unit === 'O2C Officer') {
        o2cRecords.push(service);
      } else {
        const existing = serviceMap.get(service.service_unit);
        if (!existing || new Date(service.created_at) > new Date(existing.created_at)) {
          serviceMap.set(service.service_unit, service);
        }
      }
    });

    // Merge O2C records: use earliest created_at as anchor, latest end_time as end,
    // and sum durations across all phases
    if (o2cRecords.length > 0) {
      o2cRecords.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const merged = {
        ...o2cRecords[o2cRecords.length - 1], // take latest for officer_name/status
        service_unit: 'O2C Officer',
        created_at: o2cRecords[0].created_at,       // earliest start
        end_time: o2cRecords[o2cRecords.length - 1].end_time, // latest end
        notes: o2cRecords.length > 1
          ? `${o2cRecords.length} phases (incl. Cashier return)`
          : o2cRecords[0].notes,
        _o2c_phases: o2cRecords, // keep raw phases for duration summing
      };
      serviceMap.set('O2C Officer', merged);
    }
    
    console.log('After deduplication:', serviceMap.size, 'unique service units');
    
    // Convert back to array and sort by created_at
    const serviceDetails = Array.from(serviceMap.values())
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Calculate waiting times
    const enrichedDetails = serviceDetails.map((service, index) => {
      let waitingMinutes = 0;
      let startTime = null;

      // For merged O2C with multiple phases, sum all phase durations
      if (service._o2c_phases && service._o2c_phases.length > 1) {
        const phases = service._o2c_phases;
        let totalMinutes = 0;
        // Phase 1: registration → first O2C end
        const regTime = customer?.started_at;
        if (regTime && phases[0].end_time) {
          totalMinutes += Math.max(0, Math.round((new Date(phases[0].end_time) - new Date(regTime)) / 60000));
        }
        // Subsequent phases: previous O2C end → next O2C end (skip Cashier gap)
        for (let i = 1; i < phases.length; i++) {
          if (phases[i - 1].end_time && phases[i].end_time) {
            // Find Cashier end_time between these two O2C records
            const cashierRecord = serviceMap.get('Cashier');
            const phaseStart = cashierRecord?.end_time || phases[i - 1].end_time;
            totalMinutes += Math.max(0, Math.round((new Date(phases[i].end_time) - new Date(phaseStart)) / 60000));
          }
        }
        startTime = regTime;
        const { _o2c_phases, ...cleanService } = service;
        return { ...cleanService, start_time: startTime, waiting_minutes: totalMinutes, duration_minutes: totalMinutes };
      }

      if (index === 0) {
        const registrationTime = customer?.started_at;
        if (registrationTime && service.end_time) {
          const start = new Date(registrationTime);
          const end = new Date(service.end_time);
          waitingMinutes = Math.round((end - start) / (1000 * 60));
          startTime = registrationTime;
        }
      } else {
        const previousService = serviceDetails[index - 1];
        if (previousService.end_time && service.end_time) {
          const start = new Date(previousService.end_time);
          const end = new Date(service.end_time);
          waitingMinutes = Math.round((end - start) / (1000 * 60));
          startTime = previousService.end_time;
        }
      }

      const { _o2c_phases, ...cleanService } = service;
      return {
        ...cleanService,
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