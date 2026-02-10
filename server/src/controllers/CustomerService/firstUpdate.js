const db = require("../../models");
const UpdateQueue = db.customerService;

const updateQueue = async (req, res) => {
  try {
    const updateData = {
      next_service_point: req.body.next_service_point,
      assigned_officer_id: req.body.assigned_officer_id,
      status: req.body.status,
      completed_at: req.body.completed_at,
      aa1_odn: req.body.aa1_odn,
      aa2_odn: req.body.aa2_odn,
      aa3_odn: req.body.aa3_odn,
      store_id_1: req.body.store_id_1,
      store_id_2: req.body.store_id_2,
      store_id_3: req.body.store_id_3,
      store_completed_1: req.body.store_completed_1,
      store_completed_2: req.body.store_completed_2,
      store_completed_3: req.body.store_completed_3,
      availability_aa1: req.body.availability_aa1,
      availability_aa2: req.body.availability_aa2,
    };
    
    // Add O2C tracking fields if provided
    if (req.body.o2c_started_at !== undefined) updateData.o2c_started_at = req.body.o2c_started_at;
    if (req.body.o2c_completed_at !== undefined) updateData.o2c_completed_at = req.body.o2c_completed_at;
    if (req.body.o2c_officer_id !== undefined) updateData.o2c_officer_id = req.body.o2c_officer_id;
    if (req.body.o2c_officer_name !== undefined) updateData.o2c_officer_name = req.body.o2c_officer_name;
    
    // Add EWM tracking fields if provided
    if (req.body.ewm_started_at !== undefined) updateData.ewm_started_at = req.body.ewm_started_at;
    if (req.body.ewm_completed_at !== undefined) updateData.ewm_completed_at = req.body.ewm_completed_at;
    if (req.body.ewm_officer_id !== undefined) updateData.ewm_officer_id = req.body.ewm_officer_id;
    if (req.body.ewm_officer_name !== undefined) updateData.ewm_officer_name = req.body.ewm_officer_name;

    const result = await UpdateQueue.update(updateData, {
      where: {
        id: req.body.id,
      },
    });

    if (result[0] > 0) {
      res.status(200).send({ message: 'Service updated successfully' });
    } else {
      res.status(404).send({ message: 'Service not found' });
    }
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).send({ message: error.message || 'Update failed' });
  }
};

const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Handle Exit Permit updates (from Dispatch-Documentation)
    if (req.body.receipt_count !== undefined) updateData.receipt_count = req.body.receipt_count;
    if (req.body.vehicle_plate !== undefined) updateData.vehicle_plate = req.body.vehicle_plate;
    if (req.body.receipt_number !== undefined) updateData.receipt_number = req.body.receipt_number;
    if (req.body.total_amount !== undefined) updateData.total_amount = req.body.total_amount;
    if (req.body.measurement_unit !== undefined) updateData.measurement_unit = req.body.measurement_unit;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    // Handle Gate Keeper updates
    if (req.body.gate_status !== undefined) updateData.gate_status = req.body.gate_status;
    if (req.body.gate_processed_at !== undefined) updateData.gate_processed_at = req.body.gate_processed_at;
    if (req.body.gate_processed_by !== undefined) updateData.gate_processed_by = req.body.gate_processed_by;

    console.log('Updating record ID:', id);
    console.log('Update data:', updateData);

    const result = await UpdateQueue.update(updateData, {
      where: { id: id }
    });

    console.log('Update result:', result);

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
