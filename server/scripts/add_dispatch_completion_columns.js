require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'areacode',
  database: process.env.DB_NAME || 'customer-service'
};

async function addDispatchCompletionColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'route_assignments' 
      AND COLUMN_NAME IN ('completed_at', 'completed_by')
    `, [dbConfig.database]);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (existingColumns.includes('completed_at') && existingColumns.includes('completed_by')) {
      console.log('✅ Dispatch completion columns already exist in route_assignments table');
      return;
    }

    // Add completed_at column if it doesn't exist
    if (!existingColumns.includes('completed_at')) {
      await connection.execute(`
        ALTER TABLE route_assignments 
        ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL
      `);
      console.log('✅ Added completed_at column to route_assignments table');
    }

    // Add completed_by column if it doesn't exist
    if (!existingColumns.includes('completed_by')) {
      await connection.execute(`
        ALTER TABLE route_assignments 
        ADD COLUMN completed_by VARCHAR(255) NULL DEFAULT NULL
      `);
      console.log('✅ Added completed_by column to route_assignments table');
    }

    console.log('✅ Dispatch completion columns setup completed successfully');

  } catch (error) {
    console.error('❌ Error setting up dispatch completion columns:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
addDispatchCompletionColumns()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });