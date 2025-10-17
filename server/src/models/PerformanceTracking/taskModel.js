// Task Model Example (for Sequelize / Node.js)
module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    measurement: {
      type: DataTypes.STRING,
      allowNull: false
    },
    target: {
      type: DataTypes.STRING, // Use STRING to support 80%, 5 items, 2 hours, etc.
      allowNull: false
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return Task;
};
