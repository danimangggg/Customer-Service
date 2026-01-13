const db = require('../src/models');

async function checkEWMProcessStatus() {
  try {
    console.log('🔍 Checking EWM process status for Abuye Health Center...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check the current status of the Abuye Health Center process
    const processQuery = `
      SELECT 
        p.id as process_id,
        p.status as process_status,
        p.reporting_month,
        p.created_at,
        f.id as facility_id,
        f.facility_name,
        f.route,
        f.period,
        COUNT(o.id) as odn_count
      FROM processes p
      INNER JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN odns o ON o.process_id = p.id
      WHERE f.facility_name = 'Abuye Health Center'
        AND p.reporting_month = 'Tir 2018'
      GROUP BY p.id, p.status, p.reporting_month, p.created_at, f.id, f.facility_name, f.route, f.period
    `;
    
    const processResult = await db.sequelize.query(processQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (processResult.length === 0) {
      console.log('❌ No process found for Abuye Health Center in Tir 2018');
      return;
    }
    
    const process = processResult[0];
    console.log('📋 Process Details:');
    console.log(`  Process ID: ${process.process_id}`);
    console.log(`  Facility: ${process.facility_name}`);
    console.log(`  Route: ${process.route}`);
    console.log(`  Period: ${process.period}`);
    console.log(`  Status: ${process.process_status}`);
    console.log(`  Reporting Month: ${process.reporting_month}`);
    console.log(`  ODN Count: ${process.odn_count}`);
    console.log(`  Created: ${process.created_at}`);
    console.log('');
    
    // Check what the EWM active processes query should return
    console.log('🎯 EWM Active Processes Query Analysis:');
    console.log('   EWM Officer should see processes with status = "completed"');
    console.log('   These are processes completed by O2C Officer but not yet completed by EWM Officer');
    console.log('');
    
    if (process.process_status === 'completed') {
      console.log('✅ GOOD: Process status is "completed" - should appear in EWM active processes');
      
      // Test the actual EWM active processes query
      const ewmQuery = `
        SELECT 
          p.id,
          p.reporting_month,
          p.created_at,
          f.facility_name,
          f.region_name,
          f.zone_name,
          f.woreda_name,
          COUNT(o.id) as odn_count
        FROM processes p
        INNER JOIN facilities f ON p.facility_id = f.id
        LEFT JOIN odns o ON o.process_id = p.id
        WHERE p.status = 'completed'
          AND p.reporting_month = 'Tir 2018'
        GROUP BY p.id, p.reporting_month, p.created_at, f.facility_name, f.region_name, f.zone_name, f.woreda_name
        ORDER BY p.created_at DESC
      `;
      
      const ewmResult = await db.sequelize.query(ewmQuery, {
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log(`📝 EWM Active Processes Query Result (${ewmResult.length} processes):`);
      ewmResult.forEach(proc => {
        console.log(`  ${proc.id}: ${proc.facility_name} - ${proc.odn_count} ODNs - ${proc.reporting_month}`);
      });
      
      const abuye = ewmResult.find(proc => proc.facility_name === 'Abuye Health Center');
      if (abuye) {
        console.log('✅ CONFIRMED: Abuye Health Center appears in EWM active processes');
        console.log('   → EWM Officer should see this with a Complete button');
      } else {
        console.log('❌ ISSUE: Abuye Health Center NOT appearing in EWM active processes');
      }
      
    } else {
      console.log(`❌ ISSUE: Process status is "${process.process_status}" instead of "completed"`);
      console.log('   → This is why it\'s not appearing in EWM active processes');
      
      if (process.process_status === 'ewm_completed') {
        console.log('   → Process was already completed by EWM Officer');
        console.log('   → Should appear in PI Officer Vehicle Requests instead');
      }
    }
    
    // Check ODN details
    if (process.odn_count > 0) {
      const odnQuery = `
        SELECT 
          o.id,
          o.odn_number,
          o.status as odn_status
        FROM odns o
        WHERE o.process_id = ?
        ORDER BY o.id
      `;
      
      const odns = await db.sequelize.query(odnQuery, {
        replacements: [process.process_id],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log(`\n📝 ODNs for this process (${odns.length}):`);
      odns.forEach(odn => {
        console.log(`  ${odn.id}: ${odn.odn_number} - ${odn.odn_status}`);
      });
    }
    
    console.log('\n🎉 EWM process status check completed!');
    
  } catch (error) {
    console.error('❌ Error checking EWM process status:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

checkEWMProcessStatus()
  .then(() => {
    console.log('\n✅ EWM process status check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ EWM process status check failed:', error);
    process.exit(1);
  });