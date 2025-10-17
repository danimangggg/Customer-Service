const db = require('../../models');
const BranchPlan = db.branchPlanCatagory;

const AddBranchPlan = async (req, res) => {
  try {
    const result = await BranchPlan.create({
      branchCatagory: req.body.branchCatagorry,
      OrgCatagoryId: req.body.OrgCatagoryId,
      anualTarget: req.body.anualTarget
    });

    res.status(200).send({ message: "branch plan created successfully", task: result });
  } catch (error) {
    console.error("Error saving plan:", error);
    res.status(500).send({ message: "Failed to save branch plan", error: error.message });
  }
};

module.exports = {
  AddBranchPlan
};
