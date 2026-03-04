const db = require('../../models');
const Process = db.process;
const Facility = db.facility;

// Get processes ready for TM (EWM completed)
exports.getTMProcesses = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const processes = await Process.findAll({
      where: {
        status: 'ewm_completed',
        reporting_month: `${month} ${year}`
      },
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['id', 'facility_name', 'region_name', 'route']
      }],
      order: [['created_at', 'DESC']]
    });
    
    res.json({ success: true, processes });
  } catch (error) {
    console.error('Get TM processes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Notify TM that goods are ready
exports.notifyTM = async (req, res) => {
  try {
    const { process_id } = req.body;
    
    await Process.update({
      tm_notified_at: new Date(),
      status: 'tm_notified'
    }, {
      where: { id: process_id }
    });
    
    res.json({ success: true, message: 'TM notified successfully' });
  } catch (error) {
    console.error('Notify TM error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create freight order
exports.createFreightOrder = async (req, res) => {
  try {
    const { process_id, freight_order_number, tm_officer_id, tm_officer_name } = req.body;
    
    await Process.update({
      freight_order_number,
      freight_order_created_at: new Date(),
      freight_order_status: 'completed',
      freight_order_sent_to_ewm_at: new Date(),
      tm_officer_id,
      tm_officer_name,
      status: 'freight_order_sent_to_ewm'
    }, {
      where: { id: process_id }
    });
    
    res.json({ success: true, message: 'Freight order created successfully' });
  } catch (error) {
    console.error('Create freight order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send freight order back to EWM
exports.sendToEWM = async (req, res) => {
  try {
    const { process_id } = req.body;
    
    await Process.update({
      freight_order_sent_to_ewm_at: new Date(),
      status: 'freight_order_sent_to_ewm'
    }, {
      where: { id: process_id }
    });
    
    res.json({ success: true, message: 'Freight order sent to EWM successfully' });
  } catch (error) {
    console.error('Send to EWM error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
