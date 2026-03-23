#!/usr/bin/env node

const express = require("express");
const cors = require('cors');
const app = express();
const db = require('./src/models');
const path = require('path');
const initRoutes = require("./src/routes/web");

console.log('=== SERVER STARTING ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Database host:', process.env.DB_HOST || 'localhost');

app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'https://epss-mt.et',
    'https://www.epss-mt.et',
    'http://epss-mt.et',
    'http://www.epss-mt.et'
  ]
}));

app.use(express.json());
global.__basedir = __dirname;
app.use(express.urlencoded({ extended: true }));

// Branch middleware — attaches req.branchCode from X-Branch-Code header
const branchMiddleware = require('./src/middleware/branchMiddleware');
app.use(branchMiddleware);

// UNIQUE TEST ROUTE - If you can access this, server-production.js is running
app.get('/api/server-check', (req, res) => {
  res.json({ 
    message: 'server-production.js IS RUNNING!',
    file: 'server-production.js',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to check employees table directly
app.get('/api/debug/test-employees', async (req, res) => {
  try {
    const db = require('./src/models');
    
    // Try direct SQL query
    const [results] = await db.sequelize.query('SELECT user_name, full_name FROM employees LIMIT 5');
    
    res.json({
      success: true,
      count: results.length,
      users: results
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      sqlError: true
    });
  }
});

// Serve static assets BEFORE routes
app.use(express.static("resources/static/assets/uploads"));
app.use('/picklists', express.static(path.join(__dirname, '/resources/static/assets/picklists')));

// Test endpoint BEFORE initRoutes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Direct route works!' });
});

// Initialize API routes
console.log('Loading routes...');
initRoutes(app);
console.log('Routes loaded');

// Debug endpoint to check database tables and users
app.get('/api/debug/database-info', async (req, res) => {
  try {
    const db = require('./src/models');
    
    // Check if employee table exists and count users
    const [tables] = await db.sequelize.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    let userCount = 0;
    let sampleUsers = [];
    
    if (tableNames.includes('employees')) {
      const [users] = await db.sequelize.query("SELECT user_name, full_name FROM employees LIMIT 5");
      userCount = await db.employee.count();
      sampleUsers = users;
    }
    
    res.json({
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      tables: tableNames,
      employeeTableExists: tableNames.includes('employees'),
      userCount: userCount,
      sampleUsers: sampleUsers
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT
    });
  }
});

// Serve React build files ONLY for non-API routes
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Handle React routing - MUST be last
app.get('*', (req, res, next) => {
  // Skip API routes - let them 404 naturally if not found
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found', path: req.path });
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Run a simple model sync at startup
db.sequelize.sync().then(() => {
  console.log('✓ Database synchronized');
}).catch(err => {
  console.error('✗ DB sync error:', err.message);
});

console.log('=== SERVER READY ===');

let port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
