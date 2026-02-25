module.exports = (sequelize, DataTypes) => {
  const OdnRdf = sequelize.define('OdnRdf', {
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
    odn_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id'
      }
    },
    // Status tracking for each ODN
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'pending'
    },
    next_service_point: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'ewm'
    },
    // EWM tracking
    ewm_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ewm_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ewm_completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ewm_officer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ewm_officer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Dispatch tracking
    dispatch_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    dispatch_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dispatch_completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dispatcher_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dispatcher_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Exit Permit (Dispatch-Documentation) tracking
    exit_permit_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    exit_permit_started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    exit_permit_completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    exit_permit_officer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    exit_permit_officer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Gate Keeper tracking
    gate_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gate_processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gate_processed_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gate_processed_by_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Who added this ODN
    added_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    added_by_name: {
      type: DataTypes.STRING(255),
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
    tableName: 'odns_rdf',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return OdnRdf;
};