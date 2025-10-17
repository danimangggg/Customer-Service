module.exports = (sequelize, DataTypes) => {
    const AccountType = sequelize.define("account_type", {
      
      account_type: {
        type: DataTypes.STRING,
      }
    });
  
    return AccountType;
  };
  