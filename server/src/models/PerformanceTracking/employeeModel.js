// Employee Model Example (for Sequelize / Node.js)
module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_name: {
      type: DataTypes.STRING,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    account_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    account_status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    store: {
      type: DataTypes.STRING,
      allowNull: true
    },
  });

  return Employee;
};
