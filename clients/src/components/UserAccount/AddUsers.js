import React, { useState, useEffect } from 'react';
import {
  TextField, Button, MenuItem, Select, FormControl,
  Box, Typography, Paper, IconButton, Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const CreateUserForm = () => {
  const api_url = process.env.REACT_APP_API_URL;
  const [stores, setStores] = useState([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    user_name: '',
    password: '',
    account_type: '',
    job_title: '',
    store: ''
  });

  const accountTypes = ['Admin', 'Credit Manager', 'Pod Manager', 'Self Assesment'];
  const job_title = ['O2C Officer', 'EWM Officer', 'Customer Service Officer', 'Finance Officer', 'O2C Officer - HP', 'EWM Officer - HP', 'PI Officer-HP', 'Documentation Officer', 'Documentation Follower', 'Dispatcher - HP', 'Quality Evaluator', 'WIM Operator', 'Queue Manager', 'Driver', 'Deliverer', 'TM Manager', 'Dispatcher', 'Camera man', 'Wearhouse manager', 'Oditor', 'ICT Officer', 'Database Adminstrator', 'Data Clerk', 'Branch Manager', 'Customer Service', 'Coordinator', 'Manager', 'TV Operator', 'Dispatch-Documentation', 'Gate Keeper', 'Other'];

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${api_url}/api/stores`);
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for EWM officers - store is mandatory
    if ((formData.job_title === 'EWM Officer' || formData.job_title === 'EWM Officer - HP') && !formData.store) {
      await MySwal.fire({
        title: 'Store Required!',
        html: `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; color: #ff9800; margin-bottom: 20px;">
              🏪
            </div>
            <p style="font-size: 18px; color: #333;">
              Store selection is mandatory for EWM Officers.
            </p>
            <p style="font-size: 14px; color: #666;">
              Please select a store before creating the user.
            </p>
          </div>
        `,
        icon: 'warning',
        confirmButtonColor: '#ff9800',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'swal-custom-popup',
          title: 'swal-custom-title',
          confirmButton: 'swal-custom-confirm'
        },
        buttonsStyling: true
      });
      return;
    }
    
    try {
      const result = await axios.post(`${api_url}/api/addUser`, formData);
      
      // Success message
      await MySwal.fire({
        title: 'User Created!',
        html: `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; color: #4caf50; margin-bottom: 20px;">
              👤
            </div>
            <p style="font-size: 18px; color: #333; margin-bottom: 10px;">
              ${result.data.message}
            </p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 15px 0;">
              <p style="font-size: 16px; font-weight: bold; color: #1976d2; margin-bottom: 5px;">
                ${formData.first_name} ${formData.last_name}
              </p>
              <p style="font-size: 14px; color: #666; margin-bottom: 0;">
                ${formData.job_title} • ${formData.account_type}
              </p>
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#4caf50',
        confirmButtonText: 'Great!',
        timer: 4000,
        timerProgressBar: true
      });
      
      window.location.reload();
    } catch (e) {
      console.log(`the error is ${e}`);
      
      // Error message
      await MySwal.fire({
        title: 'Error!',
        html: `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
              ❌
            </div>
            <p style="font-size: 18px; color: #333;">
              Failed to create user. Please try again.
            </p>
          </div>
        `,
        icon: 'error',
        confirmButtonColor: '#f44336',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <>
      <style>
        {`
          /* Custom SweetAlert Styles */
          .swal2-container {
            z-index: 9999 !important;
          }
          .swal2-backdrop-show {
            z-index: 9998 !important;
          }
          .swal-custom-popup {
            border-radius: 20px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2) !important;
            border: none !important;
            z-index: 9999 !important;
          }
          .swal-custom-title {
            font-size: 28px !important;
            font-weight: bold !important;
            color: #333 !important;
            margin-bottom: 20px !important;
          }
          .swal-custom-confirm {
            border-radius: 25px !important;
            padding: 12px 30px !important;
            font-weight: bold !important;
            font-size: 16px !important;
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3) !important;
            transition: all 0.3s ease !important;
          }
          .swal-custom-confirm:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4) !important;
          }
          .swal-custom-cancel {
            border-radius: 25px !important;
            padding: 12px 30px !important;
            font-weight: bold !important;
            font-size: 16px !important;
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3) !important;
            transition: all 0.3s ease !important;
          }
          .swal-custom-cancel:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4) !important;
          }
        `}
      </style>
      
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      sx={{ backgroundColor: '#f5f5f5', padding: 2 }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: '900px',
          borderRadius: 3,
          position: 'relative',
          backgroundColor: '#fff'
        }}
      >
        <IconButton onClick={handleBack} sx={{ position: 'absolute', top: 10, right: 10 }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h5" gutterBottom align="center">
          Add Employee
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            <Grid item xs={6}>
              <TextField
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                fullWidth
                InputProps={{ sx: { height: 50 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                fullWidth
                InputProps={{ sx: { height: 50 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Username"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="off"
                InputProps={{ sx: { height: 50 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="new-password"
                InputProps={{ sx: { height: 50 } }}
              />
            </Grid>

               {/* job title */}
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <Select
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  displayEmpty
                  sx={{ height: 50 }}
                >
                  <MenuItem value="" disabled>
                    Select Job Title
                  </MenuItem>
                  {job_title.map((jobt) => (
                    <MenuItem key={jobt} value={jobt}>
                      {jobt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Account Type */}
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <Select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleChange}
                  displayEmpty
                  sx={{ height: 50 }}
                >
                  <MenuItem value="" disabled>
                    Select Account Type
                  </MenuItem>
                  {accountTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Store - Show for all users, required for EWM Officers */}
            <Grid item xs={12}>
              <FormControl 
                fullWidth 
                required={formData.job_title === 'EWM Officer' || formData.job_title === 'EWM Officer - HP'}
              >
                <Select
                  name="store"
                  value={formData.store}
                  onChange={handleChange}
                  displayEmpty
                  sx={{ 
                    height: 50,
                    backgroundColor: (formData.job_title === 'EWM Officer' || formData.job_title === 'EWM Officer - HP') ? '#fff3e0' : 'inherit'
                  }}
                >
                  <MenuItem value="" disabled>
                    {(formData.job_title === 'EWM Officer' || formData.job_title === 'EWM Officer - HP') 
                      ? 'Select Store (Required for EWM Officers)' 
                      : 'Select Store (Optional)'
                    }
                  </MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.store_name}>
                      {store.store_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="error" fullWidth sx={{ height: 50 }}>
                Create User
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
    </>
  );
};

export default CreateUserForm;
