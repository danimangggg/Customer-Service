const db = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const Employee = db.employee;

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      department = '', 
      account_status = '',
      jobTitle = '',
      store = ''
    } = req.query;
    
    console.log('Search parameters received:', { search, department, account_status }); // Debug log
    
    const offset = (page - 1) * limit;
    let whereClause = {};
    
    // Search functionality
    if (search) {
      console.log('Applying search filter for:', search); // Debug log
      whereClause[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { user_name: { [Op.like]: `%${search}%` } },
        { jobTitle: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filter by department
    if (department) {
      whereClause.department = department;
    }

    // Filter by account status
    if (account_status) {
      whereClause.account_status = account_status;
    }

    // Filter by job title
    if (jobTitle) {
      whereClause.jobTitle = jobTitle;
    }

    // Filter by store
    if (store) {
      whereClause.store = store;
    }

    console.log('Final where clause:', whereClause); // Debug log

    const { count, rows } = await Employee.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] } // Exclude password from response
    });

    res.json({
      users: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Employee.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { 
      full_name, 
      user_name, 
      password, 
      jobTitle, 
      account_type, 
      position, 
      department, 
      account_status,
      store,
      email,
      phone
    } = req.body;

    // Validation
    if (!full_name || !user_name || !password) {
      return res.status(400).json({ error: 'Full name, username, and password are required' });
    }

    // Check if username already exists
    const existingUser = await Employee.findOne({ where: { user_name } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await Employee.create({
      full_name: full_name.trim(),
      user_name: user_name.trim().toLowerCase(),
      password: hashedPassword,
      jobTitle: jobTitle || null,
      account_type: account_type || 'Standard',
      position: position || null,
      department: department || null,
      account_status: account_status || 'Active',
      store: store || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();
    
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      full_name, 
      user_name, 
      password, 
      jobTitle, 
      account_type, 
      position, 
      department, 
      account_status,
      store,
      email,
      phone
    } = req.body;

    const user = await Employee.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username already exists (excluding current user)
    if (user_name && user_name !== user.user_name) {
      const existingUser = await Employee.findOne({ 
        where: { 
          user_name: user_name.trim().toLowerCase(),
          id: { [Op.ne]: id }
        } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Prepare update data
    const updateData = {
      full_name: full_name?.trim() || user.full_name,
      user_name: user_name?.trim().toLowerCase() || user.user_name,
      jobTitle: jobTitle !== undefined ? jobTitle : user.jobTitle,
      account_type: account_type || user.account_type,
      position: position !== undefined ? position : user.position,
      department: department !== undefined ? department : user.department,
      account_status: account_status || user.account_status,
      store: store !== undefined ? store : user.store,
      email: email !== undefined ? email?.trim() : user.email,
      phone: phone !== undefined ? phone?.trim() : user.phone
    };

    // Hash new password if provided
    if (password && password.trim()) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password.trim(), saltRounds);
    }

    await user.update(updateData);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Employee.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await Employee.count();
    const activeUsers = await Employee.count({ where: { account_status: 'Active' } });
    const inactiveUsers = await Employee.count({ where: { account_status: 'Inactive' } });
    const suspendedUsers = await Employee.count({ where: { account_status: 'Suspended' } });

    const usersByDepartment = await Employee.findAll({
      attributes: [
        'department',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['department'],
      raw: true
    });

    const usersByPosition = await Employee.findAll({
      attributes: [
        'position',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['position'],
      raw: true
    });

    const usersByStore = await Employee.findAll({
      attributes: [
        'store',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['store'],
      raw: true
    });

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      usersByDepartment,
      usersByPosition,
      usersByStore
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
};

// Toggle user status
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await Employee.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ account_status: status });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.json({
      message: `User status updated to ${status}`,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Reset user password
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await Employee.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword.trim(), saltRounds);

    await user.update({ password: hashedPassword });

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  toggleUserStatus,
  resetUserPassword
};