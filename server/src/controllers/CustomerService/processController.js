const db = require('../../models');
const Process = db.process;
const Employee = db.employee;

const startProcess = async (req, res) => {
  try {
    const { facility_id, service_point, status, userId } = req.body;
    if (!facility_id || !service_point || !status) {
      return res.status(400).send({ message: 'facility_id, service_point and status are required' });
    }

    let officerName = null;
    let officerId = null;
    if (userId) {
      const emp = await Employee.findByPk(userId);
      if (emp) {
        officerName = emp.full_name || `${emp.user_name || ''}`.trim();
        officerId = emp.id;
      }
    }

    const created = await Process.create({
      facility_id,
      service_point,
      status,
      o2c_officer_id: officerId,
      o2c_officer: officerName,
    });

    // Return the auto-incremented id as process_id and include officerName for UI
    return res.status(201).send({ process_id: created.id, data: created, officerName });
  } catch (err) {
    console.error('startProcess error:', err);
    return res.status(500).send({ message: 'Internal server error', error: err.message });
  }
};

module.exports = { startProcess };
