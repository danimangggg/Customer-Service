import React, { useState } from 'react';
import {
  TextField, Button, MenuItem, Select, FormControl,
  Box, Typography, Paper, IconButton, Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const CreateUserForm = () => {
  const api_url = process.env.REACT_APP_API_URL;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    user_name: '',
    password: '',
    account_type: '',
    job_title: '',
    department: '',
    position: '',
  });

  const accountTypes = ['Admin', 'Credit Manager', 'Pod Manager', 'Self Assesment'];
  const departments = [
    'ICT Department', 'Finance', 'Human Resource',
    'Transport Management', 'Demand', 'EWM', "Executive"
  ];
  const positions = ['Officer', 'Coordinator', 'Manager'];
  const job_title = ['Camera man', 'Wearhouse manager', 'Oditor', "ICT Officer", "Database Adminstrator",
   "Data Clerk", "Branch Manager", "Customer Service", "Other"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await axios.post(`${api_url}/api/addUser`, formData);
      alert(result.data.message);
      window.location.reload();
    } catch (e) {
      console.log(`the error is ${e}`);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
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


            {/* Position */}
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <Select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  displayEmpty
                  sx={{ height: 50 }}
                >
                  <MenuItem value="" disabled>
                    Select Position
                  </MenuItem>
                  {positions.map((pos) => (
                    <MenuItem key={pos} value={pos}>
                      {pos}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Department */}
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  displayEmpty
                  sx={{ height: 50 }}
                >
                  <MenuItem value="" disabled>
                    Select Department
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
  );
};

export default CreateUserForm;
