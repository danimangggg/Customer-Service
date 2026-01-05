const db = require('../src/models');

const addMissingColumns = async () => {
  try {
    console.log('Adding missing columns to route_assignments table...');
    
    // Check and add deliverer_id column
    const [delivererResults] = await db.sequelize.query(`
      SHOW COLUMNS FROM route_assignments LIKE 'deliverer_id'
    `);
    
    if (delivererResults.length === 0) {
      console.log('Adding deliverer_id column...');
      await db.sequelize.query(`
        ALTER TABLE route_assignments 
        ADD COLUMN deliverer_id INT NULL AFTER driver_id,
        ADD CONSTRAINT fk_route_assignments_deliverer 
        FOREIGN KEY (deliverer_id) REFERENCES employees(id)
      `);
      console.log('✅ Added deliverer_id column');
    } else {
      console.log('✅ deliverer_id column already exists');
    }
    
  } catch (error) {
    console.error('❌ Error adding missing columns:', error.message);
  }
};

// Run the script
addMissingColumns()
  .then(() => {
    console.log('🎉 Missing columns added successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });