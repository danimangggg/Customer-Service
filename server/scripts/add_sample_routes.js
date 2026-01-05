const db = require('../src/models');

const addSampleRoutes = async () => {
  try {
    console.log('Sample routes script available but not inserting data as requested.');
    console.log('To add sample routes manually, uncomment the code below.');
    
    /*
    const sampleRoutes = [
      'City Center Route',
      'Airport Route',
      'Industrial Zone Route',
      'Residential Route',
      'Emergency Route',
      'Downtown Express',
      'Suburban Loop',
      'Highway Route',
      'Business District',
      'Shopping Mall Route'
    ];
    
    for (const routeName of sampleRoutes) {
      try {
        await db.route.create({ route_name: routeName });
        console.log(`✅ Added route: ${routeName}`);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`ℹ️  Route already exists: ${routeName}`);
        } else {
          console.error(`❌ Error adding route ${routeName}:`, error.message);
        }
      }
    }
    */
    
  } catch (error) {
    console.error('❌ Error in sample routes script:', error.message);
  }
};

// Run the script
addSampleRoutes()
  .then(() => {
    console.log('🎉 Sample routes script completed (no data inserted)');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });