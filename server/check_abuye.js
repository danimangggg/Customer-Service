const db = require('./src/models');

async function checkAbuye() {
  try {
    // Find Abuye Health Center
    const facility = await db.sequelize.query(
      'SELECT id, facility_name, route, period FROM facilities WHERE facility_name LIKE "%Abuye%"',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log('=== ABUYE HEALTH CENTER ===');
    console.log(JSON.stringify(facility, null, 2));
    
    if (facility.length > 0) {
      // Check its processes for current period
      const processes = await db.sequelize.query(
        'SELECT id, facility_id, reporting_month, status FROM processes WHERE facility_id = ? ORDER BY reporting_month DESC LIMIT 10',
        { 
          replacements: [facility[0].id],
          type: db.sequelize.QueryTypes.SELECT 
        }
      );
      
      console.log('\n=== PROCESSES FOR ABUYE ===');
      console.log(JSON.stringify(processes, null, 2));
      
      // Check if there are other facilities on the same route
      if (facility[0].route) {
        const reportingMonth = processes[0]?.reporting_month || 'Tahsas 2017';
        const routeFacilities = await db.sequelize.query(
          `SELECT f.id, f.facility_name, p.status, p.reporting_month 
           FROM facilities f 
           LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ? 
           WHERE f.route = ? 
           ORDER BY f.facility_name`,
          { 
            replacements: [reportingMonth, facility[0].route],
            type: db.sequelize.QueryTypes.SELECT 
          }
        );
        
        console.log('\n=== ALL FACILITIES ON ROUTE', facility[0].route, 'FOR', reportingMonth, '===');
        console.log(JSON.stringify(routeFacilities, null, 2));
        
        // Count statuses
        const ewmCompleted = routeFacilities.filter(f => f.status === 'ewm_completed').length;
        const total = routeFacilities.filter(f => f.status !== null).length;
        
        console.log('\n=== SUMMARY ===');
        console.log('Total facilities with processes:', total);
        console.log('EWM Completed:', ewmCompleted);
        console.log('Should appear in PI page?', ewmCompleted === total && total > 0 ? 'YES' : 'NO');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAbuye();
