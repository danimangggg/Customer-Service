const db = require('../src/models');

async function testQualityUpdate() {
  try {
    console.log('=== Testing Quality Evaluation Update ===\n');
    
    // 1. Find an ODN to test with
    console.log('1. Finding an ODN for testing...');
    const odns = await db.sequelize.query(`
      SELECT o.id, o.odn_number, o.quality_confirmed, o.quality_feedback
      FROM odns o
      LIMIT 1
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (odns.length === 0) {
      console.log('❌ No ODNs found in database');
      return;
    }
    
    const testODN = odns[0];
    console.log(`Found ODN: ${testODN.odn_number} (ID: ${testODN.id})`);
    console.log(`Current quality_confirmed: ${testODN.quality_confirmed}`);
    console.log(`Current quality_feedback: ${testODN.quality_feedback || 'NULL'}\n`);
    
    // 2. Try to update it
    console.log('2. Attempting to update quality evaluation...');
    const newQualityConfirmed = testODN.quality_confirmed ? 0 : 1;
    const newFeedback = 'Test feedback from script';
    const evaluatedBy = 1; // Test with user ID 1
    
    console.log(`New quality_confirmed: ${newQualityConfirmed}`);
    console.log(`New quality_feedback: ${newFeedback}`);
    console.log(`Evaluated by: ${evaluatedBy}\n`);
    
    const updateQuery = `
      UPDATE odns 
      SET quality_confirmed = ?, 
          quality_feedback = ?,
          quality_evaluated_by = ?,
          quality_evaluated_at = NOW()
      WHERE id = ?
    `;
    
    const result = await db.sequelize.query(updateQuery, {
      replacements: [newQualityConfirmed, newFeedback, evaluatedBy, testODN.id],
      type: db.sequelize.QueryTypes.UPDATE
    });
    
    console.log('Update result:', result);
    console.log('Rows affected:', result[1] || 0);
    
    // 3. Verify the update
    console.log('\n3. Verifying the update...');
    const verifyODN = await db.sequelize.query(`
      SELECT id, odn_number, quality_confirmed, quality_feedback, quality_evaluated_by, quality_evaluated_at
      FROM odns
      WHERE id = ?
    `, {
      replacements: [testODN.id],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (verifyODN.length > 0) {
      const updated = verifyODN[0];
      console.log('✓ ODN after update:');
      console.log(`  quality_confirmed: ${updated.quality_confirmed}`);
      console.log(`  quality_feedback: ${updated.quality_feedback}`);
      console.log(`  quality_evaluated_by: ${updated.quality_evaluated_by}`);
      console.log(`  quality_evaluated_at: ${updated.quality_evaluated_at}`);
      
      if (updated.quality_confirmed === newQualityConfirmed) {
        console.log('\n✅ UPDATE SUCCESSFUL!');
      } else {
        console.log('\n❌ UPDATE FAILED - value did not change');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.sequelize.close();
  }
}

testQualityUpdate();
