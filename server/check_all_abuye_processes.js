const db = require('./src/models');

async function checkAllAbuye() {
  try {
    console.log('=== CHECKING ALL PROCESSES FOR ABUYE ===\n');
    
    // Get all processes for Abuye
    const processes = await db.sequelize.query(
      `SELECT p.id, p.facility_id, p.reporting_month, p.status, f.facility_name, f.route
       FROM processes p
       INNER JOIN facilities f ON f.id = p.facility_id
       WHERE f.facility_name LIKE '%Abuye%'
       ORDER BY p.reporting_month DESC`,
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log('Total processes for Abuye:', processes.length);
    console.log(JSON.stringify(processes, null, 2));
    
    // Now run the FULL PI query without filtering by route
    console.log('\n=== RUNNING FULL PI QUERY (ALL ROUTES) ===\n');
    
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
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      LEFT JOIN pi_vehicle_requests pvr ON pvr.route_id = r.id AND pvr.month = ? AND pvr.year = ?
      WHERE f.route IS NOT NULL 
        AND f.period IS NOT NULL
      GROUP BY r.id, r.route_name, pvr.route_id
      HAVING total_facilities_in_route > 0 AND (
        (ewm_completed_facilities = total_facilities_in_route) OR 
        (vehicle_requested_facilities = total_facilities_in_route)
      )
      ORDER BY r.route_name
    `;
    
    // Test with current period
    const current = { month: 'Tir', year: 2018 };
    const reportingMonth = `${current.month} ${current.year}`;
    
    console.log('Testing with:', reportingMonth);
    
    const routes = await db.sequelize.query(query, {
      replacements: [reportingMonth, current.month, current.year],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('\nTotal routes returned:', routes.length);
    
    // Check if AD-R-9 is in the results
    const adr9 = routes.find(r => r.route_name === 'AD-R-9');
    if (adr9) {
      console.log('\n⚠️ AD-R-9 (Abuye) IS in the results:');
      console.log(JSON.stringify(adr9, null, 2));
    } else {
      console.log('\n✓ AD-R-9 (Abuye) is NOT in the results (correct)');
    }
    
    // Show all routes
    console.log('\n=== ALL ROUTES RETURNED ===');
    routes.forEach(r => {
      console.log(`${r.route_name}: ${r.ewm_completed_facilities}/${r.total_facilities_in_route} ewm_completed`);
    });
    
    // Now get the facilities for each route to see details
    if (routes.length > 0) {
      console.log('\n=== DETAILED FACILITY INFO FOR EACH ROUTE ===');
      for (const route of routes.slice(0, 5)) { // Show first 5 routes
        const facilities = await db.sequelize.query(
          `SELECT DISTINCT 
            f.id,
            f.facility_name,
            p.status as process_status
          FROM facilities f
          INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
          WHERE f.route = ?
          ORDER BY f.facility_name`,
          {
            replacements: [reportingMonth, route.route_name],
            type: db.sequelize.QueryTypes.SELECT
          }
        );
        
        console.log(`\n${route.route_name}:`);
        facilities.forEach(f => {
          console.log(`  - ${f.facility_name}: ${f.process_status}`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

checkAllAbuye();
