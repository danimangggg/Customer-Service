const db = require('../../models');

const getRDFDashboardStats = async (req, res) => {
  try {
    console.log('=== FETCHING RDF DASHBOARD STATS ===');

    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const queryBranch  = req.query.branch_code || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
    const branchWhere  = branchCode 
      ? `AND EXISTS (SELECT 1 FROM facilities f WHERE f.id = cq.facility_id AND f.branch_code = '${branchCode}')`
      : '';

    const [totalResult] = await db.sequelize.query(
      `SELECT COUNT(*) as total FROM customer_queue cq WHERE 1=1 ${branchWhere}`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const [completedResult] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM customer_queue cq WHERE cq.status = 'completed' ${branchWhere}`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const [inProgressResult] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM customer_queue cq
       WHERE cq.status NOT IN ('completed', 'Canceled', 'Auto-Canceled') ${branchWhere}`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const [cancelledResult] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM customer_queue cq WHERE cq.status = 'Canceled' ${branchWhere}`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const [autoCancelledResult] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM customer_queue cq WHERE cq.status = 'Auto-Canceled' ${branchWhere}`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const [avgWaitingResult] = await db.sequelize.query(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, cq.started_at, COALESCE(cq.completed_at, NOW()))) as avg_time
       FROM customer_queue cq
       WHERE cq.started_at IS NOT NULL ${branchWhere}`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const stats = {
      totalRegistrations: totalResult.total || 0,
      completedCount: completedResult.count || 0,
      inProgressCount: inProgressResult.count || 0,
      cancelledCount: cancelledResult.count || 0,
      autoCancelledCount: autoCancelledResult.count || 0,
      averageWaitingTime: avgWaitingResult.avg_time || 0
    };

    console.log('Dashboard stats:', stats);

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('=== ERROR FETCHING RDF DASHBOARD STATS ===');
    console.error('Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RDF dashboard stats',
      details: error.message
    });
  }
};

module.exports = {
  getRDFDashboardStats
};
