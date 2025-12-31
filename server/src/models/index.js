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

module.exports = db;
