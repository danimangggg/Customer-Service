// Employee Model Example (for Sequelize / Node.js)
module.exports = (sequelize, DataTypes) => {
    const OrgCatagory = sequelize.define('OrgCatagories', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      catagoryName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      anualTarget: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
    });
  
    return OrgCatagory;
  };
  