const db = require('../src/models');

async function createMissingProcess() {
  try {
    console.log('=== Creating Missing Process Record ===\n');
    
    const facilityId = 19; // Abuna Health Center
    const reportingMonth = 'Tahsas 2018';
    
    // Get facility details
    const facility = await db.sequelize.query(`
      SELECT id, facility_name
      FROM facilities
      WHERE id = ?
    `, {
      replacements: [facilityId],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (facility.length === 0) {
      console.log('Facility not found');
      return;
    }
    
    console.log(`Facility: ${facility[0].facility_name}`);
    console.log(`Reporting Month: ${reportingMonth}\n`);
    
    // Create process record with all required fields
    await db.sequelize.query(`
      INSERT INTO processes (facility_id, reporting_month, status, service_point, created_at)
      VALUES (?, ?, 'ewm_completed', 'o2c', NOW())
    `, {
      replacements: [facilityId, reportingMonth],
      type: db.sequelize.QueryTypes.INSERT
    });
    
    console.log('✓ Process record created successfully\n');
    
    // Now test the query
    console.log('Testing PI vehicle request query...');
    const query = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities_in_route,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
        AND (f.period = 'Monthly' OR f.period = 'Even')
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE f.route IS NOT NULL 
        AND r.route_name = 'AD-R-2'
      GROUP BY r.id, r.route_name
    `;
    
    const result = await db.sequelize.query(query, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (result.length > 0) {
      console.log('✓ Route query result:');
      console.log(`  Total facilities: ${result[0].total_facilities_in_route}`);
      console.log(`  EWM completed: ${result[0].ewm_completed_facilities}`);
      console.log(`  Vehicle requested: ${result[0].vehicle_requested_facilities}`);
      
      if (result[0].total_facilities_in_route === result[0].ewm_completed_facilities) {
        console.log('\n✓ ALL facilities have completed EWM - route should appear!');
      } else {
        console.log('\n✗ Not all facilities have completed EWM');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

createMissingProcess();
