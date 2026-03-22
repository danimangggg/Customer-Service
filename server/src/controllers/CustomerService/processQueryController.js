const db = require('../../models');
const Process = db.process;
const Employee = db.employee;

const getActiveProcesses = async (req, res) => {
  try {
    const branchCode = req.headers['x-branch-code'] || null;
    const accountType = req.headers['x-account-type'] || null;

    // Build facility branch filter
    const facilityWhere = (accountType !== 'Super Admin' && branchCode)
      ? { branch_code: branchCode }
      : {};

    const Facility = db.facility;
    const includeOpts = [{
      model: Facility,
      as: 'facility',
      attributes: ['id', 'facility_name', 'branch_code'],
      where: Object.keys(facilityWhere).length ? facilityWhere : undefined,
      required: Object.keys(facilityWhere).length > 0
    }];

    const processes = await Process.findAll({ include: includeOpts });

    // collect officer ids and fetch employee names
    const officerIds = [...new Set(processes.map(p => p.o2c_officer_id).filter(Boolean))];
    let employees = [];
    if (officerIds.length > 0) {
      employees = await Employee.findAll({ where: { id: officerIds } });
    }
    const empMap = {};
    for (const e of employees) {
      empMap[e.id] = e.full_name || (e.user_name || '');
    }

    const results = processes.map(p => {
      const json = p.toJSON ? p.toJSON() : p;
      if (json.o2c_officer_id && empMap[json.o2c_officer_id]) {
        json.o2c_officer_name = empMap[json.o2c_officer_id];
      }
      return json;
    });

    return res.status(200).send(results);
  } catch (err) {
    console.error('getActiveProcesses error:', err);
    return res.status(500).send({ message: 'Internal server error', error: err.message });
  }
};

module.exports = { getActiveProcesses };
