const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'epss_db'
};

async function testDispatchData() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Testing dispatch management data...\n');
    
    // Check if route_assignments table exists and has data
    console.log('1. Checking route_assignments table:');
    const [routeAssignments] = await connection.execute(`
      SELECT COUNT(*) as count, 
             GROUP_CONCAT(DISTINCT ethiopian_month) as months,
             GROUP_CONCAT(DISTINCT status) as statuses
      FROM route_assignments
    `);
    console.log('   Route assignments:', routeAssignments[0]);
    
    // Check if routes table exists and has data
    console.log('\n2. Checking routes table:');
    const [routes] = await connection.execute(`
      SELECT COUNT(*) as count, 
             GROUP_CONCAT(DISTINCT route_name LIMIT 5) as sample_routes
      FROM routes
    `);
    console.log('   Routes:', routes[0]);
    
    // Check if vehicles table exists and has data
    console.log('\n3. Checking vehicles table:');
    const [vehicles] = await connection.execute(`
      SELECT COUNT(*) as count,
             GROUP_CONCAT(DISTINCT vehicle_name LIMIT 3) as sample_vehicles
      FROM vehicles
    `);
    console.log('   Vehicles:', vehicles[0]);
    
    // Check if employees table exists and has data
    console.log('\n4. Checking employees table:');
    const [employees] = await connection.execute(`
      SELECT COUNT(*) as count,
             GROUP_CONCAT(DISTINCT jobTitle LIMIT 5) as job_titles
      FROM employees
    `);
    console.log('   Employees:', employees[0]);
    
    // Check if facilities table exists and has data
    console.log('\n5. Checking facilities table:');
    const [facilities] = await connection.execute(`
      SELECT COUNT(*) as count,
             GROUP_CONCAT(DISTINCT route LIMIT 5) as sample_routes
      FROM facilities
      WHERE route IS NOT NULL
    `);
    console.log('   Facilities with routes:', facilities[0]);
    
    // Check if processes table exists and has data
    console.log('\n6. Checking processes table:');
    const [processes] = await connection.execute(`
      SELECT COUNT(*) as count,
             GROUP_CONCAT(DISTINCT status LIMIT 5) as statuses,
             GROUP_CONCAT(DISTINCT reporting_month LIMIT 3) as months
      FROM processes
    `);
    console.log('   Processes:', processes[0]);
    
    // Check for current Ethiopian month data
    console.log('\n7. Checking current month data (Tir 2017):');
    const [currentData] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT ra.id) as route_assignments,
        COUNT(DISTINCT p.id) as processes_vehicle_requested
      FROM route_assignments ra
      LEFT JOIN routes r ON ra.route_id = r.id
      LEFT JOIN facilities f ON f.route = r.route_name
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = 'Tir 2017' AND p.status = 'vehicle_requested'
      WHERE ra.ethiopian_month = 'Tir'
        AND ra.vehicle_id IS NOT NULL
        AND ra.driver_id IS NOT NULL
    `);
    console.log('   Current month data:', currentData[0]);
    
    console.log('\n8. Sample route assignment with full details:');
    const [sampleData] = await connection.execute(`
      SELECT 
        ra.id as assignment_id,
        r.route_name,
        ra.status as assignment_status,
        ra.ethiopian_month,
        v.vehicle_name,
        v.plate_number,
        d.full_name as driver_name,
        del.full_name as deliverer_name
      FROM route_assignments ra
      LEFT JOIN routes r ON ra.route_id = r.id
      LEFT JOIN vehicles v ON ra.vehicle_id = v.id
      LEFT JOIN employees d ON ra.driver_id = d.id
      LEFT JOIN employees del ON ra.deliverer_id = del.id
      WHERE ra.vehicle_id IS NOT NULL
        AND ra.driver_id IS NOT NULL
      LIMIT 3
    `);
    console.log('   Sample assignments:', sampleData);
    
  } catch (error) {
    console.error('Error testing dispatch data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the test
if (require.main === module) {
  testDispatchData()
    .then(() => {
      console.log('\nTest completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = testDispatchData;