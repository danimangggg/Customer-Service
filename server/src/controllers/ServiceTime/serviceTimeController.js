const db = require('../../models');
const { Op } = require('sequelize');

// Get service times for a specific process
const getServiceTimesByProcess = async (req, res) => {
  try {
    const { process_id } = req.params;

    const query = `
      SELECT 
        st.id,
        st.process_id,
        st.service_unit,
        st.start_time,
        st.end_time,
        st.duration_minutes,
        st.status,
        st.notes,
        st.created_by,
        st.updated_by,
        st.created_at,
        st.updated_at,
        e1.full_name as created_by_name,
        e2.full_name as updated_by_name,
        p.status as process_status,
        p.customer_name
      FROM service_time st
      LEFT JOIN employees e1 ON st.created_by = e1.id
      LEFT JOIN processes p ON st.process_id = p.id
      LEFT JOIN employees e2 ON st.updated_by = e2.id
      WHERE st.process_id = ?
      ORDER BY st.start_time ASC
    `;

    const serviceTimes = await db.sequelize.query(query, {
      replacements: [process_id],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      serviceTimes,
      processId: process_id,
      totalServices: serviceTimes.length
    });

  } catch (error) {
    console.error('Error fetching service times:', error);
    res.status(500).json({ error: 'Failed to fetch service times' });
  }
};

// Get all service times with filtering
const getAllServiceTimes = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      service_unit, 
      start_date, 
      end_date,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE p.status != \'hp_facility\''; // Only regular processes
    let replacements = [];
    
    if (status) {
      whereClause += ' AND st.status = ?';
      replacements.push(status);
    }
    
    if (service_unit) {
      whereClause += ' AND st.service_unit LIKE ?';
      replacements.push(`%${service_unit}%`);
    }
    
    if (start_date && end_date) {
      whereClause += ' AND DATE(st.start_time) BETWEEN ? AND ?';
      replacements.push(start_date, end_date);
    }
    
    if (search) {
      whereClause += ' AND (p.customer_name LIKE ? OR st.service_unit LIKE ? OR st.notes LIKE ?)';
      const searchPattern = `%${search}%`;
      replacements.push(searchPattern, searchPattern, searchPattern);
    }

    const query = `
      SELECT 
        st.id,
        st.process_id,
        st.service_unit,
        st.start_time,
        st.end_time,
        st.duration_minutes,
        st.status,
        st.notes,
        st.created_by,
        st.updated_by,
        st.created_at,
        st.updated_at,
        e1.full_name as created_by_name,
        e2.full_name as updated_by_name,
        p.status as process_status,
        p.customer_name,
        p.created_at as process_created_at
      FROM service_time st
      LEFT JOIN employees e1 ON st.created_by = e1.id
      LEFT JOIN processes p ON st.process_id = p.id
      LEFT JOIN employees e2 ON st.updated_by = e2.id
      ${whereClause}
      ORDER BY st.start_time DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM service_time st
      LEFT JOIN processes p ON st.process_id = p.id
      ${whereClause}
    `;

    replacements.push(parseInt(limit), parseInt(offset));

    const serviceTimes = await db.sequelize.query(query, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT
    });

    // For count query, remove limit and offset
    let countReplacements = replacements.slice(0, -2);
    const countResult = await db.sequelize.query(countQuery, {
      replacements: countReplacements,
      type: db.sequelize.QueryTypes.SELECT
    });

    const totalCount = countResult[0]?.total || 0;

    res.json({
      serviceTimes,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error('Error fetching all service times:', error);
    res.status(500).json({ error: 'Failed to fetch service times' });
  }
};

// Create new service time entry
const createServiceTime = async (req, res) => {
  try {
    const {
      process_id,
      service_unit,
      start_time,
      end_time,
      status = 'in_progress',
      notes,
      created_by
    } = req.body;

    // Validation
    if (!process_id || !service_unit || !start_time || !created_by) {
      return res.status(400).json({
        error: 'process_id, service_unit, start_time, and created_by are required'
      });
    }

    // Check if process exists and is not HP facility
    const processCheck = await db.sequelize.query(
      'SELECT id, status FROM processes WHERE id = ? AND status != \'hp_facility\'',
      {
        replacements: [process_id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (processCheck.length === 0) {
      return res.status(404).json({
        error: 'Process not found or is an HP facility process'
      });
    }

    const insertQuery = `
      INSERT INTO service_time (
        process_id, service_unit, start_time, end_time, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.sequelize.query(insertQuery, {
      replacements: [
        process_id,
        service_unit,
        start_time,
        end_time || null,
        status,
        notes || null,
        created_by
      ],
      type: db.sequelize.QueryTypes.INSERT
    });

    const serviceTimeId = result[0];

    // Fetch the created record
    const createdRecord = await db.sequelize.query(
      'SELECT * FROM service_time WHERE id = ?',
      {
        replacements: [serviceTimeId],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    res.status(201).json({
      message: 'Service time created successfully',
      serviceTime: createdRecord[0]
    });

  } catch (error) {
    console.error('Error creating service time:', error);
    res.status(500).json({ error: 'Failed to create service time' });
  }
};

// Update service time entry
const updateServiceTime = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      service_unit,
      start_time,
      end_time,
      status,
      notes,
      updated_by
    } = req.body;

    // Check if service time exists
    const existingRecord = await db.sequelize.query(
      'SELECT * FROM service_time WHERE id = ?',
      {
        replacements: [id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (existingRecord.length === 0) {
      return res.status(404).json({ error: 'Service time record not found' });
    }

    const updateQuery = `
      UPDATE service_time 
      SET service_unit = COALESCE(?, service_unit),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_by = COALESCE(?, updated_by)
      WHERE id = ?
    `;

    await db.sequelize.query(updateQuery, {
      replacements: [
        service_unit,
        start_time,
        end_time,
        status,
        notes,
        updated_by,
        id
      ],
      type: db.sequelize.QueryTypes.UPDATE
    });

    // Fetch updated record
    const updatedRecord = await db.sequelize.query(
      'SELECT * FROM service_time WHERE id = ?',
      {
        replacements: [id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      message: 'Service time updated successfully',
      serviceTime: updatedRecord[0]
    });

  } catch (error) {
    console.error('Error updating service time:', error);
    res.status(500).json({ error: 'Failed to update service time' });
  }
};

// Delete service time entry
const deleteServiceTime = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service time exists
    const existingRecord = await db.sequelize.query(
      'SELECT * FROM service_time WHERE id = ?',
      {
        replacements: [id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (existingRecord.length === 0) {
      return res.status(404).json({ error: 'Service time record not found' });
    }

    await db.sequelize.query(
      'DELETE FROM service_time WHERE id = ?',
      {
        replacements: [id],
        type: db.sequelize.QueryTypes.DELETE
      }
    );

    res.json({
      message: 'Service time deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting service time:', error);
    res.status(500).json({ error: 'Failed to delete service time' });
  }
};

// Get service time statistics
const getServiceTimeStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    let replacements = [];
    
    if (start_date && end_date) {
      dateFilter = 'AND DATE(st.start_time) BETWEEN ? AND ?';
      replacements.push(start_date, end_date);
    }

    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_services,
        COUNT(CASE WHEN st.status = 'completed' THEN 1 END) as completed_services,
        COUNT(CASE WHEN st.status = 'in_progress' THEN 1 END) as in_progress_services,
        COUNT(CASE WHEN st.status = 'paused' THEN 1 END) as paused_services,
        AVG(st.duration_minutes) as avg_duration_minutes,
        COUNT(DISTINCT st.process_id) as total_processes
      FROM service_time st
      LEFT JOIN processes p ON st.process_id = p.id
      WHERE p.status != 'hp_facility' ${dateFilter}
    `;

    // Get service unit breakdown
    const serviceUnitsQuery = `
      SELECT 
        st.service_unit,
        COUNT(*) as count,
        AVG(st.duration_minutes) as avg_duration,
        COUNT(CASE WHEN st.status = 'completed' THEN 1 END) as completed_count
      FROM service_time st
      LEFT JOIN processes p ON st.process_id = p.id
      WHERE p.status != 'hp_facility' ${dateFilter}
      GROUP BY st.service_unit
      ORDER BY count DESC
    `;

    const [stats] = await db.sequelize.query(statsQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT
    });

    const serviceUnits = await db.sequelize.query(serviceUnitsQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      stats,
      serviceUnits
    });

  } catch (error) {
    console.error('Error fetching service time stats:', error);
    res.status(500).json({ error: 'Failed to fetch service time statistics' });
  }
};

module.exports = {
  getServiceTimesByProcess,
  getAllServiceTimes,
  createServiceTime,
  updateServiceTime,
  deleteServiceTime,
  getServiceTimeStats
};