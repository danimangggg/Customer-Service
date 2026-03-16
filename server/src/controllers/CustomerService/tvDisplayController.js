const db = require("../../models");
const { Sequelize } = require('sequelize');

// Get customers for TV display with ODN-based store assignments
const getTvDisplayCustomers = async (req, res) => {
  try {
    // Check if we should include completed customers
    const includeCompleted = req.query.includeCompleted === 'true';
    
    // For documentation report (completed), show exit history if available, otherwise fall back to customer_queue data
    if (includeCompleted) {
      // Get data from exit_history (new records with exit tracking)
      const exitHistoryQuery = `
        SELECT 
          eh.id as exit_history_id,
          eh.process_id,
          eh.store_id,
          eh.exit_number,
          eh.vehicle_plate,
          eh.total_amount,
          eh.measurement_unit,
          eh.receipt_count,
          eh.receipt_number,
          eh.gate_keeper_name,
          eh.exit_type,
          eh.exited_at,
          cq.facility_id,
          f.facility_name,
          cq.customer_type,
          cq.status,
          cq.started_at,
          cq.completed_at,
          eh.store_id as store_name,
          GROUP_CONCAT(odn.odn_number ORDER BY odn.odn_number SEPARATOR ', ') as odn_numbers
        FROM exit_history eh
        INNER JOIN customer_queue cq ON eh.process_id = cq.id
        INNER JOIN odns_rdf odn ON cq.id = odn.process_id
        INNER JOIN stores s ON odn.store_id = s.id AND s.store_name = eh.store_id
        LEFT JOIN facilities f ON cq.facility_id = f.id
        GROUP BY eh.id, eh.process_id, eh.store_id, eh.exit_number,
                 eh.vehicle_plate, eh.total_amount, eh.measurement_unit,
                 eh.receipt_count, eh.receipt_number, eh.gate_keeper_name,
                 eh.exit_type, eh.exited_at, cq.facility_id, f.facility_name,
                 cq.customer_type, cq.status, cq.started_at, cq.completed_at
        ORDER BY eh.exited_at DESC
      `;

      const [exitHistoryResults] = await db.sequelize.query(exitHistoryQuery);

      // Get old completed records that don't have exit_history (for backward compatibility)
      const fallbackQuery = `
        SELECT 
          cq.id,
          cq.facility_id,
          f.facility_name,
          cq.vehicle_plate,
          cq.total_amount,
          cq.measurement_unit,
          cq.receipt_count,
          cq.receipt_number,
          cq.customer_type,
          cq.status,
          cq.started_at,
          cq.completed_at,
          odn.store_id,
          s.store_name,
          GROUP_CONCAT(odn.odn_number ORDER BY odn.odn_number SEPARATOR ', ') as odn_numbers,
          MAX(odn.gate_processed_by_name) as gate_processed_by_name,
          MAX(odn.gate_processed_at) as gate_processed_at
        FROM customer_queue cq
        INNER JOIN odns_rdf odn ON cq.id = odn.process_id
        INNER JOIN stores s ON odn.store_id = s.id
        LEFT JOIN facilities f ON cq.facility_id = f.id
        WHERE cq.status = 'completed'
          AND NOT EXISTS (
            SELECT 1 FROM exit_history eh 
            WHERE eh.process_id = cq.id AND eh.store_id = s.store_name
          )
        GROUP BY cq.id, odn.store_id, cq.facility_id, f.facility_name, 
                 cq.vehicle_plate, cq.total_amount, cq.measurement_unit,
                 cq.receipt_count, cq.receipt_number, cq.customer_type,
                 cq.status, cq.started_at, cq.completed_at, s.store_name
        ORDER BY cq.started_at DESC
      `;

      const [fallbackResults] = await db.sequelize.query(fallbackQuery);

      // Transform exit_history results
      const exitHistoryTransformed = exitHistoryResults.map(row => ({
        id: `exit_${row.exit_history_id}`,
        process_id: row.process_id,
        facility_id: row.facility_id,
        facility_name: row.facility_name,
        customer_type: row.customer_type,
        status: row.status,
        started_at: row.started_at,
        completed_at: row.completed_at,
        exit_number: row.exit_number,
        exit_type: row.exit_type,
        vehicle_plate: row.vehicle_plate,
        total_amount: row.total_amount,
        measurement_unit: row.measurement_unit,
        receipt_count: row.receipt_count,
        receipt_number: row.receipt_number,
        assigned_gate_keeper_name: row.gate_keeper_name || 'Security',
        gate_processed_at: row.exited_at,
        store_name: row.store_name,
        odn_number: row.odn_numbers,
        assigned_stores: [row.store_name]
      }));

      // Transform fallback results (old records without exit_history)
      const fallbackTransformed = fallbackResults.map(row => ({
        id: `${row.id}_${row.store_id}`,
        process_id: row.id,
        facility_id: row.facility_id,
        facility_name: row.facility_name,
        vehicle_plate: row.vehicle_plate,
        total_amount: row.total_amount,
        measurement_unit: row.measurement_unit,
        receipt_count: row.receipt_count,
        receipt_number: row.receipt_number,
        customer_type: row.customer_type,
        status: row.status,
        started_at: row.started_at,
        completed_at: row.completed_at,
        exit_number: 1,
        exit_type: 'full',
        store_name: row.store_name,
        odn_number: row.odn_numbers,
        assigned_gate_keeper_name: row.gate_processed_by_name || 'Security',
        gate_processed_at: row.gate_processed_at,
        assigned_stores: [row.store_name]
      }));

      // Combine both results
      const allResults = [...exitHistoryTransformed, ...fallbackTransformed];

      return res.status(200).json(allResults);
    }
    
    // For active customers (TV display), group by customer
    const whereClause = `WHERE cq.status != 'completed' 
         AND cq.status != 'canceled'
         AND cq.status != 'rejected'`;
    
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
            COALESCE(odn.gate_status, 'pending'), ':',
            COALESCE(odn.gate_processed_by_name, '')
          )
          ORDER BY s.store_name
          SEPARATOR '|'
        ) as store_details
      FROM customer_queue cq
      LEFT JOIN odns_rdf odn ON cq.id = odn.process_id
      LEFT JOIN stores s ON odn.store_id = s.id
      ${whereClause}
      GROUP BY cq.id
      ORDER BY cq.started_at ASC
    `;

    const [results] = await db.sequelize.query(query);

    // Transform the data to include store-specific status information
    const transformedResults = results.map(customer => {
      const storeDetails = {};
      const allGateKeepers = [];
      
      if (customer.store_details) {
        const details = customer.store_details.split('|');
        details.forEach(detail => {
          const [store, odnNumber, ewmStatus, dispatchStatus, exitPermitStatus, gateStatus, gateKeeperName] = detail.split(':');
          if (!storeDetails[store]) {
            storeDetails[store] = {
              odns: [],
              ewm_status: ewmStatus || 'pending',
              dispatch_status: dispatchStatus || 'pending',
              exit_permit_status: exitPermitStatus || 'pending',
              gate_status: gateStatus || 'pending',
              gate_keeper_name: gateKeeperName || ''
            };
          }
          storeDetails[store].odns.push(odnNumber);
          
          // Collect gate keeper names
          if (gateKeeperName && gateKeeperName.trim() !== '') {
            if (!allGateKeepers.includes(gateKeeperName)) {
              allGateKeepers.push(gateKeeperName);
            }
          }
        });
      }

      return {
        ...customer,
        store_details: storeDetails,
        assigned_stores: customer.assigned_stores ? customer.assigned_stores.split(',') : [],
        all_gate_keepers: allGateKeepers.join(', ') || customer.assigned_gate_keeper_name || 'Security'
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
