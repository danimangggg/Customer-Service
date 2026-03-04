const db = require('../../models');
const Process = db.process;
const Facility = db.facility;

// Get processes ready for Biller (EWM goods issued)
exports.getBillerProcesses = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const processes = await Process.findAll({
      where: {
        status: 'ewm_goods_issued',
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
    console.error('Get Biller processes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Receive goods at Biller
exports.receiveGoods = async (req, res) => {
  try {
    const { process_id, biller_officer_id, biller_officer_name } = req.body;
    
    await Process.update({
      biller_received_at: new Date(),
      biller_officer_id,
      biller_officer_name,
      biller_status: 'pending',
      status: 'biller_received'
    }, {
      where: { id: process_id }
    });
    
    res.json({ success: true, message: 'Goods received at Biller successfully' });
  } catch (error) {
    console.error('Receive goods error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Print documents
exports.printDocuments = async (req, res) => {
  try {
    const { process_id } = req.body;
    
    await Process.update({
      biller_printed_at: new Date(),
      biller_status: 'completed',
      status: 'biller_completed'
    }, {
      where: { id: process_id }
    });
    
    res.json({ success: true, message: 'Documents printed successfully' });
  } catch (error) {
    console.error('Print documents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
