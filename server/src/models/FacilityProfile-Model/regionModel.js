module.exports = (sequelize, DataTypes) => {
    const Region = sequelize.define("Regions", {
      region_name: {
        type: DataTypes.STRING,
      },
    })
  
    return Region;
  };