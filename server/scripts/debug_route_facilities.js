const db = require('../src/models');

async function debugRouteFacilities() {
  try {
    console.log('🔍 Debugging Route Facilities...\n');

    const testMonth = 'Tahsas';
    const testYear = '2018';
    const reportingMonth = `${testMonth} ${testYear}`;

    // Check AD-R-2 specifically
    console.log('Checking AD-R-2 route facilities:\n');
    
    const facilityQuery = `
      SELECT 
        f.id,
        f.facility_name,
        f.route,
        f.period,
        p.id as process_id,
        p.status as process_status,
        p.reporting_month
      FROM facilities f
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE f.route = 'AD-R-2'
      ORDER BY f.facility_name
    `;

    const facilities = await db.sequelize.query(facilityQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${facilities.length} facilities for AD-R-2:\n`);
    facilities.forEach((fac, index) => {
      console.log(`${index + 1}. ${fac.facility_name}`);
      console.log(`   Period: ${fac.period}`);
      console.log(`   Process ID: ${fac.process_id || 'NO PROCESS'}`);
      console.log(`   Process Status: ${fac.process_status || 'N/A'}`);
      console.log(`   Reporting Month: ${fac.reporting_month || 'N/A'}`);
      console.log('');
    });

    // Now check what the query is actually returning
    console.log('\nTesting the actual query logic:\n');
    
    const testQuery = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities_in_route,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities,
        GROUP_CONCAT(DISTINCT f.facility_name ORDER BY f.facility_name SEPARATOR ', ') as facility_names,
        GROUP_CONCAT(DISTINCT CONCAT(f.facility_name, ':', COALESCE(p.status, 'NO_PROCESS')) ORDER BY f.facility_name SEPARATOR ' | ') as facility_status
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE r.route_name = 'AD-R-2'
        AND f.route IS NOT NULL 
        AND f.period IS NOT NULL
      GROUP BY r.id, r.route_name
    `;

    const result = await db.sequelize.query(testQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (result.length > 0) {
      const route = result[0];
      console.log('Query Result:');
      console.log(`  Route: ${route.route_name}`);
      console.log(`  Total Facilities: ${route.total_facilities_in_route}`);
      console.log(`  EWM Completed: ${route.ewm_completed_facilities}`);
      console.log(`  Vehicle Requested: ${route.vehicle_requested_facilities}`);
      console.log(`  Facilities: ${route.facility_names}`);
      console.log(`  Status Details: ${route.facility_status}`);
      console.log('');
      
      const shouldAppear = route.total_facilities_in_route === (route.ewm_completed_facilities + route.vehicle_requested_facilities) &&
                          (route.ewm_completed_facilities === route.total_facilities_in_route || 
                           route.vehicle_requested_facilities === route.total_facilities_in_route);
      
      console.log(`  Should appear in PI Vehicle Requests? ${shouldAppear ? '✅ YES' : '❌ NO'}`);
      console.log(`  Reason: ${shouldAppear ? 'All facilities accounted for' : 'Not all facilities have ewm_completed or vehicle_requested'}`);
    } else {
      console.log('❌ No result returned for AD-R-2');
    }

    // Check if there are facilities with different periods
    console.log('\n\nChecking period distribution:\n');
    const periodQuery = `
      SELECT 
        f.period,
        COUNT(*) as facility_count,
        GROUP_CONCAT(f.facility_name ORDER BY f.facility_name SEPARATOR ', ') as facilities
      FROM facilities f
      WHERE f.route = 'AD-R-2'
      GROUP BY f.period
      ORDER BY f.period
    `;

    const periods = await db.sequelize.query(periodQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log('Period Distribution:');
    periods.forEach(period => {
      console.log(`  Period ${period.period}: ${period.facility_count} facilities`);
      console.log(`    Facilities: ${period.facilities}`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

debugRouteFacilities();