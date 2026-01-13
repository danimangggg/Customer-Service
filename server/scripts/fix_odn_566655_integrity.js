const db = require('../src/models');

async function fixODN566655Integrity() {
  try {
    console.log('🔧 Fixing ODN 566655 data integrity issue...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Step 1: Revert process status to 'completed' so O2C Officer can properly complete it
    console.log('Step 1: Reverting process status to "completed"...');
    const revertProcessQuery = `
      UPDATE processes 
      SET status = 'completed' 
      WHERE id = 16
    `;
    
    await db.sequelize.query(revertProcessQuery, {
      type: db.sequelize.QueryTypes.UPDATE
    });
    console.log('✅ Process status reverted to "completed"');
    
    // Step 2: Reset all downstream workflow statuses
    console.log('\nStep 2: Resetting downstream workflow statuses...');
    const resetODNQuery = `
      UPDATE odns 
      SET pod_confirmed = FALSE,
          pod_reason = NULL,
          pod_confirmed_by = NULL,
          pod_confirmed_at = NULL,
          documents_signed = FALSE,
          documents_handover = FALSE,
          followup_completed_by = NULL,
          followup_completed_at = NULL,
          quality_confirmed = FALSE,
          quality_feedback = NULL,
          quality_evaluated_by = NULL,
          quality_evaluated_at = NULL
      WHERE process_id = 16
    `;
    
    await db.sequelize.query(resetODNQuery, {
      type: db.sequelize.QueryTypes.UPDATE
    });
    console.log('✅ ODN workflow statuses reset');
    
    // Step 3: Verify the fix
    console.log('\nStep 3: Verifying the fix...');
    const verifyQuery = `
      SELECT 
        o.id as odn_id,
        o.odn_number,
        o.status as odn_status,
        o.pod_confirmed,
        o.documents_signed,
        o.documents_handover,
        o.quality_confirmed,
        p.id as process_id,
        p.status as process_status,
        f.facility_name
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE o.odn_number = '566655'
        AND f.facility_name = 'Abuye Health Center'
    `;
    
    const result = await db.sequelize.query(verifyQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (result.length > 0) {
      const odn = result[0];
      console.log('📋 Fixed ODN Status:');
      console.log(`  ODN: ${odn.odn_number} - ${odn.facility_name}`);
      console.log(`  Process Status: ${odn.process_status} ✅`);
      console.log(`  ODN Status: ${odn.odn_status}`);
      console.log(`  POD Confirmed: ${odn.pod_confirmed ? 'Yes' : 'No'} ✅`);
      console.log(`  Documents Signed: ${odn.documents_signed ? 'Yes' : 'No'} ✅`);
      console.log(`  Documents Handover: ${odn.documents_handover ? 'Yes' : 'No'} ✅`);
      console.log(`  Quality Confirmed: ${odn.quality_confirmed ? 'Yes' : 'No'} ✅`);
    }
    
    console.log('\n🎯 Expected Behavior After Fix:');
    console.log('  ✅ ODN will NO LONGER appear in:');
    console.log('     - PI Officer Vehicle Requests');
    console.log('     - Dispatch Management');
    console.log('     - Documentation Management');
    console.log('     - Document Follow-up');
    console.log('     - Quality Evaluation');
    console.log('');
    console.log('  ✅ ODN will appear in:');
    console.log('     - O2C Officer active processes (ready for completion)');
    console.log('');
    console.log('  📝 Next Steps:');
    console.log('     1. O2C Officer should complete the process properly');
    console.log('     2. EWM Officer should then complete EWM');
    console.log('     3. Process will flow through workflow correctly');
    
    console.log('\n🎉 Data integrity fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing ODN integrity:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

fixODN566655Integrity()
  .then(() => {
    console.log('\n✅ ODN 566655 integrity fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Integrity fix failed:', error);
    process.exit(1);
  });