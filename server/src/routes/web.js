const express = require("express");
const cors = require('cors');
const app = express();
const router = express.Router();

// Organization profile controller path
const addRegion = require('../controllers/FacilityProfile-Controller/Region/addRegion')
const showRegions = require('../controllers/FacilityProfile-Controller/Region/showRegions')
const addZone = require('../controllers/FacilityProfile-Controller/Zone/addZone')
const showZone = require('../controllers/FacilityProfile-Controller/Zone/showZone')
const addWoreda = require('../controllers/FacilityProfile-Controller/Woreda/addWoreda')
const showWoreda = require('../controllers/FacilityProfile-Controller/Woreda/showWoreda')
const addFacility = require('../controllers/FacilityProfile-Controller/Facility/addFacility')
const showFacility = require('../controllers/FacilityProfile-Controller/Facility/showFacility')

// contract controller path
const deleteContract = require('../controllers/CreaditController/DeleteCreditController')
const findOne = require('../controllers/CreaditController/fineOne')
const updateContract = require('../controllers/CreaditController/UpdateCredit')
const addContract = require("../controllers/upload");
const retriveController = require("../controllers/retrive");
const addCreaditPdfPage = require("../controllers/CreaditController/AddPdfPage");

// Pod 
const AddPod = require('../controllers/PodController/addPod')
const ViewPod = require('../controllers/PodController/viewPod')
const findOnePod = require('../controllers/PodController/fineOne')
const updatePod = require('../controllers/PodController/UpdatePod')
const deletePod = require('../controllers/PodController/DeletePodController')

// Pod Handler
const AddPodReceiver = require('../controllers/PodController/PodHandler/addReceiver')
const ViewPodReceiver = require('../controllers/PodController/PodHandler/showReceiver')
const AddPodRegisterer = require('../controllers/PodController/PodHandler/addRegisterer')
const ViewPodRegisterer = require('../controllers/PodController/PodHandler/showRegisterer')

//user Account
const Login = require('../controllers/UserAccount/login')
const ChangePassword = require('../controllers/UserAccount/changePassword')
const ViewUsers = require('../controllers/UserAccount/showUsers')
const AddUser = require('../controllers/UserAccount/AddUsers')
const ResetPassword = require('../controllers/UserAccount/ResetPassword')
const DeleteUser = require('../controllers/UserAccount/DeleteUser')

//performance tracking
const addTask = require('../controllers/PerformanceTracking-Controller/addTask')
const ViewTask = require('../controllers/PerformanceTracking-Controller/viewTask')
const addAssignedTask = require('../controllers/PerformanceTracking-Controller/AssignTask')
const viewAssignedTask = require('../controllers/PerformanceTracking-Controller/viewAssignedTask')
const AddAchivment = require('../controllers/PerformanceTracking-Controller/Achivment')
const getAchivment = require('../controllers/PerformanceTracking-Controller/viewAchivment')
const updateAchivment = require('../controllers/PerformanceTracking-Controller/updateAchivment')
const getEmployee = require('../controllers/PerformanceTracking-Controller/Employee')


//Plan
const addOrgPlan = require('../controllers/PlanController/addOrgCatagory')
const addBranchPlan = require('../controllers/PlanController/addBranchCatagory')
const addmeasure = require('../controllers/PlanController/planMeasurement')
const getmeasure = require('../controllers/PlanController/getMeasurement')

//customer service

const addCustomerQueue = require('../controllers/CustomerService/customerQueueController')
const viewCustomerQueue = require('../controllers/CustomerService/getQueue')
const updateQueue = require('../controllers/CustomerService/firstUpdate')
const picklist = require("../controllers/uploadPicklist");
const viewPicklist= require("../controllers/CustomerService/picklistController");
const deletePicklist= require("../controllers/CustomerService/picklistController");

const upload = require("../middleware/upload");
const uploadPicklist = require("../middleware/uploadPicklist");


app.use(cors());
let routes =  (app) => {

  router.post("/api/addregion", upload.none(), addRegion.addRegion);
  router.get('/api/regions', showRegions.retriveRegions);
  router.post("/api/addzone", upload.none(), addZone.addZone);
  router.get('/api/zones', showZone.retriveZone);
  router.post("/api/addworeda", upload.none(), addWoreda.addWoreda);
  router.get('/api/woredas', showWoreda.retriveWoreda);
  router.post("/api/addfacility", upload.none(), addFacility.addFacility);
  router.get('/api/facilities', showFacility.retriveFacility);

  router.delete('/api/deleteContract/:id', deleteContract.deleteFiles);
  router.get('/api/find/:id', findOne.findFiles);
  router.put('/api/updateContract/:id', upload.none(), updateContract.updateFiles);
  router.get('/api/all',retriveController.retriveFiles)
  router.post("/api/upload", upload.single('file'), addContract.uploadFiles);
  router.post("/api/addCreditPdf", upload.single('file'), addCreaditPdfPage.addPdf);

  router.post("/api/addPod", upload.single('file'), AddPod.addPod);
  router.get('/api/viewPod',ViewPod.retrivePods)
  router.get('/api/findPod/:id', findOnePod.findPod);
  router.put('/api/updatePod/:id', upload.none(), updatePod.updatePod);
  router.delete('/api/deletePod/:id', deletePod.deletePod);


  router.post("/api/addReceivedBy", upload.none(), AddPodReceiver.addReceiver);
  router.get('/api/receivedBy', ViewPodReceiver.retriveReceiver);
  router.post("/api/addRegisteredBy", upload.none(), AddPodRegisterer.addRegisterer);
  router.get('/api/registeredBy', ViewPodRegisterer.retriveRegisterer);


  router.post("/api/addUser", AddUser.AddUser);
  router.post("/api/login", Login.login);
  router.post("/api/changePassword", ChangePassword.changePassword);
  router.get("/api/users", ViewUsers.retriveUsers);
  router.post("/api/resetPassword", ResetPassword.ResetPassword);
  router.delete('/api/deleteUser/:id', DeleteUser.deleteUser);

  router.post("/api/addTask", addTask.AddTask)
  router.get("/api/tasks", ViewTask.retriveTasks)
  router.post("/api/addAssignedTask", addAssignedTask.AssignedTask)
  router.get("/api/viewAssignedTask", viewAssignedTask.retriveAssignedTasks)
  router.post("/api/add-achievement", AddAchivment.AddAchivment)
  router.get("/api/get-achievements", getAchivment.retriveAchievement)
  router.put('/api/update-achievement/:id', updateAchivment.updateFiles);
  router.get('/api/get-employee', getEmployee.getEmployees);

  router.post("/api/add-Orgplan", addOrgPlan.AddOrgPlan)
  router.post("/api/add-Branchplan", addBranchPlan.AddBranchPlan)
  router.post("/api/add-measure", addmeasure.AddMeasurement)
  router.get("/api/get-measure", getmeasure.retriveMeasurements)

  
  router.post("/api/customer-queue", addCustomerQueue.AddCustomerQueue)
  router.get("/api/serviceList", viewCustomerQueue.retriveQueue)
  router.put('/api/update-service-point', updateQueue.updateQueue);
  router.post("/api/uploadPicklist", uploadPicklist.single('attachment'), picklist.uploadPicklist);
  router.get("/api/getPicklists", viewPicklist.retrievePicklists);
  router.delete("/api/deletePicklist/:id", deletePicklist.deletePicklist);
  return app.use("/", router);
};

module.exports = routes;
