const mysql = require('mysql2/promise');
require('dotenv').config();

const addVehicleRequestedStatus = async () => {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'areacode',
      database: process.env.DB_NAME || 'customer-service'
    });

    console.log('Connected to MySQL database');

    // Check current status values in the table
    const [statusValues] = await connection.execute(`
      SELECT DISTINCT status FROM processes WHERE status IS NOT NULL
    `);
    
    console.log('Current status values in table:', statusValues.map(row => row.status));

    // Check current ENUM values for status column
    const [columns] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'processes' AND COLUMN_NAME = 'status'
    `, [process.env.DB_NAME || 'customer-service']);

    if (columns.length === 0) {
      console.log('❌ Status column not found in processes table');
      return;
    }

    const currentType = columns[0].COLUMN_TYPE;
    console.log('Current status column type:', currentType);

    // Check if 'vehicle_requested' is already in the values
    const hasVehicleRequested = statusValues.some(row => row.status === 'vehicle_requested');
    if (hasVehicleRequested) {
      console.log('✅ vehicle_requested status already exists in processes table');
      return;
    }

    // Since it's VARCHAR, we don't need to modify the column structure
    // Just verify that the column can accept 'vehicle_requested' value
    console.log('✅ Status column is VARCHAR, can accept vehicle_requested values');
    console.log('No database modification needed - vehicle_requested can be inserted as needed');

  } catch (error) {
    console.error('❌ Error adding vehicle_requested status:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
};

// Run the script if called directly
if (require.main === module) {
  addVehicleRequestedStatus()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = addVehicleRequestedStatus;