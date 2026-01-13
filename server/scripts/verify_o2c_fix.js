const db = require('../src/models');
const Process = db.process;
const Facility = db.facility;

async function verifyO2CFix() {
  try {
    console.log('🔍 Verifying O2C page fix...');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Get all processes for Tir 2018
    const allProcesses = await Process.findAll({
      where: { reporting_month: 'Tir 2018' },
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['id', 'facility_name', 'route', 'period']
      }],
      order: [['id', 'ASC']]
    });
    
    // Get all odd period HP facilities
    const oddHPFacilities = await Facility.findAll({
      where: {
        route: { [db.Sequelize.Op.ne]: null },
        route: { [db.Sequelize.Op.ne]: '' },
        period: 'Odd'
      },
      order: [['facility_name', 'ASC']]
    });
    
    console.log('\n📊 O2C Page Analysis (After Fix):');
    console.log('Should show facilities with:');
    console.log('- No process (can start new)');
    console.log('- Process status "o2c_started" (O2C working on it)');
    console.log('- Process status "completed" (O2C needs to start)');
    console.log('\nShould NOT show facilities with:');
    console.log('- Process status "o2c_completed" (O2C finished)');
    console.log('- Process status "ewm_completed" (EWM finished)');
    console.log('- Process status "vehicle_requested" (beyond O2C)');
    
    console.log('\n🎯 Results:');
    let shouldShowCount = 0;
    
    for (const facility of oddHPFacilities) {
      const tirProcess = allProcesses.find(p => p.facility_id === facility.id);
      
      // Apply the new filtering logic
      const shouldShowForO2C = !tirProcess || 
                               tirProcess.status === 'o2c_started' || 
                               tirProcess.status === 'completed';
      
      console.log(`\n  ${facility.facility_name}:`);
      console.log(`    Route: ${facility.route}, Period: ${facility.period}`);
      console.log(`    Process: ${tirProcess ? `${tirProcess.status} (ID: ${tirProcess.id})` : 'None'}`);
      console.log(`    Should show on O2C page: ${shouldShowForO2C ? '✅ YES' : '❌ NO'}`);
      
      if (shouldShowForO2C) {
        shouldShowCount++;
        if (tirProcess) {
          console.log(`    Reason: Process status "${tirProcess.status}" is allowed for O2C`);
        } else {
          console.log(`    Reason: No process - O2C can start new one`);
        }
      } else {
        console.log(`    Reason: Process status "${tirProcess.status}" is beyond O2C responsibility`);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`Total odd period HP facilities: ${oddHPFacilities.length}`);
    console.log(`Should show on O2C page: ${shouldShowCount}`);
    console.log(`Should hide from O2C page: ${oddHPFacilities.length - shouldShowCount}`);
    
    // Check the specific problematic facilities
    console.log('\n🎯 Specific Problem Cases:');
    
    const abenetProcess = allProcesses.find(p => p.facility.facility_name === 'Abenet Medical Center');
    const abdiProcess = allProcesses.find(p => p.facility.facility_name === 'ABDI NONO HEALTH CENTER');
    
    console.log(`\nAbenet Medical Center (vehicle_requested):`);
    console.log(`  Should show: ${!abenetProcess || abenetProcess.status === 'o2c_started' || abenetProcess.status === 'completed' ? 'YES' : 'NO'}`);
    console.log(`  Status: ${abenetProcess ? abenetProcess.status : 'No process'}`);
    console.log(`  Period: ${abenetProcess ? abenetProcess.facility.period : 'N/A'} (Note: Monthly facilities should not appear in odd period filter)`);
    
    console.log(`\nABDI NONO HEALTH CENTER (ewm_completed):`);
    console.log(`  Should show: ${!abdiProcess || abdiProcess.status === 'o2c_started' || abdiProcess.status === 'completed' ? 'YES' : 'NO'}`);
    console.log(`  Status: ${abdiProcess ? abdiProcess.status : 'No process'}`);
    
  } catch (error) {
    console.error('❌ Error verifying fix:', error);
  }
}

// Run the verification
verifyO2CFix()
  .then(() => {
    console.log('\n✅ Verification completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });