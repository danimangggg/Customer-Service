// Employee Model Example (for Sequelize / Node.js)
module.exports = (sequelize, DataTypes) => {
    const Measurement= sequelize.define('Measurements', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      branchCatagoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      measurement: {
        type: DataTypes.STRING,
        allowNull: false
      },
      department: {
        type: DataTypes.STRING,
        allowNull: false
      },
      scoreType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      anualTarget: {
        type: DataTypes.DECIMAL,
        allowNull: false
      },
    });
  
    return Measurement;
  };
  