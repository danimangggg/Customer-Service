const { DataTypes } = require('sequelize');
const sequelize = require('../src/config/database');

const createVehiclesTable = async () => {
  try {
    // Create the vehicles table
    await sequelize.getQueryInterface().createTable('vehicles', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      vehicle_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      plate_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      vehicle_type: {
        type: DataTypes.ENUM('Truck', 'Van', 'Pickup', 'Motorcycle', 'Car', 'Bus', 'Other'),
        allowNull: false,
        defaultValue: 'Truck'
      },
      status: {
        type: DataTypes.ENUM('Active', 'Inactive', 'Maintenance', 'Retired'),
        allowNull: false,
        defaultValue: 'Active'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await sequelize.getQueryInterface().addIndex('vehicles', ['plate_number'], {
      unique: true,
      name: 'vehicles_plate_number_unique'
    });

    await sequelize.getQueryInterface().addIndex('vehicles', ['vehicle_type'], {
      name: 'vehicles_vehicle_type_index'
    });

    await sequelize.getQueryInterface().addIndex('vehicles', ['status'], {
      name: 'vehicles_status_index'
    });

    console.log('✅ Vehicles table created successfully with indexes');

    // Insert some sample data
    await sequelize.getQueryInterface().bulkInsert('vehicles', [
      {
        vehicle_name: 'Main Delivery Truck',
        plate_number: 'AA-001-2024',
        vehicle_type: 'Truck',
        status: 'Active',
        description: 'Primary delivery vehicle for pharmaceutical supplies',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        vehicle_name: 'Emergency Van',
        plate_number: 'AA-002-2024',
        vehicle_type: 'Van',
        status: 'Active',
        description: 'Emergency delivery vehicle for urgent medical supplies',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        vehicle_name: 'Pickup Truck',
        plate_number: 'AA-003-2024',
        vehicle_type: 'Pickup',
        status: 'Maintenance',
        description: 'Small delivery vehicle for local distribution',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        vehicle_name: 'Motorcycle Courier',
        plate_number: 'AA-004-2024',
        vehicle_type: 'Motorcycle',
        status: 'Active',
        description: 'Fast delivery for small packages and documents',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log('✅ Sample vehicle data inserted successfully');
    
  } catch (error) {
    console.error('❌ Error creating vehicles table:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the migration
createVehiclesTable();