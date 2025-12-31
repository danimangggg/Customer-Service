const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'customer_service',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: console.log
  }
);

async function addStatusColumn() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully.');

    // Check if status column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'odns' AND COLUMN_NAME = 'status'
    `);

    if (results.length > 0) {
      console.log('Status column already exists in odns table.');
      return;
    }

    console.log('Adding status column to odns table...');
    
    // Add the status column
    await sequelize.query(`
      ALTER TABLE odns 
      ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'
    `);

    console.log('Status column added successfully!');
    console.log('All existing ODNs will have status = "pending" by default.');

  } catch (error) {
    console.error('Error adding status column:', error);
  } finally {
    await sequelize.close();
  }
}

addStatusColumn();