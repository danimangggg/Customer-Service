const db = require('../../models');

// Mark ODN as available or unavailable
const markCustomerAvailable = async (req, res) => {
  try {
    const {
      process_id,
      store,
      marked_by_id,
      marked_by_name,
      notes,
      is_available
    } = req.body;

    console.log('=== Update ODN Availability Request ===');
    console.log('Request body:', req.body);
    console.log('Process ID:', process_id);
    console.log('Store:', store);
    console.log('Set available to:', is_available);

    if (!process_id || !store || is_available === undefined) {
      console.error('Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Process ID, store, and is_available are required'
      });
    }

    // Update all ODNs for this process and store
    console.log('Updating ODNs availability...');
    const result = await db.sequelize.query(
      `UPDATE odns_rdf 
       SET is_available = ?,
           availability_status = ?,
           available_at = ${is_available ? 'NOW()' : 'NULL'},
           marked_available_by_id = ?,
           marked_available_by_name = ?,
           updated_at = NOW()
       WHERE process_id = ? AND store = ?`,
      {
        replacements: [
          is_available,
          is_available ? 'available' : 'unavailable',
          marked_by_id,
          marked_by_name,
          process_id,
          store
        ],
        type: db.sequelize.QueryTypes.UPDATE
      }
    );
    
    console.log('Update result:', result);
    console.log(`✅ ODNs marked as ${is_available ? 'available' : 'unavailable'} successfully`);

    res.json({
      success: true,
      message: `ODNs marked as ${is_available ? 'available' : 'unavailable'}`
    });

  } catch (error) {
    console.error('❌ Error updating ODN availability:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to update ODN availability',
      details: error.message
    });
  }
};

// Get available customers for a specific store
const getAvailableCustomers = async (req, res) => {
  try {
    const { store } = req.query;

    if (!store) {
      return res.status(400).json({
        success: false,
        error: 'Store parameter is required'
      });
    }

    const query = `
      SELECT 
        ca.*,
        cq.facility_id,
        f.facility_name,
        f.region_name,
        f.woreda_name,
        f.zone_name
      FROM customer_availability ca
      INNER JOIN customer_queue cq ON ca.process_id = cq.id
      INNER JOIN facilities f ON cq.facility_id = f.id
      WHERE ca.store = ?
        AND ca.is_available = TRUE
        AND ca.availability_status IN ('available', 'in_progress')
      ORDER BY ca.available_at ASC
    `;

    const [results] = await db.sequelize.query(query, {
      replacements: [store],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error fetching available customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available customers',
      details: error.message
    });
  }
};

// Start service for a customer at a store
const startService = async (req, res) => {
  try {
    const {
      process_id,
      store,
      served_by_id,
      served_by_name
    } = req.body;

    await db.sequelize.query(
      `UPDATE customer_availability 
       SET availability_status = 'in_progress',
           service_started_at = NOW(),
           served_by_id = ?,
           served_by_name = ?,
           updated_at = NOW()
       WHERE process_id = ? AND store = ?`,
      {
        replacements: [served_by_id, served_by_name, process_id, store],
        type: db.sequelize.QueryTypes.UPDATE
      }
    );

    res.json({
      success: true,
      message: 'Service started'
    });

  } catch (error) {
    console.error('Error starting service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start service',
      details: error.message
    });
  }
};

// Complete service for a customer at a store
const completeService = async (req, res) => {
  try {
    const {
      process_id,
      store
    } = req.body;

    await db.sequelize.query(
      `UPDATE customer_availability 
       SET availability_status = 'completed',
           service_completed_at = NOW(),
           is_available = FALSE,
           updated_at = NOW()
       WHERE process_id = ? AND store = ?`,
      {
        replacements: [process_id, store],
        type: db.sequelize.QueryTypes.UPDATE
      }
    );

    res.json({
      success: true,
      message: 'Service completed'
    });

  } catch (error) {
    console.error('Error completing service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete service',
      details: error.message
    });
  }
};

// Get customer availability status across all stores
const getCustomerAvailabilityStatus = async (req, res) => {
  try {
    const { process_id } = req.params;

    const query = `
      SELECT *
      FROM customer_availability
      WHERE process_id = ?
      ORDER BY store ASC
    `;

    const [results] = await db.sequelize.query(query, {
      replacements: [process_id],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error fetching customer availability status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability status',
      details: error.message
    });
  }
};

// Get O2C completed customers with ODNs for a specific store
const getO2CCompletedByStore = async (req, res) => {
  try {
    const { store } = req.query;

    console.log('Fetching O2C completed customers for store:', store);

    if (!store) {
      return res.status(400).json({
        success: false,
        error: 'Store parameter is required'
      });
    }

    const query = `
      SELECT DISTINCT
        cq.id,
        cq.facility_id,
        cq.next_service_point,
        f.facility_name as actual_facility_name,
        f.region_name,
        f.woreda_name,
        f.zone_name,
        GROUP_CONCAT(odn.odn_number ORDER BY odn.odn_number SEPARATOR ', ') as odn_numbers,
        MAX(odn.is_available) as is_available
      FROM customer_queue cq
      INNER JOIN odns_rdf odn ON cq.id = odn.process_id
      LEFT JOIN facilities f ON cq.facility_id = f.id
      WHERE cq.status = 'o2c_completed'
        AND (cq.next_service_point = 'ewm' OR cq.next_service_point = 'EWM')
        AND odn.store = ?
      GROUP BY cq.id, cq.facility_id, cq.next_service_point, f.facility_name, f.region_name, f.woreda_name, f.zone_name
      ORDER BY cq.id DESC
    `;

    const customers = await db.sequelize.query(query, {
      replacements: [store],
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${customers.length} customers for store ${store}`);

    res.json({
      success: true,
      data: customers
    });

  } catch (error) {
    console.error('Error fetching O2C completed customers by store:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      details: error.message
    });
  }
};

module.exports = {
  markCustomerAvailable,
  getAvailableCustomers,
  startService,
  completeService,
  getCustomerAvailabilityStatus,
  getO2CCompletedByStore
};
