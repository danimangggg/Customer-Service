module.exports = (sequelize, DataTypes) => {
  const CustomerQueue = sequelize.define('CustomerQueue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    facility_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    customer_type: {
      type: DataTypes.ENUM('Cash', 'Credit'),
      allowNull: false,
    },
    next_service_point: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assigned_officer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('started', 'onprogress', "ewm_completed", 'completed', 'Canceled', 'archived', 'o2c_started', 'o2c_completed', 'notifying'),
      allowNull: false,
      defaultValue: 'started',
    },
    delegate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    delegate_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    letter_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Exit Permit fields (added for Dispatch-Documentation)
    receipt_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
vehicle_plate: {
  type: DataTypes.STRING(50),
  allowNull: true,
},
receipt_number: {
  type: DataTypes.STRING(100),
  allowNull: true,
},
total_amount: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: true,
},
measurement_unit: {
  type: DataTypes.STRING(50),
  allowNull: true,
},
// Gate Keeper fields
assigned_gate_keeper_id: {
  type: DataTypes.STRING(50),
  allowNull: true,
},
assigned_gate_keeper_name: {
  type: DataTypes.STRING(255),
  allowNull: true,
},
gate_status: {
  type: DataTypes.ENUM('allowed', 'denied'),
  allowNull: true,
},
gate_processed_at: {
  type: DataTypes.DATE,
  allowNull: true,
},
gate_processed_by: {
  type: DataTypes.STRING(255),
  allowNull: true,
},
  }, {
    tableName: 'customer_queue',
    timestamps: false,
  });

  return CustomerQueue;
};
