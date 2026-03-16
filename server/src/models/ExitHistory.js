module.exports = (sequelize, DataTypes) => {
  const ExitHistory = sequelize.define('exit_history', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    process_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customer_queue',
        key: 'id'
      }
    },
    store_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    exit_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Sequential exit number for this process (1st exit, 2nd exit, etc.)'
    },
    vehicle_plate: {
      type: DataTypes.STRING,
      allowNull: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    measurement_unit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    receipt_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    receipt_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gate_keeper_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    gate_keeper_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    exit_type: {
      type: DataTypes.ENUM('partial', 'full'),
      allowNull: false,
      defaultValue: 'full'
    },
    exited_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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
    tableName: 'exit_history',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ExitHistory;
};
