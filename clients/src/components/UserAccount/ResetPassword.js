import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const ResetPasswordForm = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const navigate = useNavigate();
  const api_url = process.env.REACT_APP_API_URL;
  const [user_name, setUsername] = useState('');

  useEffect(() => {
    // Fetch users from the API
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${api_url}/api/users`); // Adjust the endpoint as needed
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (event) => {
    setSelectedUser(event.target.value);
  };

  const handleResetPassword = async () => {
    console.log(selectedUser)
    // Implement the password reset logic here
    const result = await axios.post(`${api_url}/api/resetPassword`,{user_name: selectedUser});
    
    alert(result.data.message)
    window.location.reload()
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="60vh"
      sx={{ backgroundColor: 'white', padding: 2 }}
    >
      <Paper elevation={3} sx={{ padding: 4, width: '400px', borderRadius: 2, position: 'relative' }}>
        <IconButton
          onClick={handleBack}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom align="center">
          Reset Password
        </Typography>
        <Box
          component="form"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <FormControl fullWidth margin="normal">
            <InputLabel>Select User</InputLabel>
            <Select
              value={selectedUser}
              onChange={handleChange}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.user_name}>
                  {user.user_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={handleResetPassword}
            sx={{ marginTop: 2 }}
          >
            Reset Password
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPasswordForm;
