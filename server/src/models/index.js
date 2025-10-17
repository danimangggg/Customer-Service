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

db.creadit = require("./creadit.model.js")(sequelize, Sequelize);
db.region = require("./FacilityProfile-Model/regionModel.js")(sequelize, Sequelize);
db.zone = require("./FacilityProfile-Model/zone_subcityModel.js")(sequelize, Sequelize);
db.woreda = require("./FacilityProfile-Model/woredaModel.js")(sequelize, Sequelize);
db.facility = require("./FacilityProfile-Model/facilityModel.js")(sequelize, Sequelize);
db.pod = require("./pod.model.js")(sequelize, Sequelize);
db.registerer = require("./podHandler/registerer.js")(sequelize, Sequelize);
db.receiver = require("./podHandler/receiver.js")(sequelize, Sequelize);
db.user = require("./UserAccount/user.js")(sequelize, Sequelize);
db.accountType = require("./UserAccount/accountType.js")(sequelize, Sequelize);
db.task = require("./PerformanceTracking/taskModel.js")(sequelize, Sequelize);
db.assignedTask = require("./PerformanceTracking/assignTaskModel.js")(sequelize, Sequelize);
db.achivement = require("./PerformanceTracking/achivementModel.js")(sequelize, Sequelize);
db.employee = require("./PerformanceTracking/employeeModel.js")(sequelize, Sequelize);
db.orgPlanCatagory = require("./Plan/planCatagoryModel.js")(sequelize, Sequelize);
db.branchPlanCatagory = require("./Plan/planBranchCatagoryModel.js")(sequelize, Sequelize);
db.measurement = require("./Plan/measurementModel.js")(sequelize, Sequelize);
db.customerService = require("./CustomerService/customerQueue.js")(sequelize, Sequelize);
db.picklist = require("./CustomerService/picklist.js")(sequelize, Sequelize);

module.exports = db;
