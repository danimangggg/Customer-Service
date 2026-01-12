const db = require('../src/models');

async function fixDatabaseIssues() {
  try {
    console.log('🔧 Fixing database issues...\n');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // 1. Check and create routes if missing
    console.log('1. Checking routes table...');
    const routesCount = await db.route.count();
    console.log(`   Current routes: ${routesCount}`);
    
    if (routesCount === 0) {
      console.log('   Adding sample routes...');
      const sampleRoutes = [
        'Route A - North',
        'Route B - South', 
        'Route C - East',
        'Route D - West',
        'Route E - Central'
      ];
      
      for (const routeName of sampleRoutes) {
        await db.route.create({
          route_name: routeName
        });
        console.log(`   ✅ Added: ${routeName}`);
      }
    }
    
    // 2. Check and create vehicles if missing
    console.log('\n2. Checking vehicles table...');
    const vehiclesCount = await db.vehicle.count();
    console.log(`   Current vehicles: ${vehiclesCount}`);
    
    if (vehiclesCount === 0) {
      console.log('   Adding sample vehicles...');
      const sampleVehicles = [
        { vehicle_name: 'Toyota Hilux 1', plate_number: 'AA-001-2024', vehicle_type: 'Pickup Truck', status: 'Active' },
        { vehicle_name: 'Toyota Hilux 2', plate_number: 'AA-002-2024', vehicle_type: 'Pickup Truck', status: 'Active' },
        { vehicle_name: 'Isuzu D-Max 1', plate_number: 'AA-003-2024', vehicle_type: 'Pickup Truck', status: 'Active' },
        { vehicle_name: 'Ford Transit 1', plate_number: 'AA-004-2024', vehicle_type: 'Van', status: 'Active' },
        { vehicle_name: 'Mitsubishi L200 1', plate_number: 'AA-005-2024', vehicle_type: 'Pickup Truck', status: 'Active' }
      ];
      
      for (const vehicle of sampleVehicles) {
        await db.vehicle.create(vehicle);
        console.log(`   ✅ Added: ${vehicle.vehicle_name} (${vehicle.plate_number})`);
      }
    }
    
    // 3. Create pi_vehicle_requests table if missing
    console.log('\n3. Checking pi_vehicle_requests table...');
    try {
      await db.sequelize.query('SELECT 1 FROM pi_vehicle_requests LIMIT 1');
      console.log('   ✅ pi_vehicle_requests table exists');
    } catch (error) {
      console.log('   Creating pi_vehicle_requests table...');
      await db.sequelize.query(`
        CREATE TABLE IF NOT EXISTS pi_vehicle_requests (
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
          
          UNIQUE KEY unique_route_period (route_id, month, year)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ Created pi_vehicle_requests table');
    }
    
    // 4. Check employees for drivers/deliverers
    console.log('\n4. Checking employees...');
    const driversCount = await db.employee.count({ where: { jobTitle: 'Driver' } });
    const deliverersCount = await db.employee.count({ where: { jobTitle: 'Deliverer' } });
    console.log(`   Drivers: ${driversCount}, Deliverers: ${deliverersCount}`);
    
    if (driversCount === 0) {
      console.log('   Adding sample drivers...');
      const sampleDrivers = [
        { full_name: 'John Driver', user_name: 'driver1', jobTitle: 'Driver', account_status: 'Active', store: 'AA1' },
        { full_name: 'Mike Driver', user_name: 'driver2', jobTitle: 'Driver', account_status: 'Active', store: 'AA1' },
        { full_name: 'David Driver', user_name: 'driver3', jobTitle: 'Driver', account_status: 'Active', store: 'AA2' }
      ];
      
      for (const driver of sampleDrivers) {
        await db.employee.create(driver);
        console.log(`   ✅ Added driver: ${driver.full_name}`);
      }
    }
    
    if (deliverersCount === 0) {
      console.log('   Adding sample deliverers...');
      const sampleDeliverers = [
        { full_name: 'Tom Deliverer', user_name: 'deliverer1', jobTitle: 'Deliverer', account_status: 'Active', store: 'AA1' },
        { full_name: 'Sam Deliverer', user_name: 'deliverer2', jobTitle: 'Deliverer', account_status: 'Active', store: 'AA2' }
      ];
      
      for (const deliverer of sampleDeliverers) {
        await db.employee.create(deliverer);
        console.log(`   ✅ Added deliverer: ${deliverer.full_name}`);
      }
    }
    
    console.log('\n🎉 Database issues fixed successfully!');
    console.log('\nSummary:');
    console.log(`   Routes: ${await db.route.count()}`);
    console.log(`   Vehicles: ${await db.vehicle.count()}`);
    console.log(`   Drivers: ${await db.employee.count({ where: { jobTitle: 'Driver' } })}`);
    console.log(`   Deliverers: ${await db.employee.count({ where: { jobTitle: 'Deliverer' } })}`);
    
  } catch (error) {
    console.error('❌ Error fixing database issues:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Run the fix
fixDatabaseIssues()
  .then(() => {
    console.log('\n✅ All database issues resolved!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to fix database issues:', error);
    process.exit(1);
  });