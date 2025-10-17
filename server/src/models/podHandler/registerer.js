module.exports = (sequelize, DataTypes) => {
    const Registerer = sequelize.define("Registerers", {
      registerer: {
        type: DataTypes.STRING,
      },
    })
  
    return Registerer;
  };