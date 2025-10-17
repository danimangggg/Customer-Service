module.exports = (sequelize, DataTypes) => {
    const Zone = sequelize.define("Zones", {
      region_name: {
        type: DataTypes.STRING,
      },
      zone_name: {
        type: DataTypes.STRING,
      },
    })
  
    return Zone;
  };