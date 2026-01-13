const db = require('../../models');
const Process = db.process;
const Employee = db.employee;
const ODN = db.odn;

const startProcess = async (req, res) => {
  try {
    const { facility_id, service_point, status, userId, reporting_month } = req.body;
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
      reporting_month: reporting_month || null,
    });

    // Return the auto-incremented id as process_id and include officerName for UI
    return res.status(201).send({ process_id: created.id, data: created, officerName });
  } catch (err) {
    console.error('startProcess error:', err);
    return res.status(500).send({ message: 'Internal server error', error: err.message });
  }
};

const revertProcess = async (req, res) => {
  try {
    const pid = req.params.id || req.body.process_id;
    if (!pid) return res.status(400).send({ message: 'process id required' });
    
    // First delete all ODNs associated with this process
    await ODN.destroy({ where: { process_id: pid } });
    
    // Then delete the process
    const deleted = await Process.destroy({ where: { id: pid } });
    if (deleted) return res.status(200).send({ message: 'Process and associated ODNs removed', process_id: pid });
    return res.status(404).send({ message: 'Process not found' });
  } catch (err) {
    console.error('revertProcess error:', err);
    return res.status(500).send({ message: 'Internal server error', error: err.message });
  }
};

const returnToO2C = async (req, res) => {
  try {
    const { process_id } = req.body;
    if (!process_id) {
      return res.status(400).send({ message: 'process_id is required' });
    }

    // Find the process
    const process = await Process.findByPk(process_id);
    if (!process) {
      return res.status(404).send({ message: 'Process not found' });
    }

    // Check if process is in the correct status to be returned
    if (process.status !== 'o2c_completed') {
      return res.status(400).send({ 
        message: 'Process must be in "o2c_completed" status to be returned to O2C Officer' 
      });
    }

    // Update process status back to 'completed' so O2C Officer can make corrections
    await Process.update(
      { status: 'completed' },
      { where: { id: process_id } }
    );

    return res.status(200).send({ 
      message: 'Process returned to O2C Officer for corrections',
      process_id: process_id,
      new_status: 'completed'
    });

  } catch (err) {
    console.error('returnToO2C error:', err);
    return res.status(500).send({ message: 'Internal server error', error: err.message });
  }
};

module.exports = { startProcess, revertProcess, returnToO2C };
