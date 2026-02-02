import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const ResetPasswordForm = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api_url = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${api_url}/api/users`);
        console.log('Raw API response:', response);
        console.log('Response data:', response.data);
        console.log('Response data type:', typeof response.data);
        console.log('Is array?', Array.isArray(response.data));
        
        const data = response.data;
        
        // Handle different response formats
        if (Array.isArray(data)) {
          console.log('Setting users - array format, count:', data.length);
          setUsers(data);
        } else if (typeof data === 'string') {
          console.error('Received string instead of array:', data);
          setError('Server returned invalid data format (string)');
          setUsers([]);
        } else if (data && typeof data === 'object') {
          console.log('Received object, keys:', Object.keys(data));
          if (data.users && Array.isArray(data.users)) {
            console.log('Setting users from nested array');
            setUsers(data.users);
          } else if (data.data && Array.isArray(data.data)) {
            console.log('Setting users from data property');
            setUsers(data.data);
          } else {
            console.error('Object does not contain users array');
            setError('Invalid data structure received from server');
            setUsers([]);
          }
        } else {
          console.error('Unexpected data type:', typeof data);
          setError('Invalid data format received');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        console.error('Error response:', error.response);
        setError(`Failed to load users: ${error.message}`);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [api_url]);

  const handleChange = (event) => {
    setSelectedUser(event.target.value);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) {
      await MySwal.fire({
        title: 'No User Selected',
        html: `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; color: #ff9800; margin-bottom: 20px;">
              ⚠️
            </div>
            <p style="font-size: 18px; color: #333;">
              Please select a user first
            </p>
          </div>
        `,
        icon: 'warning',
        confirmButtonColor: '#ff9800',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    // Confirmation dialog
    const result = await MySwal.fire({
      title: 'Reset Password?',
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 60px; color: #ff9800; margin-bottom: 20px;">
            🔑
          </div>
          <p style="font-size: 18px; color: #333; margin-bottom: 10px;">
            Are you sure you want to reset the password for:
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <p style="font-size: 20px; font-weight: bold; color: #1976d2; margin-bottom: 0;">
              ${selectedUser}
            </p>
          </div>
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">
            The password will be reset to the default value.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#ff9800',
      cancelButtonColor: '#2196f3',
      confirmButtonText: 'Yes, Reset Password!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.post(`${api_url}/api/resetPassword`, { user_name: selectedUser });
        
        // Success message
        await MySwal.fire({
          title: 'Password Reset!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #4caf50; margin-bottom: 20px;">
                ✅
              </div>
              <p style="font-size: 18px; color: #333;">
                ${response.data.message || 'Password reset successfully'}
              </p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 15px 0;">
                <p style="font-size: 16px; font-weight: bold; color: #1976d2; margin-bottom: 0;">
                  User: ${selectedUser}
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
        
        setSelectedUser('');
      } catch (error) {
        console.error('Error resetting password:', error);
        
        // Error message
        await MySwal.fire({
          title: 'Error!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
                ❌
              </div>
              <p style="font-size: 18px; color: #333;">
                ${error.response?.data?.message || 'Failed to reset password. Please try again.'}
              </p>
            </div>
          `,
          icon: 'error',
          confirmButtonColor: '#f44336',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      sx={{ backgroundColor: '#f5f5f5', padding: 2 }}
    >
      <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 500, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
          Reset User Password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth>
              <InputLabel id="user-select-label">Select User</InputLabel>
              <Select
                labelId="user-select-label"
                id="user-select"
                value={selectedUser}
                label="Select User"
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>-- Select a user --</em>
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.user_name}>
                    {user.user_name} {user.FullName ? `(${user.FullName})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {users.length} user(s) available
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={handleResetPassword}
              disabled={!selectedUser}
              size="large"
              sx={{ mt: 2 }}
            >
              Reset Password
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ResetPasswordForm;
