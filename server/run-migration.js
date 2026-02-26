const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'customer-service',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read SQL file
    const sqlFile = path.join(__dirname, 'migrations', 'create_app_settings_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Running migration: create_app_settings_table.sql');

    // Execute SQL
    await connection.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('✅ Table "app_settings" created');
    console.log('✅ Default YouTube playlist setting inserted');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

runMigration();
