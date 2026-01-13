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
    // POD tracking columns
    pod_confirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    pod_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pod_confirmed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    pod_confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Document follow-up columns
    documents_signed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    documents_handover: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    followup_completed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    followup_completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Quality evaluation columns
    quality_confirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    quality_feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quality_evaluated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    quality_evaluated_at: {
      type: DataTypes.DATE,
      allowNull: true
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