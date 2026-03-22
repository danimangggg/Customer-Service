const db = require("../models");
const ExitHistory = db.exitHistory;

// Get exit history for a process
const getExitHistory = async (req, res) => {
  try {
    const { processId } = req.params;
    
    const exits = await ExitHistory.findAll({
      where: { process_id: processId },
      order: [['exit_number', 'ASC']]
    });
    
    res.status(200).json({ 
      success: true, 
      exits 
    });
  } catch (error) {
    console.error('Error fetching exit history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch exit history',
      error: error.message 
    });
  }
};

// Create exit history record
const createExitHistory = async (req, res) => {
  try {
    const {
      process_id,
      store_id,
      exit_number,
      vehicle_plate,
      total_amount,
      measurement_unit,
      receipt_count,
      receipt_number,
      gate_keeper_id,
      gate_keeper_name,
      exit_type,
      exited_at
    } = req.body;
    
    const exitHistory = await ExitHistory.create({
      process_id,
      store_id,
      exit_number,
      vehicle_plate,
      total_amount,
      measurement_unit,
      receipt_count,
      receipt_number,
      gate_keeper_id,
      gate_keeper_name,
      exit_type,
      gate_status: req.body.gate_status || 'pending',
      assigned_gate_keeper_id: req.body.assigned_gate_keeper_id || null,
      assigned_gate_keeper_name: req.body.assigned_gate_keeper_name || null,
      exited_at: exited_at || new Date()
    });
    
    res.status(201).json({ 
      success: true, 
      exitHistory 
    });
  } catch (error) {
    console.error('Error creating exit history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create exit history',
      error: error.message 
    });
  }
};

// Get all exit history records for a store (for ExitPermit history tab)
async function getHistoryByStore(req, res) {
  try {
    const { store } = req.params;
    const rows = await db.sequelize.query(`
      SELECT 
        eh.*,
        cq.facility_id, cq.customer_type, cq.status as global_status,
        f.facility_name
      FROM exit_history eh
      INNER JOIN customer_queue cq ON eh.process_id = cq.id
      LEFT JOIN facilities f ON cq.facility_id = f.id
      WHERE eh.store_id = ?
        AND LOWER(COALESCE(cq.status, '')) != 'completed'
      ORDER BY eh.created_at DESC
    `, { replacements: [store], type: db.sequelize.QueryTypes.SELECT });

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching exit history by store:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Update an exit_history row (for edit dialog in ExitPermit)
async function updateExitHistoryRow(req, res) {
  try {
    const { id } = req.params;
    const {
      vehicle_plate, total_amount, measurement_unit,
      receipt_count, receipt_number,
      assigned_gate_keeper_id, assigned_gate_keeper_name
    } = req.body;

    await ExitHistory.update(
      { vehicle_plate, total_amount, measurement_unit, receipt_count, receipt_number,
        assigned_gate_keeper_id, assigned_gate_keeper_name },
      { where: { id } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating exit history row:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get all pending exit history records for a store (for GateKeeper)
async function getPendingByStore(req, res) {
  try {
    const { store } = req.params;
    const rows = await db.sequelize.query(`
      SELECT 
        eh.*,
        cq.facility_id, cq.customer_type, cq.status as global_status,
        f.facility_name
      FROM exit_history eh
      INNER JOIN customer_queue cq ON eh.process_id = cq.id
      LEFT JOIN facilities f ON cq.facility_id = f.id
      WHERE eh.store_id = ? AND eh.gate_status = 'pending'
      ORDER BY eh.created_at ASC
    `, { replacements: [store], type: db.sequelize.QueryTypes.SELECT });

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching pending exit history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Update gate status on a specific exit_history row
async function updateGateStatus(req, res) {
  try {
    const { id } = req.params;
    const { gate_status, gate_keeper_id, gate_keeper_name } = req.body;

    await ExitHistory.update(
      { gate_status, gate_keeper_id, gate_keeper_name, exited_at: new Date() },
      { where: { id } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating exit history gate status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getExitHistory,
  createExitHistory,
  getHistoryByStore,
  getPendingByStore,
  updateGateStatus,
  updateExitHistoryRow,
  deleteExitHistoryByProcess
};

// Delete all exit_history rows for a process (called after Gate Keeper completes)
async function deleteExitHistoryByProcess(req, res) {
  try {
    const { processId } = req.params;
    await ExitHistory.destroy({ where: { process_id: processId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting exit history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
