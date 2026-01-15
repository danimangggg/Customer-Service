const db = require('../src/models');

async function debugVehicleRequestButton() {
  try {
    console.log('=== Debugging Vehicle Request Button Issue ===\n');
    
    const month = 'Tahsas';
    const year = '2018';
    const reportingMonth = `${month} ${year}`;
    const routeName = 'AD-R-2';
    
    console.log(`Testing route: ${routeName}`);
    console.log(`Reporting month: ${reportingMonth}\n`);
    
    // Determine current period
    const ethiopianMonths = [
      'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
    ];
    const monthIndex = ethiopianMonths.indexOf(month);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';
    
    console.log(`Current period: ${currentPeriod} (month index: ${monthIndex + 1})\n`);
    
    // 1. Check all facilities for this route
    console.log('1. ALL FACILITIES FOR ROUTE (no period filter):');
    const allFacilities = await db.sequelize.query(`
      SELECT 
        f.id,
        f.facility_name,
        f.period,
        f.route
      FROM facilities f
      WHERE f.route = ?
      ORDER BY f.facility_name
    `, {
      replacements: [routeName],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`Total facilities: ${allFacilities.length}`);
    allFacilities.forEach(f => {
      console.log(`  - ${f.facility_name} (Period: ${f.period})`);
    });
    console.log('');
    
    // 2. Check facilities for current period
    console.log('2. FACILITIES FOR CURRENT PERIOD (with period filter):');
    const periodFacilities = await db.sequelize.query(`
      SELECT 
        f.id,
        f.facility_name,
        f.period,
        f.route
      FROM facilities f
      WHERE f.route = ?
        AND (f.period = 'Monthly' OR f.period = ?)
      ORDER BY f.facility_name
    `, {
      replacements: [routeName, currentPeriod],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`Facilities in current period: ${periodFacilities.length}`);
    periodFacilities.forEach(f => {
      console.log(`  - ${f.facility_name} (Period: ${f.period})`);
    });
    console.log('');
    
    // 3. Check process status for each facility
    console.log('3. PROCESS STATUS FOR EACH FACILITY:');
    for (const facility of periodFacilities) {
      const process = await db.sequelize.query(`
        SELECT 
          p.id,
          p.status,
          p.reporting_month
        FROM processes p
        WHERE p.facility_id = ? AND p.reporting_month = ?
      `, {
        replacements: [facility.id, reportingMonth],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      if (process.length > 0) {
        console.log(`  - ${facility.facility_name}: ${process[0].status}`);
      } else {
        console.log(`  - ${facility.facility_name}: NO PROCESS RECORD`);
      }
    }
    console.log('');
    
    // 4. Run the actual query from the controller
    console.log('4. RUNNING ACTUAL CONTROLLER QUERY:');
    const query = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities_in_route,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities,
        CASE WHEN pvr.route_id IS NOT NULL OR MAX(CASE WHEN p.status = 'vehicle_requested' THEN 1 ELSE 0 END) = 1 THEN 1 ELSE 0 END as vehicle_requested
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
        AND (f.period = 'Monthly' OR f.period = ?)
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      LEFT JOIN pi_vehicle_requests pvr ON pvr.route_id = r.id AND pvr.month = ? AND pvr.year = ?
      WHERE f.route IS NOT NULL 
        AND r.route_name = ?
      GROUP BY r.id, r.route_name, pvr.route_id
      HAVING total_facilities_in_route > 0 
        AND total_facilities_in_route = ewm_completed_facilities + vehicle_requested_facilities
        AND (
          ewm_completed_facilities = total_facilities_in_route OR 
          vehicle_requested_facilities = total_facilities_in_route
        )
    `;
    
    const result = await db.sequelize.query(query, {
      replacements: [currentPeriod, reportingMonth, month, year, routeName],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (result.length > 0) {
      console.log('✓ Route APPEARS in query results:');
      console.log(`  Route: ${result[0].route_name}`);
      console.log(`  Total facilities: ${result[0].total_facilities_in_route}`);
      console.log(`  EWM completed: ${result[0].ewm_completed_facilities}`);
      console.log(`  Vehicle requested: ${result[0].vehicle_requested_facilities}`);
      console.log(`  vehicle_requested flag: ${result[0].vehicle_requested}`);
    } else {
      console.log('✗ Route DOES NOT appear in query results');
      console.log('  This means the HAVING clause filtered it out');
    }
    console.log('');
    
    // 5. Check if vehicle request exists
    console.log('5. VEHICLE REQUEST STATUS:');
    const vehicleRequest = await db.sequelize.query(`
      SELECT * FROM pi_vehicle_requests
      WHERE route_id = (SELECT id FROM routes WHERE route_name = ?)
        AND month = ? AND year = ?
    `, {
      replacements: [routeName, month, year],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (vehicleRequest.length > 0) {
      console.log('✓ Vehicle request EXISTS in database');
      console.log(`  Status: ${vehicleRequest[0].status}`);
      console.log(`  Requested at: ${vehicleRequest[0].requested_at}`);
    } else {
      console.log('✗ No vehicle request found in database');
    }
    
    console.log('\n=== Analysis ===');
    console.log('If the route appears in the query results when only 1 of 2 facilities');
    console.log('has completed EWM, then the HAVING clause is not working correctly.');
    console.log('The button should only be active when ALL facilities have ewm_completed status.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

debugVehicleRequestButton();
