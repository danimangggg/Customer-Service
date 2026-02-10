import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { recordServiceTimeAuto, formatTimestamp } from '../../../utils/serviceTimeHelper';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, 
  Snackbar, Alert, Chip, Card, CardContent, Stack, Divider
} from '@mui/material';
import { 
  Security, CheckCircle, LocalShipping, Receipt, 
  Scale, Inventory, Storefront, ExitToApp, Block
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const GateKeeper = () => {
  const [records, setRecords] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Access control - only for Gate Keeper users
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const hasAccess = userJobTitle === 'Gate Keeper';

  // Fetch Data Logic - only show records that have been processed by Dispatch-Documentation
  const fetchData = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    try {
      const [serviceRes, facilityRes] = await Promise.all([
        axios.get(`${API_URL}/api/serviceList`),
        axios.get(`${API_URL}/api/facilities`)
      ]);
      
      // Only show records that have been finalized by Dispatch-Documentation (status = 'archived')
      // and have all exit permit information filled, but haven't been processed by gate keeper yet
      const processedRecords = serviceRes.data.filter(row => 
        row.status === 'archived' && 
        row.receipt_count && 
        row.vehicle_plate && 
        row.total_amount && 
        row.measurement_unit &&
        !row.gate_status // Only show records that haven't been processed by gate keeper yet
      );

      // Debug logging to help troubleshoot
      console.log('=== GATE KEEPER DEBUG ===');
      console.log('All records:', serviceRes.data.length);
      console.log('Archived records:', serviceRes.data.filter(row => row.status === 'archived').length);
      console.log('With receipt_count:', serviceRes.data.filter(row => row.status === 'archived' && row.receipt_count).length);
      console.log('With vehicle_plate:', serviceRes.data.filter(row => row.status === 'archived' && row.receipt_count && row.vehicle_plate).length);
      console.log('With total_amount:', serviceRes.data.filter(row => row.status === 'archived' && row.receipt_count && row.vehicle_plate && row.total_amount).length);
      console.log('With measurement_unit:', serviceRes.data.filter(row => row.status === 'archived' && row.receipt_count && row.vehicle_plate && row.total_amount && row.measurement_unit).length);
      console.log('Final filtered records:', processedRecords.length);
      
      // Show a sample archived record to see what data we have
      const archivedSample = serviceRes.data.find(row => row.status === 'archived');
      if (archivedSample) {
        console.log('Sample archived record:', {
          id: archivedSample.id,
          status: archivedSample.status,
          receipt_count: archivedSample.receipt_count,
          vehicle_plate: archivedSample.vehicle_plate,
          total_amount: archivedSample.total_amount,
          measurement_unit: archivedSample.measurement_unit,
          gate_status: archivedSample.gate_status
        });
      }
      
      setRecords(processedRecords);
      setFacilities(facilityRes.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-Refresh Effect (every 15 seconds)
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleVehicleAction = async (record, action) => {
    const actionText = action === 'allow' ? 'Allow Exit' : 'Deny Exit';
    const actionColor = action === 'allow' ? '#4caf50' : '#f44336';
    const actionIcon = action === 'allow' ? '✅' : '❌';

    const result = await Swal.fire({
      title: `${actionIcon} ${actionText}`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Vehicle:</strong> ${record.vehicle_plate}</p>
          <p><strong>Facility:</strong> ${facilities.find(f => f.id === record.facility_id)?.facility_name || record.facility_id}</p>
          <p><strong>Amount:</strong> ${record.total_amount} ${record.measurement_unit}</p>
          <p><strong>Receipts:</strong> ${record.receipt_count}</p>
          ${record.receipt_number ? `<p><strong>Receipt #:</strong> ${record.receipt_number}</p>` : ''}
        </div>
      `,
      icon: action === 'allow' ? 'success' : 'warning',
      showCancelButton: true,
      confirmButtonColor: actionColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      }
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`${API_URL}/api/update-service-status/${record.id}`, {
          gate_status: action === 'allow' ? 'allowed' : 'denied',
          gate_processed_at: new Date().toISOString(),
          gate_processed_by: localStorage.getItem('FullName') || 'Gate Keeper'
        });

        // Record service time for Gate Keeper
        // Calculate waiting time: current time - dispatch-doc end time
        try {
          const gateProcessedTime = formatTimestamp();
          const dispatchDocEndTime = record.updated_at; // When dispatch-doc finalized
          
          // Calculate waiting time in minutes
          let waitingMinutes = 0;
          if (dispatchDocEndTime) {
            const prevTime = new Date(dispatchDocEndTime);
            const currTime = new Date(gateProcessedTime);
            const diffMs = currTime - prevTime;
            waitingMinutes = Math.floor(diffMs / 60000);
            waitingMinutes = waitingMinutes > 0 ? waitingMinutes : 0;
          }
          
          // Record service time directly
          await axios.post(`${API_URL}/api/service-time`, {
            process_id: record.id,
            service_unit: 'Gate Keeper',
            start_time: gateProcessedTime,
            end_time: gateProcessedTime,
            waiting_minutes: waitingMinutes,
            officer_id: localStorage.getItem('EmployeeID'),
            officer_name: localStorage.getItem('FullName'),
            status: 'completed',
            notes: `Gate ${action === 'allow' ? 'allowed' : 'denied'} exit for vehicle ${record.vehicle_plate}`
          });
          
          console.log(`✅ Gate Keeper service time recorded: ${waitingMinutes} minutes`);
        } catch (err) {
          console.error('❌ Failed to record Gate Keeper service time:', err);
          // Don't fail the gate processing if service time recording fails
        }

        setSnackbar({ 
          open: true, 
          message: `Vehicle ${record.vehicle_plate} ${action === 'allow' ? 'allowed to exit' : 'denied exit'}!`, 
          severity: action === 'allow' ? 'success' : 'warning' 
        });
        
        fetchData(true);
      } catch (error) {
        setSnackbar({ open: true, message: "Action failed. Please try again.", severity: "error" });
      }
    }
  };

  if (loading && records.length === 0) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress thickness={5} size={60} />
    </Box>
  );

  // Access control check
  if (!hasAccess) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page is restricted to Gate Keeper users only.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Your current job title: <strong>{userJobTitle || 'Not Set'}</strong>
        </Typography>
        <Typography variant="body2">
          Required job title: <strong>Gate Keeper</strong>
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>
            Gate Security Control
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vehicle Exit Authorization System
          </Typography>
        </Box>
        <Chip 
          label={`${records.length} Vehicles Ready`} 
          color="primary" 
          variant="filled" 
          sx={{ fontWeight: 'bold', px: 2, py: 2.5, borderRadius: '8px' }} 
        />
      </Box>

      {/* Summary Cards */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Security sx={{ fontSize: 40, color: '#2196f3' }} />
              <Box>
                <Typography variant="h6" fontWeight="bold">Security Gate</Typography>
                <Typography variant="body2" color="text.secondary">
                  Authorized Exit Control
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <LocalShipping sx={{ fontSize: 40, color: '#4caf50' }} />
              <Box>
                <Typography variant="h6" fontWeight="bold">{records.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Vehicles Awaiting Clearance
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#ffffff' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#5c6bc0' }}>VEHICLE & FACILITY</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#5c6bc0' }}>SHIPMENT DETAILS</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#5c6bc0' }}>GATE ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 10 }}>
                  <Security sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">No vehicles awaiting clearance.</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vehicles will appear here after Dispatch-Documentation processing.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              records.map((row) => {
                const facility = facilities.find(f => f.id === row.facility_id);
                const isCash = row.customer_type?.toLowerCase() === 'cash';
                
                return (
                  <TableRow key={row.id} sx={{ '&:hover': { bgcolor: '#fcfdff' } }}>
                    {/* Vehicle & Facility Info */}
                    <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <LocalShipping sx={{ fontSize: 20, color: '#2196f3' }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                            {row.vehicle_plate}
                          </Typography>
                        </Stack>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Storefront sx={{ fontSize: 16, color: '#7986cb' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {facility?.facility_name || row.facility_id}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Customer: {row.customer_type || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Shipment Details */}
                    <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
                      <Stack spacing={2}>
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Scale sx={{ fontSize: 18, color: '#ff9800' }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {row.total_amount} {row.measurement_unit}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Receipt sx={{ fontSize: 16, color: '#9c27b0' }} />
                            <Typography variant="body2">
                              <strong>{row.receipt_count}</strong> Receipts
                            </Typography>
                          </Stack>
                        </Box>
                        
                        {isCash && row.receipt_number && (
                          <Box sx={{ 
                            bgcolor: '#fff3e0', 
                            p: 1.5, 
                            borderRadius: 2, 
                            border: '1px solid #ffcc02' 
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#f57c00' }}>
                              Cash Receipt: {row.receipt_number}
                            </Typography>
                          </Box>
                        )}
                        
                        <Chip 
                          label="Documentation Complete" 
                          color="success" 
                          size="small" 
                          icon={<CheckCircle />}
                          sx={{ fontWeight: 'bold', alignSelf: 'flex-start' }}
                        />
                      </Stack>
                    </TableCell>

                    {/* Gate Actions */}
                    <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                      <Stack direction="column" spacing={1} alignItems="center">
                        <Button 
                          variant="contained" 
                          color="success"
                          onClick={() => handleVehicleAction(row, 'allow')} 
                          sx={{ 
                            borderRadius: '10px', 
                            px: 3, 
                            fontWeight: 'bold', 
                            textTransform: 'none',
                            minWidth: '120px'
                          }}
                          startIcon={<ExitToApp />}
                        >
                          Allow Exit
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error"
                          onClick={() => handleVehicleAction(row, 'deny')} 
                          sx={{ 
                            borderRadius: '10px', 
                            px: 3, 
                            fontWeight: 'bold', 
                            textTransform: 'none',
                            minWidth: '120px'
                          }}
                          startIcon={<Block />}
                        >
                          Deny Exit
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert variant="filled" severity={snackbar.severity} sx={{ borderRadius: '8px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GateKeeper;