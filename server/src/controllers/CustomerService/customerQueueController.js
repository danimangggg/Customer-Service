 const db = require('../../models');
const Queue = db.customerService;

const AddCustomerQueue = async (req, res) => {
  try {
    const result = await Queue.create({
      facility_id: req.body.facility_id,
      customer_type: req.body.customer_type,
      next_service_point: req.body.next_service_point,
      assigned_officer_id: req.body.assigned_officer_id,
      status: req.body.status,
      delegate: req.body.delegate,
      delegate_phone: req.body.delegate_phone,
      letter_number: req.body.letter_number,
      started_at: req.body.started_at,
      completed_at: req.body.completed_at,
      service_points_status: req.body.service_points_status,
    });

    res.status(200).send({ message: "Task created successfully", task: result });
  } catch (error) {
    console.error("Error saving task:", error);
    res.status(500).send({ message: "Failed to save task", error: error.message });
  }
};

module.exports = {
 AddCustomerQueue
};
