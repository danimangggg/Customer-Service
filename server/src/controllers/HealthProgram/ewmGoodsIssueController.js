const db = require('../../models');
const Process = db.process;
const Facility = db.facility;

// Get processes ready for goods issue (freight order received from TM)
exports.getGoodsIssueProcesses = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const processes = await Process.findAll({
      where: {
        status: 'freight_order_sent_to_ewm',
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
    console.error('Get goods issue processes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Issue goods
exports.issueGoods = async (req, res) => {
  try {
    const { process_id, ewm_officer_id, ewm_officer_name } = req.body;
    
    await Process.update({
      ewm_goods_issued_at: new Date(),
      ewm_goods_issued_by_id: ewm_officer_id,
      ewm_goods_issued_by_name: ewm_officer_name,
      status: 'ewm_goods_issued'
    }, {
      where: { id: process_id }
    });
    
    res.json({ success: true, message: 'Goods issued successfully' });
  } catch (error) {
    console.error('Issue goods error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
