import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Container,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  CheckCircle,
  Store as StoreIcon,
  Refresh,
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const QueueManager = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());

  const userStore = localStorage.getItem('store') || '';
  const userId = localStorage.getItem('EmployeeID');
  const userName = localStorage.getItem('FullName');

  const fetchO2CCompletedCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get customers with O2C completed status that have ODNs for this store
      const response = await axios.get(`${API_URL}/api/customer-availability/o2c-completed`, {
        params: { store: userStore }
      });
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setCustomers(response.data.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error('Error fetching O2C completed customers:', err);
      setError('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [userStore]);

  useEffect(() => {
    if (!userStore) {
      setError('No store assigned to your account');
      setLoading(false);
      return;
    }
    fetchO2CCompletedCustomers();
  }, [fetchO2CCompletedCustomers, userStore]);

  const handleCheckboxChange = (customerId) => {
    setSelectedCustomers(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      
      return newSet;
    });
  };

  const handleMarkAvailable = async () => {
    if (selectedCustomers.size === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one customer to update availability'
      });
      return;
    }

    // Separate customers into those to mark available and those to mark unavailable
    const toMarkAvailable = [];
    const toMarkUnavailable = [];
    
    customers.forEach(customer => {
      if (selectedCustomers.has(customer.id)) {
        if (customer.is_available === 1) {
          // Currently available, will be marked unavailable
          toMarkUnavailable.push(customer.id);
        } else {
          // Currently unavailable, will be marked available
          toMarkAvailable.push(customer.id);
        }
      }
    });

    const result = await Swal.fire({
      title: 'Update Customer Availability?',
      html: `
        ${toMarkAvailable.length > 0 ? `<p>Mark ${toMarkAvailable.length} customer(s) as <strong>available</strong></p>` : ''}
        ${toMarkUnavailable.length > 0 ? `<p>Mark ${toMarkUnavailable.length} customer(s) as <strong>unavailable</strong></p>` : ''}
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      console.log('=== Updating customer availability ===');
      console.log('To mark available:', toMarkAvailable);
      console.log('To mark unavailable:', toMarkUnavailable);

      const promises = [];

      // Mark as available
      toMarkAvailable.forEach(customerId => {
        const payload = {
          process_id: customerId,
          store: userStore,
          marked_by_id: userId,
          marked_by_name: userName,
          notes: 'Marked available by Queue Manager',
          is_available: true
        };
        console.log('Marking available:', customerId);
        promises.push(axios.post(`${API_URL}/api/customer-availability/mark-available`, payload));
      });

      // Mark as unavailable
      toMarkUnavailable.forEach(customerId => {
        const payload = {
          process_id: customerId,
          store: userStore,
          marked_by_id: userId,
          marked_by_name: userName,
          notes: 'Marked unavailable by Queue Manager',
          is_available: false
        };
        console.log('Marking unavailable:', customerId);
        promises.push(axios.post(`${API_URL}/api/customer-availability/mark-available`, payload));
      });

      const results = await Promise.all(promises);
      console.log('All requests completed:', results.map(r => r.data));

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Customer availability updated',
        timer: 2000
      });

      setSelectedCustomers(new Set());
      fetchO2CCompletedCustomers();
    } catch (err) {
      console.error('❌ Error updating availability:', err);
      console.error('Error response:', err.response?.data);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update customer availability'
      });
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  if (!userStore) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          No store assigned to your account. Please contact an administrator.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <StoreIcon sx={{ fontSize: 56, color: 'white' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold" color="white">
                Queue Manager - Store {userStore}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Mark Customers as Available for EWM
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              O2C Completed Customers ({customers.length})
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={handleMarkAvailable}
                disabled={selectedCustomers.size === 0 || loading}
                color="success"
              >
                Update Availability ({selectedCustomers.size})
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchO2CCompletedCustomers}
                disabled={loading}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading customers...</Typography>
            </Box>
          ) : customers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No customers with completed O2C status found for Store {userStore}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead style={{ backgroundColor: '#1565c0' }}>
                  <TableRow style={{ backgroundColor: '#1565c0' }}>
                    <TableCell style={{ color: '#ffffff', fontWeight: 'bold', backgroundColor: '#1565c0', padding: '16px' }}>
                      <Checkbox
                        checked={selectedCustomers.size === customers.length && customers.length > 0}
                        indeterminate={selectedCustomers.size > 0 && selectedCustomers.size < customers.length}
                        onChange={handleSelectAll}
                        sx={{ 
                          color: 'white',
                          '&.Mui-checked': { color: 'white' },
                          '&.MuiCheckbox-indeterminate': { color: 'white' }
                        }}
                      />
                    </TableCell>
                    <TableCell style={{ color: '#ffffff', fontWeight: 'bold', backgroundColor: '#1565c0', padding: '16px', fontSize: '1rem' }}>
                      Facility Name
                    </TableCell>
                    <TableCell style={{ color: '#ffffff', fontWeight: 'bold', backgroundColor: '#1565c0', padding: '16px', fontSize: '1rem' }}>
                      Region / Woreda
                    </TableCell>
                    <TableCell style={{ color: '#ffffff', fontWeight: 'bold', backgroundColor: '#1565c0', padding: '16px', fontSize: '1rem' }}>
                      ODN Numbers
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => {
                    // Checkbox logic:
                    // - If customer is in selectedCustomers, it will be toggled
                    // - If not in selectedCustomers, show database state
                    const inSelection = selectedCustomers.has(customer.id);
                    const dbAvailable = customer.is_available === 1;
                    
                    // If in selection, toggle the DB state
                    // If not in selection, show DB state
                    const isChecked = inSelection ? !dbAvailable : dbAvailable;
                    
                    return (
                      <TableRow 
                        key={customer.id}
                        sx={{ 
                          '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' },
                          bgcolor: inSelection ? '#fff3cd' : (isChecked ? '#e3f2fd' : 'inherit'),
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#e0e0e0' }
                        }}
                        onClick={() => handleCheckboxChange(customer.id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(customer.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={600}>
                          {customer.actual_facility_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={600}>
                          {customer.region_name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {customer.woreda_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={600} color="primary">
                          {customer.odn_numbers || 'No ODNs'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default QueueManager;
