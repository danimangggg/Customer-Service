const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'epss_db'
};

async function testVehiclesData() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Testing vehicles data...\n');
    
    // Check if vehicles table exists
    console.log('1. Checking if vehicles table exists:');
    try {
      const [tables] = await connection.execute(`
        SHOW TABLES LIKE 'vehicles'
      `);
      console.log('   Vehicles table exists:', tables.length > 0);
      
      if (tables.length === 0) {
        console.log('   ❌ Vehicles table does not exist!');
        console.log('   This is why /api/vehicles/available is returning 404');
        return;
      }
    } catch (error) {
      console.log('   ❌ Error checking vehicles table:', error.message);
      return;
    }
    
    // Check vehicles table structure
    console.log('\n2. Checking vehicles table structure:');
    const [columns] = await connection.execute(`
      DESCRIBE vehicles
    `);
    console.log('   Columns:', columns.map(col => `${col.Field} (${col.Type})`));
    
    // Check if vehicles table has data
    console.log('\n3. Checking vehicles table data:');
    const [vehicles] = await connection.execute(`
      SELECT COUNT(*) as count FROM vehicles
    `);
    console.log('   Total vehicles:', vehicles[0].count);
    
    if (vehicles[0].count > 0) {
      console.log('\n4. Sample vehicles:');
      const [sampleVehicles] = await connection.execute(`
        SELECT id, vehicle_name, plate_number, status, vehicle_type
        FROM vehicles 
        ORDER BY vehicle_name 
        LIMIT 10
      `);
      console.log('   Sample data:', sampleVehicles);
      
      // Check active vehicles
      const [activeVehicles] = await connection.execute(`
        SELECT COUNT(*) as count FROM vehicles WHERE status = 'Active'
      `);
      console.log('   Active vehicles:', activeVehicles[0].count);
      
      if (activeVehicles[0].count === 0) {
        console.log('   ⚠️  No active vehicles found! This might cause issues.');
      }
    } else {
      console.log('\n4. ❌ No vehicles found in the database!');
      console.log('   This is likely why PI Officer HP is getting errors');
      console.log('   You need to add some vehicles to the database first.');
    }
    
    // Check employees table for drivers and deliverers
    console.log('\n5. Checking employees (drivers/deliverers):');
    try {
      const [drivers] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM employees 
        WHERE jobTitle = 'Driver' AND account_status = 'Active'
      `);
      console.log('   Active drivers:', drivers[0].count);
      
      const [deliverers] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM employees 
        WHERE jobTitle = 'Deliverer' AND account_status = 'Active'
      `);
      console.log('   Active deliverers:', deliverers[0].count);
    } catch (error) {
      console.log('   Error checking employees:', error.message);
    }
    
  } catch (error) {
    console.error('Error testing vehicles data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the test
if (require.main === module) {
  testVehiclesData()
    .then(() => {
      console.log('\nTest completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = testVehiclesData;