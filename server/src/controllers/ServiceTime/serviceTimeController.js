const db = require('../../models');

// Insert service time record for RDF process
const insertServiceTime = async (req, res) => {
  try {
    const { 
      process_id, 
      service_unit, 
      end_time, 
      officer_id, 
      officer_name, 
      status, 
      notes 
    } = req.body;

    const query = `
      INSERT INTO service_time 
      (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.sequelize.query(query, {
      replacements: [
        process_id, 
        service_unit, 
        end_time, 
        officer_id, 
        officer_name, 
        status || 'completed', 
        notes
      ],
      type: db.sequelize.QueryTypes.INSERT
    });

    res.json({ success: true, message: 'Service time recorded successfully' });
  } catch (error) {
    console.error('Error inserting service time:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to record service time',
      message: error.message 
    });
  }
};

// Insert service time record for HP process
const insertServiceTimeHP = async (req, res) => {
  try {
    const { 
      process_id, 
      service_unit, 
      end_time, 
      officer_id, 
      officer_name, 
      status, 
      notes 
    } = req.body;

    const query = `
      INSERT INTO service_time_hp 
      (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.sequelize.query(query, {
      replacements: [
        process_id, 
        service_unit, 
        end_time, 
        officer_id, 
        officer_name, 
        status || 'completed', 
        notes
      ],
      type: db.sequelize.QueryTypes.INSERT
    });

    res.json({ success: true, message: 'HP service time recorded successfully' });
  } catch (error) {
    console.error('Error inserting HP service time:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to record HP service time',
      message: error.message 
    });
  }
};

// Get last end time for a service unit (to calculate waiting time)
const getLastEndTime = async (req, res) => {
  try {
    const { process_id, service_unit, table } = req.query;
    
    // Determine table: if URL contains 'service-time-hp', use HP table
    const isHPEndpoint = req.originalUrl && req.originalUrl.includes('service-time-hp');
    const tableName = isHPEndpoint || table === 'hp' ? 'service_time_hp' : 'service_time';
    
    const query = `
      SELECT end_time 
      FROM ${tableName}
      WHERE process_id = ? AND service_unit = ?
      ORDER BY end_time DESC 
      LIMIT 1
    `;

    const [result] = await db.sequelize.query(query, {
      replacements: [process_id, service_unit],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({ end_time: result?.end_time || null });
  } catch (error) {
    console.error('Error getting last end time:', error);
    res.status(500).json({ 
      error: 'Failed to get last end time',
      message: error.message 
    });
  }
};

// Get all service times for a process
const getServiceTimesByProcess = async (req, res) => {
  try {
    const { process_id, table } = req.query;
    
    const tableName = table === 'hp' ? 'service_time_hp' : 'service_time';
    
    const query = `
      SELECT * 
      FROM ${tableName}
      WHERE process_id = ?
      ORDER BY end_time ASC
    `;

    const records = await db.sequelize.query(query, {
      replacements: [process_id],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({ records });
  } catch (error) {
    console.error('Error getting service times:', error);
    res.status(500).json({ 
      error: 'Failed to get service times',
      message: error.message 
    });
  }
};

// Get RDF service time report
const getRDFServiceTimeReport = async (req, res) => {
  try {
    // RDF records are in service_time table (not service_time_hp)
    // They come from customer_queue (not processes table)
    const query = `
      SELECT 
        st.*,
        f.facility_name,
        f.route,
        cq.customer_type,
        cq.started_at as registration_time
      FROM service_time st
      INNER JOIN customer_queue cq ON st.process_id = cq.id
      LEFT JOIN facilities f ON cq.facility_id = f.id
      ORDER BY st.end_time DESC
      LIMIT 1000
    `;

    const records = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });

    // Group by process_id
    const groupedRecords = {};
    records.forEach(record => {
      if (!groupedRecords[record.process_id]) {
        groupedRecords[record.process_id] = {
          process_id: record.process_id,
          facility_name: record.facility_name,
          customer_type: record.customer_type,
          route: record.route,
          registration_time: record.registration_time,
          service_units: []
        };
      }
      groupedRecords[record.process_id].service_units.push({
        service_unit: record.service_unit,
        end_time: record.end_time,
        officer_id: record.officer_id,
        officer_name: record.officer_name,
        status: record.status,
        notes: record.notes
      });
    });

    res.json({ records: Object.values(groupedRecords) });
  } catch (error) {
    console.error('Error getting RDF service time report:', error);
    res.status(500).json({ 
      error: 'Failed to get RDF service time report',
      message: error.message 
    });
  }
};

// Get HP service time report
const getHPServiceTimeReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        st.*,
        f.facility_name,
        f.route,
        p.reporting_month
      FROM service_time_hp st
      LEFT JOIN processes p ON st.process_id = p.id
      LEFT JOIN facilities f ON p.facility_id = f.id
      WHERE f.route IS NOT NULL AND f.route != ''
      ORDER BY st.end_time DESC
      LIMIT 1000
    `;

    const records = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });

    // Group by process_id
    const groupedRecords = {};
    records.forEach(record => {
      if (!groupedRecords[record.process_id]) {
        groupedRecords[record.process_id] = {
          process_id: record.process_id,
          facility_name: record.facility_name,
          route: record.route,
          reporting_month: record.reporting_month,
          service_units: []
        };
      }
      groupedRecords[record.process_id].service_units.push(record);
    });

    res.json({ records: Object.values(groupedRecords) });
  } catch (error) {
    console.error('Error getting HP service time report:', error);
    res.status(500).json({ 
      error: 'Failed to get HP service time report',
      message: error.message 
    });
  }
};

module.exports = {
  insertServiceTime,
  insertServiceTimeHP,
  getLastEndTime,
  getServiceTimesByProcess,
  getRDFServiceTimeReport,
  getHPServiceTimeReport
};

// Legacy functions for backward compatibility
const getAllServiceTimes = async (req, res) => {
  try {
    const query = `SELECT * FROM service_time ORDER BY end_time DESC LIMIT 100`;
    const records = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });
    res.json({ records });
  } catch (error) {
    console.error('Error getting all service times:', error);
    res.status(500).json({ error: 'Failed to get service times', message: error.message });
  }
};

const getServiceTimeStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        service_unit,
        COUNT(*) as count
      FROM service_time
      WHERE status = 'completed'
      GROUP BY service_unit
    `;
    const stats = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });
    res.json({ stats });
  } catch (error) {
    console.error('Error getting service time stats:', error);
    res.status(500).json({ error: 'Failed to get stats', message: error.message });
  }
};

const createServiceTime = async (req, res) => {
  // Alias for insertServiceTime
  return insertServiceTime(req, res);
};

const updateServiceTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { end_time, status, notes } = req.body;
    
    const query = `
      UPDATE service_time 
      SET end_time = ?, status = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    await db.sequelize.query(query, {
      replacements: [end_time, status, notes, id],
      type: db.sequelize.QueryTypes.UPDATE
    });
    
    res.json({ success: true, message: 'Service time updated' });
  } catch (error) {
    console.error('Error updating service time:', error);
    res.status(500).json({ error: 'Failed to update', message: error.message });
  }
};

const deleteServiceTime = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `DELETE FROM service_time WHERE id = ?`;
    
    await db.sequelize.query(query, {
      replacements: [id],
      type: db.sequelize.QueryTypes.DELETE
    });
    
    res.json({ success: true, message: 'Service time deleted' });
  } catch (error) {
    console.error('Error deleting service time:', error);
    res.status(500).json({ error: 'Failed to delete', message: error.message });
  }
};

module.exports = {
  insertServiceTime,
  insertServiceTimeHP,
  getLastEndTime,
  getServiceTimesByProcess,
  getRDFServiceTimeReport,
  getHPServiceTimeReport,
  // Legacy functions
  getAllServiceTimes,
  getServiceTimeStats,
  createServiceTime,
  updateServiceTime,
  deleteServiceTime
};
