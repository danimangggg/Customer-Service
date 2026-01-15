const mysql = require('mysql2/promise');
require('dotenv').config();

async function addDepartureKilometer() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'areacode',
      database: process.env.DB_NAME || 'customer-service'
    });

    console.log('Connected to database');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'route_assignments' 
        AND COLUMN_NAME = 'departure_kilometer'
    `, [process.env.DB_NAME || 'customer-service']);

    if (columns.length > 0) {
      console.log('Column departure_kilometer already exists in route_assignments table');
      return;
    }

    // Add departure_kilometer column
    await connection.execute(`
      ALTER TABLE route_assignments 
      ADD COLUMN departure_kilometer DECIMAL(10, 2) NULL 
      COMMENT 'Departure kilometer reading for the route'
      AFTER deliverer_id
    `);

    console.log('Successfully added departure_kilometer column to route_assignments table');

    // Verify the column was added
    const [verify] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'route_assignments' 
        AND COLUMN_NAME = 'departure_kilometer'
    `, [process.env.DB_NAME || 'customer-service']);

    console.log('Verification:', verify);

  } catch (error) {
    console.error('Error adding departure_kilometer column:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
addDepartureKilometer()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
