const db = require("../../models");
const UpdateQueue = db.customerService;

const updateQueue = async (req, res) => {
  try {
    const result = await UpdateQueue.update(
      {
        next_service_point: req.body.next_service_point,
        assigned_officer_id: req.body.assigned_officer_id,
        status:req.body.status,
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
         // ✅ Only this field is updated
      },
      {
        where: {
          id: req.body.id,
        },
      }
    );

    if (result[0] > 0) {
      res.status(200).send({ message: 'Service updated successfully' });
    } else {
      res.status(404).send({ message: 'Service not found' });
    }
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).send({ message: error });
  }
};

module.exports = {
  updateQueue
};
