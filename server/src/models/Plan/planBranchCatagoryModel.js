// Employee Model Example (for Sequelize / Node.js)
module.exports = (sequelize, DataTypes) => {
  const BranchCatagory = sequelize.define('BranchCatagories', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    OrgCatagoryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    branchCatagory: {
      type: DataTypes.STRING,
      allowNull: false
    },
    anualTarget: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  });

  return BranchCatagory;
};
