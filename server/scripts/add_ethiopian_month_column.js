const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'areacode',
  database: 'customer-service'
};

async function addEthiopianMonthColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'route_assignments' AND COLUMN_NAME = 'ethiopian_month'
    `, [dbConfig.database]);

    if (columns.length > 0) {
      console.log('Ethiopian month column already exists');
      return;
    }

    // Add the ethiopian_month column
    await connection.execute(`
      ALTER TABLE route_assignments 
      ADD COLUMN ethiopian_month ENUM(
        'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
        'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
      ) NOT NULL DEFAULT 'Tir' 
      AFTER scheduled_date
    `);

    console.log('Successfully added ethiopian_month column to route_assignments table');

    // Update existing records to have current Ethiopian month (Tir for January)
    await connection.execute(`
      UPDATE route_assignments 
      SET ethiopian_month = 'Tir' 
      WHERE ethiopian_month IS NULL OR ethiopian_month = ''
    `);

    console.log('Updated existing records with default Ethiopian month');

  } catch (error) {
    console.error('Error adding ethiopian_month column:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
addEthiopianMonthColumn();