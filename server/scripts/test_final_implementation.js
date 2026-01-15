const db = require('../src/models');

async function testFinalImplementation() {
  try {
    console.log('=== Testing Final Implementation ===\n');
    
    const month = 'Tahsas';
    const year = '2018';
    const reportingMonth = `${month} ${year}`;
    
    // Determine current period
    const ethiopianMonths = [
      'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
    ];
    const monthIndex = ethiopianMonths.indexOf(month);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';
    
    console.log(`Reporting month: ${reportingMonth}`);
    console.log(`Current period: ${currentPeriod}\n`);
    
    // Run the main query
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
      GROUP BY r.id, r.route_name, pvr.route_id
      HAVING total_facilities_in_route > 0
      ORDER BY all_facilities_ready DESC, r.route_name
      LIMIT 10
    `;
    
    const routes = await db.sequelize.query(query, {
      replacements: [currentPeriod, reportingMonth, month, year],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`Found ${routes.length} routes:\n`);
    
    routes.forEach((route, index) => {
      const remainingFacilities = route.total_facilities_in_route - route.ewm_completed_facilities - route.vehicle_requested_facilities;
      const buttonStatus = route.all_facilities_ready === 1 ? 'ACTIVE' : 'DISABLED';
      const statusIcon = route.all_facilities_ready === 1 ? '✓' : '✗';
      
      console.log(`${index + 1}. ${route.route_name} ${statusIcon}`);
      console.log(`   Total facilities: ${route.total_facilities_in_route}`);
      console.log(`   EWM completed: ${route.ewm_completed_facilities}`);
      console.log(`   Vehicle requested: ${route.vehicle_requested_facilities}`);
      console.log(`   Pending: ${route.pending_facilities}`);
      console.log(`   Button: ${buttonStatus}`);
      
      if (remainingFacilities > 0) {
        console.log(`   Message: "${remainingFacilities} facility(ies) pending"`);
      } else if (route.vehicle_requested === 1) {
        console.log(`   Status: "Vehicle Requested"`);
      } else {
        console.log(`   Message: "All EWM Completed ✓"`);
      }
      console.log('');
    });
    
    // Summary
    const readyRoutes = routes.filter(r => r.all_facilities_ready === 1 && r.vehicle_requested === 0);
    const pendingRoutes = routes.filter(r => r.all_facilities_ready === 0);
    const requestedRoutes = routes.filter(r => r.vehicle_requested === 1);
    
    console.log('=== Summary ===');
    console.log(`Total routes: ${routes.length}`);
    console.log(`Ready for vehicle request: ${readyRoutes.length}`);
    console.log(`Pending (incomplete): ${pendingRoutes.length}`);
    console.log(`Already requested: ${requestedRoutes.length}`);
    
    console.log('\n=== Expected UI Behavior ===');
    console.log('✓ All routes are visible in the list');
    console.log('✓ Routes with all facilities completed show ACTIVE button');
    console.log('✓ Routes with pending facilities show DISABLED button with pending count');
    console.log('✓ Routes with vehicle requested show "Vehicle Requested" chip');
    console.log('✓ Each facility shows completion status badge');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

testFinalImplementation();
