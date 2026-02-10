module.exports = (sequelize, DataTypes) => {
  const CustomerQueue = sequelize.define('CustomerQueue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    facility_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    customer_type: {
      type: DataTypes.ENUM('Cash', 'Credit'),
      allowNull: false,
    },
    next_service_point: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assigned_officer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('started', 'onprogress', "ewm_completed", 'completed', 'Canceled'),
      allowNull: false,
      defaultValue: 'started',
    },
    delegate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    delegate_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    letter_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    store_id_1: {
      type: DataTypes.STRING,
      allowNull: true,
    }, 
    store_id_2: {
      type: DataTypes.STRING,
      allowNull: true,
    }, 
    store_id_3: {
      type: DataTypes.STRING,
      allowNull: true,
    }, 
    store_completed_1: {
      type: DataTypes.STRING,
      allowNull: true,
    }, 
   store_completed_2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     store_completed_3: {
      type: DataTypes.STRING,
      allowNull: true,
  }, 
  aa1_odn: {
      type: DataTypes.STRING,
      allowNull: true,
    }, 
   aa2_odn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     aa3_odn: {
      type: DataTypes.STRING
  },
  availability_aa1: {
   type: DataTypes.STRING
},
availability_aa2: {
  type: DataTypes.STRING
},
// Exit Permit fields (added for Dispatch-Documentation)
receipt_count: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
vehicle_plate: {
  type: DataTypes.STRING(50),
  allowNull: true,
},
receipt_number: {
  type: DataTypes.STRING(100),
  allowNull: true,
},
total_amount: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: true,
},
measurement_unit: {
  type: DataTypes.STRING(50),
  allowNull: true,
},
// Gate Keeper fields
gate_status: {
  type: DataTypes.ENUM('allowed', 'denied'),
  allowNull: true,
},
gate_processed_at: {
  type: DataTypes.DATE,
  allowNull: true,
},
gate_processed_by: {
  type: DataTypes.STRING(255),
  allowNull: true,
},
// Registration tracking
registered_by_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
registered_by_name: {
  type: DataTypes.STRING(255),
  allowNull: true,
},
registration_completed_at: {
  type: DataTypes.DATE,
  allowNull: true,
},
// O2C Officer tracking
o2c_started_at: {
  type: DataTypes.DATE,
  allowNull: true,
},
o2c_completed_at: {
  type: DataTypes.DATE,
  allowNull: true,
},
o2c_officer_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
o2c_officer_name: {
  type: DataTypes.STRING(255),
  allowNull: true,
},
// EWM Officer tracking
ewm_started_at: {
  type: DataTypes.DATE,
  allowNull: true,
},
ewm_completed_at: {
  type: DataTypes.DATE,
  allowNull: true,
},
ewm_officer_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
ewm_officer_name: {
  type: DataTypes.STRING(255),
  allowNull: true,
},
// WIM Operator tracking
wim_started_at: {
  type: DataTypes.DATE,
  allowNull: true,
},
wim_completed_at: {
  type: DataTypes.DATE,
  allowNull: true,
},
wim_operator_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
wim_operator_name: {
  type: DataTypes.STRING(255),
  allowNull: true,
},
  }, {
    tableName: 'customer_queue',
    timestamps: false,
  });

  return CustomerQueue;
};
