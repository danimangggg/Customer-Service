const db = require('../src/models');

async function checkODNSchema() {
  try {
    console.log('🔍 Checking ODN table schema...\n');

    // Get table structure
    const [results] = await db.sequelize.query("DESCRIBE odns");
    
    console.log('ODN Table Structure:');
    console.log('===================');
    results.forEach(column => {
      console.log(`${column.Field.padEnd(25)} | ${column.Type.padEnd(20)} | ${column.Null.padEnd(5)} | ${column.Key.padEnd(5)} | ${column.Default || 'NULL'}`);
    });

    console.log('\n🔍 Checking for missing columns...');
    const columnNames = results.map(col => col.Field);
    
    const requiredColumns = ['pod_number', 'arrival_kilometer'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns.join(', '));
      console.log('\n💡 These columns need to be added to the ODN table.');
    } else {
      console.log('✅ All required columns are present.');
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkODNSchema();