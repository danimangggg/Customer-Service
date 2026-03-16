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

module.exports = {
  getExitHistory,
  createExitHistory
};
