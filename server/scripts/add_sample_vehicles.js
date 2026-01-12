const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'epss_db'
};

const sampleVehicles = [
  { vehicle_name: 'Toyota Hilux 1', plate_number: 'AA-001-2024', vehicle_type: 'Pickup Truck', description: 'Standard delivery vehicle' },
  { vehicle_name: 'Toyota Hilux 2', plate_number: 'AA-002-2024', vehicle_type: 'Pickup Truck', description: 'Standard delivery vehicle' },
  { vehicle_name: 'Isuzu D-Max 1', plate_number: 'AA-003-2024', vehicle_type: 'Pickup Truck', description: 'Heavy duty delivery vehicle' },
  { vehicle_name: 'Isuzu D-Max 2', plate_number: 'AA-004-2024', vehicle_type: 'Pickup Truck', description: 'Heavy duty delivery vehicle' },
  { vehicle_name: 'Ford Transit 1', plate_number: 'AA-005-2024', vehicle_type: 'Van', description: 'Large capacity delivery van' },
  { vehicle_name: 'Ford Transit 2', plate_number: 'AA-006-2024', vehicle_type: 'Van', description: 'Large capacity delivery van' },
  { vehicle_name: 'Mitsubishi L200 1', plate_number: 'AA-007-2024', vehicle_type: 'Pickup Truck', description: 'Reliable delivery vehicle' },
  { vehicle_name: 'Mitsubishi L200 2', plate_number: 'AA-008-2024', vehicle_type: 'Pickup Truck', description: 'Reliable delivery vehicle' },
  { vehicle_name: 'Nissan Navara 1', plate_number: 'AA-009-2024', vehicle_type: 'Pickup Truck', description: 'All-terrain delivery vehicle' },
  { vehicle_name: 'Nissan Navara 2', plate_number: 'AA-010-2024', vehicle_type: 'Pickup Truck', description: 'All-terrain delivery vehicle' }
];

async function addSampleVehicles() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Adding sample vehicles...\n');
    
    // Check if vehicles table exists
    const [tables] = await connection.execute(`SHOW TABLES LIKE 'vehicles'`);
    if (tables.length === 0) {
      console.log('❌ Vehicles table does not exist. Please create it first.');
      return;
    }
    
    // Check current vehicles count
    const [currentCount] = await connection.execute(`SELECT COUNT(*) as count FROM vehicles`);
    console.log(`Current vehicles in database: ${currentCount[0].count}`);
    
    if (currentCount[0].count > 0) {
      console.log('Vehicles already exist. Showing existing vehicles...');
      
      // Show existing vehicles
      const [existingVehicles] = await connection.execute(`
        SELECT id, vehicle_name, plate_number, status, vehicle_type 
        FROM vehicles 
        ORDER BY vehicle_name 
        LIMIT 10
      `);
      console.log('Existing vehicles:', existingVehicles);
      return;
    }
    
    // Insert sample vehicles
    console.log('Inserting sample vehicles...');
    let insertedCount = 0;
    
    for (const vehicle of sampleVehicles) {
      try {
        await connection.execute(`
          INSERT INTO vehicles (vehicle_name, plate_number, vehicle_type, description, status, created_at, updated_at) 
          VALUES (?, ?, ?, ?, 'Active', NOW(), NOW())
        `, [vehicle.vehicle_name, vehicle.plate_number, vehicle.vehicle_type, vehicle.description]);
        
        console.log(`✓ Added: ${vehicle.vehicle_name} (${vehicle.plate_number})`);
        insertedCount++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`- Skipped (already exists): ${vehicle.vehicle_name}`);
        } else {
          console.error(`❌ Error adding ${vehicle.vehicle_name}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ Successfully added ${insertedCount} vehicles`);
    
    // Verify the insertion
    const [finalCount] = await connection.execute(`SELECT COUNT(*) as count FROM vehicles`);
    console.log(`Total vehicles now: ${finalCount[0].count}`);
    
    // Show all vehicles
    const [allVehicles] = await connection.execute(`
      SELECT id, vehicle_name, plate_number, status, vehicle_type, created_at 
      FROM vehicles 
      ORDER BY vehicle_name
    `);
    console.log('\nAll vehicles in database:');
    allVehicles.forEach(vehicle => {
      console.log(`  ${vehicle.id}: ${vehicle.vehicle_name} (${vehicle.plate_number}) - ${vehicle.status}`);
    });
    
  } catch (error) {
    console.error('Error adding sample vehicles:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the script
if (require.main === module) {
  addSampleVehicles()
    .then(() => {
      console.log('\nSample vehicles addition completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = addSampleVehicles;