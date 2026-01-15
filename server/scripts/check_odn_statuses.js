const db = require('../src/models');

async function checkODNStatuses() {
  try {
    console.log('=== Checking ODN Statuses ===\n');
    
    // Get all unique ODN statuses
    const statuses = await db.sequelize.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM odns
      GROUP BY status
      ORDER BY count DESC
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('ODN Status Distribution:');
    statuses.forEach(s => {
      console.log(`  ${(s.status || 'NULL').padEnd(20)} : ${s.count} ODNs`);
    });
    
    console.log('\n=== Checking Process Statuses ===\n');
    
    // Get all unique process statuses
    const processStatuses = await db.sequelize.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM processes
      GROUP BY status
      ORDER BY count DESC
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('Process Status Distribution:');
    processStatuses.forEach(s => {
      console.log(`  ${(s.status || 'NULL').padEnd(25)} : ${s.count} processes`);
    });
    
    console.log('\n=== Checking Route Assignment Statuses ===\n');
    
    // Get route assignment statuses
    const raStatuses = await db.sequelize.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM route_assignments
      GROUP BY status
      ORDER BY count DESC
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log('Route Assignment Status Distribution:');
    raStatuses.forEach(s => {
      console.log(`  ${(s.status || 'NULL').padEnd(20)} : ${s.count} assignments`);
    });
    
    console.log('\n=== Recommendation ===');
    console.log('Dispatched ODNs should be counted based on:');
    console.log('  - Route assignments with status "Dispatched" or "Completed"');
    console.log('  - OR processes with status "vehicle_requested" or beyond');
    console.log('  - NOT based on ODN status field (which may not be used)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkODNStatuses();
