
const db = require("../../models");
const Employee = db.employee;

const retriveUsers = async (req, res) => {
  try {
    // Use raw query to join with stores table
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
    `);
    
    // Map to match expected frontend format
    const jsonArray = data.map(emp => ({
      id: emp.id,
      user_name: emp.user_name,
      FullName: emp.full_name,
      AccountType: emp.account_type,
      JobTitle: emp.jobTitle,
      store: emp.store
    }));
    
    console.log('Employees fetched:', jsonArray.length);
    
    res.status(200).json(jsonArray);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      message: error.message 
    });
  }
}

module.exports = {
  retriveUsers
};