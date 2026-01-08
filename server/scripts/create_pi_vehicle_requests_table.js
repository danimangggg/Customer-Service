const mysql = require('mysql2/promise');
require('dotenv').config();

const createPIVehicleRequestsTable = async () => {
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

    // Check if table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pi_vehicle_requests'
    `, [process.env.DB_NAME || 'customer-service']);

    if (tables.length > 0) {
      console.log('pi_vehicle_requests table already exists');
      return;
    }

    // Create pi_vehicle_requests table
    const createTableQuery = `
      CREATE TABLE pi_vehicle_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_id INT NOT NULL,
        month VARCHAR(20) NOT NULL,
        year INT NOT NULL,
        requested_by INT NOT NULL,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('requested', 'approved', 'assigned', 'completed') DEFAULT 'requested',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
        FOREIGN KEY (requested_by) REFERENCES employees(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_route_period (route_id, month, year),
        INDEX idx_month_year (month, year),
        INDEX idx_status (status),
        INDEX idx_requested_by (requested_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableQuery);
    console.log('✅ pi_vehicle_requests table created successfully');

    // Add sample data for testing (optional)
    console.log('PI Vehicle Requests table setup completed');

  } catch (error) {
    console.error('❌ Error creating pi_vehicle_requests table:', error);
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
  createPIVehicleRequestsTable()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = createPIVehicleRequestsTable;