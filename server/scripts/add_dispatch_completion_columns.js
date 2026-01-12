const db = require('../src/models');

async function addDispatchCompletionColumns() {
  try {
    console.log('🔧 Adding dispatch completion columns...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check if completed_at column exists
    try {
      await db.sequelize.query('SELECT completed_at FROM route_assignments LIMIT 1');
      console.log('✅ completed_at column already exists');
    } catch (error) {
      if (error.message.includes('Unknown column')) {
        console.log('Adding completed_at column...');
        await db.sequelize.query(`
          ALTER TABLE route_assignments 
          ADD COLUMN completed_at DATETIME NULL 
          COMMENT 'When the dispatch was completed'
        `);
        console.log('✅ Added completed_at column');
      } else {
        throw error;
      }
    }
    
    // Check if completed_by column exists
    try {
      await db.sequelize.query('SELECT completed_by FROM route_assignments LIMIT 1');
      console.log('✅ completed_by column already exists');
    } catch (error) {
      if (error.message.includes('Unknown column')) {
        console.log('Adding completed_by column...');
        await db.sequelize.query(`
          ALTER TABLE route_assignments 
          ADD COLUMN completed_by INT NULL 
          COMMENT 'Employee ID who completed the dispatch'
        `);
        console.log('✅ Added completed_by column');
      } else {
        throw error;
      }
    }
    
    // Show updated table structure
    const tableInfo = await db.sequelize.query('DESCRIBE route_assignments', {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('\nUpdated route_assignments table structure:');
    const relevantColumns = tableInfo.filter(col => 
      ['status', 'completed_at', 'completed_by', 'actual_start_time', 'actual_end_time'].includes(col.Field)
    );
    
    relevantColumns.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    console.log('\n🎉 Dispatch completion columns added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

addDispatchCompletionColumns()
  .then(() => {
    console.log('\n✅ Column addition completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Column addition failed:', error);
    process.exit(1);
  });