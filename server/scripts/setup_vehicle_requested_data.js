const db = require('../src/models');

async function setupVehicleRequestedData() {
  try {
    console.log('🔧 Setting up vehicle requested test data...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Update some processes to have vehicle_requested status
    const reportingMonth = 'Tir 2018';
    
    // Find processes with ewm_completed status and update some to vehicle_requested
    const updateQuery = `
      UPDATE processes p
      INNER JOIN facilities f ON f.id = p.facility_id
      SET p.status = 'vehicle_requested'
      WHERE p.reporting_month = ? 
        AND p.status = 'ewm_completed'
        AND f.route IN ('AD-R-1', 'AD-R-2')
    `;
    
    const result = await db.sequelize.query(updateQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.UPDATE
    });
    
    console.log(`✅ Updated ${result[1]} processes to vehicle_requested status`);
    
    // Verify the update
    const verifyQuery = `
      SELECT 
        f.route,
        f.facility_name,
        p.status,
        p.reporting_month
      FROM processes p
      INNER JOIN facilities f ON f.id = p.facility_id
      WHERE p.reporting_month = ?
        AND p.status = 'vehicle_requested'
      ORDER BY f.route, f.facility_name
    `;
    
    const vehicleRequestedProcesses = await db.sequelize.query(verifyQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`\nFound ${vehicleRequestedProcesses.length} processes with vehicle_requested status:`);
    vehicleRequestedProcesses.forEach(process => {
      console.log(`  ${process.route}: ${process.facility_name} - ${process.status}`);
    });
    
    console.log('\n🎉 Vehicle requested test data setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

setupVehicleRequestedData()
  .then(() => {
    console.log('\n✅ Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });