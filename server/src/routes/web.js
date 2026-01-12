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

//settings
const vehicleController = require('../controllers/Settings/vehicleController');
const userManagementController = require('../controllers/Settings/userManagementController');

//transportation
const routeManagementController = require('../controllers/Transportation/routeManagementController');

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
  router.put('/api/update-facilities/:id', facilityController.updateFacility); // Alternative endpoint for FacilityManager
  router.delete('/api/facilities/:id', facilityController.deleteFacility);
  router.get('/api/regions', locationController.getRegions);
  router.get('/api/zones', locationController.getZones);
  router.get('/api/woredas', locationController.getWoredas);
  router.post('/api/regions', locationController.createRegion);
  router.post('/api/zones', locationController.createZone);
  router.post('/api/woredas', locationController.createWoreda);

  // Vehicle Management routes
  router.get('/api/vehicles', vehicleController.getAllVehicles);
  router.get('/api/vehicles/stats', vehicleController.getVehicleStats);
  router.get('/api/vehicles/available', routeManagementController.getAvailableVehicles);
  router.get('/api/vehicles/:id', vehicleController.getVehicleById);
  router.post('/api/vehicles', vehicleController.createVehicle);
  router.put('/api/vehicles/:id', vehicleController.updateVehicle);
  router.delete('/api/vehicles/:id', vehicleController.deleteVehicle);

  // User Management routes
  router.get('/api/users-management', userManagementController.getAllUsers);
  router.get('/api/users-management/stats', userManagementController.getUserStats);
  router.get('/api/users-management/:id', userManagementController.getUserById);
  router.post('/api/users-management', userManagementController.createUser);
  router.put('/api/users-management/:id', userManagementController.updateUser);
  router.delete('/api/users-management/:id', userManagementController.deleteUser);
  router.patch('/api/users-management/:id/status', userManagementController.toggleUserStatus);
  router.patch('/api/users-management/:id/reset-password', userManagementController.resetUserPassword);

  // Dashboard Analytics routes
  const dashboardAnalyticsController = require('../controllers/Reports/dashboardAnalyticsController');
  router.get('/api/reports/dashboard/analytics', dashboardAnalyticsController.getDashboardAnalytics);
  router.get('/api/reports/dashboard/performance', dashboardAnalyticsController.getSystemPerformance);

  // Health Program Reports routes
  const healthProgramReportsController = require('../controllers/Reports/healthProgramReportsController');
  router.get('/api/reports/health-program/analytics', healthProgramReportsController.getHealthProgramAnalytics);
  router.get('/api/reports/health-program/facilities', healthProgramReportsController.getHPFacilityPerformance);

  // Workflow Reports routes
  const workflowReportsController = require('../controllers/Reports/workflowReportsController');
  router.get('/api/reports/dispatch', workflowReportsController.getDispatchReports);
  router.get('/api/reports/documentation', workflowReportsController.getDocumentationReports);
  router.get('/api/reports/followup', workflowReportsController.getFollowupReports);
  router.get('/api/reports/quality', workflowReportsController.getQualityReports);
  router.get('/api/reports/workflow', workflowReportsController.getWorkflowReports);

  // Route Management routes
  router.get('/api/routes', routeManagementController.getAllRoutes);
  router.get('/api/drivers/available', routeManagementController.getAvailableDrivers);
  router.get('/api/deliverers/available', routeManagementController.getAvailableDeliverers);
  router.post('/api/route-assignments', routeManagementController.createRouteAssignment);
  router.get('/api/route-assignments', routeManagementController.getRouteAssignments);
  router.put('/api/route-assignments/:id', routeManagementController.updateRouteAssignment);
  router.delete('/api/route-assignments/:id', routeManagementController.deleteRouteAssignment);
  router.put('/api/route-assignments/:id/status', routeManagementController.updateAssignmentStatus);
  router.get('/api/route-assignments/stats', routeManagementController.getAssignmentStats);
  
  // Ready routes (EWM completed routes ready for assignment)
  router.get('/api/ready-routes', routeManagementController.getReadyRoutes);
  router.get('/api/ready-routes/stats', routeManagementController.getReadyRoutesStats);

  // Route CRUD routes
  const routeController = require('../controllers/Transportation/routeController');
  router.get('/api/routes-crud', routeController.getAllRoutes);
  router.get('/api/routes-crud/stats', routeController.getRouteStats);
  router.get('/api/routes-crud/:id', routeController.getRouteById);
  router.post('/api/routes-crud', routeController.createRoute);
  router.put('/api/routes-crud/:id', routeController.updateRoute);
  router.delete('/api/routes-crud/:id', routeController.deleteRoute);

  // PI Vehicle Request routes
  const piVehicleRequestController = require('../controllers/CustomerService/piVehicleRequestController');
  router.get('/api/pi-vehicle-requests', piVehicleRequestController.getPIVehicleRequests);
  router.get('/api/pi-vehicle-requests/stats', piVehicleRequestController.getPIVehicleRequestStats);
  router.post('/api/pi-vehicle-requests/request', piVehicleRequestController.submitVehicleRequest);
  router.delete('/api/pi-vehicle-requests/:route_id', piVehicleRequestController.deleteVehicleRequest);

  // Dispatch Management routes
  const dispatchController = require('../controllers/Transportation/dispatchController');
  router.get('/api/dispatch-routes', dispatchController.getDispatchRoutes);
  router.get('/api/dispatch-routes/stats', dispatchController.getDispatchStats);
  router.put('/api/route-assignments/:id/complete-dispatch', dispatchController.completeDispatch);

  // Documentation Management routes
  const documentationController = require('../controllers/Documentation/documentationController');
  const documentFollowupController = require('../controllers/Documentation/documentFollowupController');
  router.get('/api/dispatched-odns', documentationController.getDispatchedODNs);
  router.get('/api/documentation/stats', documentationController.getDocumentationStats);
  router.put('/api/odns/:id/pod-confirmation', documentationController.updatePODConfirmation);
  router.put('/api/odns/bulk-pod-confirmation', documentationController.bulkUpdatePODConfirmation);

  // Document Follow-up routes
  router.get('/api/followup-odns', documentFollowupController.getODNsForFollowup);
  router.get('/api/followup/stats', documentFollowupController.getFollowupStats);
  router.put('/api/odns/bulk-followup', documentFollowupController.updateDocumentFollowup);

  // Quality Evaluation routes
  const qualityEvaluationController = require('../controllers/Quality/qualityEvaluationController');
  router.get('/api/quality-evaluation-odns', qualityEvaluationController.getODNsForQualityEvaluation);
  router.get('/api/quality-evaluation/stats', qualityEvaluationController.getQualityEvaluationStats);
  router.put('/api/odns/bulk-quality-evaluation', qualityEvaluationController.updateQualityEvaluation);

  // Service Time routes
  const serviceTimeController = require('../controllers/ServiceTime/serviceTimeController');
  router.get('/api/service-times', serviceTimeController.getAllServiceTimes);
  router.get('/api/service-times/process/:process_id', serviceTimeController.getServiceTimesByProcess);
  router.get('/api/service-times/stats', serviceTimeController.getServiceTimeStats);
  router.post('/api/service-times', serviceTimeController.createServiceTime);
  router.put('/api/service-times/:id', serviceTimeController.updateServiceTime);
  router.delete('/api/service-times/:id', serviceTimeController.deleteServiceTime);

  return app.use("/", router);
};

module.exports = routes;
