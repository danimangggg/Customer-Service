const db = require('../src/models');
const Process = db.process;
const Facility = db.facility;

async function debugO2CProcesses() {
  try {
    console.log('🔍 Debugging O2C HP processes for Tir 2018...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check all processes for Tir 2018
    console.log('\n📋 All processes for Tir 2018:');
    const allProcesses = await Process.findAll({
      where: { reporting_month: 'Tir 2018' },
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['id', 'facility_name', 'route', 'period']
      }],
      order: [['id', 'ASC']]
    });
    
    console.log(`Found ${allProcesses.length} processes:`);
    allProcesses.forEach(proc => {
      console.log(`  ID: ${proc.id}, Facility: ${proc.facility.facility_name}, Status: ${proc.status}, Route: ${proc.facility.route}, Period: ${proc.facility.period}`);
    });
    
    // Check specifically o2c_started processes
    console.log('\n🎯 O2C Started processes for Tir 2018:');
    const o2cStartedProcesses = await Process.findAll({
      where: { 
        reporting_month: 'Tir 2018',
        status: 'o2c_started'
      },
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['id', 'facility_name', 'route', 'period']
      }],
      order: [['id', 'ASC']]
    });
    
    console.log(`Found ${o2cStartedProcesses.length} o2c_started processes:`);
    o2cStartedProcesses.forEach(proc => {
      console.log(`  ID: ${proc.id}, Facility: ${proc.facility.facility_name}, Status: ${proc.status}, Route: ${proc.facility.route}, Period: ${proc.facility.period}`);
    });
    
    // Check all facilities with routes (HP facilities)
    console.log('\n🏥 All HP facilities (with routes):');
    const hpFacilities = await Facility.findAll({
      where: {
        route: { [db.Sequelize.Op.ne]: null },
        route: { [db.Sequelize.Op.ne]: '' }
      },
      order: [['id', 'ASC']]
    });
    
    console.log(`Found ${hpFacilities.length} HP facilities:`);
    hpFacilities.forEach(facility => {
      console.log(`  ID: ${facility.id}, Name: ${facility.facility_name}, Route: ${facility.route}, Period: ${facility.period}`);
    });
    
    // Check what the frontend logic would show
    console.log('\n🖥️  Frontend Logic Analysis:');
    console.log('The O2C HP page shows facilities that:');
    console.log('1. Have routes (HP facilities)');
    console.log('2. Either have no process OR have a process that is NOT o2c_completed');
    console.log('3. Match the current period (Tir = month 5, odd month, so odd period facilities)');
    
    // Get current period (Tir is month 5, which is odd)
    const currentPeriod = 'odd';
    console.log(`\nCurrent period: ${currentPeriod}`);
    
    // Filter facilities that should show on O2C HP page
    const facilitiesForO2C = hpFacilities.filter(facility => {
      const facilityPeriod = facility.period ? facility.period.toLowerCase() : '';
      const matchesPeriod = facilityPeriod === currentPeriod;
      
      // Find if this facility has a process for Tir 2018
      const hasProcess = allProcesses.find(proc => proc.facility_id === facility.id);
      const shouldShow = !hasProcess || hasProcess.status !== 'o2c_completed';
      
      return matchesPeriod && shouldShow;
    });
    
    console.log(`\n📊 Facilities that should appear on O2C HP page: ${facilitiesForO2C.length}`);
    facilitiesForO2C.forEach(facility => {
      const process = allProcesses.find(proc => proc.facility_id === facility.id);
      const processStatus = process ? process.status : 'No process';
      console.log(`  ${facility.facility_name} (Route: ${facility.route}, Period: ${facility.period}) - Process: ${processStatus}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging O2C processes:', error);
  }
}

// Run the debug
debugO2CProcesses()
  .then(() => {
    console.log('\n✅ Debug completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });