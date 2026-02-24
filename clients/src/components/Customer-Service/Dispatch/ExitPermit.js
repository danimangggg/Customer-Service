import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { recordServiceTimeAuto, formatTimestamp } from '../../../utils/serviceTimeHelper';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, 
  TextField, Snackbar, Alert, MenuItem, Select, FormControl, 
  InputLabel, InputAdornment, Chip, Autocomplete, Tabs, Tab,
  Pagination, Stack
} from '@mui/material';
import { 
  LocalShipping, Receipt, ConfirmationNumber, 
  Scale, Send, Inventory, Storefront, Person, History,
  CheckCircle
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const ExitPermit = () => {
  const [records, setRecords] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [gateKeepers, setGateKeepers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

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

  // Get current store keys for display
  const currentStoreKeys = getStoreKeys();
  const { storeId, statusKey, odnKey } = currentStoreKeys;
  
  const fetchData = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    try {
      const storeKeys = getStoreKeys();
      
      console.log('=== EXIT PERMIT DEBUG ===');
      console.log('Store ID:', storeKeys.storeId);
      
      // Fetch from TV display endpoint which has ODN-based data
      const [serviceRes, facilityRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/tv-display-customers`),
        axios.get(`${API_URL}/api/facilities`),
        axios.get(`${API_URL}/api/users`)
      ]);
      
      console.log('Service Response:', serviceRes.data);
      
      // Filter records that are ready for exit permit (dispatch completed for this store)
      const activeRows = serviceRes.data.filter(row => {
        const storeDetails = row.store_details || {};
        const storeInfo = storeDetails[storeKeys.storeId];
        
        if (!storeInfo) return false;
        
        const dispatchStatus = (storeInfo.dispatch_status || '').toLowerCase();
        const exitPermitStatus = (storeInfo.exit_permit_status || '').toLowerCase();
        const globalStatus = (row.status || '').toLowerCase();
        
        // Show records where:
        // 1. Dispatch is completed for this store
        // 2. Exit permit is NOT yet completed for this store
        // 3. Global status is not completed (final gate keeper approval)
        return dispatchStatus === 'completed' && 
               exitPermitStatus !== 'completed' && 
               globalStatus !== 'completed';
      });
      
      console.log('Total records:', serviceRes.data.length);
      console.log('Filtered records for exit permit:', activeRows.length);
      
      // Get gate keeper users for this store only
      const userData = Array.isArray(usersRes.data) ? usersRes.data : [];
      
      console.log('All users fetched:', userData.length);
      console.log('Looking for Gate Keepers with store:', storeKeys.storeId);
      
      // Debug: Show all Gate Keepers regardless of store
      const allGateKeepers = userData.filter(user => user.JobTitle === 'Gate Keeper');
      console.log('Total Gate Keepers in system:', allGateKeepers.length);
      allGateKeepers.forEach(gk => {
        console.log(`  - ${gk.FullName}: store="${gk.store}" (match: ${gk.store === storeKeys.storeId})`);
      });
      
      const gateKeeperUsers = userData.filter(user => {
        const isGateKeeper = user.JobTitle === 'Gate Keeper';
        const storeMatch = user.store && user.store.toUpperCase().trim() === storeKeys.storeId.toUpperCase().trim();
        return isGateKeeper && storeMatch;
      }).map(user => ({
        id: user.id,
        name: user.FullName,
        label: user.FullName,
        store: user.store
      }));
      
      console.log('Available Gate Keepers for store', storeKeys.storeId, ':', gateKeeperUsers.length);
      if (gateKeeperUsers.length === 0) {
        console.warn('⚠️ No Gate Keepers found for store', storeKeys.storeId);
        console.warn('Please assign Gate Keepers to this store in user management');
      }
      
      // Handle facilities data
      const facilityData = Array.isArray(facilityRes.data) ? facilityRes.data : [];
      
      setRecords(activeRows);
      setFacilities(facilityData);
      setGateKeepers(gateKeeperUsers);
      
      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError('Failed to load data. Please try again.');
      setRecords([]);
      setFacilities([]);
      setGateKeepers([]);
    } finally {
      setLoading(false);
    }
  }, [getStoreKeys]);

  // Fetch history data with pagination
  const fetchHistoryData = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const storeKeys = getStoreKeys();
      
      // Fetch completed/archived records with pagination
      const response = await axios.get(`${API_URL}/api/customers-detail-report`, {
        params: {
          page,
          limit: 10,
          statusFilter: 'completed,archived',
          sortBy: 'created_at',
          sortOrder: 'desc'
        }
      });
      
      let historyData = [];
      if (response.data && response.data.customers && Array.isArray(response.data.customers)) {
        historyData = response.data.customers;
      } else if (Array.isArray(response.data)) {
        historyData = response.data;
      }
      
      // Filter for completed dispatch processes
      const completedRecords = historyData.filter(row => {
        const isCustomerDetailFormat = row.ewm_status !== undefined;
        
        if (isCustomerDetailFormat) {
          return row.dispatch_status === 'completed' || row.status === 'completed' || row.status === 'archived';
        } else {
          const statusValue = (row[storeKeys.statusKey] || "").toLowerCase().trim();
          return statusValue === 'dispatch_completed' || row.status === 'archived' || row.dispatch_completed_at;
        }
      });
      
      setHistoryRecords(completedRecords);
      setHistoryTotalPages(response.data.totalPages || 1);
      setHistoryTotal(response.data.total || completedRecords.length);
      
    } catch (error) {
      console.error("History fetch error:", error);
      setHistoryRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [getStoreKeys]);

  // 3. Auto-Refresh Effect (every 10 seconds) - only for current tab
  useEffect(() => {
    if (currentTab === 0) {
      fetchData();
      const interval = setInterval(() => fetchData(true), 10000);
      return () => clearInterval(interval);
    }
  }, [fetchData, currentTab]);

  // Fetch history when history tab is selected
  useEffect(() => {
    if (currentTab === 1) {
      fetchHistoryData(historyPage);
    }
  }, [currentTab, historyPage, fetchHistoryData]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleHistoryPageChange = (event, value) => {
    setHistoryPage(value);
  };

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
    if (!data.selectedGateKeeper) {
      setSnackbar({ open: true, message: "Please select a Security officer to send the exit permit request.", severity: "warning" });
      return;
    }

    try {
      const exitPermitData = {
        receipt_count: data.receiptCount,
        vehicle_plate: data.plateNumber,
        receipt_number: data.receiptNumber || null,
        total_amount: data.amount,
        measurement_unit: data.measurement
      };
      
      console.log('=== EXIT PERMIT SUBMISSION ===');
      console.log('Record ID:', record.id);
      console.log('Exit Permit Data:', exitPermitData);
      console.log('Selected Gate Keeper:', data.selectedGateKeeper);
      
      const storeKeys = getStoreKeys();
      
      // Update ODN exit permit status FIRST
      try {
        await axios.put(`${API_URL}/api/odns-rdf/update-exit-permit-status`, {
          process_id: record.id,
          store: storeKeys.storeId,
          exit_permit_status: 'completed',
          officer_id: localStorage.getItem('EmployeeID'),
          officer_name: localStorage.getItem('FullName')
        });
        console.log('✅ ODN exit permit status updated');
      } catch (err) {
        console.error('❌ Failed to update ODN exit permit status:', err);
      }
      
      // Record service time IMMEDIATELY (before checking other stores or updating customer_queue)
      try {
        const dispatchDocEndTime = formatTimestamp();
        
        await axios.post(`${API_URL}/api/service-time`, {
          process_id: record.id,
          service_unit: `Dispatch-Documentation - ${storeKeys.storeId}`,
          end_time: dispatchDocEndTime,
          officer_id: localStorage.getItem('EmployeeID'),
          officer_name: localStorage.getItem('FullName'),
          status: 'completed',
          notes: `Exit permit finalized - Receipt: ${data.receiptNumber || 'N/A'}, Plate: ${data.plateNumber}`
        });
        
        console.log(`✅ Dispatch-Documentation service time recorded`);
      } catch (err) {
        console.error('❌ Failed to record Dispatch-Documentation service time:', err);
        console.error('Error details:', err.response?.data || err.message);
      }
      
      // Check if all stores have completed exit permit
      let allExitPermitCompleted = false;
      try {
        const odnResponse = await axios.get(`${API_URL}/api/rdf-odns/${record.id}`);
        const allOdns = odnResponse.data.odns || [];
        allExitPermitCompleted = allOdns.every(odn => odn.exit_permit_status === 'completed');
        
        if (allExitPermitCompleted) {
          exitPermitData.status = 'archived';
          // DON'T set completed_at here - only Gate Keeper sets it when allowing exit
          console.log('✅ All stores completed exit permit, setting status to archived');
        } else {
          console.log('⏳ Some stores still need to complete exit permit');
        }
      } catch (err) {
        console.error('❌ Failed to check all ODN statuses:', err);
      }
      
      // Update customer_queue with exit permit data and gate keeper assignment
      exitPermitData.assigned_gate_keeper_id = data.selectedGateKeeper.id;
      exitPermitData.assigned_gate_keeper_name = data.selectedGateKeeper.name;
      
      try {
        await axios.put(`${API_URL}/api/update-service-status/${record.id}`, exitPermitData);
        console.log('✅ Customer queue updated with exit permit data');
      } catch (err) {
        console.error('❌ Failed to update customer queue:', err);
        console.error('Error details:', err.response?.data || err.message);
        // Don't throw - service time is already recorded
      }
      
      setSnackbar({ 
        open: true, 
        message: `Exit Permit sent to ${data.selectedGateKeeper.name}!`, 
        severity: "success" 
      });
      
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
          {/* Debug Info */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Status Key: {statusKey} | Gate Keepers: {gateKeepers.length} | Records: {records.length}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            User: {userJobTitle} | Store: {storeId} | Access: {hasAccess ? 'Yes' : 'No'}
          </Typography>
        </Box>
        <Chip 
          label={`${records.filter(r => r.status !== 'archived').length} Pending Dispatches`} 
          color="primary" 
          variant="filled" 
          sx={{ fontWeight: 'bold', px: 2, py: 2.5, borderRadius: '8px' }} 
        />
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          sx={{ 
            '& .MuiTab-root': { 
              fontWeight: 600, 
              textTransform: 'none',
              fontSize: '1rem'
            }
          }}
        >
          <Tab 
            label={`Current (${records.length})`} 
            icon={<Receipt />} 
            iconPosition="start"
          />
          <Tab 
            label={`History (${historyTotal})`} 
            icon={<History />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        <Table>
          <TableHead sx={{ bgcolor: '#ffffff' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#5c6bc0' }}>LOGISTICS INFO</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#5c6bc0' }}>QUANTITY & UNIT</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#5c6bc0' }}>DOCUMENTATION</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#5c6bc0' }}>SECURITY</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#5c6bc0' }}>ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Current Tab */}
            {currentTab === 0 && (
              <>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <Inventory sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary">No items waiting for exit permit.</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Records will appear here when dispatch is completed. Check the browser console for debugging info.
                      </Typography>
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
                              {(() => {
                                const storeDetails = row.store_details || {};
                                const storeInfo = storeDetails[storeId];
                                if (storeInfo && storeInfo.odns && storeInfo.odns.length > 0) {
                                  return storeInfo.odns.join(', ');
                                }
                                return '—';
                              })()}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Storefront sx={{ fontSize: 16, color: '#7986cb' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {row.actual_facility_name || 
                               row.facility_name || 
                               facilities.find(f => f.id === row.facility_id)?.facility_name || 
                               row.facility_id}
                            </Typography>
                          </Box>
                          {isFinalized && (
                            <Chip 
                              label="Sent to Security" 
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

                        {/* Security Selection */}
                        <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
                          {isFinalized ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                <Person sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                {row.assigned_gate_keeper_name || 'Security'}
                              </Typography>
                              <Chip 
                                label="Assigned" 
                                color="info" 
                                size="small" 
                                sx={{ fontWeight: 'bold', alignSelf: 'flex-start' }}
                              />
                            </Box>
                          ) : (
                            <Autocomplete
                              size="small"
                              options={gateKeepers}
                              getOptionLabel={(option) => option.label}
                              value={val.selectedGateKeeper || null}
                              onChange={(event, newValue) => {
                                handleInputChange(row.id, 'selectedGateKeeper', newValue);
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Select Security Officer"
                                  variant="filled"
                                  required
                                  InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <Person fontSize="small" />
                                      </InputAdornment>
                                    )
                                  }}
                                />
                              )}
                              sx={{ minWidth: 200 }}
                            />
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
              </>
            )}

            {/* History Tab */}
            {currentTab === 1 && (
              <>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <CircularProgress thickness={5} size={40} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading history...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : historyRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <History sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary">No completed exit permits found.</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Completed exit permits will appear here.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  historyRecords.map((row) => {
                    const isCash = row.customer_type?.toLowerCase() === 'cash';
                    
                    return (
                      <TableRow 
                        key={`history-${row.id}`} 
                        sx={{ 
                          '&:hover': { bgcolor: '#f8f9fa' },
                          opacity: 0.8,
                          bgcolor: '#fafafa'
                        }}
                      >
                        {/* ODN & Store Info */}
                        <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#9e9e9e' }}>ODN REFERENCE</Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word', mt: 0.5, fontWeight: 'normal' }}>
                              {(() => {
                                // History records might come from customer detail report with different structure
                                const storeDetails = row.store_details || {};
                                const storeInfo = storeDetails[storeId];
                                if (storeInfo && storeInfo.odns && storeInfo.odns.length > 0) {
                                  return storeInfo.odns.join(', ');
                                }
                                // Fallback to old column names for history records
                                return row[odnKey] || row.aa1_odn || row.aa2_odn || row.aa3_odn || row.odn_numbers || '—';
                              })()}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Storefront sx={{ fontSize: 16, color: '#7986cb' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {row.actual_facility_name || 
                               row.facility_name || 
                               facilities.find(f => f.id === row.facility_id)?.facility_name || 
                               row.facility_id}
                            </Typography>
                          </Box>
                          <Chip 
                            label="Completed" 
                            color="success" 
                            size="small" 
                            sx={{ mt: 1, fontWeight: 'bold' }}
                          />
                        </TableCell>

                        {/* Quantity & Units */}
                        <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              <Scale sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {row.total_amount || '—'} {row.measurement_unit || ''}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Completed
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Plate & Receipts */}
                        <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              <LocalShipping sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {row.vehicle_plate || '—'}
                            </Typography>
                            <Typography variant="body2">
                              <Receipt sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {row.receipt_count || '—'} Receipts
                            </Typography>
                            {isCash && row.receipt_number && (
                              <Typography variant="body2" sx={{ color: '#f57c00' }}>
                                <ConfirmationNumber sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                {row.receipt_number}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* Security */}
                        <TableCell sx={{ verticalAlign: 'top', py: 3 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              <Person sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                              {row.assigned_gate_keeper_name || 'Gate Keeper'}
                            </Typography>
                            <Chip 
                              label="Processed" 
                              color="success" 
                              size="small" 
                              sx={{ fontWeight: 'bold', alignSelf: 'flex-start' }}
                            />
                          </Box>
                        </TableCell>

                        {/* Status */}
                        <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
                          <Chip 
                            label="Completed" 
                            color="success" 
                            variant="filled"
                            sx={{ fontWeight: 'bold' }}
                            icon={<CheckCircle />}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination for History Tab */}
      {currentTab === 1 && historyTotalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Stack spacing={2}>
            <Pagination 
              count={historyTotalPages} 
              page={historyPage} 
              onChange={handleHistoryPageChange}
              color="primary"
              size="large"
              showFirstButton 
              showLastButton
            />
            <Typography variant="body2" color="text.secondary" align="center">
              Showing page {historyPage} of {historyTotalPages} ({historyTotal} total records)
            </Typography>
          </Stack>
        </Box>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert variant="filled" severity={snackbar.severity} sx={{ borderRadius: '8px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExitPermit;