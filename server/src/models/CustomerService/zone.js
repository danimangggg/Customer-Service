module.exports = (sequelize, Sequelize) => {
  const Zone = sequelize.define("zone", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    zone_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    region_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'zones',
    timestamps: true,
  });

  return Zone;
};