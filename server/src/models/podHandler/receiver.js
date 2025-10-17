module.exports = (sequelize, DataTypes) => {
    const Receiver = sequelize.define("Receivers", {
      receiver: {
        type: DataTypes.STRING,
      },
    })
  
    return Receiver;
  };