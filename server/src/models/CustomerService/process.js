module.exports = (sequelize, DataTypes) => {
  const Process = sequelize.define('Processes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    facility_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    service_point: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    o2c_officer_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reporting_month: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    process_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'regular',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    // TM (Transportation Manager) fields
    tm_notified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tm_officer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tm_officer_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    freight_order_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    freight_order_created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    freight_order_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    freight_order_sent_to_ewm_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // EWM Goods Issue fields
    ewm_goods_issued_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ewm_goods_issued_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ewm_goods_issued_by_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Biller fields
    biller_received_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    biller_officer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    biller_officer_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    biller_printed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    biller_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Vehicle assignment fields (from TM Manager Phase 1)
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    vehicle_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Driver and deliverer assignment fields (from Route Management Phase 2)
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    driver_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deliverer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deliverer_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    driver_assigned_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    departure_kilometer: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    arrival_kilometer: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    tm_confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dispatch_completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: 'processes',
    timestamps: false,
  });

  return Process;
};
