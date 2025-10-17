module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("Users", {
      first_name: {
        type: DataTypes.STRING,
      },
      last_name: {
        type: DataTypes.STRING,
      },
      user_name: {
        type: DataTypes.STRING,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
      },
      account_type: {
        type: DataTypes.STRING,
      },
       position: {
        type: DataTypes.STRING,
      },
       department: {
        type: DataTypes.STRING,
      },
      role: {
        type: DataTypes.STRING,
      },
      store: {
        type: DataTypes.STRING,
      }
    });
  
    return User;
  };
  