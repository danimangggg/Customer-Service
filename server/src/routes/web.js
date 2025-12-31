const express = require("express");
const cors = require('cors');
const app = express();
const router = express.Router();

//user Account
const Login = require('../controllers/UserAccount/login')
const ChangePassword = require('../controllers/UserAccount/changePassword')
const ViewUsers = require('../controllers/UserAccount/showUsers')
const AddUser = require('../controllers/UserAccount/AddUsers')
const ResetPassword = require('../controllers/UserAccount/ResetPassword')
const DeleteUser = require('../controllers/UserAccount/DeleteUser')

//performance tracking (Employee management only)
const getEmployee = require('../controllers/PerformanceTracking-Controller/Employee')
const addEmployee = require('../controllers/PerformanceTracking-Controller/Employee')
const updateEmployee = require('../controllers/PerformanceTracking-Controller/Employee')
const deleteEmployee = require('../controllers/PerformanceTracking-Controller/Employee')

//customer service
const addCustomerQueue = require('../controllers/CustomerService/customerQueueController')
const viewCustomerQueue = require('../controllers/CustomerService/getQueue')
const updateQueue = require('../controllers/CustomerService/firstUpdate')
const picklist = require("../controllers/uploadPicklist");
const viewPicklist= require("../controllers/CustomerService/picklistController");
const deletePicklist= require("../controllers/CustomerService/picklistController");
const processController = require('../controllers/CustomerService/processController');
const processQueryController = require('../controllers/CustomerService/processQueryController');
const odnController = require('../controllers/CustomerService/odnController');
const facilityController = require('../controllers/CustomerService/facilityController');
const locationController = require('../controllers/CustomerService/locationController');

const upload = require("../middleware/upload");
const uploadPicklist = require("../middleware/uploadPicklist");


app.use(cors());
let routes =  (app) => {

  // User Account routes
  router.post("/api/addUser", AddUser.AddUser);
  router.post("/api/login", Login.login);
  router.post("/api/changePassword", ChangePassword.changePassword);
  router.get("/api/users", ViewUsers.retriveUsers);
  router.post("/api/resetPassword", ResetPassword.ResetPassword);
  router.delete('/api/deleteUser/:id', DeleteUser.deleteUser);

  // Employee management routes (Performance tracking)
  router.get('/api/get-employee', getEmployee.getEmployees);
  router.put('/api/update-employee/:id', updateEmployee.updateEmployee);

  // Customer Service routes
  router.post("/api/customer-queue", addCustomerQueue.AddCustomerQueue)
  router.get("/api/serviceList", viewCustomerQueue.retriveQueue)
  router.put('/api/update-service-point', updateQueue.updateQueue);
  router.post("/api/uploadPicklist", uploadPicklist.single('attachment'), picklist.uploadPicklist);
  router.get("/api/getPicklists", viewPicklist.retrievePicklists);
  router.delete("/api/deletePicklist/:id", deletePicklist.deletePicklist);
  router.put('/api/completePicklist/:id', deletePicklist.deletePdf);
  router.post('/api/start-process', processController.startProcess);
  router.get('/api/active-processes', processQueryController.getActiveProcesses);
  router.delete('/api/process/:id', processController.revertProcess);
  router.post('/api/save-odn', odnController.saveODN);
  router.get('/api/odns/:process_id', odnController.getODNsByProcess);
  router.put('/api/odn/:id', odnController.updateODN);
  router.delete('/api/odn/:id', odnController.deleteODN);
  router.post('/api/complete-process', odnController.completeProcess);
  router.post('/api/ewm-complete-process', odnController.ewmCompleteProcess);
  router.post('/api/ewm-revert-process', odnController.ewmRevertProcess);
  router.post('/api/complete-odn', odnController.completeODN);

  // Facility and Location routes
  router.get('/api/facilities', facilityController.getFacilities);
  router.get('/api/facilities/:id', facilityController.getFacilityById);
  router.post('/api/facilities', facilityController.createFacility);
  router.put('/api/facilities/:id', facilityController.updateFacility);
  router.delete('/api/facilities/:id', facilityController.deleteFacility);
  router.get('/api/regions', locationController.getRegions);
  router.get('/api/zones', locationController.getZones);
  router.get('/api/woredas', locationController.getWoredas);
  router.post('/api/regions', locationController.createRegion);
  router.post('/api/zones', locationController.createZone);
  router.post('/api/woredas', locationController.createWoreda);

  return app.use("/", router);
};

module.exports = routes;
