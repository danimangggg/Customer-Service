const db = require("../../models");
const { Sequelize } = require('sequelize');

// Get customers for TV display with ODN-based store assignments
const getTvDisplayCustomers = async (req, res) => {
  try {
    const query = `
      SELECT 
        cq.*,
        GROUP_CONCAT(DISTINCT s.store_name ORDER BY s.store_name) as assigned_stores,
        GROUP_CONCAT(
          CONCAT(
            s.store_name, ':', 
            odn.odn_number, ':', 
            COALESCE(odn.ewm_status, 'pending'), ':', 
            COALESCE(odn.dispatch_status, 'pending'), ':',
            COALESCE(odn.exit_permit_status, 'pending'), ':',
            COALESCE(odn.gate_status, 'pending')
          )
          ORDER BY s.store_name
          SEPARATOR '|'
        ) as store_details
      FROM customer_queue cq
      LEFT JOIN odns_rdf odn ON cq.id = odn.process_id
      LEFT JOIN stores s ON odn.store_id = s.id
      WHERE cq.status != 'completed' 
        AND cq.status != 'canceled'
        AND cq.status != 'rejected'
      GROUP BY cq.id
      ORDER BY cq.started_at ASC
    `;

    const [results] = await db.sequelize.query(query);

    // Transform the data to include store-specific status information
    const transformedResults = results.map(customer => {
      const storeDetails = {};
      
      if (customer.store_details) {
        const details = customer.store_details.split('|');
        details.forEach(detail => {
          const [store, odnNumber, ewmStatus, dispatchStatus, exitPermitStatus, gateStatus] = detail.split(':');
          if (!storeDetails[store]) {
            storeDetails[store] = {
              odns: [],
              ewm_status: ewmStatus || 'pending',
              dispatch_status: dispatchStatus || 'pending',
              exit_permit_status: exitPermitStatus || 'pending',
              gate_status: gateStatus || 'pending'
            };
          }
          storeDetails[store].odns.push(odnNumber);
        });
      }

      return {
        ...customer,
        store_details: storeDetails,
        assigned_stores: customer.assigned_stores ? customer.assigned_stores.split(',') : []
      };
    });

    res.status(200).json(transformedResults);
  } catch (error) {
    console.error('Error fetching TV display customers:', error);
    res.status(500).json({ 
      message: 'Failed to fetch TV display customers',
      error: error.message 
    });
  }
};

module.exports = {
  getTvDisplayCustomers
};
