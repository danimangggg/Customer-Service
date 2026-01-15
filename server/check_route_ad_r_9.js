const db = require('./src/models');

async function checkRoute() {
  try {
    const routeName = 'AD-R-9';
    const reportingMonth = 'Tahsas 2017'; // Adjust this to current period
    
    console.log('=== CHECKING ROUTE', routeName, 'FOR', reportingMonth, '===\n');
    
    // Get all facilities on this route
    const allFacilities = await db.sequelize.query(
      'SELECT id, facility_name, route, period FROM facilities WHERE route = ?',
      { 
        replacements: [routeName],
        type: db.sequelize.QueryTypes.SELECT 
      }
    );
    
    console.log('Total facilities on route:', allFacilities.length);
    console.log(JSON.stringify(allFacilities, null, 2));
    
    // Check processes for each facility
    console.log('\n=== PROCESSES FOR EACH FACILITY ===');
    for (const facility of allFacilities) {
      const processes = await db.sequelize.query(
        'SELECT id, status, reporting_month FROM processes WHERE facility_id = ? AND reporting_month = ?',
        { 
          replacements: [facility.id, reportingMonth],
          type: db.sequelize.QueryTypes.SELECT 
        }
      );
      
      console.log(`\n${facility.facility_name} (ID: ${facility.id}):`);
      if (processes.length > 0) {
        console.log('  Status:', processes[0].status);
      } else {
        console.log('  NO PROCESS for this period');
      }
    }
    
    // Run the actual PI query to see what it returns
    console.log('\n=== RUNNING ACTUAL PI QUERY ===');
    const query = `
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
        AND r.route_name = ?
      GROUP BY r.id, r.route_name
    `;
    
    const result = await db.sequelize.query(query, {
      replacements: [reportingMonth, routeName],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('Query result:', JSON.stringify(result, null, 2));
    
    if (result.length > 0) {
      const r = result[0];
      console.log('\nAnalysis:');
      console.log('- Total facilities in route:', r.total_facilities_in_route);
      console.log('- EWM completed:', r.ewm_completed_facilities);
      console.log('- Vehicle requested:', r.vehicle_requested_facilities);
      console.log('- Should appear?', 
        (r.ewm_completed_facilities === r.total_facilities_in_route || 
         r.vehicle_requested_facilities === r.total_facilities_in_route) ? 'YES' : 'NO'
      );
    } else {
      console.log('\nRoute does NOT appear in query results (correct if no processes)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRoute();
