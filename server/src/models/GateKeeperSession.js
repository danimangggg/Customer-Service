module.exports = (sequelize, DataTypes) => {
  const GateKeeperSession = sequelize.define('GateKeeperSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    store: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Store gate assigned to this Gate Keeper session'
    },
    logged_in_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this session is currently active'
    },
    logged_out_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'gate_keeper_sessions',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  GateKeeperSession.associate = (models) => {
    GateKeeperSession.belongsTo(models.employee, {
      foreignKey: 'user_id',
      as: 'employee'
    });
  };

  return GateKeeperSession;
};
