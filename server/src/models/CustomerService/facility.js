module.exports = (sequelize, Sequelize) => {
  const Facility = sequelize.define("facility", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    facility_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    facility_type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    region_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    zone_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    woreda_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    route: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    period: {
      type: Sequelize.ENUM('Odd', 'Even', 'Monthly'),
      allowNull: true,
    },
  }, {
    tableName: 'facilities',
    timestamps: true,
  });

  return Facility;
};