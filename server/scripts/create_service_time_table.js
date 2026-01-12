require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'areacode',
  database: process.env.DB_NAME || 'customer-service'
};

async function createServiceTimeTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    // Check if table already exists
    const [existingTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_time'
    `, [dbConfig.database]);

    if (existingTables.length > 0) {
      console.log('⚠ service_time table already exists');
      return;
    }

    // Create service_time table
    await connection.execute(`
      CREATE TABLE service_time (
        id INT AUTO_INCREMENT PRIMARY KEY,
        process_id INT NOT NULL,
        service_unit VARCHAR(255) NOT NULL COMMENT 'Name of the service unit',
        start_time TIMESTAMP NOT NULL COMMENT 'Service unit start time',
        end_time TIMESTAMP NULL COMMENT 'Service unit end time',
        duration_minutes INT GENERATED ALWAYS AS (
          CASE 
            WHEN end_time IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, start_time, end_time)
            ELSE NULL
          END
        ) STORED COMMENT 'Calculated duration in minutes',
        status ENUM('in_progress', 'completed', 'paused') DEFAULT 'in_progress' COMMENT 'Service status',
        notes TEXT NULL COMMENT 'Additional notes about the service',
        created_by INT NULL COMMENT 'User who created the record',
        updated_by INT NULL COMMENT 'User who last updated the record',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Foreign key constraints
        CONSTRAINT fk_service_time_process 
          FOREIGN KEY (process_id) REFERENCES processes(id) 
          ON DELETE CASCADE ON UPDATE CASCADE,
        
        CONSTRAINT fk_service_time_created_by 
          FOREIGN KEY (created_by) REFERENCES employees(id) 
          ON DELETE SET NULL ON UPDATE CASCADE,
          
        CONSTRAINT fk_service_time_updated_by 
          FOREIGN KEY (updated_by) REFERENCES employees(id) 
          ON DELETE SET NULL ON UPDATE CASCADE,
        
        -- Indexes for better performance
        INDEX idx_process_id (process_id),
        INDEX idx_service_unit (service_unit),
        INDEX idx_start_time (start_time),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
      COMMENT='Service time tracking for regular customer processes (not HP-RRF processes)'
    `);

    console.log('✅ service_time table created successfully!');

    // Check existing processes to insert valid sample data
    const [existingProcesses] = await connection.execute(`
      SELECT id, status FROM processes 
      WHERE status != 'hp_facility' 
      ORDER BY id 
      LIMIT 3
    `);

    if (existingProcesses.length > 0) {
      console.log('Found existing regular processes:', existingProcesses.map(p => p.id));
      
      // Insert sample data using existing process IDs
      const processId1 = existingProcesses[0].id;
      const processId2 = existingProcesses.length > 1 ? existingProcesses[1].id : processId1;
      
      await connection.execute(`
        INSERT INTO service_time (
          process_id, service_unit, start_time, end_time, status, notes, created_by
        ) VALUES 
        (?, 'Order Processing', '2026-01-11 08:00:00', '2026-01-11 08:30:00', 'completed', 'Initial order processing completed', 1),
        (?, 'Inventory Check', '2026-01-11 08:30:00', '2026-01-11 09:15:00', 'completed', 'Stock verification completed', 1),
        (?, 'Packaging', '2026-01-11 09:15:00', NULL, 'in_progress', 'Currently packaging items', 1),
        (?, 'Order Processing', '2026-01-11 09:00:00', '2026-01-11 09:20:00', 'completed', 'Order processed successfully', 1),
        (?, 'Quality Check', '2026-01-11 09:20:00', '2026-01-11 09:45:00', 'completed', 'Quality verification passed', 1)
      `, [processId1, processId1, processId1, processId2, processId2]);

      console.log('✅ Sample service time data inserted successfully!');
    } else {
      console.log('⚠ No existing regular processes found, skipping sample data insertion');
    }

    // Verify the table structure
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_time' 
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);

    console.log('\n📋 Service Time Table Structure:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) - ${col.COLUMN_COMMENT || 'No comment'}`);
    });

    console.log('\n✅ Service time table setup completed successfully!');
    console.log('\nTable features:');
    console.log('  - Tracks service unit start and end times for regular customer processes');
    console.log('  - Does NOT track HP-RRF processes (those are handled separately)');
    console.log('  - Automatically calculates duration in minutes');
    console.log('  - Supports multiple service units per process');
    console.log('  - Includes status tracking (in_progress, completed, paused)');
    console.log('  - Links to processes and employees tables');
    console.log('  - Includes audit trail with created/updated timestamps');

  } catch (error) {
    console.error('❌ Error creating service_time table:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  createServiceTimeTable()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createServiceTimeTable;