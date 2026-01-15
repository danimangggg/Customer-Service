
const db = require("../../models");
const Employee = db.employee;

const retriveUsers = async (req, res) => {
  try {
    const data = await Employee.findAll({
      attributes: ['id', 'user_name', 'full_name', 'account_type', 'jobTitle', 'department']
    });
    
    // Map to match expected frontend format
    const jsonArray = data.map(element => {
      const emp = element.toJSON();
      return {
        id: emp.id,
        user_name: emp.user_name,
        FullName: emp.full_name,
        AccountType: emp.account_type,
        JobTitle: emp.jobTitle,
        Department: emp.department
      };
    });
    
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