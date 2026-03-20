
const db = require("../../models");
const Employee = db.employee;

const retriveUsers = async (req, res) => {
  try {
    const accountType  = req.headers['x-account-type'] || null;
    const branchCode   = req.headers['x-branch-code'] || null;

    // Branch isolation: non-Super Admin only sees their own branch
    // Also exclude Super Admin accounts from the list
    const branchCondition = (accountType !== 'Super Admin' && branchCode)
      ? `AND e.branch_code = '${branchCode}'` : '';

    const [data] = await db.sequelize.query(`
      SELECT 
        e.id, 
        e.user_name, 
        e.full_name, 
        e.account_type, 
        e.jobTitle, 
        e.store_id,
        s.store_name as store
      FROM employees e
      LEFT JOIN stores s ON e.store_id = s.id
      WHERE e.account_type != 'Super Admin'
      ${branchCondition}
    `);

    const jsonArray = data.map(emp => ({
      id: emp.id,
      user_name: emp.user_name,
      FullName: emp.full_name,
      AccountType: emp.account_type,
      JobTitle: emp.jobTitle,
      store: emp.store
    }));

    res.status(200).json(jsonArray);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees', message: error.message });
  }
}

module.exports = {
  retriveUsers
};