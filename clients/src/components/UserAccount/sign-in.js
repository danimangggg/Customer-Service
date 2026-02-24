import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { styled, keyframes } from '@mui/material/styles';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Divider from '@mui/material/Divider';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #0066cc 0%, #00a8e8 100%)',
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
    animation: `${float} 6s ease-in-out infinite`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
    animation: `${pulse} 2s ease-in-out infinite`,
  }
}));

const FeatureBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  animation: `${slideInLeft} 0.8s ease-out`,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.18)',
    transform: 'translateX(10px) scale(1.02)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 44,
    marginRight: theme.spacing(2),
    opacity: 0.95,
    transition: 'transform 0.3s ease',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'scale(1.1) rotate(5deg)',
  }
}));

const LoginBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  animation: `${slideInRight} 0.6s ease-out`,
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  m: 1,
  width: 60,
  height: 60,
  background: 'linear-gradient(135deg, #0066cc 0%, #00a8e8 100%)',
  boxShadow: '0 8px 24px rgba(0, 102, 204, 0.4)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: 'linear-gradient(45deg, #0066cc, #00a8e8, #0066cc)',
    borderRadius: '50%',
    zIndex: -1,
    animation: `${rotate} 3s linear infinite`,
    opacity: 0.5,
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  mt: 3,
  mb: 2,
  borderRadius: 30,
  padding: '14px 48px',
  fontSize: '16px',
  fontWeight: 700,
  textTransform: 'none',
  background: 'linear-gradient(135deg, #0066cc 0%, #00a8e8 100%)',
  boxShadow: '0 4px 15px rgba(0, 102, 204, 0.4)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    background: 'linear-gradient(135deg, #0052a3 0%, #0090c9 100%)',
    boxShadow: '0 6px 25px rgba(0, 102, 204, 0.6)',
    transform: 'translateY(-3px)',
    '&::before': {
      left: '100%',
    }
  },
  '&:active': {
    transform: 'translateY(-1px)',
  },
  '&:disabled': {
    background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'rgba(0, 102, 204, 0.02)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(0, 102, 204, 0.04)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#0066cc',
        borderWidth: 2,
      }
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(0, 102, 204, 0.05)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#0066cc',
        borderWidth: 2,
        boxShadow: '0 0 0 3px rgba(0, 102, 204, 0.1)',
      }
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#0066cc',
    fontWeight: 600,
  }
}));

const StatBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  background: 'rgba(255, 255, 255, 0.15)',
  borderRadius: 20,
  marginRight: theme.spacing(2),
  marginBottom: theme.spacing(1),
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  animation: `${fadeIn} 1s ease-out`,
  '& .MuiTypography-root': {
    fontSize: '0.875rem',
    fontWeight: 600,
  }
}));

const theme = createTheme({
  palette: {
    primary: {
      main: '#0066cc',
    },
    secondary: {
      main: '#00a8e8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default function SignIn() {
  const [user_name, setuserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formValidation = () => {
    let isvalid = true;
    if (!user_name) {
      toast.warn("Username is required", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      isvalid = false;
    }
    if (!password) {
      toast.warn("Password is required", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      isvalid = false;
    }
    return isvalid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const api_url = process.env.REACT_APP_API_URL;
    
    if (!formValidation()) return;
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${api_url}/api/login`, { user_name, password });
      
      console.log("API Response Data:", response.data);

      const { token } = response.data;

      // Save the token and all user-related data to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem("FullName", response.data.FullName);
      localStorage.setItem("AccountType", response.data.AccountType);
      localStorage.setItem("JobTitle", response.data.JobTitle);
      localStorage.setItem("UserId", response.data.UserId);
      localStorage.setItem("UserName", user_name); // Store username for browser access
      localStorage.setItem("store", response.data.store);

      // Redirect to a protected route based on user roles
      console.log("=== LOGIN ROUTING DEBUG ===");
      console.log("AccountType:", response.data.AccountType);
      console.log("JobTitle:", response.data.JobTitle);
      console.log("========================");
      
      setTimeout(() => {
        const accountType = response.data.AccountType;
        const jobTitle = response.data.JobTitle;
        
        // Admin, Coordinator, and Manager - keep dashboard/reports access
        if(accountType === "Admin"){
          if(jobTitle === "WIM Operator"){
            console.log("→ Routing to Picklists - Admin WIM Operator");
            navigate(`/all-picklists`);
          } else {
            console.log("→ Routing to HP Dashboard - Admin");
            navigate('/hp-dashboard');
          }
        }
        else if(jobTitle === "Coordinator" || jobTitle === "Manager"){
          console.log("→ Routing to HP Reports - Coordinator/Manager");
          navigate('/reports/hp-comprehensive');
        }
        // Regular users - redirect to their specific work page
        else if(jobTitle === "Customer Service Officer"){
          console.log("→ Routing to Register Customer - Customer Service Officer");
          navigate('/register-customer');
        }
        else if(jobTitle === "O2C Officer"){
          console.log("→ Routing to Outstanding Process - O2C Officer");
          navigate('/outstandingProcess');
        }
        else if(jobTitle === "EWM Officer"){
          console.log("→ Routing to Outstanding Process - EWM Officer");
          navigate('/outstandingProcess');
        }
        else if(jobTitle === "O2C Officer - HP"){
          console.log("→ Routing to HP Facilities - O2C Officer HP");
          navigate('/hp-facilities');
        }
        else if(jobTitle === "EWM Officer - HP"){
          console.log("→ Routing to HP Facilities - EWM Officer HP");
          navigate('/hp-facilities');
        }
        else if(jobTitle === "PI Officer-HP"){
          console.log("→ Routing to PI Vehicle Requests - PI Officer HP");
          navigate('/pi-vehicle-requests');
        }
        else if(jobTitle === "Dispatcher"){
          console.log("→ Routing to Dispatch - Dispatcher");
          navigate('/dispatch');
        }
        else if(jobTitle === "Dispatcher - HP"){
          console.log("→ Routing to Dispatch Management - Dispatcher HP");
          navigate('/dispatch-management');
        }
        else if(jobTitle === "Dispatch-Documentation"){
          console.log("→ Routing to Exit Permit - Dispatch-Documentation");
          navigate('/exit-permit');
        }
        else if(jobTitle === "EWM-Documentation"){
          console.log("→ Routing to Invoice Management - EWM-Documentation");
          navigate('/ewm-documentation');
        }
        else if(jobTitle === "Gate Keeper"){
          console.log("→ Routing to Security - Gate Keeper");
          navigate('/gate-keeper');
        }
        else if(jobTitle === "WIM Operator"){
          console.log("→ Routing to Picklists - WIM Operator");
          navigate('/all-picklists');
        }
        else if(jobTitle === "Queue Manager"){
          console.log("→ Routing to Customer Availability - Queue Manager");
          navigate('/queue-manager');
        }
        else if(jobTitle === "Documentation Officer"){
          console.log("→ Routing to Documentation Management - Documentation Officer");
          navigate('/documentation-management');
        }
        else if(jobTitle === "Documentation Follower"){
          console.log("→ Routing to Document Follow-up - Documentation Follower");
          navigate('/document-followup');
        }
        else if(jobTitle === "Quality Evaluator"){
          console.log("→ Routing to Quality Evaluation - Quality Evaluator");
          navigate('/quality-evaluation');
        }
        else if(jobTitle === "TM Manager"){
          console.log("→ Routing to HP Dashboard - TM Manager");
          navigate('/hp-dashboard');
        }
        // Handle Self Assessment account type
        else if(accountType === "Self Assesment"){
          if(jobTitle === "WIM Operator"){
            console.log("→ Routing to Picklists - WIM Operator");
            navigate(`/all-picklists`);
          } else {
            console.log("→ Routing to Customer Dashboard - Self Assessment");
            navigate('/customer-dashboard');
          }
        } 
        // Handle Credit Manager
        else if(accountType === "Credit Manager"){
          console.log("→ Routing to Customer Dashboard - Credit Manager");
          navigate('/customer-dashboard');
        }
        // Default fallback
        else {
          console.log("→ Routing to Customer Dashboard - default fallback");
          navigate('/customer-dashboard');
        }
      }, 300);
    } catch (err) {
      toast.error('Invalid username or password. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid container component="main" sx={{ height: '100vh', overflow: 'hidden' }}>
        <CssBaseline />
        
        {/* Left Side - Branding */}
        <Grid item xs={false} sm={4} md={7} sx={{ overflow: 'hidden' }}>
          <StyledPaper elevation={0} square sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 550, px: 3 }}>
              <Box sx={{ mb: 2 }}>
                <img 
                  src="/pharmalog-logo.png" 
                  alt="EPSS-MT Logo" 
                  style={{ 
                    width: 180, 
                    height: 180, 
                    marginBottom: 15,
                    filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.3))',
                    animation: `${float} 3s ease-in-out infinite`,
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '50%',
                    padding: '15px',
                    backdropFilter: 'blur(10px)',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                  }} 
                />
              </Box>
              
              <Typography variant="h2" sx={{ fontWeight: 900, mb: 1.5, textShadow: '0 4px 8px rgba(0,0,0,0.2)', letterSpacing: '-1px', fontSize: '3rem' }}>
                EPSS-MT
              </Typography>
              <Typography variant="h6" sx={{ mb: 3, opacity: 0.95, fontWeight: 500 }}>
                Pharmaceutical Operations Follow-Up System
              </Typography>

              <Box sx={{ mt: 3 }}>
                <FeatureBox>
                  <LocalHospitalIcon sx={{ fontSize: 44 }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.1rem' }}>Health Program (HP)</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                      RRF, ODN & facility management
                    </Typography>
                  </Box>
                </FeatureBox>

                <FeatureBox sx={{ animationDelay: '0.2s' }}>
                  <SecurityIcon sx={{ fontSize: 44 }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.1rem' }}>Transport & Delivery</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                      Route planning & dispatch tracking
                    </Typography>
                  </Box>
                </FeatureBox>

                <FeatureBox sx={{ animationDelay: '0.4s' }}>
                  <SpeedIcon sx={{ fontSize: 44 }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.1rem' }}>Customer Service</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                      Order processing & quality control
                    </Typography>
                  </Box>
                </FeatureBox>
              </Box>
            </Box>
          </StyledPaper>
        </Grid>

        {/* Right Side - Login Form */}
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square sx={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
          <LoginBox sx={{ width: '100%', maxWidth: 420, px: 4 }}>
            <StyledAvatar>
              <LockOutlinedIcon sx={{ fontSize: 28 }} />
            </StyledAvatar>
            
            <Typography component="h1" variant="h4" sx={{ mt: 1, mb: 0.5, fontWeight: 800, color: '#333', letterSpacing: '-0.5px' }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', fontSize: '0.95rem' }}>
              Sign in to access your dashboard
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%', maxWidth: 420 }}>
              <StyledTextField
                margin="normal"
                required
                fullWidth
                id="user_name"
                label="Username"
                name="username"
                autoComplete="username"
                value={user_name}
                onChange={(e) => setuserName(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                placeholder="Enter your username"
              />
              
              <StyledTextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
                placeholder="Enter your password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      value="remember" 
                      color="primary"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Remember me"
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <StyledButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </StyledButton>

                <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary', textAlign: 'center' }}>
                  © 2025 EPSS-MT. All rights reserved.
                </Typography>
              </Box>
            </Box>
          </LoginBox>
        </Grid>
      </Grid>
      <ToastContainer />
    </ThemeProvider>
  );
}
