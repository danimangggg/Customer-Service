const mysql = require('mysql2/promise');

async function createStoresTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'areacode',
    database: 'customer-service'
  });

  try {
    console.log('Creating stores table...');

    // Create stores table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Stores table created successfully');

    // Check if employee table has store column
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM employee LIKE 'store'
    `);

    if (columns.length === 0) {
      console.log('Adding store column to employee table...');
      await connection.query(`
        ALTER TABLE employee ADD COLUMN store VARCHAR(100) AFTER department
      `);
      console.log('✓ Store column added to employee table');
    } else {
      console.log('✓ Store column already exists in employee table');
    }

    // Insert some default stores
    console.log('Inserting default stores...');
    
    const defaultStores = [
      { store_name: 'HP', description: 'Health Program Store' },
      { store_name: 'AA1', description: 'Addis Ababa Store 1' },
      { store_name: 'AA2', description: 'Addis Ababa Store 2' },
      { store_name: 'AA3', description: 'Addis Ababa Store 3' }
    ];

    for (const store of defaultStores) {
      try {
        await connection.query(
          'INSERT INTO stores (store_name, description, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
          [store.store_name, store.description]
        );
        console.log(`✓ Added store: ${store.store_name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`- Store ${store.store_name} already exists`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✓ Setup completed successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

createStoresTable();
