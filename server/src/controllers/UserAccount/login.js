 
const bcrypt = require('bcryptjs');
const db = require("../../models");
const { QueryTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const User = db.employee;

const login =  async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
    const { user_name, password } = req.body;
    
    if (!user_name || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    console.log('Looking for user:', user_name);
    const user = await User.findOne({ where: { user_name } });
    
    if (!user) {
      console.log('User not found:', user_name);
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    
    console.log('User found, checking password');

    // Guard: password must be a non-empty string (bcrypt hash)
    if (!user.password || typeof user.password !== 'string') {
      console.log('Invalid password hash for user:', user_name, typeof user.password);
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
   
    if (!isMatch) {
      console.log('Password mismatch for user:', user_name);
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    
    console.log('Password match, getting store info');
    
    // Get store name from stores table if store_id exists
    let storeName = null;
    if (user.store_id) {
      try {
        const [storeResult] = await db.sequelize.query(
          'SELECT store_name FROM stores WHERE id = ?',
          { replacements: [user.store_id], type: QueryTypes.SELECT }
        );
        if (storeResult) {
          storeName = storeResult.store_name;
        }
      } catch (storeError) {
        console.error('Store query error:', storeError.message);
        // Non-fatal — continue login without store name
      }
    }

    // Get branch name from branches table if branch_code exists
    let branchName = null;
    if (user.branch_code) {
      try {
        const [branchResult] = await db.sequelize.query(
          'SELECT branch_name FROM epss_branches WHERE branch_code = ?',
          { replacements: [user.branch_code], type: QueryTypes.SELECT }
        );
        if (branchResult) {
          branchName = branchResult.branch_name;
        }
      } catch (branchError) {
        console.error('Branch query error:', branchError.message);
        // Non-fatal — continue login without branch name
      }
    }
    
    console.log('Creating JWT token');
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });
    
    console.log('Login successful for user:', user_name);
    res.json({ 
      message: 'Login successful', 
      token, 
      UserId: user.id, 
      FullName: user.full_name, 
      AccountType: user.account_type, 
      JobTitle: user.jobTitle, 
      store: storeName,
      branch_code: user.branch_code || null,
      branch_name: branchName || null
    });
    
  } catch (error) {
    console.error('Login error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Login failed', 
      details: error.message 
    });
  }
}

module.exports = {
    login
  };