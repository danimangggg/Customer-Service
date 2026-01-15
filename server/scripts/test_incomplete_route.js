const db = require('../src/models');

async function testIncompleteRoute() {
  try {
    console.log('=== Testing Incomplete Route Display ===\n');
    
    const month = 'Tahsas';
    const year = '2018';
    const reportingMonth = `${month} ${year}`;
    const routeName = 'AD-R-2';
    
    // Determine current period
    const ethiopianMonths = [
      'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
    ];
    const monthIndex = ethiopianMonths.indexOf(month);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';
    
    console.log(`Testing route: ${routeName}`);
    console.log(`Reporting month: ${reportingMonth}`);
    console.log(`Current period: ${currentPeriod}\n`);
    
    // 1. Set one facility to ewm_completed and one to a different status
    console.log('1. Setting up test scenario...');
    
    const facilities = await db.sequelize.query(`
      SELECT f.id, f.facility_name
      FROM facilities f
      WHERE f.route = ?
        AND (f.period = 'Monthly' OR f.period = ?)
      ORDER BY f.facility_name
    `, {
      replacements: [routeName, currentPeriod],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`Found ${facilities.length} facilities:`);
    facilities.forEach(f => console.log(`  - ${f.facility_name} (ID: ${f.id})`));
    console.log('');
    
    // Set first facility to ewm_completed
    await db.sequelize.query(`
      UPDATE processes
      SET status = 'ewm_completed'
      WHERE facility_id = ? AND reporting_month = ?
    `, {
      replacements: [facilities[0].id, reportingMonth],
      type: db.sequelize.QueryTypes.UPDATE
    });
    console.log(`✓ Set ${facilities[0].facility_name} to ewm_completed`);
    
    // Set second facility to a different status (e.g., 'odn_dispatched')
    await db.sequelize.query(`
      UPDATE processes
      SET status = 'odn_dispatched'
      WHERE facility_id = ? AND reporting_month = ?
    `, {
      replacements: [facilities[1].id, reportingMonth],
      type: db.sequelize.QueryTypes.UPDATE
    });
    console.log(`✓ Set ${facilities[1].facility_name} to odn_dispatched\n`);
    
    // 2. Run the query to see what the API will return
    console.log('2. Testing API query...');
    const query = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities_in_route,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities,
        COUNT(DISTINCT CASE WHEN p.status IS NULL OR (p.status != 'ewm_completed' AND p.status != 'vehicle_requested') THEN f.id END) as pending_facilities,
        CASE WHEN pvr.route_id IS NOT NULL OR MAX(CASE WHEN p.status = 'vehicle_requested' THEN 1 ELSE 0 END) = 1 THEN 1 ELSE 0 END as vehicle_requested,
        CASE WHEN COUNT(DISTINCT f.id) = COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) + COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) THEN 1 ELSE 0 END as all_facilities_ready
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
        AND (f.period = 'Monthly' OR f.period = ?)
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      LEFT JOIN pi_vehicle_requests pvr ON pvr.route_id = r.id AND pvr.month = ? AND pvr.year = ?
      WHERE f.route IS NOT NULL 
        AND r.route_name = ?
      GROUP BY r.id, r.route_name, pvr.route_id
      HAVING total_facilities_in_route > 0
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
      console.log(`  Pending facilities: ${result[0].pending_facilities}`);
      console.log(`  All facilities ready: ${result[0].all_facilities_ready}`);
      console.log(`  vehicle_requested flag: ${result[0].vehicle_requested}`);
      
      const remainingFacilities = result[0].total_facilities_in_route - result[0].ewm_completed_facilities - result[0].vehicle_requested_facilities;
      
      if (result[0].all_facilities_ready === 1) {
        console.log('\n✓ Button should be ACTIVE (all facilities ready)');
      } else {
        console.log(`\n✗ Button should be DISABLED (${remainingFacilities} facility(ies) pending)`);
      }
    } else {
      console.log('✗ Route DOES NOT appear in query results');
    }
    
    console.log('\n=== Test Complete ===');
    console.log('Expected UI behavior:');
    console.log('- Route AD-R-2 should appear in the list');
    console.log('- Button should be DISABLED');
    console.log('- Should show "1 facility(ies) pending" message');
    console.log(`- ${facilities[0].facility_name} should have a green checkmark`);
    console.log(`- ${facilities[1].facility_name} should have a "Pending" badge`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

testIncompleteRoute();
