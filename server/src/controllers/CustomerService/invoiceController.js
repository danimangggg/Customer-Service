const db = require('../../models');

// Get ODNs with completed EWM status
const getEwmCompletedCustomers = async (req, res) => {
  try {
    const { store } = req.query;
    
    console.log('=== FETCHING EWM COMPLETED ODNs ===');
    console.log('Store filter:', store);
    
    // Query to get ODNs with EWM completed status
    const query = `
      SELECT 
        odn.id as odn_id,
        odn.process_id,
        odn.odn_number,
        odn.store,
        odn.ewm_status,
        odn.ewm_completed_at,
        odn.next_service_point,
        cq.facility_id,
        f.facility_name as customer_name,
        f.region_name,
        f.woreda_name,
        inv.id as invoice_id,
        inv.invoice_number,
        inv.invoice_date
      FROM odns_rdf odn
      INNER JOIN customer_queue cq ON odn.process_id = cq.id
      INNER JOIN facilities f ON cq.facility_id = f.id
      LEFT JOIN invoices inv ON inv.odn_number = odn.odn_number AND inv.process_id = odn.process_id
      WHERE odn.ewm_status = 'completed'
        ${store ? `AND odn.store = ?` : ''}
      ORDER BY odn.ewm_completed_at DESC, odn.odn_number ASC
    `;

    console.log('Executing query...');
    const replacements = store ? [store] : [];
    const [results] = await db.sequelize.query(query, { replacements });
    
    console.log(`Found ${results.length} ODNs with completed EWM status`);
    
    if (results.length > 0) {
      console.log('Sample result:', JSON.stringify(results[0], null, 2));
    } else {
      console.log('No results found. This could mean:');
      console.log('1. No ODNs have ewm_status = completed');
      console.log('2. Store filter is excluding all results');
      console.log('3. ODNs table needs to be updated with status fields');
    }
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('=== ERROR FETCHING EWM COMPLETED ODNs ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('SQL:', error.sql);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ODNs',
      details: error.message,
      sql: error.sql
    });
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
    const { 
      store, 
      startDate, 
      endDate, 
      search 
    } = req.query;
    
    let whereConditions = [];
    let replacements = [];
    
    if (store) {
      whereConditions.push('inv.store = ?');
      replacements.push(store);
    }
    
    if (startDate) {
      whereConditions.push('inv.invoice_date >= ?');
      replacements.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('inv.invoice_date <= ?');
      replacements.push(endDate);
    }
    
    if (search) {
      whereConditions.push('(inv.invoice_number LIKE ? OR inv.odn_number LIKE ? OR inv.customer_name LIKE ?)');
      replacements.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    const query = `
      SELECT 
        inv.*,
        cq.facility_id,
        f.region_name,
        f.woreda_name
      FROM invoices inv
      LEFT JOIN customer_queue cq ON inv.process_id = cq.id
      LEFT JOIN facilities f ON cq.facility_id = f.id
      ${whereClause}
      ORDER BY inv.invoice_date DESC, inv.created_at DESC
    `;
    
    const [results] = await db.sequelize.query(query, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices',
      details: error.message
    });
  }
};

module.exports = {
  getEwmCompletedCustomers,
  saveInvoice,
  getInvoices
};
