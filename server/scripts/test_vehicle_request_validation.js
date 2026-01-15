const db = require('../src/models');

async function testVehicleRequestValidation() {
  try {
    console.log('🧪 Testing Vehicle Request Validation Logic...\n');

    const testMonth = 'Tahsas';
    const testYear = '2018';
    const reportingMonth = `${testMonth} ${testYear}`;

    // Test 1: Check routes and their facility completion status
    console.log('1. Checking all routes and their facility EWM completion status...\n');
    
    const routeStatusQuery = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested,
        COUNT(DISTINCT CASE WHEN p.status NOT IN ('ewm_completed', 'vehicle_requested') THEN f.id END) as other_status
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE f.route IS NOT NULL AND f.period IS NOT NULL
      GROUP BY r.id, r.route_name
      ORDER BY r.route_name
    `;

    const routeStatus = await db.sequelize.query(routeStatusQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log('Route Status Summary:');
    console.log('='.repeat(80));
    routeStatus.forEach(route => {
      const allCompleted = route.total_facilities === route.ewm_completed;
      const allRequested = route.total_facilities === route.vehicle_requested;
      const status = allRequested ? '✅ ALL REQUESTED' : allCompleted ? '✅ ALL EWM COMPLETED' : '❌ INCOMPLETE';
      
      console.log(`Route: ${route.route_name}`);
      console.log(`  Total Facilities: ${route.total_facilities}`);
      console.log(`  EWM Completed: ${route.ewm_completed}`);
      console.log(`  Vehicle Requested: ${route.vehicle_requested}`);
      console.log(`  Other Status: ${route.other_status}`);
      console.log(`  Status: ${status}`);
      console.log('');
    });

    // Test 2: Test the actual query used in getPIVehicleRequests
    console.log('\n2. Testing the actual PI Vehicle Requests query...\n');
    
    const actualQuery = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities_in_route,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE f.route IS NOT NULL 
        AND f.period IS NOT NULL
      GROUP BY r.id, r.route_name
      HAVING total_facilities_in_route > 0 
        AND total_facilities_in_route = ewm_completed_facilities + vehicle_requested_facilities
        AND (
          ewm_completed_facilities = total_facilities_in_route OR 
          vehicle_requested_facilities = total_facilities_in_route
        )
      ORDER BY r.route_name
    `;

    const actualResult = await db.sequelize.query(actualQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log('Routes that SHOULD appear in PI Vehicle Requests:');
    console.log('='.repeat(80));
    if (actualResult.length === 0) {
      console.log('❌ No routes found that meet the criteria');
    } else {
      actualResult.forEach(route => {
        const isAllEWM = route.ewm_completed_facilities === route.total_facilities_in_route;
        const isAllRequested = route.vehicle_requested_facilities === route.total_facilities_in_route;
        
        console.log(`✅ Route: ${route.route_name}`);
        console.log(`   Total: ${route.total_facilities_in_route}`);
        console.log(`   EWM Completed: ${route.ewm_completed_facilities} ${isAllEWM ? '(ALL ✓)' : ''}`);
        console.log(`   Vehicle Requested: ${route.vehicle_requested_facilities} ${isAllRequested ? '(ALL ✓)' : ''}`);
        console.log('');
      });
    }

    // Test 3: Show routes that should NOT appear (incomplete)
    console.log('\n3. Routes that should NOT appear (incomplete EWM)...\n');
    
    const incompleteQuery = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE f.route IS NOT NULL AND f.period IS NOT NULL
      GROUP BY r.id, r.route_name
      HAVING total_facilities > 0 
        AND total_facilities != ewm_completed + vehicle_requested
      ORDER BY r.route_name
    `;

    const incompleteResult = await db.sequelize.query(incompleteQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (incompleteResult.length === 0) {
      console.log('✅ No incomplete routes found (all routes are either fully completed or fully requested)');
    } else {
      console.log('Routes with incomplete EWM (should be BLOCKED):');
      console.log('='.repeat(80));
      incompleteResult.forEach(route => {
        console.log(`❌ Route: ${route.route_name}`);
        console.log(`   Total: ${route.total_facilities}`);
        console.log(`   EWM Completed: ${route.ewm_completed}`);
        console.log(`   Vehicle Requested: ${route.vehicle_requested}`);
        console.log(`   Missing: ${route.total_facilities - route.ewm_completed - route.vehicle_requested}`);
        console.log('');
      });
    }

    console.log('\n🎉 Validation test completed!');
    console.log('\n💡 Summary:');
    console.log('   - Routes appear ONLY when ALL facilities have ewm_completed OR vehicle_requested');
    console.log('   - Routes with partial completion are BLOCKED from requesting vehicles');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

testVehicleRequestValidation();