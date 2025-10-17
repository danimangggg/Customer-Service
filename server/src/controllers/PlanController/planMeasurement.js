const db = require('../../models');
const Measurement = db.measurement;

const AddMeasurement = async (req, res) => {
  try {
    const result = await Measurement.create({
        measurement: req.body.measurement,
        department: req.body.department,
        branchCatagoryId: req.body.branchCatagoryId,
        anualTarget: req.body.anualTarget,
        scoreType: req.body.scoreType
    });

    res.status(200).send({ message: "Organization plan created successfully", task: result });
  } catch (error) {
    console.error("Error saving plan:", error);
    res.status(500).send({ message: "Failed to save org plan", error: error.message });
  }
};

module.exports = {
  AddMeasurement
};
