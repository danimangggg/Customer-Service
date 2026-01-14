import Navbar2 from './components/Navbar/Navbar2'
import './App.css'
import SignIn from './pages/UserAccountPage/SignInPage';
import ChangePassword from './pages/UserAccountPage/ChangePasswordPage';
import ProtectedRoutes from './components/ProtectedRoutes/ProtectedRoutes';
import AddUsersPage from './pages/UserAccountPage/AddUsersPage';
import ResetPasswordPage from './pages/UserAccountPage/ResetPasswordPage';
import UserListPage from './pages/UserAccountPage/UserListPage';
import EmployeePage from './pages/Performance-tracking/EmployeePage';
import EmployeeDetailPage from './pages/Performance-tracking/EmployeeDetailPage';
import LandingPage2 from './landingPage';
import RegisterCustomer from './pages/Customer-Service/RegisterCustomerPage';
import TvRegisterList from './pages/Customer-Service/TvRegistrationListPage';
import DashboardCustomer from './pages/Customer-Service/DashboardCS';
import Picklist from './pages/Customer-Service/Picklist';
import AllPicklist from './pages/Customer-Service/AllPicklists';
import CompletedPicklists from './pages/Customer-Service/CompletedPicklists';
import TvDispatch from './pages/Customer-Service/Dispatch/TvDispatchPage';
import Dispatch from './pages/Customer-Service/Dispatch/DispatchPage';
import TvCustomer from './pages/Customer-Service/Dispatch/TvCustomerPage';
import TvMainMenu from './pages/Customer-Service/TvMainMenuPage';
import ExitPermit from './pages/Customer-Service/Dispatch/ExitPermitPage';
import facilityManager from './pages/Customer-Service/HealthProgram/FacilityManagerPage';
import EmployeeManager from './pages/Customer-Service/HealthProgram/EmployeeManagerPage';
import HPFacilitiesCS from './components/Customer-Service/HealthProgram/HP-Facilities';
import PIVehicleRequests from './components/Customer-Service/HealthProgram/PIVehicleRequests';
import HPDashboard from './pages/Customer-Service/HealthProgram/HPDashboard';
import DispatchManagement from './components/Transportation/DispatchManagement';
import DocumentationManagement from './components/Documentation/DocumentationManagement';
import DocumentFollowup from './components/Documentation/DocumentFollowup';
import QualityEvaluation from './components/Quality/QualityEvaluation';
import HPFacilitiesTransport from './components/Transportation/HPFacilities';
import HPPicklist from './pages/Customer-Service/HealthProgram/HP-PicklistPage';
import TransportationReports from './pages/Reports/TransportationReports';
import AllPicklists from './components/Customer-Service/AllPicklists';
import OrganizationProfileView from './components/Reports/OrganizationProfileView';
import OrganizationProfilePage from './pages/Settings/OrganizationProfilePage';
import UserManagementPage from './pages/Settings/UserManagementPage';
import DefaultRedirect from './components/DefaultRedirect';
import OutstandingProcessPage from './pages/Customer-Service/OutstandingProcessPage';
import ServiceTimeManagement from './components/ServiceTime/ServiceTimeManagement';
import AccountTypesManagement from './pages/Admin/AccountTypesManagement';
import RouteManagementPage from './pages/Transportation/RouteManagementPage';
import RouteManagementCRUDPage from './pages/Transportation/RouteManagementCRUDPage';
import VehicleManagement from './components/Transportation/VehicleManagement';
import HPComprehensiveReport from './components/Reports/HPComprehensiveReport';

import {BrowserRouter as Router, Routes, Route, useLocation} from 'react-router-dom'

const AppContent = () => {
  const location = useLocation();
  const isPublicPage = location.pathname === '/' || location.pathname === '/login';
  
  return (
    <>
      {!isPublicPage && <Navbar2 />}
      <div className={isPublicPage ? 'public-content' : 'main-content'}>
        <Routes>
        <Route path = '/' element={
          <>
            <DefaultRedirect />
            <LandingPage2 />
          </>
        } />
        <Route path = '/login' Component={SignIn} />

        <Route element = {<ProtectedRoutes/>}>
            <Route path = '/change-password' exact Component={ChangePassword}/>
            <Route path = '/add-users' Component={AddUsersPage} />
            <Route path = '/reset-password' Component={ResetPasswordPage} />
            <Route path = '/users' Component={UserListPage} />
            <Route path = '/all-employee' Component={EmployeePage} />
            <Route path = '/employee-detail/:id' Component={EmployeeDetailPage} />
            <Route path = '/register-customer' Component={RegisterCustomer} />
            <Route path = '/customer-slide' Component={TvRegisterList} />
            <Route path = '/customer-dashboard' Component={DashboardCustomer} />
            <Route path = '/picklist/:processId' Component={Picklist} />
            <Route path = '/hp-picklist/:processId' Component={HPPicklist} />
            <Route path = '/all-picklists' Component={AllPicklist} />
            <Route path = '/completed-picklists' Component={CompletedPicklists} />
            <Route path = '/tv-dispatch' Component={TvDispatch} />
            <Route path = '/dispatch' Component={Dispatch} />
            <Route path = '/tvcustomer' Component={TvCustomer} />
            <Route path = '/tv-main-menu' Component={TvMainMenu} />
            <Route path = '/exit-permit' Component={ExitPermit} />
            <Route path = '/update-facility' Component={facilityManager} />
            <Route path = '/update-employee' Component={EmployeeManager} />
            <Route path = '/hp-facilities' Component={HPFacilitiesCS} />
            <Route path = '/hp-dashboard' Component={HPDashboard} />
            <Route path = '/pi-vehicle-requests' Component={PIVehicleRequests} />
            <Route path = '/dispatch-management' Component={DispatchManagement} />
            <Route path = '/documentation-management' Component={DocumentationManagement} />
            <Route path = '/document-followup' Component={DocumentFollowup} />
            <Route path = '/quality-evaluation' Component={QualityEvaluation} />
            <Route path = '/transportation/hp-facilities' Component={HPFacilitiesTransport} />
            <Route path = '/outstandingProcess' Component={OutstandingProcessPage} />
            <Route path = '/service-time-management' Component={ServiceTimeManagement} />
            <Route path = '/reports/all-picklists' Component={AllPicklists} />
            <Route path = '/reports/transportation' Component={TransportationReports} />
            <Route path = '/reports/organization-profile' Component={OrganizationProfileView} />
            <Route path = '/reports/hp-comprehensive' Component={HPComprehensiveReport} />
            <Route path = '/settings/organization-profile' Component={OrganizationProfilePage} />
            <Route path = '/settings/user-management' Component={UserManagementPage} />
            <Route path = '/settings/account-types' Component={AccountTypesManagement} />
            <Route path = '/transportation/route-management' Component={RouteManagementPage} />
            <Route path = '/transportation/routes' Component={RouteManagementCRUDPage} />
            <Route path = '/transportation/vehicle-management' Component={VehicleManagement} />
        </Route>
        
      </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
   <>
     <Router>
      <AppContent />
     </Router>

     <br/> 

     <footer className="footer" style={{
          "backgroundColor": "black",
          "textAlign": "center",
          "position": "fixed",
          "left": "0",
          "bottom": "0",
          "width": "100%",
          "color": "white",
          "fontWeight": "lighter",
          "zIndex": "1000"
        }}>
      <h6>© 2025 EPSS AA1.</h6>
    </footer>

   </>
  );
};

export default App;
