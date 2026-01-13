const db = require('../src/models');

async function addPODTrackingColumns() {
  try {
    console.log('🔧 Adding POD tracking columns to ODNs table...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check current ODNs count
    const odnsCount = await db.sequelize.query('SELECT COUNT(*) as count FROM odns', {
      type: db.sequelize.QueryTypes.SELECT
    });
    console.log(`Current ODNs in database: ${odnsCount[0].count}`);
    
    // Check if POD tracking columns exist
    const columnsToAdd = [
      {
        name: 'pod_confirmed',
        definition: 'BOOLEAN NOT NULL DEFAULT FALSE COMMENT "Whether POD has been confirmed"'
      },
      {
        name: 'pod_reason',
        definition: 'TEXT NULL COMMENT "Reason if POD is not confirmed"'
      },
      {
        name: 'pod_confirmed_by',
        definition: 'INT NULL COMMENT "Employee ID who confirmed POD"'
      },
      {
        name: 'pod_confirmed_at',
        definition: 'DATETIME NULL COMMENT "When POD was confirmed"'
      }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await db.sequelize.query(`SELECT ${column.name} FROM odns LIMIT 1`);
        console.log(`✅ ${column.name} column already exists`);
      } catch (error) {
        if (error.message.includes('Unknown column')) {
          console.log(`Adding ${column.name} column...`);
          await db.sequelize.query(`ALTER TABLE odns ADD COLUMN ${column.name} ${column.definition}`);
          console.log(`✅ Added ${column.name} column`);
        } else {
          console.error(`Error checking ${column.name}:`, error.message);
        }
      }
    }
    
    // Show some sample ODNs if they exist
    if (odnsCount[0].count > 0) {
      const sampleODNs = await db.sequelize.query(`
        SELECT o.id, o.odn_number, o.status, p.reporting_month, f.facility_name
        FROM odns o
        INNER JOIN processes p ON o.process_id = p.id
        INNER JOIN facilities f ON p.facility_id = f.id
        ORDER BY o.id DESC
        LIMIT 5
      `, {
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log('\nSample ODNs:');
      sampleODNs.forEach(odn => {
        console.log(`  ${odn.id}: ${odn.odn_number} - ${odn.facility_name} (${odn.reporting_month})`);
      });
    } else {
      console.log('\n⚠️  No ODNs found in database. This is why documentation management is failing.');
      console.log('   You may need to create some test ODNs or complete some processes first.');
    }
    
    // Check for completed dispatches
    const completedDispatches = await db.sequelize.query(`
      SELECT COUNT(*) as count 
      FROM route_assignments 
      WHERE status = 'Completed'
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`\nCompleted dispatches: ${completedDispatches[0].count}`);
    
    if (completedDispatches[0].count === 0) {
      console.log('⚠️  No completed dispatches found. Documentation management needs completed dispatches to show ODNs.');
    }
    
    console.log('\n🎉 POD tracking columns setup completed!');
    
  } catch (error) {
    console.error('❌ Error adding POD tracking columns:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

addPODTrackingColumns()
  .then(() => {
    console.log('\n✅ POD tracking setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ POD tracking setup failed:', error);
    process.exit(1);
  });