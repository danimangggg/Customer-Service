const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'epss_db'
};

async function createPIVehicleRequestsTable() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Checking if pi_vehicle_requests table exists...');
    
    // Check if table exists
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'pi_vehicle_requests'
    `);
    
    if (tables.length > 0) {
      console.log('✓ pi_vehicle_requests table already exists');
      
      // Show table structure
      const [columns] = await connection.execute(`DESCRIBE pi_vehicle_requests`);
      console.log('Table structure:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
      });
      
      // Show sample data
      const [sampleData] = await connection.execute(`
        SELECT COUNT(*) as count FROM pi_vehicle_requests
      `);
      console.log(`Records in table: ${sampleData[0].count}`);
      
      return;
    }
    
    console.log('Creating pi_vehicle_requests table...');
    
    const createTableQuery = `
      CREATE TABLE pi_vehicle_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_id INT NOT NULL,
        month VARCHAR(20) NOT NULL,
        year INT NOT NULL,
        requested_by INT NOT NULL,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('requested', 'approved', 'assigned', 'completed', 'cancelled') DEFAULT 'requested',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_route_month_year (route_id, month, year),
        INDEX idx_requested_by (requested_by),
        INDEX idx_status (status),
        INDEX idx_requested_at (requested_at),
        
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
        FOREIGN KEY (requested_by) REFERENCES employees(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_route_period (route_id, month, year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Successfully created pi_vehicle_requests table');
    
    // Verify table creation
    const [newColumns] = await connection.execute(`DESCRIBE pi_vehicle_requests`);
    console.log('Created table structure:');
    newColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
  } catch (error) {
    console.error('Error creating pi_vehicle_requests table:', error);
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_CANNOT_ADD_FOREIGN') {
      console.log('\n⚠️  Foreign key constraint failed. This might be because:');
      console.log('   - routes table does not exist');
      console.log('   - employees table does not exist');
      console.log('   - These tables need to be created first');
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the script
if (require.main === module) {
  createPIVehicleRequestsTable()
    .then(() => {
      console.log('\nTable creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = createPIVehicleRequestsTable;