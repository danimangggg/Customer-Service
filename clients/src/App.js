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
import RegisterList from './pages/Customer-Service/RegistrationList';
import TvRegisterList from './pages/Customer-Service/TvRegistrationListPage';
import Outstanding from './pages/Customer-Service/OustandingPage';
import DashboardCustomer from './pages/Customer-Service/DashboardCS';
import Picklist from './pages/Customer-Service/Picklist';
import AllPicklist from './pages/Customer-Service/AllPicklists';
import CompletedPicklists from './pages/Customer-Service/CompletedPicklists';
import TvDispatch from './pages/Customer-Service/Dispatch/TvDispatchPage';
import Dispatch from './pages/Customer-Service/Dispatch/DispatchPage';
import TvCustomer from './pages/Customer-Service/Dispatch/TvCustomerPage';
import ExitPermit from './pages/Customer-Service/Dispatch/ExitPermitPage';
import facilityManager from './pages/Customer-Service/HealthProgram/FacilityManagerPage';
import EmployeeManager from './pages/Customer-Service/HealthProgram/EmployeeManagerPage';
import HpFacilities from './pages/Customer-Service/HealthProgram/HP-FacilitiesPage';
import HPPicklist from './pages/Customer-Service/HealthProgram/HP-PicklistPage';
import DashboardAnalytics from './pages/Reports/DashboardAnalytics';
import PerformanceReports from './pages/Reports/PerformanceReports';
import CustomerAnalytics from './pages/Reports/CustomerAnalytics';
import FinancialReports from './pages/Reports/FinancialReports';
import InventoryReports from './pages/Reports/InventoryReports';
import HealthProgramReports from './pages/Reports/HealthProgramReports';

import {BrowserRouter as Router, Routes, Route, useLocation} from 'react-router-dom'

const AppContent = () => {
  const location = useLocation();
  const isPublicPage = location.pathname === '/' || location.pathname === '/login';
  
  return (
    <>
      {!isPublicPage && <Navbar2 />}
      <div className={isPublicPage ? 'public-content' : 'main-content'}>
        <Routes>
        <Route path = '/' Component={LandingPage2} />
        <Route path = '/login' Component={SignIn} />

        <Route element = {<ProtectedRoutes/>}>
            <Route path = '/change-password' exact Component={ChangePassword}/>
            <Route path = '/add-users' Component={AddUsersPage} />
            <Route path = '/reset-password' Component={ResetPasswordPage} />
            <Route path = '/users' Component={UserListPage} />
            <Route path = '/all-employee' Component={EmployeePage} />
            <Route path = '/employee-detail/:id' Component={EmployeeDetailPage} />
            <Route path = '/register-customer' Component={RegisterCustomer} />
            <Route path = '/register-list' Component={RegisterList} />
            <Route path = '/customer-slide' Component={TvRegisterList} />
            <Route path = '/outstanding' Component={Outstanding} />
            <Route path = '/customer-dashboard' Component={DashboardCustomer} />
            <Route path = '/picklist/:processId' Component={Picklist} />
            <Route path = '/hp-picklist/:processId' Component={HPPicklist} />
            <Route path = '/all-picklists' Component={AllPicklist} />
            <Route path = '/completed-picklists' Component={CompletedPicklists} />
            <Route path = '/tv-dispatch' Component={TvDispatch} />
            <Route path = '/dispatch' Component={Dispatch} />
            <Route path = '/tvcustomer' Component={TvCustomer} />
            <Route path = '/exit-permit' Component={ExitPermit} />
            <Route path = '/update-facility' Component={facilityManager} />
            <Route path = '/update-employee' Component={EmployeeManager} />
            <Route path = '/hp-facilities' Component={HpFacilities} />
            <Route path = '/reports/dashboard' Component={DashboardAnalytics} />
            <Route path = '/reports/performance' Component={PerformanceReports} />
            <Route path = '/reports/customer-analytics' Component={CustomerAnalytics} />
            <Route path = '/reports/financial' Component={FinancialReports} />
            <Route path = '/reports/inventory' Component={InventoryReports} />
            <Route path = '/reports/health-program' Component={HealthProgramReports} />
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
