const db = require('../../models');
const assigned_task = db.assignedTask;

const AssignedTask = async (req, res) => {
  try {
    const result = await assigned_task.create({
      userId: req.body.userId,
      taskId: req.body.taskId,
      target: req.body.target,
    });

    res.status(200).send({ message: "Task created successfully", task: result });
  } catch (error) {
    console.error("Error saving task:", error);
    res.status(500).send({ message: "Failed to save task", error: error.message });
  }
};

module.exports = {
  AssignedTask
};
