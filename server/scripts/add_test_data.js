const db = require('../src/models');

const addTestData = async () => {
  try {
    // Add test drivers
    await db.sequelize.query(`
      INSERT IGNORE INTO employees (full_name, user_name, password, jobTitle, account_status, account_type, department, store) VALUES
      ('John Driver', 'driver1', 'password123', 'Driver', 'Active', 'Standard', 'Transportation', 'AA1'),
      ('Jane Driver', 'driver2', 'password123', 'Driver', 'Active', 'Standard', 'Transportation', 'AA1'),
      ('Mike Driver', 'driver3', 'password123', 'Driver', 'Active', 'Standard', 'Transportation', 'AA1')
    `);

    // Add test deliverers
    await db.sequelize.query(`
      INSERT IGNORE INTO employees (full_name, user_name, password, jobTitle, account_status, account_type, department, store) VALUES
      ('Bob Deliverer', 'deliverer1', 'password123', 'Deliverer', 'Active', 'Standard', 'Transportation', 'AA1'),
      ('Alice Deliverer', 'deliverer2', 'password123', 'Deliverer', 'Active', 'Standard', 'Transportation', 'AA1'),
      ('Tom Deliverer', 'deliverer3', 'password123', 'Deliverer', 'Active', 'Standard', 'Transportation', 'AA1')
    `);

    // Add test TM Manager
    await db.sequelize.query(`
      INSERT IGNORE INTO employees (full_name, user_name, password, jobTitle, account_status, account_type, department, store) VALUES
      ('Transport Manager', 'tmmanager', 'password123', 'TM Manager', 'Active', 'Standard', 'Transportation', 'AA1')
    `);

    // Add test vehicles (check if vehicles table has created_at/updated_at)
    await db.sequelize.query(`
      INSERT IGNORE INTO vehicles (vehicle_name, plate_number, vehicle_type, description, status) VALUES
      ('Delivery Truck 1', 'DT-001', 'Truck', 'Large delivery truck for heavy loads', 'Active'),
      ('Delivery Van 1', 'DV-001', 'Van', 'Medium delivery van for regular deliveries', 'Active'),
      ('Delivery Van 2', 'DV-002', 'Van', 'Medium delivery van for regular deliveries', 'Active'),
      ('Emergency Vehicle', 'EV-001', 'Car', 'Fast emergency delivery vehicle', 'Active'),
      ('Cargo Truck', 'CT-001', 'Truck', 'Heavy cargo truck for industrial deliveries', 'Active')
    `);

    console.log('✅ Successfully added test data for drivers, deliverers, TM manager, and vehicles');
  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
  }
};

// Run the script
addTestData()
  .then(() => {
    console.log('🎉 Test data setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test data setup failed:', error);
    process.exit(1);
  });