const db = require('../../models');
const { Op } = require('sequelize');
const Process = db.process;
const Facility = db.facility;

// Get processes ready for goods issue (TM confirmed)
exports.getGoodsIssueProcesses = async (req, res) => {
  try {
    const { month, year, process_type = 'regular' } = req.query;
    const branchCode = req.headers['x-branch-code'] || null;
    const accountType = req.headers['x-account-type'] || null;
    const facilityWhere = (accountType !== 'Super Admin' && branchCode)
      ? { branch_code: branchCode }
      : {};

    const whereClause = { status: 'freight_order_sent_to_ewm', process_type };
    if (process_type === 'regular') {
      whereClause.reporting_month = `${month} ${year}`;
    }

    const processes = await Process.findAll({
      where: whereClause,
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['id', 'facility_name', 'region_name', 'route'],
        where: Object.keys(facilityWhere).length ? facilityWhere : undefined,
        required: Object.keys(facilityWhere).length > 0
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
    
    // Record service time for EWM Phase 2 - Goods Issue
    try {
      // ALWAYS fetch officer name from employees table
      let finalOfficerName = 'Unknown Officer';
      if (ewm_officer_id) {
        try {
          const employeeQuery = `SELECT full_name FROM employees WHERE id = ?`;
          const [employee] = await db.sequelize.query(employeeQuery, {
            replacements: [ewm_officer_id],
            type: db.sequelize.QueryTypes.SELECT
          });
          if (employee && employee.full_name) {
            finalOfficerName = employee.full_name;
          }
        } catch (err) {
          console.error('Failed to fetch EWM officer name:', err);
        }
      }
      
      // Calculate waiting time from TM confirmation
      let waitingMinutes = 0;
      try {
        const lastServiceQuery = `
          SELECT end_time 
          FROM service_time_hp
          WHERE process_id = ? AND service_unit LIKE '%TM%'
          ORDER BY created_at DESC 
          LIMIT 1
        `;
        
        const [lastService] = await db.sequelize.query(lastServiceQuery, {
          replacements: [process_id],
          type: db.sequelize.QueryTypes.SELECT
        });
        
        if (lastService && lastService.end_time) {
          const prevTime = new Date(lastService.end_time);
          const currTime = new Date();
          const diffMs = currTime - prevTime;
          waitingMinutes = Math.floor(diffMs / 60000);
          waitingMinutes = waitingMinutes > 0 ? waitingMinutes : 0;
        }
      } catch (err) {
        console.error('Failed to calculate EWM Phase 2 waiting time:', err);
      }
      
      const insertQuery = `
        INSERT INTO service_time_hp 
        (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
        VALUES (?, ?, NOW(), ?, ?, ?, ?)
      `;
      
      await db.sequelize.query(insertQuery, {
        replacements: [
          process_id,
          'EWM - Goods Issue',
          ewm_officer_id,
          finalOfficerName,
          'completed',
          `EWM Phase 2 completed, waiting time: ${waitingMinutes} minutes`
        ],
        type: db.sequelize.QueryTypes.INSERT
      });
      
      console.log(`✅ EWM Phase 2 service time recorded: ${waitingMinutes} minutes`);
    } catch (err) {
      console.error('❌ Failed to record EWM Phase 2 service time:', err);
      // Don't fail the completion if service time recording fails
    }
    
    res.json({ success: true, message: 'Goods issued successfully' });
  } catch (error) {
    console.error('Issue goods error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
