const db = require('../src/models');
const Process = db.process;
const Facility = db.facility;
const ODN = db.odn;

async function debugO2CDetailed() {
  try {
    console.log('🔍 Detailed debugging of O2C HP page issues...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check all processes for Tir 2018 with their ODNs
    console.log('\n📋 All processes for Tir 2018 with ODNs:');
    const allProcesses = await Process.findAll({
      where: { reporting_month: 'Tir 2018' },
      include: [
        {
          model: Facility,
          as: 'facility',
          attributes: ['id', 'facility_name', 'route', 'period']
        },
        {
          model: ODN,
          as: 'odns',
          attributes: ['id', 'odn_number', 'status'],
          required: false
        }
      ],
      order: [['id', 'ASC']]
    });
    
    console.log(`Found ${allProcesses.length} processes:`);
    allProcesses.forEach(proc => {
      console.log(`\n  Process ID: ${proc.id}`);
      console.log(`  Facility: ${proc.facility.facility_name}`);
      console.log(`  Status: ${proc.status}`);
      console.log(`  Route: ${proc.facility.route}`);
      console.log(`  Period: ${proc.facility.period}`);
      console.log(`  ODNs: ${proc.odns.length}`);
      proc.odns.forEach(odn => {
        console.log(`    - ODN ${odn.odn_number} (Status: ${odn.status})`);
      });
    });
    
    // Check the specific problematic facilities
    console.log('\n🎯 Checking specific problematic facilities:');
    
    const problematicFacilities = ['Abenet Medical Center', 'ABDI NONO HEALTH CENTER'];
    
    for (const facilityName of problematicFacilities) {
      console.log(`\n--- ${facilityName} ---`);
      
      const facility = await Facility.findOne({
        where: { facility_name: facilityName }
      });
      
      if (facility) {
        console.log(`Facility ID: ${facility.id}, Route: ${facility.route}, Period: ${facility.period}`);
        
        // Check if this facility has any processes
        const processes = await Process.findAll({
          where: { facility_id: facility.id },
          include: [{
            model: ODN,
            as: 'odns',
            attributes: ['id', 'odn_number', 'status'],
            required: false
          }],
          order: [['created_at', 'DESC']]
        });
        
        console.log(`Total processes for this facility: ${processes.length}`);
        processes.forEach(proc => {
          console.log(`  Process ID: ${proc.id}, Status: ${proc.status}, Month: ${proc.reporting_month}, ODNs: ${proc.odns.length}`);
          proc.odns.forEach(odn => {
            console.log(`    - ODN ${odn.odn_number} (Status: ${odn.status})`);
          });
        });
        
        // Check specifically for Tir 2018
        const tirProcess = processes.find(p => p.reporting_month === 'Tir 2018');
        if (tirProcess) {
          console.log(`  ⚠️  HAS TIR 2018 PROCESS: ID ${tirProcess.id}, Status: ${tirProcess.status}`);
        } else {
          console.log(`  ✅ No Tir 2018 process found`);
        }
      } else {
        console.log(`❌ Facility not found in database`);
      }
    }
    
    // Check the frontend filtering logic
    console.log('\n🖥️  Frontend Logic Analysis:');
    console.log('O2C page should show facilities that:');
    console.log('1. Have routes (HP facilities)');
    console.log('2. Match current period (odd for Tir)');
    console.log('3. Either have NO process OR have process with status NOT "o2c_completed"');
    console.log('4. Should NOT show "ewm_completed" processes');
    
    // Get all HP facilities for odd period
    const oddHPFacilities = await Facility.findAll({
      where: {
        route: { [db.Sequelize.Op.ne]: null },
        route: { [db.Sequelize.Op.ne]: '' },
        period: 'Odd'
      },
      order: [['facility_name', 'ASC']]
    });
    
    console.log(`\n📊 Analysis of odd period HP facilities:`);
    for (const facility of oddHPFacilities) {
      const tirProcess = allProcesses.find(p => p.facility_id === facility.id);
      const shouldShow = !tirProcess || tirProcess.status !== 'o2c_completed';
      const shouldNotShow = tirProcess && tirProcess.status === 'ewm_completed';
      
      console.log(`\n  ${facility.facility_name}:`);
      console.log(`    Route: ${facility.route}, Period: ${facility.period}`);
      console.log(`    Process: ${tirProcess ? `${tirProcess.status} (ID: ${tirProcess.id})` : 'None'}`);
      console.log(`    Should show on O2C page: ${shouldShow && !shouldNotShow ? 'YES' : 'NO'}`);
      if (shouldNotShow) {
        console.log(`    ⚠️  PROBLEM: ewm_completed should NOT appear on O2C page!`);
      }
      if (tirProcess && tirProcess.odns.length > 0) {
        console.log(`    ODNs: ${tirProcess.odns.length}`);
        tirProcess.odns.forEach(odn => {
          console.log(`      - ${odn.odn_number} (${odn.status})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error in detailed debugging:', error);
  }
}

// Run the debug
debugO2CDetailed()
  .then(() => {
    console.log('\n✅ Detailed debug completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });