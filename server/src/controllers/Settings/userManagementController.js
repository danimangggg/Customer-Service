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
      account_status = '',
      jobTitle = '',
      store = ''
    } = req.query;
    
    console.log('=== GET ALL USERS ===');
    console.log('Search parameters received:', { search, account_status, store, jobTitle, page, limit });
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = [];
    let replacements = [];
    
    // Search functionality
    if (search && search.trim()) {
      whereConditions.push('(e.full_name LIKE ? OR e.user_name LIKE ? OR e.jobTitle LIKE ?)');
      replacements.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Filter by account status
    if (account_status && account_status.trim()) {
      whereConditions.push('e.account_status = ?');
      replacements.push(account_status);
    }

    // Filter by job title
    if (jobTitle && jobTitle.trim()) {
      whereConditions.push('e.jobTitle = ?');
      replacements.push(jobTitle);
    }

    // Filter by store name
    if (store && store.trim()) {
      whereConditions.push('s.store_name = ?');
      replacements.push(store);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    console.log('WHERE clause:', whereClause);
    console.log('Replacements:', replacements);

    // Get total count - simplified query
    const countQuery = `
      SELECT COUNT(DISTINCT e.id) as count
      FROM employees e
      LEFT JOIN stores s ON e.store_id = s.id
      ${whereClause}
    `;
    
    console.log('Executing count query...');
    
    let countResult;
    try {
      const results = await db.sequelize.query(countQuery, { 
        replacements
      });
      countResult = results[0][0];
    } catch (countError) {
      console.error('Count query failed:', countError.message);
      throw countError;
    }
    
    const count = countResult.count || 0;
    console.log('Total count:', count);

    // Get paginated results
    const dataQuery = `
      SELECT 
        e.id, e.full_name, e.user_name, e.jobTitle, e.account_type, 
        e.account_status, e.store_id, e.createdAt, e.updatedAt,
        s.store_name as store
      FROM employees e
      LEFT JOIN stores s ON e.store_id = s.id
      ${whereClause}
      ORDER BY e.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    
    console.log('Executing data query...');
    
    let rows;
    try {
      const results = await db.sequelize.query(dataQuery, { 
        replacements: [...replacements, parseInt(limit), parseInt(offset)]
      });
      rows = results[0];
    } catch (dataError) {
      console.error('Data query failed:', dataError.message);
      throw dataError;
    }
    
    console.log('Rows fetched:', rows.length);

    res.json({
      users: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('=== ERROR IN GET ALL USERS ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error.message,
      details: error.toString()
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use raw query to join with stores table
    const [users] = await db.sequelize.query(`
      SELECT 
        e.*,
        s.store_name as store
      FROM employees e
      LEFT JOIN stores s ON e.store_id = s.id
      WHERE e.id = ?
    `, { replacements: [id] });

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    delete user.password; // Remove password from response

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

    // Convert store name to store_id
    let store_id = null;
    if (store) {
      const [storeResult] = await db.sequelize.query(
        'SELECT id FROM stores WHERE store_name = ?',
        { replacements: [store] }
      );
      if (storeResult && storeResult.length > 0) {
        store_id = storeResult[0].id;
      }
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
      account_status: account_status || 'Active',
      store_id: store_id,
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

    // Convert store name to store_id if store is provided
    let store_id = user.store_id;
    if (store !== undefined) {
      if (store === null || store === '') {
        store_id = null;
      } else {
        const [storeResult] = await db.sequelize.query(
          'SELECT id FROM stores WHERE store_name = ?',
          { replacements: [store] }
        );
        if (storeResult && storeResult.length > 0) {
          store_id = storeResult[0].id;
        }
      }
    }

    // Prepare update data
    const updateData = {
      full_name: full_name?.trim() || user.full_name,
      user_name: user_name?.trim().toLowerCase() || user.user_name,
      jobTitle: jobTitle !== undefined ? jobTitle : user.jobTitle,
      account_type: account_type || user.account_type,
      account_status: account_status || user.account_status,
      store_id: store_id,
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

    const usersByJobTitle = await Employee.findAll({
      attributes: [
        'jobTitle',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['jobTitle'],
      raw: true
    });

    // Get users by store using JOIN with stores table
    const [usersByStore] = await db.sequelize.query(`
      SELECT s.store_name as store, COUNT(e.id) as count
      FROM employees e
      LEFT JOIN stores s ON e.store_id = s.id
      GROUP BY s.store_name
    `);

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      usersByJobTitle,
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