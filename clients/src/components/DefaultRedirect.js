import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DefaultRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token && token !== 'guest') {
      const jobTitle = localStorage.getItem('JobTitle');
      const accountType = localStorage.getItem('AccountType');
      
      // HP roles — each goes directly to their task page
      if (jobTitle === "O2C Officer - HP") {
        navigate('/hp-facilities');
      } else if (jobTitle === "EWM Officer - HP") {
        navigate('/ewm-outstanding');
      } else if (jobTitle === "PI Officer-HP") {
        navigate('/pi-vehicle-requests');
      } else if (jobTitle === "Biller") {
        navigate('/biller');
      } else if (jobTitle === "TM Manager") {
        navigate('/tm-manager');
      } else if (jobTitle === "Dispatcher - HP") {
        navigate('/dispatch-management');
      } else if (jobTitle === "Documentation Officer - HP") {
        navigate('/documentation-hp');
      } else if (jobTitle === "Reports") {
        navigate('/reports/hp-comprehensive');
      }
      // EWM-Documentation goes to invoice management
      else if (jobTitle === "EWM-Documentation") {
        navigate('/ewm-documentation');
      }
      // Queue Manager goes to customer availability
      else if (jobTitle === "Queue Manager") {
        navigate('/queue-manager');
      }
      // RDF roles — each goes directly to their task page
      else if (jobTitle === "O2C Officer") {
        navigate('/outstandingProcess');
      } else if (jobTitle === "EWM Officer") {
        navigate('/outstandingProcess');
      } else if (jobTitle === "Dispatcher") {
        navigate('/dispatch');
      } else if (jobTitle === "Dispatch-Documentation") {
        navigate('/exit-permit');
      } else if (jobTitle === "Gate Keeper") {
        navigate('/gate-keeper');
      } else if (jobTitle === "WIM Operator") {
        navigate('/all-picklists');
      } else if (jobTitle === "Customer Service Officer") {
        navigate('/register-customer');
      } else if (jobTitle === "Cashier") {
        navigate('/outstandingProcess');
      } else if ((jobTitle === "Finance" || jobTitle === "Finance Officer")) {
        navigate('/finance-invoices');
      }
      // Redirect all other authenticated users to customer dashboard
      else if (accountType === "Self Assesment" || accountType === "Admin" || accountType === "Credit Manager") {
        navigate('/customer-dashboard');
      }
      // Default fallback
      else {
        navigate('/customer-dashboard');
      }
    } else {
      // Not logged in, redirect to login page
      navigate('/login');
    }
  }, [navigate]);

  // This component doesn't render anything, it just handles redirection
  return null;
};

export default DefaultRedirect;