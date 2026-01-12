const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'epss_db'
};

async function testRoutesData() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Testing routes data...\n');
    
    // Check if routes table exists
    console.log('1. Checking if routes table exists:');
    try {
      const [tables] = await connection.execute(`
        SHOW TABLES LIKE 'routes'
      `);
      console.log('   Routes table exists:', tables.length > 0);
      
      if (tables.length === 0) {
        console.log('   ❌ Routes table does not exist!');
        return;
      }
    } catch (error) {
      console.log('   ❌ Error checking routes table:', error.message);
      return;
    }
    
    // Check routes table structure
    console.log('\n2. Checking routes table structure:');
    const [columns] = await connection.execute(`
      DESCRIBE routes
    `);
    console.log('   Columns:', columns.map(col => `${col.Field} (${col.Type})`));
    
    // Check if routes table has data
    console.log('\n3. Checking routes table data:');
    const [routes] = await connection.execute(`
      SELECT COUNT(*) as count FROM routes
    `);
    console.log('   Total routes:', routes[0].count);
    
    if (routes[0].count > 0) {
      console.log('\n4. Sample routes:');
      const [sampleRoutes] = await connection.execute(`
        SELECT id, route_name, created_at 
        FROM routes 
        ORDER BY route_name 
        LIMIT 10
      `);
      console.log('   Sample data:', sampleRoutes);
    } else {
      console.log('\n4. ❌ No routes found in the database!');
      console.log('   This is likely why PI Officer HP is getting "Failed to load route data"');
      console.log('   You need to add some routes to the database first.');
    }
    
    // Check if there are any facilities with routes assigned
    console.log('\n5. Checking facilities with routes:');
    try {
      const [facilitiesWithRoutes] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM facilities 
        WHERE route IS NOT NULL AND route != ''
      `);
      console.log('   Facilities with routes assigned:', facilitiesWithRoutes[0].count);
      
      if (facilitiesWithRoutes[0].count > 0) {
        const [sampleFacilityRoutes] = await connection.execute(`
          SELECT DISTINCT route 
          FROM facilities 
          WHERE route IS NOT NULL AND route != ''
          LIMIT 5
        `);
        console.log('   Sample facility routes:', sampleFacilityRoutes.map(f => f.route));
      }
    } catch (error) {
      console.log('   Error checking facilities:', error.message);
    }
    
  } catch (error) {
    console.error('Error testing routes data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the test
if (require.main === module) {
  testRoutesData()
    .then(() => {
      console.log('\nTest completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = testRoutesData;