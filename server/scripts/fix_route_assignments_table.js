const db = require('../src/models');

const fixRouteAssignmentsTable = async () => {
  try {
    console.log('Checking route_assignments table structure...');
    
    // Check if route_id column exists
    const [results] = await db.sequelize.query(`
      SHOW COLUMNS FROM route_assignments LIKE 'route_id'
    `);
    
    if (results.length === 0) {
      console.log('route_id column does not exist, adding it...');
      
      // Add route_id column
      await db.sequelize.query(`
        ALTER TABLE route_assignments 
        ADD COLUMN route_id INT NOT NULL AFTER id,
        ADD CONSTRAINT fk_route_assignments_route 
        FOREIGN KEY (route_id) REFERENCES routes(id)
      `);
      
      console.log('✅ Added route_id column to route_assignments table');
      
      // Update existing records with a default route (if any exist)
      const routeCount = await db.sequelize.query('SELECT COUNT(*) as count FROM routes', {
        type: db.sequelize.QueryTypes.SELECT
      });
      
      if (routeCount[0].count > 0) {
        const firstRoute = await db.sequelize.query('SELECT id FROM routes LIMIT 1', {
          type: db.sequelize.QueryTypes.SELECT
        });
        
        await db.sequelize.query(`
          UPDATE route_assignments 
          SET route_id = ${firstRoute[0].id} 
          WHERE route_id IS NULL OR route_id = 0
        `);
        
        console.log('✅ Updated existing route assignments with default route');
      }
    } else {
      console.log('✅ route_id column already exists');
    }
    
    // Remove old columns that are no longer needed
    const columnsToRemove = [
      'route_name', 
      'route_description', 
      'start_location', 
      'end_location', 
      'waypoints', 
      'estimated_distance_km', 
      'estimated_duration_hours',
      'actual_distance_km',
      'fuel_consumed_liters'
    ];
    
    for (const column of columnsToRemove) {
      try {
        const [columnExists] = await db.sequelize.query(`
          SHOW COLUMNS FROM route_assignments LIKE '${column}'
        `);
        
        if (columnExists.length > 0) {
          await db.sequelize.query(`
            ALTER TABLE route_assignments DROP COLUMN ${column}
          `);
          console.log(`✅ Removed ${column} column`);
        }
      } catch (error) {
        console.log(`ℹ️  Column ${column} doesn't exist or already removed`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing route_assignments table:', error.message);
  }
};

// Run the fix
fixRouteAssignmentsTable()
  .then(() => {
    console.log('🎉 Route assignments table fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });