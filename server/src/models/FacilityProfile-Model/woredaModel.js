module.exports = (sequelize, DataTypes) => {
    const Woreda = sequelize.define("Woredas", {
      region_name: {
        type: DataTypes.STRING,
      },
      zone_name: {
        type: DataTypes.STRING,
      },
      woreda_name: {
        type: DataTypes.STRING,
      },
    })
  
    return Woreda;
  };