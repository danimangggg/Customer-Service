const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'areacode',
  database: 'customer-service'
};

async function addPeriodColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'facilities' AND COLUMN_NAME = 'period'
    `, [dbConfig.database]);

    if (columns.length > 0) {
      console.log('Period column already exists in facilities table');
      return;
    }

    // Add the period column
    await connection.execute(`
      ALTER TABLE facilities 
      ADD COLUMN period ENUM('Odd', 'Even', 'Monthly') NULL 
      AFTER route
    `);

    console.log('Successfully added period column to facilities table');

  } catch (error) {
    console.error('Error adding period column:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
addPeriodColumn();