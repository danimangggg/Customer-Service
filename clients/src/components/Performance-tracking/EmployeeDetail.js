import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Divider,
  Grid,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import axios from 'axios';

const EmployeeDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const api_url = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get(`${api_url}/api/get-employee`);
        const foundUser = userRes.data.find(u => u.id === parseInt(id));
        setUser(foundUser);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id, api_url]);

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" color="error">
          Employee not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom color="primary">
        Employee Detail
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#1565c0', fontWeight: 'bold' }}>
          Personal Information
        </Typography>
        <Divider sx={{ my: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Basic Details
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Full Name:</strong> 
                    <span style={{ marginLeft: '10px', color: '#1565c0', fontWeight: 'bold' }}>
                      {user.full_name}
                    </span>
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Email:</strong> 
                    <span style={{ marginLeft: '10px', color: '#2e7d32' }}>
                      {user.email || 'Not provided'}
                    </span>
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Phone:</strong> 
                    <span style={{ marginLeft: '10px', color: '#ed6c02' }}>
                      {user.phone || 'Not provided'}
                    </span>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Work Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Position:</strong> 
                    <span style={{ marginLeft: '10px', color: '#2e7d32', fontWeight: 'bold' }}>
                      {user.position || 'Not specified'}
                    </span>
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Department:</strong> 
                    <span style={{ marginLeft: '10px', color: '#6a1b9a', fontWeight: 'bold' }}>
                      {user.department || 'Not specified'}
                    </span>
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Account Type:</strong> 
                    <span style={{ marginLeft: '10px', color: '#d32f2f' }}>
                      {user.account_type || 'Not specified'}
                    </span>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#1565c0', fontWeight: 'bold' }}>
          Additional Information
        </Typography>
        <Divider sx={{ my: 3 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Employee ID:</strong> 
              <span style={{ marginLeft: '10px', color: '#1565c0' }}>
                {user.id}
              </span>
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Status:</strong> 
              <span style={{ marginLeft: '10px', color: '#2e7d32', fontWeight: 'bold' }}>
                Active
              </span>
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            This employee profile shows basic information for customer service management purposes.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmployeeDetail;
