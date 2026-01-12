module.exports = (sequelize, DataTypes) => {
  const ODN = sequelize.define('ODN', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    process_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'processes',
        key: 'id'
      }
    },
    odn_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'odns',
    timestamps: false,
    indexes: [
      {
        // Add unique constraint on odn_number to prevent duplicates
        unique: true,
        fields: ['odn_number'],
        name: 'unique_odn_number'
      }
    ]
  });

  return ODN;
};