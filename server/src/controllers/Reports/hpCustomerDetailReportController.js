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
      statusFilter = '',
      month = '',
      year = '',
      process_type = ''
    } = req.query;

    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const queryBranch  = req.query.branch_code || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
    const branchCondition = branchCode ? `AND f.branch_code = '${branchCode}'` : '';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build process_type filter
    let processTypeCondition = '';
    if (process_type) {
      processTypeCondition = `AND p.process_type = '${process_type}'`;
    }

    // Emergency/breakdown have NULL reporting_month — skip month filter for them
    const skipMonthFilter = process_type === 'emergency' || process_type === 'breakdown';

    // Build month/year filter condition
    let monthYearCondition = '';
    if (!skipMonthFilter) {
      if (month && year) {
        monthYearCondition = `AND p.reporting_month = '${month} ${year}'`;
      } else if (month && !year) {
        monthYearCondition = `AND p.reporting_month LIKE '${month} %'`;
      } else if (!month && year) {
        monthYearCondition = `AND p.reporting_month LIKE '% ${year}'`;
      }
    }

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
    if (statusFilter === 'rrf_not_sent') {
      const rrfPattern = process_type === 'vaccine' ? 'VRF not sent%' : 'RRF not sent%';
      statusFilterCondition = `AND EXISTS (SELECT 1 FROM odns o WHERE o.process_id = p.id AND o.odn_number LIKE '${rrfPattern}')`;
    } else if (statusFilter) {
      statusFilterCondition = `AND p.status = '${statusFilter}'`;
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
      ${monthYearCondition}
      ${processTypeCondition}
      ${searchCondition}
      ${statusFilterCondition}
      ${branchCondition}
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
        f.branch_code,
        COALESCE(b.branch_name, f.branch_code) as branch_name,
        -- RRF/VRF not sent flag and officer
        (SELECT o.odn_number FROM odns o WHERE o.process_id = p.id AND (o.odn_number LIKE 'RRF not sent%' OR o.odn_number LIKE 'VRF not sent%') LIMIT 1) as rrf_not_sent_label,
        COALESCE(
          (SELECT st.officer_name FROM service_time_hp st WHERE st.process_id = p.id AND st.service_unit = 'O2C Officer - HP' ORDER BY st.created_at DESC LIMIT 1),
          e.full_name
        ) as rrf_not_sent_officer,
        COALESCE(e.full_name, p.o2c_officer_id) as o2c_officer_name,
        -- Calculate total kilometers from route assignments
        (
          SELECT COALESCE(
            (ra.arrival_kilometer - ra.departure_kilometer), 
            0
          )
          FROM route_assignments ra
          INNER JOIN routes r ON ra.route_id = r.id
          WHERE r.route_name = f.route
            AND ra.ethiopian_month = p.reporting_month
          ORDER BY ra.created_at DESC
          LIMIT 1
        ) as total_km,
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
          WHEN p.status = 'documentation_completed' THEN 'Completed'
          WHEN p.status = 'dispatch_completed' THEN 'Dispatch Completed'
          WHEN p.status = 'in_progress' THEN 'In Progress'
          ELSE p.status
        END as process_status
        
      FROM processes p
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN employees e ON e.id = p.o2c_officer_id
      LEFT JOIN epss_branches b ON b.branch_code = f.branch_code
      WHERE f.route IS NOT NULL AND f.route != ''
      ${monthYearCondition}
      ${processTypeCondition}
      ${searchCondition}
      ${statusFilterCondition}
      ${branchCondition}
      ORDER BY ${validSortBy === 'facility_name' ? 'f.facility_name' : 'p.' + validSortBy} ${validSortOrder}
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    console.log('Executing HP processes query...');

    const customers = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log('Query successful, found', customers.length, 'real HP processes');

    // Calculate total waiting time: process created_at → quality_evaluated_at
    const waitingTimeQuery = `
      SELECT p.id,
        TIMESTAMPDIFF(MINUTE, p.created_at, COALESCE(MAX(o.quality_evaluated_at), NOW())) as total_waiting_time
      FROM processes p
      LEFT JOIN odns o ON o.process_id = p.id AND (o.odn_number NOT LIKE 'RRF not sent%' AND o.odn_number NOT LIKE 'VRF not sent%')
      WHERE p.id IN (${customers.map(c => c.id).join(',') || 'NULL'})
      GROUP BY p.id, p.created_at
    `;
    if (customers.length > 0) {
      const waitingTimes = await db.sequelize.query(waitingTimeQuery, {
        type: db.sequelize.QueryTypes.SELECT
      });
      const wtMap = {};
      waitingTimes.forEach(r => { wtMap[r.id] = r.total_waiting_time; });
      customers.forEach(c => { c.total_waiting_time = wtMap[c.id] || 0; });
    }

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
    
    console.log('=== GET HP CUSTOMER SERVICE DETAILS ===');
    console.log('Process ID:', customerId);

    // Get process record to get creation time
    const processQuery = `
      SELECT created_at
      FROM processes
      WHERE id = :customerId
    `;
    
    const [process] = await db.sequelize.query(processQuery, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: { customerId }
    });
    
    console.log('Process record:', process);

    // Get all service time records from service_time_hp table
    // Note: service_time_hp only has end_time, not start_time
    const query = `
      SELECT 
        st.service_unit,
        st.end_time,
        st.officer_name,
        st.status,
        st.notes,
        st.created_at
      FROM service_time_hp st
      WHERE st.process_id = :customerId
      ORDER BY st.created_at ASC
    `;

    const allServiceDetails = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: { customerId }
    });
    
    console.log('All HP service records found:', allServiceDetails.length);

    // Deduplicate: keep only the first record for each service unit
    const serviceMap = new Map();
    allServiceDetails.forEach(service => {
      const existing = serviceMap.get(service.service_unit);
      if (!existing) {
        // Only set if this is the first occurrence
        serviceMap.set(service.service_unit, service);
      }
    });
    
    console.log('After deduplication:', serviceMap.size, 'unique service units');
    
    // Convert back to array and sort by created_at
    const serviceDetails = Array.from(serviceMap.values())
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Calculate start times and waiting times
    const enrichedDetails = serviceDetails.map((service, index) => {
      let waitingMinutes = 0;
      let startTime = null;
      
      if (index === 0) {
        // First service: start time is process creation, end time is service end_time
        startTime = process?.created_at;
        if (startTime && service.end_time) {
          const start = new Date(startTime);
          const end = new Date(service.end_time);
          waitingMinutes = Math.round((end - start) / (1000 * 60));
          console.log(`Service ${index} (${service.service_unit}): start=${start.toISOString()}, end=${end.toISOString()}, duration=${waitingMinutes}min`);
        }
      } else {
        // Subsequent services: start time is previous service end_time
        const previousService = serviceDetails[index - 1];
        startTime = previousService.end_time;
        if (startTime && service.end_time) {
          const start = new Date(startTime);
          const end = new Date(service.end_time);
          waitingMinutes = Math.round((end - start) / (1000 * 60));
          console.log(`Service ${index} (${service.service_unit}): start=${start.toISOString()}, end=${end.toISOString()}, duration=${waitingMinutes}min`);
        }
      }
      
      // If duration is negative, something is wrong with the timestamps
      if (waitingMinutes < 0) {
        console.warn(`⚠️ Negative duration detected for ${service.service_unit}: ${waitingMinutes}min`);
        console.warn(`  Start: ${startTime}, End: ${service.end_time}`);
      }
      
      return {
        service_unit: service.service_unit,
        officer_name: service.officer_name || 'N/A',
        start_time: startTime,
        end_time: service.end_time,
        waiting_minutes: Math.max(0, waitingMinutes),
        status: service.status || 'completed',
        notes: service.notes
      };
    });
    
    console.log('Enriched HP details:', enrichedDetails.length, 'records');

    res.json({
      success: true,
      serviceDetails: enrichedDetails
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