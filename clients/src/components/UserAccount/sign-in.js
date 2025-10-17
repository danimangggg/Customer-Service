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

const defaultTheme = createTheme();

export default function SignIn() {
  const [user_name, setuserName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const formValidation = () => {
    let isvalid = true;
    if (!user_name) {
      toast.warn("User name is required");
      isvalid = false;
    }
    if (!password) {
      toast.warn("Password is required");
      isvalid = false;
    }
    return isvalid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const api_url = process.env.REACT_APP_API_URL;
    try {
      if (formValidation()) {
        const response = await axios.post(`${api_url}/api/login`, { user_name, password });
        
        // VVVV THIS IS THE NEW DEBUGGING LINE VVVV
        console.log("API Response Data:", response.data);
        // ^^^^ END OF NEW LINE ^^^^

        const { token } = response.data;

        // Save the token and all user-related data to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem("FullName", response.data.FullName);
        localStorage.setItem("AccountType", response.data.AccountType);
        localStorage.setItem("Department", response.data.Department);
        localStorage.setItem("Position", response.data.Position);
        localStorage.setItem("JobTitle", response.data.JobTitle);
        localStorage.setItem("UserId", response.data.UserId);
        localStorage.setItem("store", response.data.store);
        
        // Save the store ID to local storage, which will be used for filtering tasks
        // This assumes the API response includes a 'store' field for the user
        

        // Redirect to a protected route based on user roles
        if(response.data.AccountType === "Self Assesment" || response.data.AccountType === "Admin"){
          if(response.data.Position === "Admin"){
            navigate('/customer-dashboard');
          } else if(response.data.Position === "Officer"){
            navigate(`/customer-dashboard`);
          } else if(response.data.Position === "Coordinator"){
            navigate('/customer-dashboard');
          } else if(response.data.Position === "Manager"){
            navigate('/customer-dashboard');
          }
        } else if (response.data.AccountType === "Credit Manager" || response.data.AccountType === "Admin"){
          navigate('/customer-dashboard');
        }
      }
    } catch (err) {
      toast.error('Invalid email or password.');
    }
  };

  const guest = () => {
    localStorage.setItem("FullName", 'Guest');
    localStorage.setItem('token', 'guest');
    navigate('/customer-dashboard');
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline />
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage: 'url(/pharmaceuticals.jpg)', // Reference to the image in the public folder
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="user_name"
                label="User Name"
                name="username"
                autoComplete="username"
                autoFocus
                value={user_name}
                onChange={(e) => setuserName(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
              <Box 
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  style={{
                    borderRadius: 35,
                    backgroundColor: "red",
                    padding: "10px 20px",
                    fontSize: "18px"
                  }}
                >
                  Sign In
                </Button>
              </Box>
              <ToastContainer />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
