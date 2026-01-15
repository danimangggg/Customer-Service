const db = require('../src/models');

async function testPeriodFiltering() {
  try {
    console.log('🧪 Testing Period Filtering Logic...\n');

    const testMonth = 'Tahsas';
    const testYear = '2018';
    const reportingMonth = `${testMonth} ${testYear}`;

    // Determine period
    const ethiopianMonths = [
      'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
    ];
    const monthIndex = ethiopianMonths.indexOf(testMonth);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';
    
    console.log(`Month: ${testMonth} (index ${monthIndex + 1})`);
    console.log(`Current Period: ${currentPeriod}\n`);

    // Test AD-R-2 with period filtering
    console.log('Testing AD-R-2 with period filtering:\n');
    
    const testQuery = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities_in_route,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities,
        GROUP_CONCAT(DISTINCT CONCAT(f.facility_name, ' (', f.period, ')') ORDER BY f.facility_name SEPARATOR ' | ') as facilities,
        GROUP_CONCAT(DISTINCT CONCAT(f.facility_name, ':', COALESCE(p.status, 'NO_PROCESS')) ORDER BY f.facility_name SEPARATOR ' | ') as facility_status
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
        AND (f.period = 'Monthly' OR f.period = ?)
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE r.route_name = 'AD-R-2'
        AND f.route IS NOT NULL
      GROUP BY r.id, r.route_name
    `;

    const result = await db.sequelize.query(testQuery, {
      replacements: [currentPeriod, reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (result.length > 0) {
      const route = result[0];
      console.log('Query Result (WITH period filtering):');
      console.log(`  Route: ${route.route_name}`);
      console.log(`  Total Facilities (${currentPeriod} + Monthly): ${route.total_facilities_in_route}`);
      console.log(`  EWM Completed: ${route.ewm_completed_facilities}`);
      console.log(`  Vehicle Requested: ${route.vehicle_requested_facilities}`);
      console.log(`  Facilities: ${route.facilities}`);
      console.log(`  Status: ${route.facility_status}`);
      console.log('');
      
      const shouldAppear = route.total_facilities_in_route === (route.ewm_completed_facilities + route.vehicle_requested_facilities) &&
                          (route.ewm_completed_facilities === route.total_facilities_in_route || 
                           route.vehicle_requested_facilities === route.total_facilities_in_route);
      
      console.log(`  Should appear in PI Vehicle Requests? ${shouldAppear ? '✅ YES' : '❌ NO'}`);
      
      if (!shouldAppear) {
        console.log(`  Reason: Only ${route.ewm_completed_facilities + route.vehicle_requested_facilities} out of ${route.total_facilities_in_route} facilities have completed/requested status`);
      }
    } else {
      console.log('❌ No result returned for AD-R-2 (route has no facilities for this period)');
    }

    // Compare with old query (without period filtering)
    console.log('\n\nComparison - OLD query (WITHOUT period filtering):\n');
    
    const oldQuery = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities_in_route,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities,
        GROUP_CONCAT(DISTINCT CONCAT(f.facility_name, ' (', f.period, ')') ORDER BY f.facility_name SEPARATOR ' | ') as facilities
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE r.route_name = 'AD-R-2'
        AND f.route IS NOT NULL
        AND f.period IS NOT NULL
      GROUP BY r.id, r.route_name
    `;

    const oldResult = await db.sequelize.query(oldQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (oldResult.length > 0) {
      const route = oldResult[0];
      console.log('OLD Query Result (counting ALL periods):');
      console.log(`  Route: ${route.route_name}`);
      console.log(`  Total Facilities (ALL periods): ${route.total_facilities_in_route}`);
      console.log(`  EWM Completed: ${route.ewm_completed_facilities}`);
      console.log(`  Vehicle Requested: ${route.vehicle_requested_facilities}`);
      console.log(`  Facilities: ${route.facilities}`);
      console.log('');
      console.log('  ⚠️  This is WRONG - it counts facilities from ALL periods!');
    }

    console.log('\n🎉 Period filtering test completed!');
    console.log('\n💡 Summary:');
    console.log(`   - For ${testMonth} (${currentPeriod} month), only ${currentPeriod} and Monthly facilities are counted`);
    console.log('   - This ensures routes only appear when ALL relevant facilities have completed EWM');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

testPeriodFiltering();