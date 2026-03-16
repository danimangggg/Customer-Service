const db = require('../../models');

const getRDFDashboardStats = async (req, res) => {
  try {
    console.log('=== FETCHING RDF DASHBOARD STATS ===');

    // Get total registrations
    const [totalResult] = await db.sequelize.query(
      `SELECT COUNT(*) as total FROM customer_queue`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // Get completed count
    const [completedResult] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM customer_queue WHERE status = 'Completed'`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // Get in progress count (all statuses except completed and cancelled)
    const [inProgressResult] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM customer_queue 
       WHERE status NOT IN ('Completed', 'Canceled', 'Auto-Canceled')`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // Get manually cancelled count
    const [cancelledResult] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM customer_queue WHERE status = 'Canceled'`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // Get auto-cancelled count
    const [autoCancelledResult] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM customer_queue WHERE status = 'Auto-Canceled'`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // Get average waiting time (in minutes)
    const [avgWaitingResult] = await db.sequelize.query(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, started_at, COALESCE(completed_at, NOW()))) as avg_time
       FROM customer_queue
       WHERE started_at IS NOT NULL`,
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
