const db = require('../../models');

const saveCrossDocking = async (req, res) => {
  try {
    const { region_name, zone_name, woreda_name, facility_id, facility_name,
            odn_number, invoice_number, invoice_date, store, created_by_id, created_by_name } = req.body;

    if (!facility_id || !odn_number || !invoice_number) {
      return res.status(400).json({ success: false, error: 'facility, ODN number, and invoice number are required' });
    }

    const replacements = [
      facility_id, facility_name || null, odn_number, invoice_number,
      invoice_date || new Date().toISOString().split('T')[0],
      store || null, created_by_id || null, created_by_name || null
    ];

    await db.sequelize.query(
      `INSERT INTO invoices (facility_id, customer_name, odn_number, invoice_number, invoice_date,
        store, created_by_id, created_by_name, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cross_docking')`,
      { replacements, type: db.sequelize.QueryTypes.INSERT }
    );

    res.json({ success: true, message: 'Cross-docking record saved' });
  } catch (error) {
    console.error('saveCrossDocking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCrossDocking = async (req, res) => {
  try {
    const { store } = req.query;
    const branchCode = req.headers['x-branch-code'] || null;
    const accountType = req.headers['x-account-type'] || null;
    const effectiveBranch = accountType !== 'Super Admin' ? branchCode : null;

    let where = `WHERE inv.type = 'cross_docking'`;
    const replacements = [];

    if (store) { where += ` AND inv.store = ?`; replacements.push(store); }
    if (effectiveBranch) { where += ` AND f.branch_code = ?`; replacements.push(effectiveBranch); }

    const rows = await db.sequelize.query(
      `SELECT inv.*, f.facility_name as fac_name, f.woreda_name, f.zone_name, f.region_name
       FROM invoices inv
       LEFT JOIN facilities f ON f.id = inv.facility_id
       ${where} ORDER BY inv.created_at DESC`,
      { replacements, type: db.sequelize.QueryTypes.SELECT }
    );

    // Use facility_name from facilities table if available
    const data = rows.map(r => ({
      ...r,
      facility_name: r.fac_name || r.customer_name || r.facility_name
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('getCrossDocking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const markCrossDockingReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { received_by } = req.body;
    await db.sequelize.query(
      `UPDATE invoices SET received = 1, received_by = ?, received_at = NOW() WHERE id = ? AND type = 'cross_docking'`,
      { replacements: [received_by, id], type: db.sequelize.QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const saveCrossDockingFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { folder_number } = req.body;
    await db.sequelize.query(
      `UPDATE invoices SET folder_number = ? WHERE id = ? AND type = 'cross_docking'`,
      { replacements: [folder_number, id], type: db.sequelize.QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const editCrossDocking = async (req, res) => {
  try {
    const { id } = req.params;
    const { odn_number, invoice_number, invoice_date } = req.body;
    await db.sequelize.query(
      `UPDATE invoices SET odn_number = ?, invoice_number = ?, invoice_date = ? WHERE id = ? AND type = 'cross_docking'`,
      { replacements: [odn_number, invoice_number, invoice_date, id], type: db.sequelize.QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { saveCrossDocking, getCrossDocking, markCrossDockingReceived, saveCrossDockingFolder, editCrossDocking };
