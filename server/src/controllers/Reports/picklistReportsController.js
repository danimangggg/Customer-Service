const db = require('../../models');
const { Op, fn, col, literal } = require('sequelize');
const Picklist = db.picklist;
const Employee = db.employee;

// Get picklist statistics
const getPicklistStats = async (req, res) => {
  try {
    const { startDate, endDate, store, operator_id } = req.query;
    
    let whereClause = {};
    
    // Date filtering
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Store filtering
    if (store) {
      whereClause.store = store;
    }
    
    // Operator filtering
    if (operator_id) {
      whereClause.operator_id = operator_id;
    }

    // Total picklists
    const totalPicklists = await Picklist.count({ where: whereClause });
    
    // Completed picklists
    const completedPicklists = await Picklist.count({
      where: { ...whereClause, status: 'Completed' }
    });
    
    // Pending picklists
    const pendingPicklists = await Picklist.count({
      where: { ...whereClause, status: { [Op.ne]: 'Completed' } }
    });
    
    // Picklists by store
    const picklistsByStore = await Picklist.findAll({
      where: whereClause,
      attributes: [
        'store',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['store'],
      raw: true
    });
    
    // Picklists by status
    const picklistsByStatus = await Picklist.findAll({
      where: whereClause,
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // Daily picklist trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyTrend = await Picklist.findAll({
      where: {
        ...whereClause,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      totalPicklists,
      completedPicklists,
      pendingPicklists,
      completionRate: totalPicklists > 0 ? ((completedPicklists / totalPicklists) * 100).toFixed(2) : 0,
      picklistsByStore,
      picklistsByStatus,
      dailyTrend
    });
  } catch (error) {
    console.error('Error fetching picklist statistics:', error);
    res.status(500).json({ error: 'Failed to fetch picklist statistics' });
  }
};

// Get detailed picklist reports
const getPicklistReports = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      store, 
      status, 
      operator_id,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = {};
    
    // Date filtering
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Store filtering
    if (store) {
      whereClause.store = store;
    }
    
    // Status filtering
    if (status) {
      whereClause.status = status;
    }
    
    // Operator filtering
    if (operator_id) {
      whereClause.operator_id = operator_id;
    }
    
    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { odn: { [Op.like]: `%${search}%` } },
        { process_id: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Picklist.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Employee,
          as: 'operator',
          attributes: ['id', 'full_name', 'email'],
          required: false
        }
      ]
    });

    res.json({
      picklists: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching picklist reports:', error);
    res.status(500).json({ error: 'Failed to fetch picklist reports' });
  }
};

// Get operator performance report
const getOperatorPerformance = async (req, res) => {
  try {
    const { startDate, endDate, store } = req.query;
    
    let whereClause = {};
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (store) {
      whereClause.store = store;
    }

    const operatorStats = await Picklist.findAll({
      where: whereClause,
      attributes: [
        'operator_id',
        [fn('COUNT', col('Picklists.id')), 'totalPicklists'],
        [fn('COUNT', fn('CASE', fn('WHEN', col('status'), '=', 'Completed', fn('THEN', 1)), fn('END'))), 'completedPicklists']
      ],
      include: [
        {
          model: Employee,
          as: 'operator',
          attributes: ['id', 'full_name', 'email', 'job_title'],
          required: false
        }
      ],
      group: ['operator_id', 'operator.id'],
      raw: false
    });

    const formattedStats = operatorStats.map(stat => {
      const total = parseInt(stat.getDataValue('totalPicklists'));
      const completed = parseInt(stat.getDataValue('completedPicklists'));
      return {
        operator_id: stat.operator_id,
        operator: stat.operator,
        totalPicklists: total,
        completedPicklists: completed,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
      };
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching operator performance:', error);
    res.status(500).json({ error: 'Failed to fetch operator performance' });
  }
};

// Export picklist data
const exportPicklistData = async (req, res) => {
  try {
    const { startDate, endDate, store, status, format = 'json' } = req.query;
    
    let whereClause = {};
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (store) whereClause.store = store;
    if (status) whereClause.status = status;

    const picklists = await Picklist.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'operator',
          attributes: ['full_name', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (format === 'csv') {
      const csv = convertToCSV(picklists);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=picklist-report.csv');
      res.send(csv);
    } else {
      res.json(picklists);
    }
  } catch (error) {
    console.error('Error exporting picklist data:', error);
    res.status(500).json({ error: 'Failed to export picklist data' });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data.length) return '';
  
  const headers = ['ID', 'ODN', 'Process ID', 'Store', 'Status', 'Operator', 'Created At'];
  const csvRows = [headers.join(',')];
  
  data.forEach(item => {
    const row = [
      item.id,
      item.odn || '',
      item.process_id || '',
      item.store || '',
      item.status || '',
      item.operator?.full_name || '',
      item.createdAt || ''
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

module.exports = {
  getPicklistStats,
  getPicklistReports,
  getOperatorPerformance,
  exportPicklistData
};