const db = require('../src/models');

async function checkODNColumns() {
  try {
    console.log('=== Checking ODN Table Structure ===\n');
    
    const columns = await db.sequelize.query('SHOW COLUMNS FROM odns', {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('ODN Table Columns:');
    columns.forEach(col => {
      console.log(`  ${col.Field.padEnd(30)} ${col.Type.padEnd(20)} Null: ${col.Null.padEnd(5)} Key: ${col.Key.padEnd(5)} Default: ${col.Default || 'NULL'}`);
    });
    
    console.log('\n=== Checking for quality_* columns ===');
    const qualityColumns = columns.filter(col => col.Field.startsWith('quality_'));
    if (qualityColumns.length > 0) {
      console.log('Found quality columns:');
      qualityColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type})`);
      });
    } else {
      console.log('❌ No quality_* columns found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkODNColumns();
