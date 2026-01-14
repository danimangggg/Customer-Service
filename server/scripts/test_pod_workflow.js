const db = require('../src/models');

async function testPODWorkflow() {
  try {
    console.log('🧪 Testing POD confirmation workflow...\n');

    // Test data
    const testODNId = 1; // Use the first ODN
    const testPodNumber = 'POD-TEST-001';
    const testArrivalKm = 125.50;
    const testRouteAssignmentId = 7; // From our query results
    const testUserId = 1;

    console.log('1. Testing POD confirmation with details...');
    
    // Simulate the bulk update API call
    const update = {
      odn_id: testODNId,
      pod_confirmed: true,
      pod_reason: '',
      pod_number: testPodNumber,
      arrival_kilometer: testArrivalKm,
      route_assignment_id: testRouteAssignmentId
    };

    // Start transaction
    const transaction = await db.sequelize.transaction();

    try {
      // Update ODN table
      const odnUpdateQuery = `
        UPDATE odns 
        SET pod_confirmed = ?, 
            pod_reason = ?,
            pod_number = ?,
            pod_confirmed_by = ?,
            pod_confirmed_at = NOW()
        WHERE id = ?
      `;

      await db.sequelize.query(odnUpdateQuery, {
        replacements: [
          update.pod_confirmed, 
          update.pod_reason || null, 
          update.pod_number || null,
          testUserId, 
          update.odn_id
        ],
        type: db.sequelize.QueryTypes.UPDATE,
        transaction
      });

      console.log('✅ ODN table updated successfully');

      // Update route_assignments table
      const raUpdateQuery = `
        UPDATE route_assignments 
        SET arrival_kilometer = ?
        WHERE id = ?
      `;

      await db.sequelize.query(raUpdateQuery, {
        replacements: [update.arrival_kilometer, update.route_assignment_id],
        type: db.sequelize.QueryTypes.UPDATE,
        transaction
      });

      console.log('✅ Route assignments table updated successfully');

      // Commit the transaction
      await transaction.commit();
      console.log('✅ Transaction committed successfully');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // Verify the updates
    console.log('\n2. Verifying the updates...');
    
    const verifyQuery = `
      SELECT 
        o.id, o.odn_number, o.pod_confirmed, o.pod_number, o.pod_reason
      FROM odns o
      WHERE o.id = ?
    `;

    const verifyResult = await db.sequelize.query(verifyQuery, {
      replacements: [testODNId],
      type: db.sequelize.QueryTypes.SELECT
    });

    const raVerifyQuery = `
      SELECT id, arrival_kilometer
      FROM route_assignments
      WHERE id = ?
    `;

    const raVerifyResult = await db.sequelize.query(raVerifyQuery, {
      replacements: [testRouteAssignmentId],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (verifyResult.length > 0 && raVerifyResult.length > 0) {
      const odnResult = verifyResult[0];
      const raResult = raVerifyResult[0];
      
      console.log('📋 Verification Results:');
      console.log(`   ODN ID: ${odnResult.id}`);
      console.log(`   ODN Number: ${odnResult.odn_number}`);
      console.log(`   POD Confirmed: ${odnResult.pod_confirmed ? 'Yes' : 'No'}`);
      console.log(`   POD Number: ${odnResult.pod_number || 'Not set'}`);
      console.log(`   Route Assignment ID: ${raResult.id}`);
      console.log(`   Arrival Kilometer: ${raResult.arrival_kilometer || 'Not set'}`);
      
      // Check if our test values were saved correctly
      const podNumberMatch = odnResult.pod_number === testPodNumber;
      const arrivalKmMatch = parseFloat(raResult.arrival_kilometer) === testArrivalKm;
      
      console.log(`\n✅ POD Number saved correctly: ${podNumberMatch}`);
      console.log(`✅ Arrival Kilometer saved correctly: ${arrivalKmMatch}`);
      
      if (podNumberMatch && arrivalKmMatch) {
        console.log('\n🎉 POD workflow test PASSED! All data saved correctly.');
      } else {
        console.log('\n❌ POD workflow test FAILED! Data mismatch.');
      }
    } else {
      console.log('❌ No verification data found');
    }

  } catch (error) {
    console.error('❌ POD workflow test failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

testPODWorkflow();