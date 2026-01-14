module.exports = (sequelize, DataTypes) => {
  const RouteAssignment = sequelize.define('RouteAssignment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    route_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'routes',
        key: 'id'
      }
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    deliverer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      },
      comment: 'TM Manager who made the assignment'
    },
    assignment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    scheduled_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the route should be executed'
    },
    ethiopian_month: {
      type: DataTypes.ENUM(
        'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
        'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
      ),
      allowNull: false,
      defaultValue: 'Tir', // Current Ethiopian month (January 2026 = Tir)
      comment: 'Ethiopian calendar month for the assignment'
    },
    status: {
      type: DataTypes.ENUM('Assigned', 'In Progress', 'Completed', 'Cancelled', 'Delayed'),
      allowNull: false,
      defaultValue: 'Assigned'
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
      allowNull: false,
      defaultValue: 'Medium'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    actual_start_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actual_end_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the dispatch was completed'
    },
    completed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      },
      comment: 'Employee ID who completed the dispatch'
    },
    arrival_kilometer: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Arrival kilometer reading for the route'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'route_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['route_id']
      },
      {
        fields: ['vehicle_id']
      },
      {
        fields: ['driver_id']
      },
      {
        fields: ['deliverer_id']
      },
      {
        fields: ['assigned_by']
      },
      {
        fields: ['status']
      },
      {
        fields: ['scheduled_date']
      },
      {
        fields: ['assignment_date']
      }
    ]
  });

  return RouteAssignment;
};