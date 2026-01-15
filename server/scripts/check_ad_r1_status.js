const db = require('../src/models');

async function checkADR1Status() {
  try {
    console.log('=== Checking AD-R-1 Vehicle Request Status ===\n');
    
    const month = 'Tahsas';
    const year = '2018';
    const reportingMonth = `${month} ${year}`;
    const routeName = 'AD-R-1';
    
    // 1. Check pi_vehicle_requests table
    console.log('1. Checking pi_vehicle_requests table:');
    const vehicleRequests = await db.sequelize.query(`
      SELECT pvr.*, r.route_name
      FROM pi_vehicle_requests pvr
      INNER JOIN routes r ON r.id = pvr.route_id
      WHERE r.route_name = ? AND pvr.month = ? AND pvr.year = ?
    `, {
      replacements: [routeName, month, year],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (vehicleRequests.length > 0) {
      console.log('✓ Found record in pi_vehicle_requests table:');
      vehicleRequests.forEach(req => {
        console.log(`  - Route: ${req.route_name}`);
        console.log(`  - Status: ${req.status}`);
        console.log(`  - Requested by: ${req.requested_by}`);
        console.log(`  - Requested at: ${req.requested_at}`);
      });
    } else {
      console.log('✗ No record found in pi_vehicle_requests table');
    }
    console.log('');
    
    // 2. Check processes table for facilities with vehicle_requested status
    console.log('2. Checking processes table for vehicle_requested status:');
    const processes = await db.sequelize.query(`
      SELECT f.facility_name, p.status, p.reporting_month
      FROM processes p
      INNER JOIN facilities f ON f.id = p.facility_id
      WHERE f.route = ? AND p.reporting_month = ?
      ORDER BY f.facility_name
    `, {
      replacements: [routeName, reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (processes.length > 0) {
      console.log(`Found ${processes.length} process records:`);
      processes.forEach(proc => {
        const statusIcon = proc.status === 'vehicle_requested' ? '✓' : ' ';
        console.log(`  ${statusIcon} ${proc.facility_name}: ${proc.status}`);
      });
      
      const vehicleRequestedCount = processes.filter(p => p.status === 'vehicle_requested').length;
      console.log(`\n  Total with vehicle_requested status: ${vehicleRequestedCount}`);
    } else {
      console.log('✗ No process records found');
    }
    console.log('');
    
    // 3. Check all facilities for this route
    console.log('3. All facilities for this route:');
    const facilities = await db.sequelize.query(`
      SELECT id, facility_name, period
      FROM facilities
      WHERE route = ?
      ORDER BY facility_name
    `, {
      replacements: [routeName],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`Found ${facilities.length} facilities:`);
    facilities.forEach(f => {
      console.log(`  - ${f.facility_name} (Period: ${f.period})`);
    });
    console.log('');
    
    // 4. Summary
    console.log('=== Summary ===');
    const hasVehicleRequestRecord = vehicleRequests.length > 0;
    const hasVehicleRequestedStatus = processes.some(p => p.status === 'vehicle_requested');
    
    console.log(`Vehicle request record exists: ${hasVehicleRequestRecord ? 'YES' : 'NO'}`);
    console.log(`Facilities with vehicle_requested status: ${hasVehicleRequestedStatus ? 'YES' : 'NO'}`);
    console.log(`\nThe vehicle_requested flag is set to 1 because:`);
    
    if (hasVehicleRequestRecord) {
      console.log('  ✓ A record exists in pi_vehicle_requests table');
    }
    if (hasVehicleRequestedStatus) {
      console.log('  ✓ At least one facility has vehicle_requested status in processes table');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkADR1Status();
