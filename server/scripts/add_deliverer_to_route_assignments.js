const db = require('../src/models');

const createTables = async () => {
  try {
    // Create routes table
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_name VARCHAR(200) NOT NULL UNIQUE,
        route_code VARCHAR(20) NOT NULL UNIQUE,
        description TEXT,
        start_location VARCHAR(200) NOT NULL,
        end_location VARCHAR(200) NOT NULL,
        waypoints TEXT COMMENT 'JSON array of waypoint locations',
        estimated_distance_km DECIMAL(10,2),
        estimated_duration_hours DECIMAL(5,2),
        route_type ENUM('Delivery', 'Pickup', 'Round Trip', 'Emergency', 'Maintenance') NOT NULL DEFAULT 'Delivery',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES employees(id),
        INDEX idx_route_code (route_code),
        INDEX idx_route_name (route_name),
        INDEX idx_route_type (route_type),
        INDEX idx_is_active (is_active)
      )
    `);

    // Create route_assignments table with simplified structure
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS route_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        driver_id INT NOT NULL,
        deliverer_id INT NULL,
        assigned_by INT NOT NULL COMMENT 'TM Manager who made the assignment',
        assignment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        scheduled_date TIMESTAMP NULL COMMENT 'When the route should be executed',
        status ENUM('Assigned', 'In Progress', 'Completed', 'Cancelled', 'Delayed') NOT NULL DEFAULT 'Assigned',
        priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
        notes TEXT,
        actual_start_time TIMESTAMP NULL,
        actual_end_time TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (route_id) REFERENCES routes(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (driver_id) REFERENCES employees(id),
        FOREIGN KEY (deliverer_id) REFERENCES employees(id),
        FOREIGN KEY (assigned_by) REFERENCES employees(id),
        INDEX idx_route_id (route_id),
        INDEX idx_vehicle_id (vehicle_id),
        INDEX idx_driver_id (driver_id),
        INDEX idx_deliverer_id (deliverer_id),
        INDEX idx_assigned_by (assigned_by),
        INDEX idx_status (status),
        INDEX idx_scheduled_date (scheduled_date),
        INDEX idx_assignment_date (assignment_date)
      )
    `);

    console.log('✅ Successfully created routes and route_assignments tables');
  } catch (error) {
    if (error.message.includes('Table') && error.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist');
    } else {
      console.error('❌ Error creating tables:', error.message);
    }
  }
};

const insertSampleRoutes = async () => {
  try {
    // Insert some sample routes
    await db.sequelize.query(`
      INSERT IGNORE INTO routes (route_name, route_code, description, start_location, end_location, estimated_distance_km, estimated_duration_hours, created_by) VALUES
      ('City Center Route', 'CCR001', 'Main city center delivery route', 'Warehouse A', 'City Center', 15.5, 2.0, 1),
      ('Airport Route', 'APR001', 'Airport delivery and pickup route', 'Warehouse A', 'Airport Terminal', 25.0, 1.5, 1),
      ('Industrial Zone Route', 'IZR001', 'Industrial area delivery route', 'Warehouse B', 'Industrial Zone', 30.2, 3.0, 1),
      ('Residential Route', 'RES001', 'Residential area delivery route', 'Warehouse A', 'Residential District', 12.8, 1.8, 1),
      ('Emergency Route', 'EMR001', 'Emergency delivery route', 'Warehouse A', 'Hospital District', 8.5, 0.5, 1)
    `);

    console.log('✅ Successfully inserted sample routes');
  } catch (error) {
    console.error('❌ Error inserting sample routes:', error.message);
  }
};

// Run the migration
createTables()
  .then(() => insertSampleRoutes())
  .then(() => {
    console.log('🎉 Route management database setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });