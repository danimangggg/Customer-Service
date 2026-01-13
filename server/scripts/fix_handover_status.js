const db = require('../src/models');

async function fixHandoverStatus() {
  try {
    console.log('🔧 Fixing handover status for ODN 11...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Update ODN 11 to have completed handover
    const updateQuery = `
      UPDATE odns 
      SET documents_handover = TRUE,
          followup_completed_by = 123,
          followup_completed_at = NOW()
      WHERE id = 11
    `;
    
    const result = await db.sequelize.query(updateQuery, {
      type: db.sequelize.QueryTypes.UPDATE
    });
    
    console.log(`✅ Updated ODN 11 handover status`);
    
    // Verify both ODNs are now ready for quality evaluation
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
    
    console.log('\n🎉 Handover status fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing handover status:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

fixHandoverStatus()
  .then(() => {
    console.log('\n✅ Handover fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Handover fix failed:', error);
    process.exit(1);
  });