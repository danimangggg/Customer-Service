
const db = require("../../models");
const Queue = db.customerService;

const retriveQueue = async (req, res) => {
  try {
    console.log('Fetching customer queue data...');
    
    // Get user's store from query params if provided (for EWM officers)
    const userStore = req.query.store;

    // Branch filtering — read from header (logged-in users) or query param (TV displays)
    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const queryBranch  = req.query.branch_code || null;
    const branchCode   = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
    const branchFilter = branchCode ? `AND s.branch_code = '${branchCode}'` : '';
    const branchFilterCq = branchCode ? `AND EXISTS (SELECT 1 FROM facilities f WHERE f.id = cq.facility_id AND f.branch_code = '${branchCode}')` : '';

    let query, replacements;
    
    if (userStore) {
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
        WHERE 1=1 ${branchFilterCq}
        GROUP BY cq.id
        ORDER BY cq.started_at DESC
      `;
      replacements = [storeId];
    } else {
      query = `
        SELECT cq.*
        FROM customer_queue cq
        WHERE 1=1 ${branchFilterCq}
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