const db = require('../../models');
const Process = db.process;

// Valid revert transitions: current status → previous status
const REVERT_MAP = {
  ewm_completed:    'o2c_completed',
  tm_confirmed:     'ewm_completed',
  ewm_goods_issued: 'tm_confirmed',
  biller_completed: 'ewm_goods_issued',
  driver_assigned:  'biller_completed',
  dispatch_completed: 'driver_assigned',
};

// Vaccine skips ewm_goods_issued, so biller_completed reverts to tm_confirmed
const REVERT_MAP_VACCINE = {
  ...REVERT_MAP,
  biller_completed: 'tm_confirmed',
};

exports.revertProcess = async (req, res) => {
  try {
    const { process_id } = req.body;

    if (!process_id) {
      return res.status(400).json({ error: 'process_id is required' });
    }

    const process = await Process.findByPk(process_id);
    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    const map = process.process_type === 'vaccine' ? REVERT_MAP_VACCINE : REVERT_MAP;
    const targetStatus = map[process.status];

    if (!targetStatus) {
      return res.status(400).json({
        error: `Cannot revert process at status "${process.status}"`,
        current_status: process.status
      });
    }

    await process.update({ status: targetStatus });

    console.log(`[HP Revert] Process ${process_id}: ${process.status} → ${targetStatus}`);

    res.json({
      success: true,
      message: `Process reverted from "${process.status}" to "${targetStatus}"`,
      previous_status: process.status,
      new_status: targetStatus
    });

  } catch (error) {
    console.error('HP revert error:', error);
    res.status(500).json({ error: 'Failed to revert process', details: error.message });
  }
};
