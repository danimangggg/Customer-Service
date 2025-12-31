module.exports = (sequelize, Sequelize) => {
  const Woreda = sequelize.define("woreda", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    woreda_name: {
      type: Sequelize.STRING,
      allowNull: false,
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
    tableName: 'woredas',
    timestamps: true,
  });

  return Woreda;
};