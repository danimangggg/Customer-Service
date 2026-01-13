const db = require('../src/models');

async function addQualityEvaluationColumns() {
  try {
    console.log('🔧 Adding quality evaluation columns to ODNs table...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check if quality evaluation columns exist
    const columnsToAdd = [
      {
        name: 'quality_confirmed',
        definition: 'BOOLEAN NOT NULL DEFAULT FALSE COMMENT "Whether quality has been confirmed"'
      },
      {
        name: 'quality_feedback',
        definition: 'TEXT NULL COMMENT "Quality evaluation feedback"'
      },
      {
        name: 'quality_evaluated_by',
        definition: 'INT NULL COMMENT "Employee ID who evaluated quality"'
      },
      {
        name: 'quality_evaluated_at',
        definition: 'DATETIME NULL COMMENT "When quality was evaluated"'
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
    
    // Set up test data for quality evaluation
    console.log('\nSetting up test data for quality evaluation...');
    
    // Update some ODNs to have completed document follow-up (signed and handover)
    const updateFollowupQuery = `
      UPDATE odns o
      INNER JOIN processes p ON o.process_id = p.id
      SET o.documents_signed = TRUE,
          o.documents_handover = TRUE,
          o.followup_completed_by = 123,
          o.followup_completed_at = NOW()
      WHERE p.reporting_month = 'Tir 2018'
        AND o.pod_confirmed = TRUE
        AND o.odn_number IN ('566655', '4864648')
    `;
    
    const result = await db.sequelize.query(updateFollowupQuery, {
      type: db.sequelize.QueryTypes.UPDATE
    });
    
    console.log(`✅ Updated ${result[1]} ODNs to have completed document follow-up`);
    
    // Verify the updates
    const verifyQuery = `
      SELECT 
        o.id, 
        o.odn_number, 
        o.pod_confirmed,
        o.documents_signed,
        o.documents_handover,
        o.quality_confirmed,
        f.facility_name
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE p.reporting_month = 'Tir 2018'
        AND o.pod_confirmed = TRUE
        AND o.documents_signed = TRUE
        AND o.documents_handover = TRUE
      ORDER BY o.id
    `;
    
    const readyODNs = await db.sequelize.query(verifyQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`\nODNs ready for quality evaluation: ${readyODNs.length}`);
    readyODNs.forEach(odn => {
      console.log(`  ${odn.id}: ${odn.odn_number} - ${odn.facility_name}`);
      console.log(`    POD: ${odn.pod_confirmed ? 'Confirmed' : 'Pending'}, Docs Signed: ${odn.documents_signed ? 'Yes' : 'No'}, Handover: ${odn.documents_handover ? 'Yes' : 'No'}, Quality: ${odn.quality_confirmed ? 'Confirmed' : 'Pending'}`);
    });
    
    console.log('\n🎉 Quality evaluation columns and test data setup completed!');
    
  } catch (error) {
    console.error('❌ Error adding quality evaluation columns:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

addQualityEvaluationColumns()
  .then(() => {
    console.log('\n✅ Quality evaluation setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Quality evaluation setup failed:', error);
    process.exit(1);
  });