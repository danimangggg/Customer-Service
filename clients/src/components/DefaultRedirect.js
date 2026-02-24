import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DefaultRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token && token !== 'guest') {
      const jobTitle = localStorage.getItem('JobTitle');
      const accountType = localStorage.getItem('AccountType');
      
      // Redirect HP Officers, PI Officers, Documentation Officers, Documentation Followers, Quality Evaluators, HP Dispatchers, and TM Managers to HP Dashboard
      if (jobTitle === "O2C Officer - HP" || jobTitle === "EWM Officer - HP" || jobTitle === "PI Officer-HP" || jobTitle === "Documentation Officer" || jobTitle === "Documentation Follower" || jobTitle === "Quality Evaluator" || jobTitle === "Dispatcher - HP" || jobTitle === "TM Manager") {
        navigate('/hp-dashboard');
      }
      // EWM-Documentation goes to invoice management
      else if (jobTitle === "EWM-Documentation") {
        navigate('/ewm-documentation');
      }
      // Queue Manager goes to customer availability
      else if (jobTitle === "Queue Manager") {
        navigate('/queue-manager');
      }
      // Customer Service Dispatcher (without HP suffix) goes to Customer Dashboard
      else if (jobTitle === "Dispatcher") {
        navigate('/customer-dashboard');
      }
      // Redirect WIM Operators to picklists
      else if (jobTitle === "WIM Operator") {
        navigate('/all-picklists');
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