const db = require('../src/models');
const Vehicle = db.vehicle;

const seedVehicles = async () => {
  try {
    // Check if vehicles already exist
    const existingVehicles = await Vehicle.count();
    if (existingVehicles > 0) {
      console.log('✅ Vehicles already exist in database');
      return;
    }

    // Insert sample vehicles
    const sampleVehicles = [
      {
        vehicle_name: 'Main Delivery Truck',
        plate_number: 'AA-001-2024',
        vehicle_type: 'Truck',
        status: 'Active',
        description: 'Primary delivery vehicle for pharmaceutical supplies'
      },
      {
        vehicle_name: 'Emergency Van',
        plate_number: 'AA-002-2024',
        vehicle_type: 'Van',
        status: 'Active',
        description: 'Emergency delivery vehicle for urgent medical supplies'
      },
      {
        vehicle_name: 'Pickup Truck',
        plate_number: 'AA-003-2024',
        vehicle_type: 'Pickup',
        status: 'Maintenance',
        description: 'Small delivery vehicle for local distribution'
      },
      {
        vehicle_name: 'Motorcycle Courier',
        plate_number: 'AA-004-2024',
        vehicle_type: 'Motorcycle',
        status: 'Active',
        description: 'Fast delivery for small packages and documents'
      }
    ];

    await Vehicle.bulkCreate(sampleVehicles);
    console.log('✅ Sample vehicles inserted successfully');
    
  } catch (error) {
    console.error('❌ Error seeding vehicles:', error);
  } finally {
    await db.sequelize.close();
  }
};

// Run the seeding
seedVehicles();