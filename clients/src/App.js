import Navbar2 from './components/Navbar/Navbar2'
import './App.css'
import Dashbord from './pages/Creadit/Dashbord'
import addContract from './pages/Creadit/AddCreaditPage'
import viewContract from './pages/Creadit/ViewCredit'
import FacilitProfile from './pages/facility-info/FacilityInfo/FacilityInfoPage'
import AddFacility from './pages/facility-info/FacilityInfo/AddFacilityPage'
import addRegionPage from './pages/facility-info/Region/addRegionPage';
import WoredaPage from './pages/facility-info/Woreda/addWoreda';
import ViewWoredaPage from './pages/facility-info/Woreda/viewWoredaPage';
import ViewZonePage from './pages/facility-info/Zone/viewZonePage';
import ViewRegionPage from './pages/facility-info/Region/viewRegionPage';
import ZonePage from './pages/facility-info/Zone/addZone';
import DetailPage from './pages/Detail/DetailPage';
import updateCredit from './pages/Creadit/UpdateCreaditPage';
import loading from './pages/stylePage/loadingPage';
import ViewPod from './pages/Pod/viewPodPage';
import addPod from './pages/Pod/addPodPage';
import DetailPodPage from './pages/Detail/DetailPodPage';
import updatePod from './pages/Pod/updatePodPage';
import AddPodReceiver from './pages/Pod/PodHandler/addReceiver';
import addPodRegisterer from './pages/Pod/PodHandler/addRegisterer';
import ViewPodReceiver from './pages/Pod/PodHandler/viewReceiver';
import ViewPodRegisterer from './pages/Pod/PodHandler/viewRegisterer';
import SignIn from './pages/UserAccountPage/SignInPage';
import ChangePassword from './pages/UserAccountPage/ChangePasswordPage';
import ProtectedRoutes from './components/ProtectedRoutes/ProtectedRoutes';
import AddCreditPdf from './pages/Detail/AddCreaditPdf';
import AddUsersPage from './pages/UserAccountPage/AddUsersPage';
import ResetPasswordPage from './pages/UserAccountPage/ResetPasswordPage';
import UserListPage from './pages/UserAccountPage/UserListPage';
import TaskTrackingPage from './pages/Performance-tracking/TaskTrackingPage';
import AddTaskPage from './pages/Performance-tracking/AddTaskPage';
import AssignTaskPage from './pages/Performance-tracking/TaskAssignPage';
import AssignedTaskPage from './pages/Performance-tracking/viewAssignedTaskPage';
import TeamTasksPage from './pages/Performance-tracking/ViewTeamAssignedTasks';
import EmployeePage from './pages/Performance-tracking/EmployeePage';
import EmployeeDetailPage from './pages/Performance-tracking/EmployeeDetailPage';
import LandingPage2 from './landingPage';
import TaskListPage from './pages/Performance-tracking/TaskListPage';
import RegisterCustomer from './pages/Customer-Service/RegisterCustomerPage';
import RegisterList from './pages/Customer-Service/RegistrationList';
import TvRegisterList from './pages/Customer-Service/TvRegistrationListPage';
import Outstanding from './pages/Customer-Service/OustandingPage';
import DashboardCustomer from './pages/Customer-Service/DashboardCS';
import Picklist from './pages/Customer-Service/Picklist';
import AllPicklist from './pages/Customer-Service/AllPicklists';
import CompletedPicklists from './pages/Customer-Service/CompletedPicklists';
import TvDispatch from './pages/Customer-Service/TvDispatchPage';

import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
const App = () => {
  return (
   <>
     <Router>

      <Routes>
        <Route path = '/' Component={LandingPage2} />
        <Route path = '/login' Component={SignIn} />

        <Route element = {<ProtectedRoutes/>}>
            <Route path = '/change-password' exact Component={ChangePassword}/>
            <Route path = '/add-facility' exact Component={AddFacility}/>
            <Route path = '/addContract' Component={addContract} />
            <Route path = '/viewContract' Component={viewContract} />
            <Route path = '/dashboard' Component={Dashbord} />
            <Route path = '/facility-profile' Component={FacilitProfile} />
            <Route path = '/add-region' Component={addRegionPage} />
            <Route path = '/add-zone' Component={ZonePage} />
            <Route path = '/add-woreda' Component={WoredaPage} />
            <Route path = '/viewWoreda' Component={ViewWoredaPage} />
            <Route path = '/viewZone' Component={ViewZonePage} />
            <Route path = '/viewRegion' Component={ViewRegionPage} />
            <Route path = '/detailPage' Component={DetailPage} />
            <Route path = '/updateCreadit' Component={updateCredit} />
            <Route path = '/loading' Component={loading} />
            <Route path = '/viewPod' Component={ViewPod} />
            <Route path = '/add-pod' Component={addPod} />
            <Route path = '/detailPodPage' Component={DetailPodPage} />
            <Route path = '/updatePod' Component={updatePod} />
            <Route path = '/add-receiver' Component={AddPodReceiver} />
            <Route path = '/add-registrant' Component={addPodRegisterer} />
            <Route path = '/viewreceiver' Component={ViewPodReceiver} />
            <Route path = '/viewregistrant' Component={ViewPodRegisterer} />
            <Route path = '/add-credit-pdf' Component={AddCreditPdf} />
            <Route path = '/add-users' Component={AddUsersPage} />
            <Route path = '/reset-password' Component={ResetPasswordPage} />
            <Route path = '/users' Component={UserListPage} />
            <Route path = '/performance-tracking' Component={TaskTrackingPage} />
            <Route path = '/add-task' Component={AddTaskPage} />
            <Route path = '/assign-task' Component={AssignTaskPage} />
            <Route path = '/assigned-task' Component={AssignedTaskPage} />
            <Route path = '/team-tasks' Component={TeamTasksPage} />
            <Route path = '/all-employee' Component={EmployeePage} />
            <Route path = '/employee-detail/:id' Component={EmployeeDetailPage} />
            <Route path = '/home' Component={LandingPage2} />
            <Route path = '/task-list' Component={TaskListPage} />
            <Route path = '/register-customer' Component={RegisterCustomer} />
            <Route path = '/register-list' Component={RegisterList} />
            <Route path = '/customer-slide' Component={TvRegisterList} />
            <Route path = '/outstanding' Component={Outstanding} />
            <Route path = '/customer-dashboard' Component={DashboardCustomer} />
            <Route path = '/picklist/:processId' Component={Picklist} />
            <Route path = '/all-picklists' Component={AllPicklist} />
            <Route path = '/completed-picklists' Component={CompletedPicklists} />
            <Route path = '/tv-dispatch' Component={TvDispatch} />
        </Route>
        
      </Routes>
     </Router>

     <br/> 

     <footer className="footer" style={{
          "background-color": "black",
          "text-align": "center",
          "position": "fixed",
          "left": "0",
          "bottom": "0",
          "width": "100%",
          "color": "white",
          "fontWeight" : "lighter",
        }}>
      <h6>© 2025 EPSS AA1.</h6>
    </footer>

   </>
  );
};

export default App;
