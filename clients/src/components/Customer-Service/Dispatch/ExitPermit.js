import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { recordServiceTimeAuto, formatTimestamp } from '../../../utils/serviceTimeHelper';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, 
  TextField, Snackbar, Alert, MenuItem, Select, FormControl, 
  InputLabel, InputAdornment, Chip 
} from '@mui/material';
import { 
  LocalShipping, Receipt, ConfirmationNumber, 
  Scale, Send, Inventory, Storefront 
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const ExitPermit = () => {
  const [records, setRecords] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Access control - only for Dispatch-Documentation users
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const hasAccess = userJobTitle === 'Dispatch-Documentation';

  const measurementOptions = ["Carton", "Box", "Package", "Bottle", "Others"];

  // 1. Identify Store Keys dynamically
  const getStoreKeys = useCallback(() => {
    const rawStore = localStorage.getItem('store') || 'AA1';
    const storeId = rawStore.toUpperCase().trim(); 
    const storeNum = storeId.replace('AA', '');    
    return {
      storeId,
      odnKey: `${storeId.toLowerCase()}_odn`,
      statusKey: `store_completed_${storeNum}`
    };
  }, []);

  // 2. Fetch Data Logic
  const fetchData = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    try {
      const [serviceRes, facilityRes] = await Promise.all([
        axios.get(`${API_URL}/api/serviceList`),
        axios.get(`${API_URL}/api/facilities`)
      ]);
      const { statusKey } = getStoreKeys();
      
      // Show records marked as dispatch_completed OR already archived (finalized)
      const completedRows = serviceRes.data.filter(row => {
        const statusValue = (row[statusKey] || "").toLowerCase().trim();
        return statusValue === 'dispatch_completed' || row.status === 'archived';
      });
      
      setRecords(completedRows);
      setFacilities(facilityRes.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [getStoreKeys]);

  // 3. Auto-Refresh Effect (every 10 seconds)
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleInputChange = (id, field, value) => {
    setFormValues(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSubmit = async (record) => {
    const data = formValues[record.id] || {};
    const isCash = record.customer_type?.toLowerCase() === 'cash';

    // Validations
    if (isCash && !data.receiptNumber) {
        setSnackbar({ open: true, message: "Receipt number required for Cash customers.", severity: "error" });
        return;
    }
    if (!data.receiptCount || !data.plateNumber || !data.amount || !data.measurement) {
      setSnackbar({ open: true, message: "Please fill all required fields.", severity: "warning" });
      return;
    }

    try {
      await axios.put(`${API_URL}/api/update-service-status/${record.id}`, {
        receipt_count: data.receiptCount,
        vehicle_plate: data.plateNumber,
        receipt_number: data.receiptNumber || null,
        total_amount: data.amount,
        measurement_unit: data.measurement,
        status: 'archived'
      });
      
      // Record service time for Dispatch-Documentation
      // Calculate waiting time: current time - dispatcher end time
      try {
        const dispatchDocTime = formatTimestamp();
        const dispatcherEndTime = record.dispatch_completed_at;
        
        // Calculate waiting time in minutes
        let waitingMinutes = 0;
        if (dispatcherEndTime) {
          const prevTime = new Date(dispatcherEndTime);
          const currTime = new Date(dispatchDocTime);
          const diffMs = currTime - prevTime;
          waitingMinutes = Math.floor(diffMs / 60000);
          waitingMinutes = waitingMinutes > 0 ? waitingMinutes : 0;
        }
        
        // Record service time directly
        const { storeId } = getStoreKeys();
        await axios.post(`${API_URL}/api/service-time`, {
          process_id: record.id,
          service_unit: `Dispatch-Documentation - ${storeId}`,
          start_time: dispatchDocTime,
          end_time: dispatchDocTime,
          waiting_minutes: waitingMinutes,
          officer_id: localStorage.getItem('EmployeeID'),
          officer_name: localStorage.getItem('FullName'),
          status: 'completed',
          notes: `Exit permit finalized - Receipt: ${data.receiptNumber || 'N/A'}, Plate: ${data.plateNumber}`
        });
        
        console.log(`✅ Dispatch-Documentation service time recorded: ${waitingMinutes} minutes`);
      } catch (err) {
        console.error('❌ Failed to record Dispatch-Documentation service time:', err);
        // Don't fail the finalization if service time recording fails
      }
      
      setSnackbar({ open: true, message: "Exit Permit finalized!", severity: "success" });
      
      // Clear local form state for this record
      setFormValues(prev => { const n = {...prev}; delete n[record.id]; return n; });
      fetchData(true); 
    } catch (error) {
      console.error('Exit permit submission error:', error);
      setSnackbar({ open: true, message: "Update failed.", severity: "error" });
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
          This page is restricted to Dispatch-Documentation users only.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Your current job title: <strong>{userJobTitle || 'Not Set'}</strong>
        </Typography>
        <Typography variant="body2">
          Required job title: <strong>Dispatch-Documentation</strong>
        </Typography>
      </Box>
    );
  }

  const { odnKey, storeId } = getStoreKeys();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>
            Exit Permit Registry
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Authorized Gateway Clearance | <strong>{storeId}</strong>
          </Typography>
        </Box>
        <Chip 
          label={`${records.filter(r => r.status !== 'archived').length} Pending Dispatches`} 
          color="primary" 
          variant="filled" 
          sx={{ fontWeight: 'bold', px: 2, py: 2.5, borderRadius: '8px' }} 
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#ffffff' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#5c6bc0' }}>LOGISTICS INFO</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#5c6bc0' }}>QUANTITY & UNIT</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#5c6bc0' }}>DOCUMENTATION</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#5c6bc0' }}>ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                  <Inventory sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">No items waiting for permit.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              records.map((row) => {
                const isCash = row.customer_type?.toLowerCase() === 'cash';
                const val = formValues[row.id] || {};
                const isFinalized = row.status === 'archived';
                
                return (
                  <TableRow 
                    key={row.id} 
                    sx={{ 
                      '&:hover': { bgcolor: isFinalized ? '#f8f9fa' : '#fcfdff' },
                      opacity: isFinalized ? 0.7 : 1,
                      bgcolor: isFinalized ? '#f5f5f5' : 'transparent'
                    }}
                  >
                    {/* ODN & Store Info */}
                    <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#9e9e9e' }}>ODN REFERENCE</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word', mt: 0.5, fontWeight: 'normal' }}>
                          {row[odnKey] || '—'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Storefront sx={{ fontSize: 16, color: '#7986cb' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {facilities.find(f => f.id === row.facility_id)?.facility_name || row.facility_id}
                        </Typography>
                      </Box>
                      {isFinalized && (
                        <Chip 
                          label="Sent to Gate Keeper" 
                          color="success" 
                          size="small" 
                          sx={{ mt: 1, fontWeight: 'bold' }}
                        />
                      )}
                    </TableCell>

                    {/* Quantity & Units */}
                    <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
                      {isFinalized ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            <Scale sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                            {row.total_amount} {row.measurement_unit}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Finalized
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField 
                            label="Amount" size="small" variant="filled" type="number"
                            InputProps={{ startAdornment: <InputAdornment position="start"><Scale fontSize="small"/></InputAdornment> }}
                            value={val.amount || ''}
                            onChange={(e) => handleInputChange(row.id, 'amount', e.target.value)}
                          />
                          <FormControl size="small" variant="filled">
                            <InputLabel>Measurement</InputLabel>
                            <Select
                              value={val.measurement || ''}
                              onChange={(e) => handleInputChange(row.id, 'measurement', e.target.value)}
                            >
                              {measurementOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Box>
                      )}
                    </TableCell>

                    {/* Plate & Receipts */}
                    <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
                      {isFinalized ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            <LocalShipping sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                            {row.vehicle_plate}
                          </Typography>
                          <Typography variant="body2">
                            <Receipt sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                            {row.receipt_count} Receipts
                          </Typography>
                          {isCash && row.receipt_number && (
                            <Typography variant="body2" sx={{ color: '#f57c00' }}>
                              <ConfirmationNumber sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {row.receipt_number}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField 
                            label="Plate Number" size="small"
                            InputProps={{ startAdornment: <InputAdornment position="start"><LocalShipping fontSize="small"/></InputAdornment> }}
                            value={val.plateNumber || ''}
                            onChange={(e) => handleInputChange(row.id, 'plateNumber', e.target.value)}
                          />
                          <TextField 
                            label="Receipts Count" size="small" type="number"
                            InputProps={{ startAdornment: <InputAdornment position="start"><Receipt fontSize="small"/></InputAdornment> }}
                            value={val.receiptCount || ''}
                            onChange={(e) => handleInputChange(row.id, 'receiptCount', e.target.value)}
                          />
                          {isCash && (
                            <TextField 
                              label="Cash Receipt Number" size="small" color="warning" focused
                              InputProps={{ startAdornment: <InputAdornment position="start"><ConfirmationNumber fontSize="small"/></InputAdornment> }}
                              value={val.receiptNumber || ''}
                              onChange={(e) => handleInputChange(row.id, 'receiptNumber', e.target.value)}
                            />
                          )}
                        </Box>
                      )}
                    </TableCell>

                    {/* Action Button */}
                    <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
                      {isFinalized ? (
                        <Chip 
                          label="Completed" 
                          color="success" 
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      ) : (
                        <Button 
                          variant="contained" 
                          onClick={() => handleSubmit(row)} 
                          sx={{ 
                            borderRadius: '10px', px: 3, fontWeight: 'bold', textTransform: 'none',
                            background: 'linear-gradient(45deg, #2e3b8b 30%, #5c6bc0 90%)'
                          }}
                          endIcon={<Send />}
                        >
                          Finalize
                        </Button>
                      )}
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

export default ExitPermit;