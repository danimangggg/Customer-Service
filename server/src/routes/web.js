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
const odnRdfController = require('../controllers/CustomerService/odnRdfController');
const facilityController = require('../controllers/CustomerService/facilityController');
const locationController = require('../controllers/CustomerService/locationController');

//settings
const vehicleController = require('../controllers/Settings/vehicleController');
const storeController = require('../controllers/Settings/storeController');
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
  router.put('/api/update-service-status/:id', updateQueue.updateServiceStatus);
  router.post("/api/uploadPicklist", uploadPicklist.single('attachment'), picklist.uploadPicklist);
  router.get("/api/getPicklists", viewPicklist.retrievePicklists);
  router.delete("/api/deletePicklist/:id", deletePicklist.deletePicklist);
  router.put('/api/completePicklist/:id', deletePicklist.deletePdf);
  router.post('/api/start-process', processController.startProcess);
  router.get('/api/active-processes', processQueryController.getActiveProcesses);
  router.delete('/api/process/:id', processController.revertProcess);
  router.post('/api/return-to-o2c', processController.returnToO2C);
  router.post('/api/save-odn', odnController.saveODN);
  router.get('/api/odns/:process_id', odnController.getODNsByProcess);
  router.put('/api/odn/:id', odnController.updateODN);
  router.delete('/api/odn/:id', odnController.deleteODN);
  router.post('/api/complete-process', odnController.completeProcess);
  router.post('/api/ewm-complete-process', odnController.ewmCompleteProcess);
  router.post('/api/ewm-revert-process', odnController.ewmRevertProcess);
  router.post('/api/complete-odn', odnController.completeODN);

  // RDF ODN Management routes
  router.get('/api/rdf-odns/:processId', odnRdfController.getOdnsByProcess);
  router.post('/api/rdf-odns', odnRdfController.addOdn);
  router.put('/api/rdf-odns/:odnId', odnRdfController.updateOdn);
  router.delete('/api/rdf-odns/:odnId', odnRdfController.deleteOdn);
  router.put('/api/odns-rdf/start-ewm', odnRdfController.startEwm);
  router.put('/api/odns-rdf/complete-ewm', odnRdfController.completeEwm);
  router.put('/api/odns-rdf/revert-ewm', odnRdfController.revertEwm);
  router.put('/api/odns-rdf/update-dispatch-status', odnRdfController.updateDispatchStatus);
  router.put('/api/odns-rdf/update-exit-permit-status', odnRdfController.updateExitPermitStatus);
  router.put('/api/odns-rdf/update-gate-status', odnRdfController.updateGateStatus);

  // Invoice routes (EWM-Documentation)
  const invoiceController = require('../controllers/CustomerService/invoiceController');
  router.get('/api/ewm-completed-customers', invoiceController.getEwmCompletedCustomers);
  router.post('/api/invoices', invoiceController.saveInvoice);
  router.get('/api/invoices', invoiceController.getInvoices);

  // Customer Availability routes
  const customerAvailabilityController = require('../controllers/CustomerService/customerAvailabilityController');
  router.post('/api/customer-availability/mark-available', customerAvailabilityController.markCustomerAvailable);
  router.get('/api/customer-availability/available', customerAvailabilityController.getAvailableCustomers);
  router.get('/api/customer-availability/o2c-completed', customerAvailabilityController.getO2CCompletedByStore);
  router.post('/api/customer-availability/start-service', customerAvailabilityController.startService);
  router.post('/api/customer-availability/complete-service', customerAvailabilityController.completeService);
  router.get('/api/customer-availability/:process_id', customerAvailabilityController.getCustomerAvailabilityStatus);

  // TV Display routes
  const tvDisplayController = require('../controllers/CustomerService/tvDisplayController');
  router.get('/api/tv-display-customers', tvDisplayController.getTvDisplayCustomers);

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
  router.get('/api/filtered-facilities', locationController.getFacilities);
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

  // Store Management routes
  router.get('/api/stores', storeController.getAllStores);
  router.post('/api/stores', storeController.createStore);
  router.put('/api/stores/:id', storeController.updateStore);
  router.delete('/api/stores/:id', storeController.deleteStore);

  // User Management routes
  router.get('/api/users-management', userManagementController.getAllUsers);
  router.get('/api/users-management/stats', userManagementController.getUserStats);
  router.get('/api/users-management/:id', userManagementController.getUserById);
  router.post('/api/users-management', userManagementController.createUser);
  router.put('/api/users-management/:id', userManagementController.updateUser);
  router.delete('/api/users-management/:id', userManagementController.deleteUser);
  router.patch('/api/users-management/:id/status', userManagementController.toggleUserStatus);
  router.patch('/api/users-management/:id/reset-password', userManagementController.resetUserPassword);

  // HP Dashboard routes
  const hpDashboardController = require('../controllers/CustomerService/hpDashboardController');
  router.get('/api/hp-dashboard-data', hpDashboardController.getHPDashboardData);

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
  router.get('/api/documentation/available-months', documentationController.getAvailableMonths);
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
  
  // New Service Time Tracking routes (using same controller)
  router.post('/api/service-time', serviceTimeController.insertServiceTime);
  router.post('/api/service-time-hp', serviceTimeController.insertServiceTimeHP);
  router.get('/api/service-time/last-end-time', serviceTimeController.getLastEndTime);
  router.get('/api/service-time-hp/last-end-time', serviceTimeController.getLastEndTime); // HP version uses same function with table param
  router.get('/api/service-time/by-process', serviceTimeController.getServiceTimesByProcess);
  router.get('/api/service-time-report', serviceTimeController.getRDFServiceTimeReport);
  router.get('/api/service-time-hp-report', serviceTimeController.getHPServiceTimeReport);

  // HP Comprehensive Report routes
  const hpComprehensiveReportController = require('../controllers/Reports/hpComprehensiveReportController');
  router.get('/api/hp-comprehensive-report', hpComprehensiveReportController.getComprehensiveHPReport);
  router.get('/api/hp-report/time-trend', hpComprehensiveReportController.getTimeTrendData);
  router.get('/api/hp-odn-pod-details', hpComprehensiveReportController.getODNPODDetails);
  router.get('/api/hp-odn-pod-details-all', hpComprehensiveReportController.getAllODNPODDetails);
  router.get('/api/service-time-tracking', hpComprehensiveReportController.getServiceTimeTracking);

  // User Activity Log routes
  const userActivityController = require('../controllers/Reports/userActivityController');
  router.get('/api/user-activity-log', userActivityController.getUserActivityLog);

  // Customer Detail Report routes
  const customerDetailReportController = require('../controllers/Reports/customerDetailReportController');
  router.get('/api/customers-detail-report', customerDetailReportController.getCustomersDetailReport);
  router.get('/api/customers/:customerId/service-details', customerDetailReportController.getCustomerServiceDetails);

  // Picklist History routes
  const picklistHistoryController = require('../controllers/Reports/picklistHistoryController');
  router.get('/api/picklist-history', picklistHistoryController.getPicklistHistory);

  // HP Customer Detail Report routes
  const hpCustomerDetailReportController = require('../controllers/Reports/hpCustomerDetailReportController');
  router.get('/api/hp-customers-detail-report', hpCustomerDetailReportController.getHPCustomersDetailReport);
  router.get('/api/hp-customers/:customerId/service-details', hpCustomerDetailReportController.getHPCustomerServiceDetails);

  // App Settings routes (YouTube playlist, etc.)
  const appSettingsController = require('../controllers/Settings/appSettingsController');
  router.get('/api/settings', appSettingsController.getAllSettings);
  router.get('/api/settings/:key', appSettingsController.getSetting);
  router.put('/api/settings/:key', appSettingsController.updateSetting);

  return app.use("/", router);
};

module.exports = routes;
