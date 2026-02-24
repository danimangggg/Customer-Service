const db = require("../../models");
const UpdateQueue = db.customerService;

const updateQueue = async (req, res) => {
  try {
    const updateData = {};
    
    // Only add fields that are provided and exist in the database
    if (req.body.next_service_point !== undefined) updateData.next_service_point = req.body.next_service_point;
    if (req.body.assigned_officer_id !== undefined) updateData.assigned_officer_id = req.body.assigned_officer_id;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.completed_at !== undefined) updateData.completed_at = req.body.completed_at;
    if (req.body.started_at !== undefined) updateData.started_at = req.body.started_at;
    
    // Add O2C tracking fields if provided
    if (req.body.o2c_started_at !== undefined) updateData.o2c_started_at = req.body.o2c_started_at;
    if (req.body.o2c_completed_at !== undefined) updateData.o2c_completed_at = req.body.o2c_completed_at;
    if (req.body.o2c_officer_id !== undefined) updateData.o2c_officer_id = req.body.o2c_officer_id;
    if (req.body.o2c_officer_name !== undefined) updateData.o2c_officer_name = req.body.o2c_officer_name;

    console.log('=== UPDATE QUEUE DEBUG ===');
    console.log('Request ID:', req.body.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const result = await UpdateQueue.update(updateData, {
      where: {
        id: req.body.id,
      },
    });

    console.log('Update result:', result);

    if (result[0] > 0) {
      res.status(200).send({ message: 'Service updated successfully' });
    } else {
      res.status(404).send({ message: 'Service not found' });
    }
  } catch (error) {
    console.error("=== UPDATE QUEUE ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    res.status(500).send({ message: error.message || 'Update failed', error: error.toString() });
  }
};

const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Only handle fields that exist in the database
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.next_service_point !== undefined) updateData.next_service_point = req.body.next_service_point;
    if (req.body.assigned_officer_id !== undefined) updateData.assigned_officer_id = req.body.assigned_officer_id;
    if (req.body.completed_at !== undefined) updateData.completed_at = req.body.completed_at;
    if (req.body.started_at !== undefined) updateData.started_at = req.body.started_at;
    
    // Exit Permit fields (Dispatch-Documentation)
    if (req.body.receipt_count !== undefined) updateData.receipt_count = req.body.receipt_count;
    if (req.body.vehicle_plate !== undefined) updateData.vehicle_plate = req.body.vehicle_plate;
    if (req.body.receipt_number !== undefined) updateData.receipt_number = req.body.receipt_number;
    if (req.body.total_amount !== undefined) updateData.total_amount = req.body.total_amount;
    if (req.body.measurement_unit !== undefined) updateData.measurement_unit = req.body.measurement_unit;
    if (req.body.assigned_gate_keeper_id !== undefined) updateData.assigned_gate_keeper_id = req.body.assigned_gate_keeper_id;
    if (req.body.assigned_gate_keeper_name !== undefined) updateData.assigned_gate_keeper_name = req.body.assigned_gate_keeper_name;
    
    // Gate Keeper fields
    if (req.body.gate_status !== undefined) updateData.gate_status = req.body.gate_status;
    if (req.body.gate_processed_at !== undefined) updateData.gate_processed_at = req.body.gate_processed_at;

    console.log('=== UPDATE SERVICE STATUS ===');
    console.log('Record ID:', id);
    console.log('Request body:', req.body);
    console.log('Update data to be saved:', updateData);

    const result = await UpdateQueue.update(updateData, {
      where: { id: id }
    });

    console.log('Update result (rows affected):', result);
    
    // Fetch and log the updated record to verify
    const updatedRecord = await UpdateQueue.findOne({ where: { id: id } });
    console.log('Updated record from DB:', {
      id: updatedRecord?.id,
      receipt_count: updatedRecord?.receipt_count,
      vehicle_plate: updatedRecord?.vehicle_plate,
      assigned_gate_keeper_id: updatedRecord?.assigned_gate_keeper_id,
      assigned_gate_keeper_name: updatedRecord?.assigned_gate_keeper_name,
      status: updatedRecord?.status
    });

    if (result[0] > 0) {
      res.status(200).send({ message: 'Service status updated successfully' });
    } else {
      res.status(404).send({ message: 'Service not found' });
    }
  } catch (error) {
    console.error("Update service status error:", error);
    res.status(500).send({ message: error.message || 'Failed to update service status' });
  }
};

module.exports = {
  updateQueue,
  updateServiceStatus
};
