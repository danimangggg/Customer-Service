module.exports = (sequelize, DataTypes) => {
  const EpssBranch = sequelize.define('EpssBranch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    branch_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    branch_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    },
  }, {
    tableName: 'epss_branches',
    timestamps: true,
  });

  return EpssBranch;
};
