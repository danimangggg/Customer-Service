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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'processes',
    timestamps: false,
  });

  return Process;
};
