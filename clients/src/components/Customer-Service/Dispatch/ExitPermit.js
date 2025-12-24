import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, TextField, Snackbar, Alert 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const ExitPermit = () => {
  const [records, setRecords] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 1. Identify Store Keys
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

  const fetchData = useCallback(async () => {
    try {
      const [serviceRes, facilityRes] = await Promise.all([
        axios.get(`${API_URL}/api/serviceList`),
        axios.get(`${API_URL}/api/facilities`)
      ]);

      const { statusKey } = getStoreKeys();

      // Only show records where status and store column are 'dispatch_completed'
      const completedRows = serviceRes.data.filter(row => {
        const currentStatus = (row[statusKey] || "").toLowerCase().trim();
        return currentStatus === 'dispatch_completed';
      });

      setRecords(completedRows);
      setFacilities(facilityRes.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [getStoreKeys]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (id, field, value) => {
    setFormValues(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSubmit = async (record) => {
    const data = formValues[record.id] || {};
    const isCash = record.customer_type?.toLowerCase() === 'cash';

    // Validations
    if (isCash && !data.receiptNumber) {
        setSnackbar({ open: true, message: "Receipt number is required for Cash customers.", severity: "error" });
        return;
    }
    if (!data.receiptCount || !data.plateNumber) {
      setSnackbar({ open: true, message: "Please enter Receipt Count and Plate Number.", severity: "warning" });
      return;
    }

    try {
      await axios.put(`${API_URL}/api/update-service-status/${record.id}`, {
        receipt_count: data.receiptCount,
        vehicle_plate: data.plateNumber,
        receipt_number: data.receiptNumber || null,
        status: 'archived' // Or whatever your final "Exit" status is
      });

      setSnackbar({ open: true, message: "Exit Permit processed successfully!", severity: "success" });
      fetchData(); 
    } catch (error) {
      setSnackbar({ open: true, message: "Error saving data.", severity: "error" });
    }
  };

  const getFacilityName = (id) => facilities.find(f => f.id === id)?.facility_name || `ID: ${id}`;

  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  const { odnKey } = getStoreKeys();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Exit Permit Registry</Typography>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ width: '200px' }}><strong>ODN Numbers</strong></TableCell>
              <TableCell><strong>Facility</strong></TableCell>
              <TableCell><strong>Receipt # (Cash)</strong></TableCell>
              <TableCell><strong>No. of Receipts</strong></TableCell>
              <TableCell><strong>Plate Number</strong></TableCell>
              <TableCell align="right"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Waiting for completed dispatches...</TableCell></TableRow>
            ) : (
              records.map((row) => {
                const isCash = row.customer_type?.toLowerCase() === 'cash';
                return (
                  <TableRow key={row.id} hover>
                    {/* ODN: Non-bold and Wrapping */}
                    <TableCell sx={{ wordBreak: 'break-word', whiteSpace: 'normal', fontWeight: 'normal', fontSize: '0.85rem' }}>
                      {row[odnKey] || 'N/A'}
                    </TableCell>

                    <TableCell>{getFacilityName(row.facility_id)}</TableCell>

                    {/* Receipt Number Input - Cash Only */}
                    <TableCell>
                      <TextField 
                        size="small" 
                        disabled={!isCash}
                        placeholder={isCash ? "Required" : "N/A"}
                        value={formValues[row.id]?.receiptNumber || ''}
                        onChange={(e) => handleInputChange(row.id, 'receiptNumber', e.target.value)}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField 
                        size="small" type="number" sx={{ width: '80px' }}
                        value={formValues[row.id]?.receiptCount || ''}
                        onChange={(e) => handleInputChange(row.id, 'receiptCount', e.target.value)}
                      />
                    </TableCell>

                    <TableCell>
                      <TextField 
                        size="small"
                        value={formValues[row.id]?.plateNumber || ''}
                        onChange={(e) => handleInputChange(row.id, 'plateNumber', e.target.value)}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Button variant="contained" color="success" onClick={() => handleSubmit(row)} endIcon={<SendIcon />}>
                        Submit
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
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ExitPermit;