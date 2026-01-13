const db = require('../src/models');

async function addFollowupColumns() {
  try {
    console.log('🔧 Adding document follow-up columns to ODNs table...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check if follow-up tracking columns exist
    const columnsToAdd = [
      {
        name: 'documents_signed',
        definition: 'BOOLEAN NOT NULL DEFAULT FALSE COMMENT "Whether documents have been signed"'
      },
      {
        name: 'documents_handover',
        definition: 'BOOLEAN NOT NULL DEFAULT FALSE COMMENT "Whether documents have been handed over"'
      },
      {
        name: 'followup_completed_by',
        definition: 'INT NULL COMMENT "Employee ID who completed follow-up"'
      },
      {
        name: 'followup_completed_at',
        definition: 'DATETIME NULL COMMENT "When follow-up was completed"'
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
    
    // Set some ODNs to have confirmed POD status for testing
    console.log('\nSetting up test data for follow-up...');
    
    // Update some ODNs to have confirmed POD
    const updatePODQuery = `
      UPDATE odns o
      INNER JOIN processes p ON o.process_id = p.id
      SET o.pod_confirmed = TRUE,
          o.pod_confirmed_by = 123,
          o.pod_confirmed_at = NOW()
      WHERE p.reporting_month = 'Tir 2018'
        AND o.odn_number IN ('566655', '4864648')
    `;
    
    const result = await db.sequelize.query(updatePODQuery, {
      type: db.sequelize.QueryTypes.UPDATE
    });
    
    console.log(`✅ Updated ${result[1]} ODNs to have confirmed POD status`);
    
    // Verify the updates
    const verifyQuery = `
      SELECT o.id, o.odn_number, o.pod_confirmed, f.facility_name
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE p.reporting_month = 'Tir 2018'
        AND o.pod_confirmed = TRUE
      ORDER BY o.id
    `;
    
    const confirmedODNs = await db.sequelize.query(verifyQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`\nODNs with confirmed POD (ready for follow-up): ${confirmedODNs.length}`);
    confirmedODNs.forEach(odn => {
      console.log(`  ${odn.id}: ${odn.odn_number} - ${odn.facility_name}`);
    });
    
    console.log('\n🎉 Document follow-up columns and test data setup completed!');
    
  } catch (error) {
    console.error('❌ Error adding follow-up columns:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

addFollowupColumns()
  .then(() => {
    console.log('\n✅ Follow-up setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Follow-up setup failed:', error);
    process.exit(1);
  });