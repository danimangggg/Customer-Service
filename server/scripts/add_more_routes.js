const db = require('../src/models');

async function addMoreRoutes() {
  try {
    console.log('🛣️  Adding more sample routes...\n');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check current routes count
    const currentCount = await db.route.count();
    console.log(`Current routes: ${currentCount}`);
    
    if (currentCount >= 5) {
      console.log('✅ Sufficient routes already exist');
      
      // Show existing routes
      const routes = await db.route.findAll({
        attributes: ['id', 'route_name'],
        order: [['route_name', 'ASC']]
      });
      
      console.log('\nExisting routes:');
      routes.forEach(route => {
        console.log(`  ${route.id}: ${route.route_name}`);
      });
      
      return;
    }
    
    // Add more sample routes
    const additionalRoutes = [
      { route_name: 'Route D - West District' },
      { route_name: 'Route E - Central District' },
      { route_name: 'Route F - Northeast District' },
      { route_name: 'Route G - Southwest District' },
      { route_name: 'Route H - Southeast District' }
    ];
    
    console.log('Adding additional routes...');
    let addedCount = 0;
    
    for (const routeData of additionalRoutes) {
      try {
        // Check if route with same name already exists
        const existing = await db.route.findOne({
          where: { route_name: routeData.route_name }
        });
        
        if (existing) {
          console.log(`  - Skipped (already exists): ${routeData.route_name}`);
          continue;
        }
        
        await db.route.create(routeData);
        console.log(`  ✅ Added: ${routeData.route_name}`);
        addedCount++;
      } catch (error) {
        console.log(`  ❌ Error adding ${routeData.route_name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Successfully added ${addedCount} additional routes!`);
    
    // Show final count and list
    const finalCount = await db.route.count();
    console.log(`Total routes now: ${finalCount}`);
    
    const allRoutes = await db.route.findAll({
      attributes: ['id', 'route_name'],
      order: [['route_name', 'ASC']]
    });
    
    console.log('\nAll routes in database:');
    allRoutes.forEach(route => {
      console.log(`  ${route.id}: ${route.route_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding routes:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
addMoreRoutes()
  .then(() => {
    console.log('\n✅ Route addition completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to add routes:', error);
    process.exit(1);
  });