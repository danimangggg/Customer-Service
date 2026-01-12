const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'epss_db'
};

const sampleRoutes = [
  'Route A - North',
  'Route B - South', 
  'Route C - East',
  'Route D - West',
  'Route E - Central',
  'Route F - Northeast',
  'Route G - Southeast',
  'Route H - Northwest',
  'Route I - Southwest',
  'Route J - Metro'
];

async function addSampleRoutes() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Adding sample routes...\n');
    
    // Check if routes table exists
    const [tables] = await connection.execute(`SHOW TABLES LIKE 'routes'`);
    if (tables.length === 0) {
      console.log('❌ Routes table does not exist. Please create it first.');
      return;
    }
    
    // Check current routes count
    const [currentCount] = await connection.execute(`SELECT COUNT(*) as count FROM routes`);
    console.log(`Current routes in database: ${currentCount[0].count}`);
    
    if (currentCount[0].count > 0) {
      console.log('Routes already exist. Skipping sample data insertion.');
      
      // Show existing routes
      const [existingRoutes] = await connection.execute(`
        SELECT id, route_name FROM routes ORDER BY route_name LIMIT 10
      `);
      console.log('Existing routes:', existingRoutes);
      return;
    }
    
    // Insert sample routes
    console.log('Inserting sample routes...');
    let insertedCount = 0;
    
    for (const routeName of sampleRoutes) {
      try {
        await connection.execute(`
          INSERT INTO routes (route_name, created_at, updated_at) 
          VALUES (?, NOW(), NOW())
        `, [routeName]);
        
        console.log(`✓ Added: ${routeName}`);
        insertedCount++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`- Skipped (already exists): ${routeName}`);
        } else {
          console.error(`❌ Error adding ${routeName}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ Successfully added ${insertedCount} routes`);
    
    // Verify the insertion
    const [finalCount] = await connection.execute(`SELECT COUNT(*) as count FROM routes`);
    console.log(`Total routes now: ${finalCount[0].count}`);
    
    // Show all routes
    const [allRoutes] = await connection.execute(`
      SELECT id, route_name, created_at FROM routes ORDER BY route_name
    `);
    console.log('\nAll routes in database:');
    allRoutes.forEach(route => {
      console.log(`  ${route.id}: ${route.route_name}`);
    });
    
  } catch (error) {
    console.error('Error adding sample routes:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the script
if (require.main === module) {
  addSampleRoutes()
    .then(() => {
      console.log('\nSample routes addition completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = addSampleRoutes;