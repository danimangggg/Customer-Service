const db = require('../../models');
const OrgPlan = db.orgPlanCatagory;

const AddOrgPlan = async (req, res) => {
  try {
    const result = await OrgPlan.create({
      catagoryName: req.body.catagoryName,
      anualTarget: req.body.anualTarget
    });

    res.status(200).send({ message: "Organization plan created successfully", task: result });
  } catch (error) {
    console.error("Error saving plan:", error);
    res.status(500).send({ message: "Failed to save org plan", error: error.message });
  }
};

module.exports = {
  AddOrgPlan
};
