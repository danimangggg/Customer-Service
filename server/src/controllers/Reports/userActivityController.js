const db = require('../../models');
const { Op } = require('sequelize');

// Get comprehensive user activity log from service_time table
const getUserActivityLog = async (req, res) => {
  try {
    const { startDate, endDate, userId, actionType } = req.query;
    
    // Build comprehensive activity log from service_time table
    const activityQuery = `
      SELECT 
        st.id as activity_id,
        st.process_id,
        st.service_unit,
        st.start_time,
        st.end_time,
        st.duration_minutes,
        st.status,
        st.notes,
        st.created_by as user_id,
        st.updated_by as updated_by_id,
        st.created_at,
        st.updated_at,
        
        -- Get user info for created_by
        e1.full_name as user_name,
        e1.jobTitle as user_role,
        
        -- Get user info for updated_by
        e2.full_name as updated_by_name,
        
        -- Get process and facility info
        p.id as process_id,
        p.status as process_status,
        p.reporting_month,
        f.id as facility_id,
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        f.route,
        
        -- Get customer queue info for RDF processes
        cq.id as queue_id,
        cq.customer_type,
        cq.registered_by_name as cs_officer_name,
        cq.registration_completed_at
        
      FROM service_time st
      LEFT JOIN employees e1 ON st.created_by = e1.id
      LEFT JOIN employees e2 ON st.updated_by = e2.id
      LEFT JOIN processes p ON st.process_id = p.id
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN customer_queue cq ON cq.facility_id = f.id
      WHERE 1=1
      ORDER BY st.start_time DESC
      LIMIT 1000
    `;

    const activities = await db.sequelize.query(activityQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    // Transform the data into a flat activity log
    const activityLog = activities.map(record => {
      const isHP = record.route && record.route.trim() !== '';
      const processType = isHP ? 'HP' : 'RDF';  // HP has route, RDF doesn't
      
      return {
        activityId: record.activity_id,
        timestamp: record.start_time,
        endTime: record.end_time,
        duration: record.duration_minutes,
        userId: record.user_id,
        userName: record.user_name,
        role: record.user_role || record.service_unit,
        serviceUnit: record.service_unit,
        action: record.status === 'completed' ? `Completed ${record.service_unit}` : `Started ${record.service_unit}`,
        status: record.status,
        processType: processType,
        processId: record.process_id,
        processStatus: record.process_status,
        reportingMonth: record.reporting_month,
        facilityId: record.facility_id,
        facilityName: record.facility_name,
        region: record.region_name,
        zone: record.zone_name,
        woreda: record.woreda_name,
        route: record.route,
        customerType: record.customer_type,
        notes: record.notes,
        updatedBy: record.updated_by_name,
        updatedAt: record.updated_at
      };
    });

    // Also get Customer Service Officer registrations from customer_queue
    const registrationQuery = `
      SELECT 
        cq.id as queue_id,
        cq.registration_completed_at as timestamp,
        cq.registered_by_id as user_id,
        cq.registered_by_name as user_name,
        'Customer Service Officer' as role,
        'Customer Service Officer' as service_unit,
        'Registered Customer' as action,
        'completed' as status,
        cq.facility_id,
        f.facility_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        f.route,
        cq.customer_type,
        CASE 
          WHEN f.route IS NOT NULL AND f.route != '' THEN 'HP' 
          ELSE 'RDF' 
        END as process_type
      FROM customer_queue cq
      LEFT JOIN facilities f ON cq.facility_id = f.id
      WHERE cq.registration_completed_at IS NOT NULL
      ORDER BY cq.registration_completed_at DESC
      LIMIT 500
    `;

    const registrations = await db.sequelize.query(registrationQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    // Add registrations to activity log
    registrations.forEach(reg => {
      activityLog.push({
        activityId: `reg_${reg.queue_id}`,
        timestamp: reg.timestamp,
        endTime: reg.timestamp,
        duration: 0,
        userId: reg.user_id,
        userName: reg.user_name,
        role: reg.role,
        serviceUnit: reg.service_unit,
        action: reg.action,
        status: reg.status,
        processType: reg.process_type,
        facilityId: reg.facility_id,
        facilityName: reg.facility_name,
        region: reg.region_name,
        zone: reg.zone_name,
        woreda: reg.woreda_name,
        route: reg.route,
        customerType: reg.customer_type
      });
    });

    // Sort by timestamp descending
    activityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Get user statistics from service_time
    const userStatsQuery = `
      SELECT 
        e.full_name as user_name,
        e.jobTitle as role,
        st.service_unit,
        COUNT(DISTINCT CASE WHEN st.status = 'completed' THEN st.id END) as completed_tasks,
        COUNT(DISTINCT CASE WHEN st.status = 'in_progress' THEN st.id END) as pending_tasks,
        AVG(CASE WHEN st.status = 'completed' THEN st.duration_minutes END) as avg_duration
      FROM service_time st
      INNER JOIN employees e ON st.created_by = e.id
      GROUP BY e.full_name, e.jobTitle, st.service_unit
      
      UNION ALL
      
      SELECT 
        cq.registered_by_name as user_name,
        'Customer Service Officer' as role,
        'Customer Service Officer' as service_unit,
        COUNT(DISTINCT CASE WHEN cq.registration_completed_at IS NOT NULL THEN cq.id END) as completed_tasks,
        0 as pending_tasks,
        0 as avg_duration
      FROM customer_queue cq
      WHERE cq.registered_by_name IS NOT NULL
      GROUP BY cq.registered_by_name
      
      ORDER BY role, user_name, service_unit
    `;

    const userStats = await db.sequelize.query(userStatsQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT st.id) as total_activities,
        COUNT(DISTINCT st.created_by) as total_users,
        COUNT(DISTINCT CASE WHEN st.status = 'completed' THEN st.id END) as completed_activities,
        COUNT(DISTINCT CASE WHEN st.status = 'in_progress' THEN st.id END) as in_progress_activities,
        AVG(CASE WHEN st.status = 'completed' THEN st.duration_minutes END) as avg_duration_minutes
      FROM service_time st
    `;

    const [summary] = await db.sequelize.query(summaryQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      activityLog,
      userStats,
      summary: {
        totalActivities: (summary.total_activities || 0) + registrations.length,
        totalUsers: summary.total_users || 0,
        completedActivities: (summary.completed_activities || 0) + registrations.length,
        inProgressActivities: summary.in_progress_activities || 0,
        avgDurationMinutes: Math.round(summary.avg_duration_minutes || 0)
      }
    });

  } catch (error) {
    console.error('Error fetching user activity log:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user activity log',
      message: error.message 
    });
  }
};

module.exports = {
  getUserActivityLog
};
