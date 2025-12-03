import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import dayjs from 'dayjs';

// --- Configuration ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const DispatcherAccount = () => {
  const [dispatchList, setDispatchList] = useState([]);
  const [facilitiesMap, setFacilitiesMap] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const DISPATCHER_STATUSES = useMemo(() => ['ewm_completed', 'dispatch_notify', 'dispatching'], []);

  // --- Data Fetching: Facilities ---
  useEffect(() => {
    // ... (Facility fetching logic remains the same)
    const fetchFacilities = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/facilities`);
        const map = response.data.reduce((acc, facility) => {
          acc[facility.id] = facility;
          return acc;
        }, {});
        setFacilitiesMap(map);
      } catch (err) {
        console.error('Error fetching facilities:', err);
        setError('Failed to load facility list for lookup.');
      }
    };
    fetchFacilities();
  }, [API_URL]);


  // --- Data Fetching: Service List ---
  const fetchDispatchList = useCallback(async () => {
    // ... (Service list fetching logic remains the same)
    setLoading(true);
    setError(null);
    
    if (Object.keys(facilitiesMap).length === 0 && dispatchList.length === 0) {
      setLoading(false);
      return; 
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/serviceList`);
      const allItems = response.data;
      
      const filteredItems = allItems
        .filter(item => DISPATCHER_STATUSES.includes(item.status?.toLowerCase()))
        .sort((a, b) => new Date(a.started_at) - new Date(b.started_at));

      setDispatchList(filteredItems);

    } catch (err) {
      console.error('Error fetching dispatch list:', err);
      setError('Failed to load dispatch list.');
    } finally {
      setLoading(false);
    }
  }, [API_URL, DISPATCHER_STATUSES, facilitiesMap, dispatchList.length]);

  useEffect(() => {
    if (Object.keys(facilitiesMap).length > 0) {
        fetchDispatchList();
        const interval = setInterval(fetchDispatchList, 5000);
        return () => clearInterval(interval);
    }
  }, [fetchDispatchList, facilitiesMap]);


  // --- Status Update Logic (CRITICAL FIX) ---
  const handleStatusUpdate = async (item, newStatus) => {
    try {
      setLoading(true);
      
      let completedAtValue = null;
      let nextServicePointValue = 'dispatch'; 
      let delegateId = item.assigned_officer_id || null; 

      if (newStatus === 'Completed') {
        completedAtValue = dayjs().format(); 
        nextServicePointValue = null; 
      }
      
      // === CRITICAL FIX: CONSTRUCTING THE PAYLOAD ===
      // The payload MUST contain ALL fields accessed by the backend's req.body 
      // to avoid triggering a SQL constraint error (NOT NULL) or undefined error.
      const putData = {
          // --- Fields required by the WHERE clause and for primary update ---
          id: item.id, // Changed from service_id to 'id'
          status: newStatus,
          
          // --- Fields explicitly used for update in backend code ---
          next_service_point: nextServicePointValue, 
          assigned_officer_id: delegateId, // Assuming delegate_id is stored here
          completed_at: completedAtValue,
          
          // --- ALL OTHER FIELDS FROM THE BACKEND CODE (MUST BE INCLUDED) ---
          // Use current item values, or null/undefined if not available/relevant
          aa1_odn: item.aa1_odn || null,
          aa2_odn: item.aa2_odn || null,
          aa3_odn: item.aa3_odn || null,
          store_id_1: item.store_id_1 || null,
          store_id_2: item.store_id_2 || null,
          store_id_3: item.store_id_3 || null,
          store_completed_1: item.store_completed_1 || null,
          store_completed_2: item.store_completed_2 || null,
          store_completed_3: item.store_completed_3 || null,
          availability_aa1: item.availability_aa1 || null,
          availability_aa2: item.availability_aa2 || null,
      };

      // Use the existing PUT endpoint
      await axios.put(`${API_URL}/api/update-service-point`, putData); 
      
      setSnackbar({ 
        open: true, 
        message: `Status updated to '${newStatus.toUpperCase()}' successfully!`, 
        severity: 'success' 
      });
      fetchDispatchList(); 
    } catch (err) {
      console.error(`Error updating status for ID ${item.id}:`, err.response?.data || err.message);
      setSnackbar({ 
        open: true, 
        message: `Failed to update status. Check payload/backend. Error: ${err.response?.data?.message || err.message}`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };


  // --- Helper Functions (getFacilityName, formatWaitingTime, getStatusChip) ---
  const getFacilityName = (facilityId) => {
    return facilitiesMap[facilityId]?.facility_name || `ID: ${facilityId} (Name Missing)`;
  };

  const formatWaitingTime = (startedAt) => {
    if (!startedAt) return 'N/A';
    const now = dayjs();
    const start = dayjs(startedAt);
    const duration = now.diff(start, 'minute');
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusChip = (status) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'ewm_completed':
        return <Chip label="Ready for Dispatch" color="primary" variant="outlined" size="small" />;
      case 'dispatch_notify':
        return <Chip label="Calling Delegate" color="warning" size="small" />;
      case 'dispatching':
        return <Chip label="In Progress" color="info" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // --- Main Render (remains the same) ---

  if (loading && dispatchList.length === 0) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Dispatch Data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Logistics Dispatch Console 🚚
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
        Queue: Active items ready for dispatch or currently in progress. 
      </Typography>
      
      {error && <Alert severity="error">{error}</Alert>}

      <TableContainer component={Paper} elevation={3}>
        <Table stickyHeader aria-label="dispatcher table">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: '#f0f0f0' } }}>
              <TableCell>Ticket</TableCell>
              <TableCell>Facility Name</TableCell>
              <TableCell>Waiting Time</TableCell>
              <TableCell>Customer Type</TableCell>
              <TableCell>Delegate Phone</TableCell>
              <TableCell>Current Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dispatchList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="h6" sx={{ py: 3, color: 'text.secondary' }}>
                    🎉 All active dispatch tasks are currently managed! Queue is clear.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              dispatchList.map((item, index) => (
                <TableRow 
                  key={item.id} 
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' }, 
                    ...(item.status?.toLowerCase() === 'dispatch_notify' && { backgroundColor: '#fffbe6' }),
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{getFacilityName(item.facility_id)}</TableCell>
                  <TableCell>{formatWaitingTime(item.started_at)}</TableCell>
                  <TableCell>{item.customer_type || 'Retail'}</TableCell>
                  <TableCell>{item.delegate_phone || 'N/A'}</TableCell>
                  <TableCell>{getStatusChip(item.status)}</TableCell>
                  <TableCell align="center" sx={{ minWidth: '350px' }}>
                    
                    {/* Action Buttons based on Current Status */}
                    
                    {/* 1. If Ready (ewm_completed), allow Notify/Dispatch */}
                    {item.status?.toLowerCase() === 'ewm_completed' && (
                      <>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          color="warning" 
                          onClick={() => handleStatusUpdate(item, 'dispatch_notify')}
                          sx={{ mr: 1 }}
                          disabled={loading}
                        >
                          Notify Delegate
                        </Button>
                        <Button 
                          variant="contained" 
                          size="small" 
                          color="info" 
                          onClick={() => handleStatusUpdate(item, 'dispatching')}
                          disabled={loading}
                        >
                          Start Dispatch
                        </Button>
                      </>
                    )}

                    {/* 2. If Notifying (dispatch_notify), allow Dispatch/Complete */}
                    {item.status?.toLowerCase() === 'dispatch_notify' && (
                       <>
                        <Button 
                          variant="contained" 
                          size="small" 
                          color="info" 
                          onClick={() => handleStatusUpdate(item, 'dispatching')}
                          sx={{ mr: 1 }}
                          disabled={loading}
                        >
                          Start Dispatch
                        </Button>
                        <Button 
                          variant="contained" 
                          size="small" 
                          color="success" 
                          onClick={() => handleStatusUpdate(item, 'completed')}
                          disabled={loading}
                        >
                          Mark Completed
                        </Button>
                      </>
                    )}

                    {/* 3. If Dispatching, allow Complete */}
                    {item.status?.toLowerCase() === 'dispatching' && (
                       <Button 
                          variant="contained" 
                          size="small" 
                          color="success" 
                          onClick={() => handleStatusUpdate(item, 'completed')}
                          disabled={loading}
                        >
                          Mark Completed
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DispatcherAccount;