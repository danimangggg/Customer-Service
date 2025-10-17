 const db = require('../../models');
const Task = db.task;

const AddTask = async (req, res) => {
  try {
    const result = await Task.create({
      description: req.body.description,
      measurement: req.body.measurement,
      target: req.body.target,
      department: req.body.department,
    });

    res.status(200).send({ message: "Task created successfully", task: result });
  } catch (error) {
    console.error("Error saving task:", error);
    res.status(500).send({ message: "Failed to save task", error: error.message });
  }
};

module.exports = {
  AddTask
};
