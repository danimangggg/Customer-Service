import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
      
      // Only show records marked as dispatch_completed by the dispatcher
      const completedRows = serviceRes.data.filter(row => 
        (row[statusKey] || "").toLowerCase().trim() === 'dispatch_completed'
      );
      
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
      setSnackbar({ open: true, message: "Exit Permit finalized!", severity: "success" });
      
      // Clear local form state for this record
      setFormValues(prev => { const n = {...prev}; delete n[record.id]; return n; });
      fetchData(true); 
    } catch (error) {
      setSnackbar({ open: true, message: "Update failed.", severity: "error" });
    }
  };

  if (loading && records.length === 0) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress thickness={5} size={60} />
    </Box>
  );

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
          label={`${records.length} Pending Dispatches`} 
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
                
                return (
                  <TableRow key={row.id} sx={{ '&:hover': { bgcolor: '#fcfdff' } }}>
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
                    </TableCell>

                    {/* Quantity & Units */}
                    <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
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
                    </TableCell>

                    {/* Plate & Receipts */}
                    <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
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
                    </TableCell>

                    {/* Action Button */}
                    <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
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