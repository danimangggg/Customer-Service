const db = require('../src/models');

async function createTestScenario() {
  try {
    console.log('🔧 Creating test scenario...\n');

    const testMonth = 'Tir';
    const testYear = '2018';
    const reportingMonth = `${testMonth} ${testYear}`;

    // Find a route with multiple facilities in the same period
    const routeQuery = `
      SELECT 
        r.id as route_id,
        r.route_name,
        f.period,
        COUNT(*) as facility_count,
        GROUP_CONCAT(f.facility_name SEPARATOR ', ') as facilities
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      WHERE f.period IN ('Odd', 'Monthly')
      GROUP BY r.id, r.route_name, f.period
      HAVING facility_count >= 2
      LIMIT 1
    `;

    const routes = await db.sequelize.query(routeQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    if (routes.length === 0) {
      console.log('❌ No route found with 2+ facilities in the same period');
      return;
    }

    const testRoute = routes[0];
    console.log(`Found test route: ${testRoute.route_name}`);
    console.log(`Period: ${testRoute.period}`);
    console.log(`Facilities: ${testRoute.facilities}`);
    console.log('');

    // Get the facilities for this route and period
    const facilitiesQuery = `
      SELECT f.id, f.facility_name
      FROM facilities f
      WHERE f.route = ? AND f.period = ?
      LIMIT 2
    `;

    const facilities = await db.sequelize.query(facilitiesQuery, {
      replacements: [testRoute.route_name, testRoute.period],
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`Setting up test scenario for ${reportingMonth}:\n`);

    // Create processes for both facilities
    for (let i = 0; i < facilities.length; i++) {
      const facility = facilities[i];
      
      // Check if process already exists
      const existingProcess = await db.sequelize.query(
        'SELECT id FROM processes WHERE facility_id = ? AND reporting_month = ?',
        {
          replacements: [facility.id, reportingMonth],
          type: db.sequelize.QueryTypes.SELECT
        }
      );

      if (existingProcess.length > 0) {
        console.log(`  ✓ Process already exists for ${facility.facility_name}`);
        
        // Update status: first facility = ewm_completed, second = o2c_started
        const newStatus = i === 0 ? 'ewm_completed' : 'o2c_started';
        await db.sequelize.query(
          'UPDATE processes SET status = ? WHERE id = ?',
          {
            replacements: [newStatus, existingProcess[0].id],
            type: db.sequelize.QueryTypes.UPDATE
          }
        );
        console.log(`    Updated status to: ${newStatus}`);
      } else {
        // Create new process
        const newStatus = i === 0 ? 'ewm_completed' : 'o2c_started';
        await db.sequelize.query(
          'INSERT INTO processes (facility_id, reporting_month, status) VALUES (?, ?, ?)',
          {
            replacements: [facility.id, reportingMonth, newStatus],
            type: db.sequelize.QueryTypes.INSERT
          }
        );
        console.log(`  ✓ Created process for ${facility.facility_name} with status: ${newStatus}`);
      }
    }

    console.log('\n✅ Test scenario created!');
    console.log('\nExpected behavior:');
    console.log(`  - Route ${testRoute.route_name} should NOT appear in PI Vehicle Requests`);
    console.log(`  - Reason: Only 1 out of 2 facilities has ewm_completed status`);
    console.log(`\nTo test:`);
    console.log(`  1. Go to PI Vehicle Requests page`);
    console.log(`  2. Select month: ${testMonth}, year: ${testYear}`);
    console.log(`  3. Route ${testRoute.route_name} should NOT be visible`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

createTestScenario();