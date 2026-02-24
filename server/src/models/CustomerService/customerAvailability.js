module.exports = (sequelize, DataTypes) => {
  const CustomerAvailability = sequelize.define('CustomerAvailability', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    process_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customer_queue',
        key: 'id'
      }
    },
    store: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    // Availability status
    is_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    availability_status: {
      type: DataTypes.ENUM('not_available', 'available', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'not_available',
    },
    // When customer became available at this store
    available_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // When customer was marked as available (by whom)
    marked_available_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    marked_available_by_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Service tracking at this store
    service_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    service_completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    served_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    served_by_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  }, {
    tableName: 'customer_availability',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['process_id', 'store']
      },
      {
        fields: ['store', 'is_available']
      },
      {
        fields: ['availability_status']
      }
    ]
  });

  return CustomerAvailability;
};
