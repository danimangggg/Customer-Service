module.exports = (sequelize, DataTypes) => {
  const Picklist = sequelize.define('Picklists', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    odn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    process_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    store: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
   
  }, {
    tableName: 'picklist',
    timestamps: false,
  });

  return Picklist;
};
