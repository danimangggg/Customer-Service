module.exports = (sequelize, Sequelize) => {
  const Region = sequelize.define("region", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    region_name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    tableName: 'regions',
    timestamps: true,
  });

  return Region;
};