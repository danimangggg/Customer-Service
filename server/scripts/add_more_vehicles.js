const db = require('../src/models');

async function addMoreVehicles() {
  try {
    console.log('🚗 Adding more sample vehicles...\n');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check current vehicles count
    const currentCount = await db.vehicle.count();
    console.log(`Current vehicles: ${currentCount}`);
    
    if (currentCount >= 5) {
      console.log('✅ Sufficient vehicles already exist');
      
      // Show existing vehicles
      const vehicles = await db.vehicle.findAll({
        attributes: ['id', 'vehicle_name', 'plate_number', 'vehicle_type', 'status'],
        order: [['vehicle_name', 'ASC']]
      });
      
      console.log('\nExisting vehicles:');
      vehicles.forEach(vehicle => {
        console.log(`  ${vehicle.id}: ${vehicle.vehicle_name} (${vehicle.plate_number}) - ${vehicle.status}`);
      });
      
      return;
    }
    
    // Add more sample vehicles
    const additionalVehicles = [
      { vehicle_name: 'Toyota Hilux 3', plate_number: 'AA-003-2024', vehicle_type: 'Pickup', status: 'Active', description: 'Standard delivery vehicle' },
      { vehicle_name: 'Isuzu D-Max 1', plate_number: 'AA-004-2024', vehicle_type: 'Pickup', status: 'Active', description: 'Heavy duty delivery vehicle' },
      { vehicle_name: 'Ford Transit 2', plate_number: 'AA-006-2024', vehicle_type: 'Van', status: 'Active', description: 'Large capacity delivery van' },
      { vehicle_name: 'Mitsubishi L200 1', plate_number: 'AA-007-2024', vehicle_type: 'Pickup', status: 'Active', description: 'Reliable delivery vehicle' },
      { vehicle_name: 'Nissan Navara 1', plate_number: 'AA-008-2024', vehicle_type: 'Pickup', status: 'Active', description: 'All-terrain delivery vehicle' }
    ];
    
    console.log('Adding additional vehicles...');
    let addedCount = 0;
    
    for (const vehicleData of additionalVehicles) {
      try {
        // Check if vehicle with same plate number already exists
        const existing = await db.vehicle.findOne({
          where: { plate_number: vehicleData.plate_number }
        });
        
        if (existing) {
          console.log(`  - Skipped (already exists): ${vehicleData.vehicle_name} (${vehicleData.plate_number})`);
          continue;
        }
        
        await db.vehicle.create(vehicleData);
        console.log(`  ✅ Added: ${vehicleData.vehicle_name} (${vehicleData.plate_number})`);
        addedCount++;
      } catch (error) {
        console.log(`  ❌ Error adding ${vehicleData.vehicle_name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Successfully added ${addedCount} additional vehicles!`);
    
    // Show final count and list
    const finalCount = await db.vehicle.count();
    console.log(`Total vehicles now: ${finalCount}`);
    
    const allVehicles = await db.vehicle.findAll({
      attributes: ['id', 'vehicle_name', 'plate_number', 'vehicle_type', 'status'],
      order: [['vehicle_name', 'ASC']]
    });
    
    console.log('\nAll vehicles in database:');
    allVehicles.forEach(vehicle => {
      console.log(`  ${vehicle.id}: ${vehicle.vehicle_name} (${vehicle.plate_number}) - ${vehicle.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding vehicles:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
addMoreVehicles()
  .then(() => {
    console.log('\n✅ Vehicle addition completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to add vehicles:', error);
    process.exit(1);
  });