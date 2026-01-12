const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'epss_db'
};

async function fixEthiopianMonthEnum() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Fixing Ethiopian month ENUM values...');
    
    // First, update any existing 'Miazia' values to 'Miyazya'
    const updateQuery = `
      UPDATE route_assignments 
      SET ethiopian_month = 'Miyazya' 
      WHERE ethiopian_month = 'Miazia'
    `;
    
    const [updateResult] = await connection.execute(updateQuery);
    console.log(`Updated ${updateResult.affectedRows} rows from 'Miazia' to 'Miyazya'`);
    
    // Then modify the ENUM to use the correct spelling
    const alterQuery = `
      ALTER TABLE route_assignments 
      MODIFY COLUMN ethiopian_month ENUM(
        'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
        'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
      ) NOT NULL DEFAULT 'Tir'
    `;
    
    await connection.execute(alterQuery);
    console.log('Successfully updated ENUM values in route_assignments table');
    
    console.log('Ethiopian month ENUM fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing Ethiopian month ENUM:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the migration
if (require.main === module) {
  fixEthiopianMonthEnum()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = fixEthiopianMonthEnum;