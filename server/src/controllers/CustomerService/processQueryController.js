const db = require('../../models');
const Process = db.process;

const getActiveProcesses = async (req, res) => {
  try {
    // return all process records (optionally filter by status)
    const processes = await Process.findAll({ where: { status: 'o2c_started' } });
    return res.status(200).send(processes);
  } catch (err) {
    console.error('getActiveProcesses error:', err);
    return res.status(500).send({ message: 'Internal server error', error: err.message });
  }
};

module.exports = { getActiveProcesses };
