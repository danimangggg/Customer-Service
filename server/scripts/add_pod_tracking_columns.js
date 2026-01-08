require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'areacode',
  database: process.env.DB_NAME || 'customer-service'
};

async function addPODTrackingColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'odns' 
      AND COLUMN_NAME IN ('pod_confirmed', 'pod_reason', 'pod_confirmed_by', 'pod_confirmed_at')
    `, [dbConfig.database]);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (existingColumns.length === 4) {
      console.log('✅ POD tracking columns already exist in odns table');
      return;
    }

    // Add pod_confirmed column if it doesn't exist
    if (!existingColumns.includes('pod_confirmed')) {
      await connection.execute(`
        ALTER TABLE odns 
        ADD COLUMN pod_confirmed BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added pod_confirmed column to odns table');
    }

    // Add pod_reason column if it doesn't exist
    if (!existingColumns.includes('pod_reason')) {
      await connection.execute(`
        ALTER TABLE odns 
        ADD COLUMN pod_reason TEXT NULL DEFAULT NULL
      `);
      console.log('✅ Added pod_reason column to odns table');
    }

    // Add pod_confirmed_by column if it doesn't exist
    if (!existingColumns.includes('pod_confirmed_by')) {
      await connection.execute(`
        ALTER TABLE odns 
        ADD COLUMN pod_confirmed_by VARCHAR(255) NULL DEFAULT NULL
      `);
      console.log('✅ Added pod_confirmed_by column to odns table');
    }

    // Add pod_confirmed_at column if it doesn't exist
    if (!existingColumns.includes('pod_confirmed_at')) {
      await connection.execute(`
        ALTER TABLE odns 
        ADD COLUMN pod_confirmed_at TIMESTAMP NULL DEFAULT NULL
      `);
      console.log('✅ Added pod_confirmed_at column to odns table');
    }

    console.log('✅ POD tracking columns setup completed successfully');

  } catch (error) {
    console.error('❌ Error setting up POD tracking columns:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
addPODTrackingColumns()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });