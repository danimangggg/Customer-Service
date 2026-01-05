module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define('Vehicle', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vehicle_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    plate_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 20]
      }
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
  }, {
    tableName: 'vehicles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['plate_number']
      },
      {
        fields: ['vehicle_type']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Vehicle;
};