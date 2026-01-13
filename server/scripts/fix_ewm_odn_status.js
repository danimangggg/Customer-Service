const db = require('../src/models');
const ODN = db.odn;
const Process = db.process;
const Facility = db.facility;

async function fixEWMODNStatus() {
  try {
    console.log('🔧 Fixing EWM ODN status for Abuye Health Center...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Find the ODN for Abuye Health Center
    const odn = await ODN.findOne({
      where: { odn_number: '566655' },
      include: [{
        model: Process,
        as: 'process',
        include: [{
          model: Facility,
          as: 'facility',
          where: { facility_name: 'Abuye Health Center' }
        }]
      }]
    });
    
    if (!odn) {
      console.log('❌ ODN 566655 not found');
      return;
    }
    
    console.log('📋 Current ODN Status:');
    console.log(`  ODN: ${odn.odn_number}`);
    console.log(`  Current Status: ${odn.status}`);
    console.log(`  Process Status: ${odn.process.status}`);
    console.log(`  Facility: ${odn.process.facility.facility_name}`);
    
    // For EWM Officer to see the complete button, ODN status should be 'dispatched' or 'o2c_completed'
    // Since the process is 'o2c_completed', the ODN should be 'dispatched' (ready for EWM completion)
    if (odn.status === 'ewm_completed') {
      console.log('');
      console.log('🔄 Updating ODN status from "ewm_completed" to "dispatched"...');
      
      await ODN.update(
        { status: 'dispatched' },
        { where: { id: odn.id } }
      );
      
      console.log('✅ ODN status updated successfully!');
      console.log('');
      console.log('📝 Result:');
      console.log('  ✅ ODN 566655 status: dispatched');
      console.log('  ✅ Process status: o2c_completed');
      console.log('  ✅ EWM Officer will now see Complete button');
      
    } else {
      console.log('');
      console.log(`ℹ️  ODN status is already "${odn.status}" - no change needed`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing EWM ODN status:', error);
  }
}

// Run the fix
fixEWMODNStatus()
  .then(() => {
    console.log('');
    console.log('✅ EWM ODN status fix completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });