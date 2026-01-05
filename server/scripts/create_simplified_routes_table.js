const db = require('../src/models');

const createSimplifiedRoutesTable = async () => {
  try {
    // Drop the old routes table if it exists
    await db.sequelize.query('DROP TABLE IF EXISTS routes');
    console.log('✅ Dropped old routes table');

    // Create new simplified routes table
    await db.sequelize.query(`
      CREATE TABLE routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_name VARCHAR(200) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_route_name (route_name)
      )
    `);
    console.log('✅ Created new simplified routes table');

    // Insert sample routes
    await db.sequelize.query(`
      INSERT INTO routes (route_name) VALUES
      ('City Center Route'),
      ('Airport Route'),
      ('Industrial Zone Route'),
      ('Residential Route'),
      ('Emergency Route'),
      ('Downtown Express'),
      ('Suburban Loop'),
      ('Highway Route'),
      ('Business District'),
      ('Shopping Mall Route')
    `);
    console.log('✅ Inserted sample routes');

  } catch (error) {
    console.error('❌ Error creating simplified routes table:', error.message);
  }
};

// Run the migration
createSimplifiedRoutesTable()
  .then(() => {
    console.log('🎉 Simplified routes table setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });