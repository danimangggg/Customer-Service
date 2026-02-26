const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'customer-service'
    });

    console.log('✅ Connected to database\n');

    // Check if table exists
    console.log('🔍 Checking if app_settings table exists...');
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'app_settings'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Table app_settings does not exist!');
      console.log('💡 Run: node run-migration.js');
      process.exit(1);
    }
    
    console.log('✅ Table app_settings exists\n');

    // Check table structure
    console.log('📋 Table structure:');
    const [columns] = await connection.query('DESCRIBE app_settings');
    console.table(columns);

    // Check existing data
    console.log('\n📊 Existing settings:');
    const [settings] = await connection.query('SELECT * FROM app_settings');
    
    if (settings.length === 0) {
      console.log('⚠️  No settings found in database');
    } else {
      settings.forEach(setting => {
        console.log(`\n🔑 Key: ${setting.setting_key}`);
        console.log(`📝 Description: ${setting.description || 'N/A'}`);
        console.log(`💾 Value: ${setting.setting_value?.substring(0, 100)}${setting.setting_value?.length > 100 ? '...' : ''}`);
        console.log(`🕐 Updated: ${setting.updated_at}`);
      });
    }

    console.log('\n✅ Database verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyDatabase();
