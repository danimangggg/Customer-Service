
const db = require("../../models");
const Queue = db.customerService;

const retriveQueue = async (req, res) => {
  try {
    console.log('Fetching customer queue data...');
    
    // Get user's store from query params if provided (for EWM officers)
    const userStore = req.query.store;
    
    let query, replacements;
    
    if (userStore) {
      // For EWM officers - join with odns_rdf for their store to get availability
      // Convert store name to store_id
      const [storeResult] = await db.sequelize.query(
        'SELECT id FROM stores WHERE store_name = ?',
        { replacements: [userStore], type: db.sequelize.QueryTypes.SELECT }
      );
      
      const storeId = storeResult ? storeResult.id : null;
      
      query = `
        SELECT 
          cq.*,
          GROUP_CONCAT(DISTINCT odn.odn_number ORDER BY odn.odn_number SEPARATOR ', ') as odn_numbers,
          MAX(odn.is_available) as is_available,
          MAX(odn.availability_status) as availability_status,
          MAX(odn.available_at) as available_at
        FROM customer_queue cq
        LEFT JOIN odns_rdf odn ON cq.id = odn.process_id AND odn.store_id = ?
        GROUP BY cq.id
        ORDER BY cq.started_at DESC
      `;
      replacements = [storeId];
    } else {
      // For other users - just get customer_queue data
      query = `
        SELECT cq.*
        FROM customer_queue cq
        ORDER BY cq.started_at DESC
      `;
      replacements = [];
    }
    
    const data = await db.sequelize.query(query, {
      replacements: replacements,
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`Found ${data.length} records in customer queue`);
    
    res.json(data);
  } catch (error) {
    console.error('Database error in retriveQueue:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return proper error response
    res.status(500).json({
      error: 'Database connection failed',
      message: 'Unable to fetch customer queue data',
      details: error.message
    });
  }
};

module.exports = {
  retriveQueue
};