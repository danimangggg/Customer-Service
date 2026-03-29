const db = require('../../models');

// Get ODNs with completed EWM status
const getEwmCompletedCustomers = async (req, res) => {
  try {
    const { store } = req.query;
    const branchCode = req.headers['x-branch-code'] || null;
    const accountType = req.headers['x-account-type'] || null;
    const effectiveBranch = accountType !== 'Super Admin' ? branchCode : null;
    const branchFilter = effectiveBranch ? `AND f.branch_code = '${effectiveBranch}'` : '';

    const query = `
      SELECT 
        odn.id as odn_id,
        odn.process_id,
        odn.odn_number,
        s.store_name as store,
        odn.ewm_status,
        odn.ewm_completed_at,
        odn.next_service_point,
        cq.facility_id,
        cq.customer_type,
        f.facility_name as customer_name,
        f.region_name,
        f.zone_name,
        f.woreda_name,
        inv.id as invoice_id,
        inv.invoice_number,
        inv.invoice_date,
        inv.folder_number,
        inv.received,
        inv.received_by,
        inv.received_at,
        inv.returned,
        inv.returned_by,
        inv.returned_at
      FROM odns_rdf odn
      INNER JOIN customer_queue cq ON odn.process_id = cq.id
      INNER JOIN facilities f ON cq.facility_id = f.id
      LEFT JOIN stores s ON odn.store_id = s.id
      LEFT JOIN invoices inv ON inv.odn_number = odn.odn_number AND inv.process_id = odn.process_id
      WHERE odn.ewm_status = 'completed'
        ${store ? `AND s.store_name = ?` : ''}
        ${branchFilter}
      ORDER BY odn.ewm_completed_at DESC, odn.odn_number ASC
    `;

    const replacements = store ? [store] : [];
    const results = await db.sequelize.query(query, { replacements, type: db.sequelize.QueryTypes.SELECT });
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching EWM completed ODNs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ODNs', details: error.message });
  }
};

// Save invoice
const saveInvoice = async (req, res) => {
  try {
    const {
      process_id,
      odn_number,
      invoice_number,
      invoice_date,
      customer_name,
      store,
      created_by_id,
      created_by_name
    } = req.body;

    console.log('Saving invoice:', { process_id, odn_number, invoice_number });

    // Check if invoice already exists for this ODN
    const [existing] = await db.sequelize.query(
      'SELECT * FROM invoices WHERE odn_number = ? AND process_id = ?',
      {
        replacements: [odn_number, process_id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (existing) {
      // Update existing invoice
      await db.sequelize.query(
        `UPDATE invoices 
         SET invoice_number = ?, invoice_date = ?, updated_at = NOW()
         WHERE odn_number = ? AND process_id = ?`,
        {
          replacements: [invoice_number, invoice_date, odn_number, process_id],
          type: db.sequelize.QueryTypes.UPDATE
        }
      );
      
      console.log('Invoice updated successfully');
      res.json({
        success: true,
        message: 'Invoice updated successfully'
      });
    } else {
      // Insert new invoice
      await db.sequelize.query(
        `INSERT INTO invoices 
         (process_id, odn_number, invoice_number, invoice_date, customer_name, store, created_by_id, created_by_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            process_id,
            odn_number,
            invoice_number,
            invoice_date,
            customer_name,
            store,
            created_by_id,
            created_by_name
          ],
          type: db.sequelize.QueryTypes.INSERT
        }
      );
      
      console.log('Invoice saved successfully');
      res.json({
        success: true,
        message: 'Invoice saved successfully'
      });
    }
    
  } catch (error) {
    console.error('Error saving invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save invoice',
      details: error.message
    });
  }
};

// Get all invoices with filtering
const getInvoices = async (req, res) => {
  try {
    const { store, startDate, endDate, search } = req.query;
    const branchCode = req.headers['x-branch-code'] || null;
    const accountType = req.headers['x-account-type'] || null;
    const effectiveBranch = accountType !== 'Super Admin' ? branchCode : null;

    let whereConditions = [];
    let replacements = [];

    if (store) { whereConditions.push('inv.store = ?'); replacements.push(store); }
    if (startDate) { whereConditions.push('inv.invoice_date >= ?'); replacements.push(startDate); }
    if (endDate) { whereConditions.push('inv.invoice_date <= ?'); replacements.push(endDate); }
    if (search) {
      whereConditions.push('(inv.invoice_number LIKE ? OR inv.odn_number LIKE ? OR inv.customer_name LIKE ?)');
      replacements.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (effectiveBranch) { whereConditions.push('f.branch_code = ?'); replacements.push(effectiveBranch); }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const query = `
      SELECT inv.*, cq.facility_id, cq.customer_type,
        f.facility_name, f.region_name, f.zone_name, f.woreda_name
      FROM invoices inv
      LEFT JOIN customer_queue cq ON inv.process_id = cq.id
      LEFT JOIN facilities f ON cq.facility_id = f.id
      ${whereClause}
      ORDER BY inv.invoice_date DESC, inv.created_at DESC
    `;

    const results = await db.sequelize.query(query, { replacements, type: db.sequelize.QueryTypes.SELECT });
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices', details: error.message });
  }
};

// Finance: mark invoice as received
const markReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { received_by } = req.body;
    await db.sequelize.query(
      `UPDATE invoices SET received = 1, received_by = ?, received_at = NOW(), returned = 0, updated_at = NOW() WHERE id = ?`,
      { replacements: [received_by, id], type: db.sequelize.QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// EWM Documentation: return (undo) received
const returnReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { returned_by } = req.body;
    await db.sequelize.query(
      `UPDATE invoices SET received = 0, returned = 1, returned_by = ?, returned_at = NOW(), updated_at = NOW() WHERE id = ?`,
      { replacements: [returned_by, id], type: db.sequelize.QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Save folder number
const saveFolderNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { folder_number } = req.body;
    await db.sequelize.query(
      `UPDATE invoices SET folder_number = ?, updated_at = NOW() WHERE id = ?`,
      { replacements: [folder_number, id], type: db.sequelize.QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get HP processes completed by documentation (for Finance HP tab)
const getHPDocumentationCompleted = async (req, res) => {
  try {
    const { search, month, year, received } = req.query;
    const branchCode = req.headers['x-account-type'] !== 'Super Admin' ? (req.headers['x-branch-code'] || null) : null;

    let conditions = [`p.status IN ('documentation_completed', 'finance_received')`];
    if (branchCode) conditions.push(`f.branch_code = '${branchCode}'`);
    const replacements = [];

    if (month && year) {
      conditions.push(`p.reporting_month = ?`);
      replacements.push(`${month} ${year}`);
    }
    if (search) {
      conditions.push(`(f.facility_name LIKE ? OR o.odn_number LIKE ? OR o.pod_number LIKE ?)`);
      replacements.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = conditions.filter(Boolean).join(' AND ');

    // received filter goes in HAVING (post-aggregation) to avoid row-level join issues
    const havingClauses = [];
    if (received === 'yes') havingClauses.push(`MAX(inv.received) = 1`);
    if (received === 'no') havingClauses.push(`(MAX(inv.received) IS NULL OR MAX(inv.received) = 0)`);
    const having = havingClauses.length > 0 ? `HAVING ${havingClauses.join(' AND ')}` : '';

    const query = `
      SELECT
        p.id as process_id,
        p.reporting_month,
        p.process_type,
        p.driver_name,
        p.deliverer_name,
        p.vehicle_name,
        f.facility_name,
        f.region_name, f.zone_name, f.woreda_name,
        r.route_name,
        GROUP_CONCAT(DISTINCT o.odn_number ORDER BY o.odn_number SEPARATOR ', ') as odn_numbers,
        GROUP_CONCAT(DISTINCT o.pod_number ORDER BY o.pod_number SEPARATOR ', ') as pod_numbers,
        MAX(o.pod_confirmed_at) as pod_confirmed_at,
        MAX(e.full_name) as submitted_by,
        MAX(inv.id) as invoice_id,
        MAX(inv.folder_number) as folder_number,
        MAX(inv.received) as received,
        MAX(inv.received_by) as received_by,
        MAX(inv.received_at) as received_at,
        MAX(inv.returned) as returned,
        MAX(inv.returned_by) as returned_by,
        MAX(inv.returned_at) as returned_at
      FROM processes p
      INNER JOIN odns o ON o.process_id = p.id
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      LEFT JOIN employees e ON o.pod_confirmed_by = e.id
      LEFT JOIN invoices inv ON inv.process_id = p.id
      WHERE ${where}
      GROUP BY p.id, p.reporting_month, p.process_type, p.driver_name, p.deliverer_name, p.vehicle_name,
               f.facility_name, f.region_name, f.zone_name, f.woreda_name, r.route_name
      ${having}
      ORDER BY pod_confirmed_at DESC
    `;

    const results = await db.sequelize.query(query, { replacements, type: db.sequelize.QueryTypes.SELECT });

    // Debug: log to verify folder_number is coming through
    if (results.length > 0) {
      console.log('[HP Finance] process_id:', results[0].process_id, '| folder_number:', results[0].folder_number, '| invoice_id:', results[0].invoice_id);
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching HP documentation completed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark HP invoice as received (reuse same invoices table, just with pod_number as identifier)
const markHPReceived = async (req, res) => {
  try {
    const { process_id, received_by } = req.body;
    const [existing] = await db.sequelize.query(
      'SELECT id FROM invoices WHERE process_id = ? ORDER BY id DESC LIMIT 1',
      { replacements: [process_id], type: db.sequelize.QueryTypes.SELECT }
    );
    if (existing) {
      await db.sequelize.query(
        `UPDATE invoices SET received = 1, received_by = ?, received_at = NOW(), returned = 0, updated_at = NOW() WHERE id = ?`,
        { replacements: [received_by, existing.id], type: db.sequelize.QueryTypes.UPDATE }
      );
    } else {
      await db.sequelize.query(
        `INSERT INTO invoices (process_id, odn_number, invoice_number, invoice_date, received, received_by, received_at, created_at, updated_at)
         VALUES (?, 'N/A', 'N/A', CURDATE(), 1, ?, NOW(), NOW(), NOW())`,
        { replacements: [process_id, received_by], type: db.sequelize.QueryTypes.INSERT }
      );
    }

    // Mark process as finance_received — this is the true completion point
    await db.sequelize.query(
      `UPDATE processes SET status = 'finance_received', finance_received_at = NOW() WHERE id = ?`,
      { replacements: [process_id], type: db.sequelize.QueryTypes.UPDATE }
    );

    // Record service time — finance received = end of waiting time
    try {
      await db.sequelize.query(
        `INSERT INTO service_time_hp (process_id, service_unit, end_time, officer_id, officer_name, status, notes)
         VALUES (?, 'Finance - Document Received', NOW(), NULL, ?, 'completed', 'Document received by finance')`,
        { replacements: [process_id, received_by], type: db.sequelize.QueryTypes.INSERT }
      );
    } catch (e) { console.error('Service time error:', e); }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Save folder number for HP
const saveHPFolderNumber = async (req, res) => {
  try {
    const { process_id, folder_number } = req.body;
    console.log('[saveHPFolderNumber] process_id:', process_id, '| folder_number:', folder_number);
    const [existing] = await db.sequelize.query(
      'SELECT id FROM invoices WHERE process_id = ? ORDER BY id DESC LIMIT 1',
      { replacements: [process_id], type: db.sequelize.QueryTypes.SELECT }
    );
    console.log('[saveHPFolderNumber] existing invoice row:', existing);
    if (existing) {
      await db.sequelize.query(
        `UPDATE invoices SET folder_number = ?, updated_at = NOW() WHERE id = ?`,
        { replacements: [folder_number, existing.id], type: db.sequelize.QueryTypes.UPDATE }
      );
      console.log('[saveHPFolderNumber] updated invoice id:', existing.id);
    } else {
      await db.sequelize.query(
        `INSERT INTO invoices (process_id, odn_number, invoice_number, invoice_date, folder_number, created_at, updated_at)
         VALUES (?, 'N/A', 'N/A', CURDATE(), ?, NOW(), NOW())`,
        { replacements: [process_id, folder_number], type: db.sequelize.QueryTypes.INSERT }
      );
      console.log('[saveHPFolderNumber] inserted new invoice row');
    }
    res.json({ success: true });
  } catch (error) {
    console.error('saveHPFolderNumber error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update pod_number on an ODN (for HP history edit)
const updateOdnPodNumber = async (req, res) => {
  try {
    const { odn_id } = req.params;
    const { pod_number } = req.body;
    await db.sequelize.query(
      `UPDATE odns SET pod_number = ? WHERE id = ?`,
      { replacements: [pod_number, odn_id], type: db.sequelize.QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getEwmCompletedCustomers,
  saveInvoice,
  getInvoices,
  markReceived,
  returnReceived,
  saveFolderNumber,
  getHPDocumentationCompleted,
  markHPReceived,
  saveHPFolderNumber,
  updateOdnPodNumber
};
