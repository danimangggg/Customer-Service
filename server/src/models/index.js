const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// User Account models
db.user = require("./UserAccount/user.js")(sequelize, Sequelize);
db.accountType = require("./UserAccount/accountType.js")(sequelize, Sequelize);

// Performance Tracking models (Employee management only)
db.employee = require("./PerformanceTracking/employeeModel.js")(sequelize, Sequelize);

// Customer Service models
db.customerService = require("./CustomerService/customerQueue.js")(sequelize, Sequelize);
db.picklist = require("./CustomerService/picklist.js")(sequelize, Sequelize);
db.process = require("./CustomerService/process.js")(sequelize, Sequelize);
db.odn = require("./CustomerService/odn.js")(sequelize, Sequelize);
db.facility = require("./CustomerService/facility.js")(sequelize, Sequelize);
db.region = require("./CustomerService/region.js")(sequelize, Sequelize);
db.zone = require("./CustomerService/zone.js")(sequelize, Sequelize);
db.woreda = require("./CustomerService/woreda.js")(sequelize, Sequelize);

// Settings models
db.vehicle = require("./Settings/vehicle.js")(sequelize, Sequelize);

// Transportation models
db.route = require("./Transportation/route.js")(sequelize, Sequelize);
db.routeAssignment = require("./Transportation/routeAssignment.js")(sequelize, Sequelize);

// Define associations
db.picklist.belongsTo(db.employee, { 
  foreignKey: 'operator_id', 
  as: 'operator' 
});

db.employee.hasMany(db.picklist, { 
  foreignKey: 'operator_id', 
  as: 'picklists' 
});

// Route Assignment associations
db.routeAssignment.belongsTo(db.route, {
  foreignKey: 'route_id',
  as: 'route'
});

db.routeAssignment.belongsTo(db.vehicle, {
  foreignKey: 'vehicle_id',
  as: 'vehicle'
});

db.routeAssignment.belongsTo(db.employee, {
  foreignKey: 'driver_id',
  as: 'driver'
});

db.routeAssignment.belongsTo(db.employee, {
  foreignKey: 'deliverer_id',
  as: 'deliverer'
});

db.routeAssignment.belongsTo(db.employee, {
  foreignKey: 'assigned_by',
  as: 'assignedBy'
});

db.route.hasMany(db.routeAssignment, {
  foreignKey: 'route_id',
  as: 'routeAssignments'
});

db.vehicle.hasMany(db.routeAssignment, {
  foreignKey: 'vehicle_id',
  as: 'vehicleAssignments'
});

db.employee.hasMany(db.routeAssignment, {
  foreignKey: 'driver_id',
  as: 'driverAssignments'
});

db.employee.hasMany(db.routeAssignment, {
  foreignKey: 'deliverer_id',
  as: 'delivererAssignments'
});

db.employee.hasMany(db.routeAssignment, {
  foreignKey: 'assigned_by',
  as: 'managerAssignments'
});

module.exports = db;
