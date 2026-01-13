const db = require('../src/models');

async function investigateODN566655() {
  try {
    console.log('🔍 Investigating ODN 566655 - Abuye Health Center...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Get detailed information about this ODN
    const odnQuery = `
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
        p.reporting_month,
        p.created_at as process_created,
        f.id as facility_id,
        f.facility_name,
        f.route,
        f.period
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      WHERE o.odn_number = '566655'
        AND f.facility_name = 'Abuye Health Center'
    `;
    
    const odnDetails = await db.sequelize.query(odnQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (odnDetails.length === 0) {
      console.log('❌ ODN 566655 not found for Abuye Health Center');
      return;
    }
    
    const odn = odnDetails[0];
    console.log('📋 ODN Details:');
    console.log(`  ODN ID: ${odn.odn_id}`);
    console.log(`  ODN Number: ${odn.odn_number}`);
    console.log(`  ODN Status: ${odn.odn_status}`);
    console.log(`  Process ID: ${odn.process_id}`);
    console.log(`  Process Status: ${odn.process_status}`);
    console.log(`  Facility: ${odn.facility_name}`);
    console.log(`  Route: ${odn.route}`);
    console.log(`  Period: ${odn.period}`);
    console.log(`  Reporting Month: ${odn.reporting_month}`);
    console.log(`  Process Created: ${odn.process_created}`);
    console.log('');
    
    console.log('🔄 Workflow Status:');
    console.log(`  POD Confirmed: ${odn.pod_confirmed ? 'Yes' : 'No'}`);
    console.log(`  Documents Signed: ${odn.documents_signed ? 'Yes' : 'No'}`);
    console.log(`  Documents Handover: ${odn.documents_handover ? 'Yes' : 'No'}`);
    console.log(`  Quality Confirmed: ${odn.quality_confirmed ? 'Yes' : 'No'}`);
    console.log('');
    
    // Check what the process status should be based on O2C workflow
    console.log('🎯 Expected Process Status Analysis:');
    console.log('  O2C Officer workflow stages:');
    console.log('    1. Process started');
    console.log('    2. ODNs created');
    console.log('    3. Process completed → status should be "completed"');
    console.log('    4. EWM Officer completes → status becomes "ewm_completed"');
    console.log('    5. PI Officer requests vehicle → status becomes "vehicle_requested"');
    console.log('');
    
    if (odn.process_status === 'vehicle_requested') {
      console.log('⚠️  ISSUE IDENTIFIED:');
      console.log('   Process status is "vehicle_requested" but O2C Officer says it\'s not completed');
      console.log('   This means the process was manually advanced without proper O2C completion');
      console.log('');
      
      // Check if there are any other ODNs for this process
      const allODNsQuery = `
        SELECT 
          o.id,
          o.odn_number,
          o.status as odn_status
        FROM odns o
        WHERE o.process_id = ?
        ORDER BY o.id
      `;
      
      const allODNs = await db.sequelize.query(allODNsQuery, {
        replacements: [odn.process_id],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log(`📝 All ODNs for this process (${allODNs.length}):`);
      allODNs.forEach(odnItem => {
        console.log(`  ${odnItem.id}: ${odnItem.odn_number} - ${odnItem.odn_status}`);
      });
      console.log('');
      
      // Check route assignments for this route
      const routeAssignmentQuery = `
        SELECT 
          ra.id,
          ra.status,
          ra.ethiopian_month,
          ra.completed_at,
          r.route_name
        FROM route_assignments ra
        INNER JOIN routes r ON ra.route_id = r.id
        WHERE r.route_name = ?
        ORDER BY ra.created_at DESC
      `;
      
      const routeAssignments = await db.sequelize.query(routeAssignmentQuery, {
        replacements: [odn.route],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log(`🚛 Route Assignments for ${odn.route} (${routeAssignments.length}):`);
      routeAssignments.forEach(assignment => {
        console.log(`  ${assignment.id}: ${assignment.status} - ${assignment.ethiopian_month} - ${assignment.completed_at || 'Not completed'}`);
      });
      console.log('');
      
      // Suggest fix
      console.log('🔧 SUGGESTED FIX:');
      console.log('   Option 1: Revert process status to "completed" so O2C Officer can properly complete it');
      console.log('   Option 2: Complete the O2C process properly if it was actually completed');
      console.log('   Option 3: Remove this ODN from downstream workflows until O2C is completed');
      console.log('');
      
      // Show the fix command
      console.log('💡 To revert process status to "completed":');
      console.log(`   UPDATE processes SET status = 'completed' WHERE id = ${odn.process_id};`);
      console.log('');
      console.log('💡 To remove from downstream workflows:');
      console.log(`   UPDATE processes SET status = 'completed' WHERE id = ${odn.process_id};`);
      console.log(`   UPDATE odns SET pod_confirmed = FALSE, documents_signed = FALSE, documents_handover = FALSE, quality_confirmed = FALSE WHERE process_id = ${odn.process_id};`);
    }
    
    console.log('\n🎉 Investigation completed!');
    
  } catch (error) {
    console.error('❌ Error investigating ODN:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

investigateODN566655()
  .then(() => {
    console.log('\n✅ Investigation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Investigation failed:', error);
    process.exit(1);
  });