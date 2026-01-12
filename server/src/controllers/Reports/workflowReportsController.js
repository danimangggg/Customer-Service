const db = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

// Get dispatch reports and analytics
const getDispatchReports = async (req, res) => {
  try {
    const { month, year, startDate, endDate, route_id } = req.query;
    
    console.log('Dispatch Reports request:', { month, year, startDate, endDate, route_id });

    const defaultResponse = {
      stats: { 
        total_assignments: 0, 
        completed_dispatches: 0, 
        in_progress: 0, 
        assigned: 0, 
        completion_rate: 0 
      },
      routePerformance: [],
      monthlyTrend: []
    };

    try {
      // Check if route_assignments table exists
      const routeAssignmentsCount = await db.sequelize.query(`
        SELECT COUNT(*) as count FROM route_assignments LIMIT 1
      `, { type: db.sequelize.QueryTypes.SELECT });

      if (routeAssignmentsCount[0]?.count >= 0) {
        // Get basic route assignment stats
        const dispatchStats = await db.sequelize.query(`
          SELECT 
            COUNT(*) as total_assignments,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_dispatches,
            SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as assigned,
            ROUND(
              (SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)), 
              1
            ) as completion_rate
          FROM route_assignments
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.stats = dispatchStats[0] || defaultResponse.stats;

        // Get route performance if routes table exists
        try {
          const routePerformance = await db.sequelize.query(`
            SELECT 
              COALESCE(r.route_name, CONCAT('Route ', ra.route_id)) as route_name,
              COUNT(ra.id) as total_assignments,
              SUM(CASE WHEN ra.status = 'Completed' THEN 1 ELSE 0 END) as completed,
              ROUND(
                (SUM(CASE WHEN ra.status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(ra.id), 0)), 
                1
              ) as completion_rate
            FROM route_assignments ra
            LEFT JOIN routes r ON ra.route_id = r.id
            GROUP BY ra.route_id, r.route_name
            ORDER BY completion_rate DESC, total_assignments DESC
            LIMIT 10
          `, { type: db.sequelize.QueryTypes.SELECT });

          defaultResponse.routePerformance = routePerformance || [];
        } catch (routeError) {
          console.log('Routes table not available for performance:', routeError.message);
        }
      }
    } catch (error) {
      console.log('Route assignments table not available:', error.message);
    }

    res.json(defaultResponse);

  } catch (error) {
    console.error('Error fetching dispatch reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dispatch reports', 
      details: error.message 
    });
  }
};

// Get documentation reports
const getDocumentationReports = async (req, res) => {
  try {
    console.log('Documentation Reports request');

    const defaultResponse = {
      stats: {
        total_documents: 0,
        signed_documents: 0,
        pending_documents: 0,
        completion_rate: 0
      },
      documentTypes: [],
      monthlyTrend: []
    };

    try {
      // Check if ODNs table exists for document tracking
      const odnsCount = await db.sequelize.query(`
        SELECT COUNT(*) as count FROM odns LIMIT 1
      `, { type: db.sequelize.QueryTypes.SELECT });

      if (odnsCount[0]?.count >= 0) {
        const documentStats = await db.sequelize.query(`
          SELECT 
            COUNT(*) as total_documents,
            SUM(CASE WHEN documents_signed = 1 THEN 1 ELSE 0 END) as signed_documents,
            SUM(CASE WHEN documents_signed = 0 OR documents_signed IS NULL THEN 1 ELSE 0 END) as pending_documents,
            ROUND(
              (SUM(CASE WHEN documents_signed = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)), 
              1
            ) as completion_rate
          FROM odns
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.stats = documentStats[0] || defaultResponse.stats;
      }
    } catch (error) {
      console.log('ODNs table not available for documentation:', error.message);
    }

    res.json(defaultResponse);

  } catch (error) {
    console.error('Error fetching documentation reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch documentation reports', 
      details: error.message 
    });
  }
};

// Get followup reports
const getFollowupReports = async (req, res) => {
  try {
    console.log('Followup Reports request');

    const defaultResponse = {
      stats: {
        total_followups: 0,
        completed_followups: 0,
        pending_followups: 0,
        completion_rate: 0
      },
      followupTypes: [],
      monthlyTrend: []
    };

    res.json(defaultResponse);

  } catch (error) {
    console.error('Error fetching followup reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch followup reports', 
      details: error.message 
    });
  }
};

// Get quality reports
const getQualityReports = async (req, res) => {
  try {
    console.log('Quality Reports request');

    const defaultResponse = {
      stats: {
        total_quality_checks: 0,
        passed_quality: 0,
        failed_quality: 0,
        pass_rate: 0
      },
      qualityMetrics: [],
      monthlyTrend: []
    };

    try {
      // Check if ODNs table exists for quality tracking
      const odnsCount = await db.sequelize.query(`
        SELECT COUNT(*) as count FROM odns LIMIT 1
      `, { type: db.sequelize.QueryTypes.SELECT });

      if (odnsCount[0]?.count >= 0) {
        const qualityStats = await db.sequelize.query(`
          SELECT 
            COUNT(*) as total_quality_checks,
            SUM(CASE WHEN quality_confirmed = 1 THEN 1 ELSE 0 END) as passed_quality,
            SUM(CASE WHEN quality_confirmed = 0 OR quality_confirmed IS NULL THEN 1 ELSE 0 END) as failed_quality,
            ROUND(
              (SUM(CASE WHEN quality_confirmed = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)), 
              1
            ) as pass_rate
          FROM odns
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.stats = qualityStats[0] || defaultResponse.stats;
      }
    } catch (error) {
      console.log('ODNs table not available for quality:', error.message);
    }

    res.json(defaultResponse);

  } catch (error) {
    console.error('Error fetching quality reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quality reports', 
      details: error.message 
    });
  }
};

// Get workflow reports
const getWorkflowReports = async (req, res) => {
  try {
    console.log('Workflow Reports request');

    const defaultResponse = {
      stats: {
        total_workflows: 0,
        completed_workflows: 0,
        in_progress_workflows: 0,
        completion_rate: 0
      },
      workflowStages: [],
      monthlyTrend: []
    };

    try {
      // Check if processes table exists for workflow tracking
      const processesCount = await db.sequelize.query(`
        SELECT COUNT(*) as count FROM processes LIMIT 1
      `, { type: db.sequelize.QueryTypes.SELECT });

      if (processesCount[0]?.count >= 0) {
        const workflowStats = await db.sequelize.query(`
          SELECT 
            COUNT(*) as total_workflows,
            SUM(CASE WHEN status = 'vehicle_requested' THEN 1 ELSE 0 END) as completed_workflows,
            SUM(CASE WHEN status != 'vehicle_requested' THEN 1 ELSE 0 END) as in_progress_workflows,
            ROUND(
              (SUM(CASE WHEN status = 'vehicle_requested' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)), 
              1
            ) as completion_rate
          FROM processes
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.stats = workflowStats[0] || defaultResponse.stats;

        // Get workflow stages
        const workflowStages = await db.sequelize.query(`
          SELECT 
            status,
            COUNT(*) as count
          FROM processes
          GROUP BY status
          ORDER BY count DESC
        `, { type: db.sequelize.QueryTypes.SELECT });

        defaultResponse.workflowStages = workflowStages || [];
      }
    } catch (error) {
      console.log('Processes table not available for workflow:', error.message);
    }

    res.json(defaultResponse);

  } catch (error) {
    console.error('Error fetching workflow reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workflow reports', 
      details: error.message 
    });
  }
};

module.exports = {
  getDispatchReports,
  getDocumentationReports,
  getFollowupReports,
  getQualityReports,
  getWorkflowReports
};