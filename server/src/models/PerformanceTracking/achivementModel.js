// Employee Model Example (for Sequelize / Node.js)
module.exports = (sequelize, DataTypes) => {
  const Achivement = sequelize.define('Achivements', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    assignmentId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    achieved: {
      type: DataTypes.STRING,
      allowNull: false
    },
    savedDate: {
      type: DataTypes.STRING,
      allowNull: false
    },
    remark: {
      type: DataTypes.STRING,
      allowNull: true
    },
  });

  return Achivement;
};
