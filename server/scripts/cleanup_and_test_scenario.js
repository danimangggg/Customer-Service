const db = require('../src/models');

async function cleanupAndTestScenario() {
  try {
    console.log('=== Cleanup and Test Scenario ===\n');
    
    const month = 'Tahsas';
    const year = '2018';
    const reportingMonth = `${month} ${year}`;
    const routeName = 'AD-R-2';
    
    // 1. Delete existing vehicle request
    console.log('1. Cleaning up existing vehicle request...');
    await db.sequelize.query(`
      DELETE FROM pi_vehicle_requests
      WHERE route_id = (SELECT id FROM routes WHERE route_name = ?)
        AND month = ? AND year = ?
    `, {
      replacements: [routeName, month, year],
      type: db.sequelize.QueryTypes.DELETE
    });
    console.log('✓ Deleted existing vehicle request\n');
    
    // 2. Get facilities for this route in current period
    console.log('2. Getting facilities for route...');
    const ethiopianMonths = [
      'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
    ];
    const monthIndex = ethiopianMonths.indexOf(month);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';
    
    const facilities = await db.sequelize.query(`
      SELECT f.id, f.facility_name, f.period
      FROM facilities f
      WHERE f.route = ?
        AND (f.period = 'Monthly' OR f.period = ?)
      ORDER BY f.facility_name
    `, {
      replacements: [routeName, currentPeriod],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`Found ${facilities.length} facilities in current period (${currentPeriod}):`);
    facilities.forEach(f => {
      console.log(`  - ${f.facility_name} (ID: ${f.id}, Period: ${f.period})`);
    });
    console.log('');
    
    // 3. Reset all processes to ewm_completed
    console.log('3. Resetting all processes to ewm_completed...');
    for (const facility of facilities) {
      // Check if process exists
      const existingProcess = await db.sequelize.query(`
        SELECT id, status FROM processes
        WHERE facility_id = ? AND reporting_month = ?
      `, {
        replacements: [facility.id, reportingMonth],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      if (existingProcess.length > 0) {
        // Update existing process
        await db.sequelize.query(`
          UPDATE processes
          SET status = 'ewm_completed'
          WHERE facility_id = ? AND reporting_month = ?
        `, {
          replacements: [facility.id, reportingMonth],
          type: db.sequelize.QueryTypes.UPDATE
        });
        console.log(`  ✓ Updated ${facility.facility_name} from ${existingProcess[0].status} to ewm_completed`);
      } else {
        console.log(`  ⚠ No process record found for ${facility.facility_name} - skipping`);
      }
    }
    console.log('');
    
    // 4. Verify the route now appears in the query
    console.log('4. Verifying route appears in PI vehicle request query...');
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
      console.log('✓ Route APPEARS in query results (CORRECT):');
      console.log(`  Route: ${result[0].route_name}`);
      console.log(`  Total facilities: ${result[0].total_facilities_in_route}`);
      console.log(`  EWM completed: ${result[0].ewm_completed_facilities}`);
      console.log(`  Vehicle requested: ${result[0].vehicle_requested_facilities}`);
      console.log(`  vehicle_requested flag: ${result[0].vehicle_requested}`);
      console.log('  → Button should be ACTIVE (Request Vehicle)');
    } else {
      console.log('✗ Route DOES NOT appear in query results (INCORRECT)');
      console.log('  This means the HAVING clause filtered it out incorrectly');
    }
    console.log('');
    
    console.log('=== Test Scenario Ready ===');
    console.log('Now you can test in the UI:');
    console.log(`1. Go to PI Vehicle Requests page`);
    console.log(`2. Select month: ${month} ${year}`);
    console.log(`3. Route ${routeName} should appear with "Request Vehicle" button ACTIVE`);
    console.log(`4. All ${facilities.length} facilities should show as "EWM Completed"`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

cleanupAndTestScenario();
