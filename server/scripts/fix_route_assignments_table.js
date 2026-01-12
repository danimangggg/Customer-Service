const db = require('../src/models');

async function fixRouteAssignmentsTable() {
  try {
    console.log('🔧 Fixing route_assignments table...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check if ethiopian_month column exists
    try {
      await db.sequelize.query('SELECT ethiopian_month FROM route_assignments LIMIT 1');
      console.log('✅ ethiopian_month column already exists');
    } catch (error) {
      if (error.message.includes('Unknown column')) {
        console.log('Adding ethiopian_month column...');
        
        // Add the missing column
        await db.sequelize.query(`
          ALTER TABLE route_assignments 
          ADD COLUMN ethiopian_month ENUM(
            'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
            'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
          ) NOT NULL DEFAULT 'Tir' 
          COMMENT 'Ethiopian calendar month for the assignment'
        `);
        
        console.log('✅ Added ethiopian_month column');
      } else {
        throw error;
      }
    }
    
    // Check if other missing columns exist and add them
    const columnsToCheck = [
      {
        name: 'actual_distance_km',
        definition: 'DECIMAL(8,2) NULL COMMENT "Actual distance traveled in kilometers"'
      },
      {
        name: 'fuel_consumed_liters',
        definition: 'DECIMAL(8,2) NULL COMMENT "Fuel consumed in liters"'
      }
    ];
    
    for (const column of columnsToCheck) {
      try {
        await db.sequelize.query(`SELECT ${column.name} FROM route_assignments LIMIT 1`);
        console.log(`✅ ${column.name} column already exists`);
      } catch (error) {
        if (error.message.includes('Unknown column')) {
          console.log(`Adding ${column.name} column...`);
          await db.sequelize.query(`ALTER TABLE route_assignments ADD COLUMN ${column.name} ${column.definition}`);
          console.log(`✅ Added ${column.name} column`);
        }
      }
    }
    
    // Show table structure
    const tableInfo = await db.sequelize.query('DESCRIBE route_assignments', {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('\nCurrent route_assignments table structure:');
    tableInfo.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    console.log('\n🎉 Route assignments table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing route assignments table:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

fixRouteAssignmentsTable()
  .then(() => {
    console.log('\n✅ Table fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Table fix failed:', error);
    process.exit(1);
  });