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
import Divider from '@mui/material/Divider';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
`;
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
`;

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  color: '#333',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, transparent, rgba(198,40,40,0.4), transparent)',
    animation: `${pulse} 2s ease-in-out infinite`,
  },
}));

const FeatureBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  background: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)',
  borderRadius: 16,
  animation: `${slideInLeft} 0.8s ease-out`,
  transition: 'all 0.3s ease',
  cursor: 'default',
  '&:hover': {
    transform: 'translateX(8px) scale(1.02)',
    boxShadow: '0 8px 30px rgba(21,101,192,0.35)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 44,
    marginRight: theme.spacing(2),
    color: '#fff',
    transition: 'transform 0.3s ease',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'scale(1.1) rotate(5deg)',
  },
}));

const LoginBox = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  animation: `${slideInRight} 0.6s ease-out`,
}));

const StyledAvatar = styled(Avatar)(() => ({
  width: 60,
  height: 60,
  background: 'linear-gradient(135deg, #c62828 0%, #ef5350 100%)',
  boxShadow: '0 8px 24px rgba(198,40,40,0.4)',
}));

const StyledButton = styled(Button)(() => ({
  borderRadius: 30,
  padding: '14px 48px',
  fontSize: '16px',
  fontWeight: 700,
  textTransform: 'none',
  background: 'linear-gradient(135deg, #c62828 0%, #ef5350 100%)',
  boxShadow: '0 4px 15px rgba(198,40,40,0.4)',
  color: '#fff',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #b71c1c 0%, #e53935 100%)',
    boxShadow: '0 6px 25px rgba(198,40,40,0.55)',
    transform: 'translateY(-3px)',
  },
  '&:active': { transform: 'translateY(-1px)' },
  '&:disabled': { background: 'linear-gradient(135deg, #ccc 0%, #999 100%)', color: '#fff' },
}));

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'rgba(198,40,40,0.02)',
    transition: 'all 0.3s ease',
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#c62828', borderWidth: 2 },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#c62828', borderWidth: 2,
      boxShadow: '0 0 0 3px rgba(198,40,40,0.1)',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#c62828', fontWeight: 600 },
}));

const muiTheme = createTheme({
  palette: {
    primary: { main: '#c62828' },
    secondary: { main: '#ef5350' },
  },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
});

export default function SignIn() {
  const [user_name, setuserName]         = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [rememberMe, setRememberMe]       = useState(false);
  const [loading, setLoading]             = useState(false);
  const navigate = useNavigate();

  const formValidation = () => {
    let isvalid = true;
    if (!user_name) { toast.warn('Username is required', { position: 'top-right', autoClose: 3000 }); isvalid = false; }
    if (!password)  { toast.warn('Password is required', { position: 'top-right', autoClose: 3000 }); isvalid = false; }
    return isvalid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const api_url = process.env.REACT_APP_API_URL;
    if (!formValidation()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${api_url}/api/login`, { user_name, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('FullName', response.data.FullName);
      localStorage.setItem('AccountType', response.data.AccountType);
      localStorage.setItem('JobTitle', response.data.JobTitle);
      localStorage.setItem('UserId', response.data.UserId);
      localStorage.setItem('UserName', user_name);
      localStorage.setItem('store', response.data.store);
      localStorage.setItem('branch_code', response.data.branch_code || '');
      localStorage.setItem('branch_name', response.data.branch_name || '');

      setTimeout(() => {
        const accountType = response.data.AccountType;
        const jobTitle    = response.data.JobTitle;
        if (accountType === 'Super Admin') {
          navigate('/settings/user-management');
        } else if (accountType === 'Admin') {
          if (jobTitle === 'WIM Operator') navigate('/all-picklists');
          else navigate('/manager-dashboard');
        } else if (jobTitle === 'Coordinator' || jobTitle === 'Manager') {
          navigate('/manager-dashboard');
        } else if (jobTitle === 'Customer Service Officer') { navigate('/register-customer');
        } else if (jobTitle === 'O2C Officer')              { navigate('/outstandingProcess');
        } else if (jobTitle === 'EWM Officer')              { navigate('/outstandingProcess');
        } else if (jobTitle === 'O2C Officer - HP')         { navigate('/hp-facilities');
        } else if (jobTitle === 'EWM Officer - HP')         { navigate('/ewm-outstanding');
        } else if (jobTitle === 'PI Officer-HP')            { navigate('/pi-vehicle-requests');
        } else if (jobTitle === 'TM Manager')               { navigate('/tm-manager');
        } else if (jobTitle === 'Biller')                   { navigate('/biller');
        } else if (jobTitle === 'Dispatcher')               { navigate('/dispatch');
        } else if (jobTitle === 'Cashier') { navigate('/outstandingProcess');
        } else if ((jobTitle === 'Finance' || jobTitle === 'Finance Officer'))                  { navigate('/finance-invoices');
        } else if (jobTitle === 'Dispatcher - HP')          { navigate('/dispatch-management');
        } else if (jobTitle === 'Dispatch-Documentation')   { navigate('/exit-permit');
        } else if (jobTitle === 'EWM-Documentation')        { navigate('/ewm-documentation');
        } else if (jobTitle === 'Gate Keeper')              { navigate('/gate-keeper');
        } else if (jobTitle === 'General Service')           { navigate('/transportation/vehicle-log-sheet');
        } else if (jobTitle === 'WIM Operator')             { navigate('/all-picklists');
        } else if (jobTitle === 'Queue Manager')            { navigate('/queue-manager');
        } else if (jobTitle === 'Documentation Officer')    { navigate('/customer-dashboard');
        } else if (jobTitle === 'Documentation Officer - HP') { navigate('/documentation-hp');
        } else if (jobTitle === 'Documentation Follower')   { navigate('/customer-dashboard');
        } else if (accountType === 'Self Assesment') {
          if (jobTitle === 'WIM Operator') navigate('/all-picklists');
          else navigate('/customer-dashboard');
        } else if (accountType === 'Credit Manager') { navigate('/customer-dashboard');
        } else { navigate('/customer-dashboard'); }
      }, 300);
    } catch (err) {
      toast.error('Invalid username or password. Please try again.', { position: 'top-right', autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <Grid container component="main" sx={{ height: '100vh', overflow: 'hidden' }}>
        <CssBaseline />

        {/* Left Side — hidden on mobile */}
        <Grid item xs={false} sm={4} md={7} sx={{ overflow: 'hidden', display: { xs: 'none', sm: 'block' } }}>
          <StyledPaper elevation={0} square sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 550, px: 3 }}>
              <Box sx={{ position: 'absolute', top: -32, left: -24, right: -24, height: 6, background: 'linear-gradient(90deg, #c62828, #ef5350)' }} />

              <Box sx={{ mb: 2 }}>
                <img
                  src="/pharmalog-logo.png"
                  alt="EPSS-MT Logo"
                  style={{
                    width: 180, height: 180, marginBottom: 15,
                    filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.15))',
                    animation: `${float} 3s ease-in-out infinite`,
                    borderRadius: '50%', padding: '15px',
                    border: '3px solid rgba(198,40,40,0.2)',
                    background: 'rgba(198,40,40,0.05)',
                  }}
                />
              </Box>

              <Typography variant="h2" sx={{ fontWeight: 900, mb: 1.5, color: '#c62828', letterSpacing: '-1px', fontSize: '3rem' }}>
                EPSS-MT
              </Typography>
              <Typography variant="h6" sx={{ mb: 3, color: '#555', fontWeight: 500 }}>
                Pharmaceutical Operations Follow-Up System
              </Typography>

              <Divider sx={{ mb: 3, borderColor: 'rgba(198,40,40,0.2)' }} />

              <Box sx={{ mt: 1 }}>
                <FeatureBox>
                  <LocalHospitalIcon />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.1rem', color: '#fff' }}>Health Program (HP)</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>RRF, ODN &amp; facility management</Typography>
                  </Box>
                </FeatureBox>

                <FeatureBox sx={{ animationDelay: '0.2s' }}>
                  <SecurityIcon />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.1rem', color: '#fff' }}>RDF</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>Route planning &amp; dispatch tracking</Typography>
                  </Box>
                </FeatureBox>

                <FeatureBox sx={{ animationDelay: '0.4s' }}>
                  <SpeedIcon />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.1rem', color: '#fff' }}>Customer Service</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>Order processing &amp; quality control</Typography>
                  </Box>
                </FeatureBox>
              </Box>
            </Box>
          </StyledPaper>
        </Grid>

        {/* Right Side — Login Form */}
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square
          sx={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2, bgcolor: '#f7f8fa', minHeight: '100vh' }}>
          <LoginBox sx={{ width: '100%', maxWidth: 420, px: { xs: 3, sm: 4 } }}>
            {/* Show logo on mobile since left panel is hidden */}
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <img src="/pharmalog-logo.png" alt="EPSS-MT Logo" style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(198,40,40,0.2)' }} />
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#c62828', mt: 1 }}>EPSS-MT</Typography>
            </Box>
            <StyledAvatar><LockOutlinedIcon sx={{ fontSize: 28 }} /></StyledAvatar>

            <Typography component="h1" variant="h4" sx={{ mt: 1, mb: 0.5, fontWeight: 800, color: '#333', letterSpacing: '-0.5px' }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', fontSize: '0.95rem' }}>
              Sign in to access your dashboard
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%', maxWidth: 420 }}>
              <StyledTextField
                margin="normal" required fullWidth id="user_name" label="Username"
                name="username" autoComplete="username" value={user_name}
                onChange={(e) => setuserName(e.target.value)}
                InputLabelProps={{ shrink: true }} disabled={loading} placeholder="Enter your username"
              />
              <StyledTextField
                margin="normal" required fullWidth name="password" label="Password"
                type={showPassword ? 'text' : 'password'} id="password"
                autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputLabelProps={{ shrink: true }} disabled={loading} placeholder="Enter your password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <FormControlLabel
                  control={<Checkbox value="remember" color="primary" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={loading} />}
                  label="Remember me"
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <StyledButton type="submit" fullWidth variant="contained" disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}>
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
