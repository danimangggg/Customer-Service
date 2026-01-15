const mysql = require('mysql2/promise');

async function checkStoresTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'areacode',
    database: 'customer-service'
  });

  try {
    // Check if stores table exists
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'stores'
    `);

    if (tables.length === 0) {
      console.log('❌ Stores table does NOT exist');
      console.log('Run: node create_stores_table.js');
    } else {
      console.log('✓ Stores table exists');

      // Show table structure
      const [structure] = await connection.query('DESCRIBE stores');
      console.log('\nTable structure:');
      console.table(structure);

      // Show existing stores
      const [stores] = await connection.query('SELECT * FROM stores');
      console.log(`\nExisting stores (${stores.length}):`);
      console.table(stores);
    }

    // Check employee table for store column
    const [empColumns] = await connection.query(`
      SHOW COLUMNS FROM employee LIKE 'store'
    `);

    if (empColumns.length === 0) {
      console.log('\n❌ Employee table does NOT have store column');
    } else {
      console.log('\n✓ Employee table has store column');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkStoresTable();
