const db = require('../../models');
const Employee = db.employee;

// Create a new employee
const CreateEmployee = async (req, res) => {
  try {
    const employee = await Employee.create({
      full_name: req.body.full_name, 
      user_name: req.body.user_name,	
      password: req.body.password,	
      jobTitle: req.body.jobTitle,	
      account_type: req.body.account_type,	
      account_status: req.body.account_status,
      store: req.body.store
    });
 
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create employee', error });
  }
};

// Get all employees
const getEmployees = async (req, res) => {
  try {
    const accountType = req.headers['x-account-type'] || null;
    const queryBranch = req.query.branch_code || null;
    const headerBranch = req.headers['x-branch-code'] || null;
    const branchCode = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);

    const where = {};
    if (branchCode) {
      where.branch_code = branchCode;
    }

    const employees = await Employee.findAll({
      where,
      include: [{
        model: db.store,
        as: 'store',
        attributes: ['id', 'store_name'],
        required: false
      }]
    });
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
  }
};

// Get a single employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employee', error });
  }
};

// Update an employee
const updateEmployee = async (req, res) => {
  try {
    const { full_name, jobTitle, store, account_type, account_status, branch_code } = req.body;
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const updateData = { full_name, jobTitle, store, account_type, account_status };
    // Only update branch_code if explicitly provided
    if (branch_code !== undefined) updateData.branch_code = branch_code;

    await employee.update(updateData);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update employee', error });
  }
};

// Delete an employee
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    await employee.destroy();
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete employee', error });
  }
};

// Bulk update employees from Excel (match by user_name)
const bulkImportEmployees = async (req, res) => {
  const rows = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: 'No data provided' });
  }

  const results = { created: 0, updated: 0, notFound: [], errors: [] };

  // Read branch from headers (set by axiosInstance)
  const accountType = req.headers['x-account-type'] || null;
  const branchCode = accountType !== 'Super Admin' ? (req.headers['x-branch-code'] || null) : null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.user_name) {
      results.errors.push({ row: i + 1, message: 'user_name is required' });
      continue;
    }
    try {
      const emp = await Employee.findOne({ where: { user_name: row.user_name } });
      if (!emp) {
        // Create new employee
        await Employee.create({
          user_name: row.user_name,
          full_name: row.full_name || row.user_name,
          jobTitle: row.jobTitle || null,
          store: row.store || null,
          branch_code: branchCode || row.branch_code || null,
        });
        results.created++;
      } else {
        // Update existing
        await emp.update({
          full_name: row.full_name || emp.full_name,
          jobTitle: row.jobTitle || emp.jobTitle,
          store: row.store || emp.store,
        });
        results.updated++;
      }
    } catch (err) {
      results.errors.push({ row: i + 1, user_name: row.user_name, message: err.message });
    }
  }

  res.json(results);
};

module.exports = {
  CreateEmployee,
  getEmployees,
  deleteEmployee, 
  updateEmployee,
  getEmployeeById,
  bulkImportEmployees
}
