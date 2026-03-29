import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../../../axiosInstance';
import { recordServiceTimeAuto, formatTimestamp } from '../../../utils/serviceTimeHelper';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, 
  TextField, Snackbar, Alert, MenuItem, Select, FormControl, 
  InputLabel, InputAdornment, Chip, Autocomplete, Tabs, Tab,
  Pagination, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { 
  LocalShipping, Receipt, ConfirmationNumber, 
  Scale, Send, Inventory, Storefront, Person, History,
  CheckCircle, Edit, Save, Close
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const ExitPermit = () => {
  const [records, setRecords] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Access control - only for Dispatch-Documentation users
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const hasAccess = userJobTitle === 'Dispatch-Documentation';
  
  const [userStore, setUserStore] = useState(localStorage.getItem('store') || 'AA11');

  const measurementOptions = ["Carton", "Box", "Package", "Bottle", "Others"];
  
  // Check for store updates from server
  useEffect(() => {
    const checkStoreUpdate = async () => {
      try {
        const userId = localStorage.getItem('UserId');
        if (!userId) return;
        
        const response = await axios.get(`${API_URL}/api/users-management/${userId}`);
        const serverStore = response.data.store;
        
        if (serverStore && serverStore !== localStorage.getItem('store')) {
          console.log('🔄 Store updated from server:', serverStore);
          localStorage.setItem('store', serverStore);
          setUserStore(serverStore);
          
          // Reload data with new store
          window.location.reload();
        }
      } catch (err) {
        console.error('Error checking store update:', err);
      }
    };
    
    checkStoreUpdate();
  }, []);

  // 1. Identify Store Keys dynamically
  const getStoreKeys = useCallback(() => {
    const rawStore = userStore || 'AA11';
    const storeId = rawStore.toUpperCase().trim(); 
    const storeNum = storeId.replace('AA', '');    
    return {
      storeId,
      odnKey: `${storeId.toLowerCase()}_odn`,
      statusKey: `store_completed_${storeNum}`
    };
  }, [userStore]);

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
      const [serviceRes, facilityRes] = await Promise.all([
        axios.get(`${API_URL}/api/tv-display-customers`),
        api.get(`${API_URL}/api/facilities`)
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
        // 2. Exit permit is NOT yet completed for this store (pending or partial_done = needs another round)
        // 3. Global status is not completed OR exit permit is partial_done (partial completion)
        return dispatchStatus === 'completed' && 
               exitPermitStatus !== 'completed' && 
               (globalStatus !== 'completed' || exitPermitStatus === 'partial_done' || exitPermitStatus === 'partial');
      });
      
      console.log('Total records:', serviceRes.data.length);
      console.log('Filtered records for exit permit:', activeRows.length);
      
      // Handle facilities data
      const facilityData = Array.isArray(facilityRes.data) ? facilityRes.data : [];
      
      setRecords(activeRows);
      setFacilities(facilityData);
      
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
  }, [getStoreKeys, userStore]);

  // Fetch history data from exit_history table (one row per submission)
  const fetchHistoryData = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const storeKeys = getStoreKeys();
      const response = await axios.get(`${API_URL}/api/exit-history-by-store/${storeKeys.storeId}`);
      const rows = response.data.data || [];
      setHistoryRecords(rows);
      setHistoryTotal(rows.length);
    } catch (error) {
      console.error("History fetch error:", error);
      setHistoryRecords([]);
      setHistoryTotal(0);
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
    if (currentTab === 1) {
      fetchHistoryData(historyPage);
      const interval = setInterval(() => fetchHistoryData(historyPage), 5000);
      return () => clearInterval(interval);
    }
  }, [fetchData, fetchHistoryData, currentTab, historyPage]);

  // Fetch history count on mount for tab label
  useEffect(() => {
    fetchHistoryData(1);
  }, [fetchHistoryData]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleHistoryPageChange = (event, value) => {
    setHistoryPage(value);
  };

  // Handle edit dialog
  const handleEditClick = (record) => {
    setEditingRecord(record);
    
    // Convert assigned_gate_keeper_id to number for proper matching
    const gateKeeperId = record.assigned_gate_keeper_id ? 
      parseInt(record.assigned_gate_keeper_id) : '';
    
    console.log('=== EDIT DIALOG DEBUG ===');
    console.log('Record gate keeper ID:', record.assigned_gate_keeper_id, 'Type:', typeof record.assigned_gate_keeper_id);
    console.log('Converted gate keeper ID:', gateKeeperId, 'Type:', typeof gateKeeperId);
    console.log('Available gate keepers:', gateKeepers.map(gk => ({ id: gk.id, name: gk.name, type: typeof gk.id })));
    console.log('Matching gate keeper:', gateKeepers.find(gk => gk.id == gateKeeperId));
    
    setEditFormData({
      vehicle_plate: record.vehicle_plate || '',
      receipt_count: record.receipt_count || '',
      receipt_number: record.receipt_number || '',
      total_amount: record.total_amount || '',
      measurement_unit: record.measurement_unit || '',
      assigned_gate_keeper_id: gateKeeperId,
      assigned_gate_keeper_name: record.assigned_gate_keeper_name || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRecord(null);
    setEditFormData({});
    setEditSaving(false);
  };

  const handleEditSave = async () => {
    if (!editingRecord) return;

    setEditSaving(true);
    
    try {
      // Find selected gate keeper (use loose equality to handle string/number mismatch)
      const selectedGateKeeper = gateKeepers.find(gk => gk.id == editFormData.assigned_gate_keeper_id);

      // Prepare update data - only include fields that have values
      const updateData = {};
      
      if (editFormData.vehicle_plate) updateData.vehicle_plate = editFormData.vehicle_plate;
      if (editFormData.receipt_count) updateData.receipt_count = editFormData.receipt_count;
      if (editFormData.receipt_number) updateData.receipt_number = editFormData.receipt_number;
      if (editFormData.total_amount) updateData.total_amount = editFormData.total_amount;
      if (editFormData.measurement_unit) updateData.measurement_unit = editFormData.measurement_unit;
      if (editFormData.assigned_gate_keeper_id) {
        updateData.assigned_gate_keeper_id = editFormData.assigned_gate_keeper_id;
        updateData.assigned_gate_keeper_name = selectedGateKeeper ? selectedGateKeeper.name : editFormData.assigned_gate_keeper_name;
      }

      console.log('=== EDIT SAVE DEBUG ===');
      console.log('Record ID:', editingRecord.id);
      console.log('Update data:', updateData);

      // Update exit_history row with edited data
      await axios.put(`${API_URL}/api/exit-history/${editingRecord.id}`, {
        vehicle_plate: updateData.vehicle_plate,
        total_amount: updateData.total_amount,
        measurement_unit: updateData.measurement_unit,
        receipt_count: updateData.receipt_count,
        receipt_number: updateData.receipt_number,
        assigned_gate_keeper_id: updateData.assigned_gate_keeper_id,
        assigned_gate_keeper_name: updateData.assigned_gate_keeper_name
      });

      // Close dialog first
      handleEditClose();
      
      // Show success message
      setSnackbar({ 
        open: true, 
        message: 'Record updated successfully!', 
        severity: 'success' 
      });

      // Refresh history data
      fetchHistoryData(historyPage);
    } catch (error) {
      console.error('=== EDIT SAVE ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to update record', 
        severity: 'error' 
      });
    } finally {
      setEditSaving(false);
    }
  };

  // DataGrid columns for history
  const historyColumns = [
    {
      field: 'exit_number',
      headerName: '#',
      width: 60,
      filterable: true,
    },
    {
      field: 'exit_type',
      headerName: 'Type',
      width: 100,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value === 'partial' ? 'Partial' : 'Full'}
          size="small"
          color={params.value === 'partial' ? 'warning' : 'primary'}
          sx={{ fontWeight: 'bold' }}
        />
      )
    },
    {
      field: 'facility_name',
      headerName: 'Facility',
      width: 200,
      filterable: true,
      valueGetter: (params) => params.row.facility_name || '—'
    },
    {
      field: 'vehicle_plate',
      headerName: 'Vehicle Plate',
      width: 150,
      filterable: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping sx={{ fontSize: 16, color: '#2196f3' }} />
          <Typography variant="body2">{params.value || '—'}</Typography>
        </Box>
      )
    },
    {
      field: 'total_amount',
      headerName: 'Amount',
      width: 120,
      filterable: true,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {params.value || '—'} {params.row.measurement_unit || ''}
        </Typography>
      )
    },
    {
      field: 'receipt_count',
      headerName: 'Receipts',
      width: 100,
      filterable: true,
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt sx={{ fontSize: 16, color: '#9c27b0' }} />
          <Typography variant="body2">{params.value || '—'}</Typography>
        </Box>
      )
    },
    {
      field: 'receipt_number',
      headerName: 'Receipt #',
      width: 130,
      filterable: true,
      renderCell: (params) => {
        const isCash = params.row.customer_type?.toLowerCase() === 'cash';
        return isCash && params.value ? (
          <Chip label={params.value} size="small" color="warning" sx={{ fontWeight: 'bold' }} />
        ) : (
          <Typography variant="body2" color="text.secondary">—</Typography>
        );
      }
    },
    {
      field: 'assigned_gate_keeper_name',
      headerName: 'Security Officer',
      width: 180,
      filterable: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person sx={{ fontSize: 16, color: '#4caf50' }} />
          <Typography variant="body2">{params.value || '—'}</Typography>
        </Box>
      )
    },
    {
      field: 'gate_status',
      headerName: 'Gate Status',
      width: 130,
      filterable: true,
      renderCell: (params) => {
        const gs = params.value || 'pending';
        const colorMap = { allowed: 'success', denied: 'error', pending: 'warning' };
        const labelMap = { allowed: 'Allowed', denied: 'Denied', pending: 'Pending' };
        return (
          <Chip
            label={labelMap[gs] || gs}
            color={colorMap[gs] || 'default'}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        );
      }
    },
    {
      field: 'created_at',
      headerName: 'Submitted At',
      width: 170,
      filterable: true,
      valueGetter: (params) => params.value ? new Date(params.value).toLocaleString() : '—'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Edit Record">
          <IconButton size="small" color="primary" onClick={() => handleEditClick(params.row)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  const handleInputChange = (id, field, value) => {
    setFormValues(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSubmit = async (record, isPartial = false) => {
    const data = formValues[record.id] || {};
    const isCash = record.customer_type?.toLowerCase() === 'cash';

    // Validations
    if (isCash && !data.receiptNumber) {
        setSnackbar({ open: true, message: "Receipt number required for Cash customers.", severity: "error" });
        return;
    }
    if (!data.receiptCount) {
      setSnackbar({ open: true, message: "Receipt count is required.", severity: "warning" });
      return;
    }
    if (!data.plateNumber || !data.amount || !data.measurement) {
      setSnackbar({ open: true, message: "Please fill all required fields.", severity: "warning" });
      return;
    }

    try {
      const exitPermitData = {
        receipt_count: data.receiptCount || null,
        vehicle_plate: data.plateNumber,
        receipt_number: data.receiptNumber || null,
        total_amount: data.amount,
        measurement_unit: data.measurement
      };
      
      console.log('=== EXIT PERMIT SUBMISSION ===');
      console.log('Record ID:', record.id);
      console.log('Is Partial:', isPartial);
      console.log('Exit Permit Data:', exitPermitData);
      console.log('Selected Gate Keeper:', data.selectedGateKeeper);
      
      const storeKeys = getStoreKeys();
      
      // Update ODN exit permit status FIRST
      if (!isPartial) {
        // Full completion - set status to completed
        try {
          await axios.put(`${API_URL}/api/odns-rdf/update-exit-permit-status`, {
            process_id: record.id,
            store: storeKeys.storeId,
            exit_permit_status: 'completed',
            officer_id: localStorage.getItem('EmployeeID'),
            officer_name: localStorage.getItem('FullName')
          });
          console.log('✅ ODN exit permit status updated to completed');
        } catch (err) {
          console.error('❌ Failed to update ODN exit permit status:', err);
        }
      } else {
        // Partial completion - set status to partial (so it shows in Gate Keeper but stays in Exit Permit list)
        try {
          await axios.put(`${API_URL}/api/odns-rdf/update-exit-permit-status`, {
            process_id: record.id,
            store: storeKeys.storeId,
            exit_permit_status: 'partial',
            officer_id: localStorage.getItem('EmployeeID'),
            officer_name: localStorage.getItem('FullName')
          });
          console.log('✅ ODN exit permit status updated to partial');
        } catch (err) {
          console.error('❌ Failed to update ODN exit permit status:', err);
        }
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
          notes: `Exit permit ${isPartial ? 'partially' : 'fully'} finalized - Receipt: ${data.receiptNumber || 'N/A'}, Plate: ${data.plateNumber}`
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
        
        // Only set to archived if it's full completion AND all stores completed
        // AND process is not already 'completed' (from a previous partial exit)
        if (!isPartial && allExitPermitCompleted && record.status !== 'completed') {
          exitPermitData.status = 'archived';
          console.log('✅ All stores completed exit permit, setting status to archived');
        } else {
          console.log(isPartial ? '⏳ Partial completion - keeping in list' : '⏳ Some stores still need to complete exit permit');
        }
      } catch (err) {
        console.error('❌ Failed to check all ODN statuses:', err);
      }
      
      // Create exit_history record at submission time so each submission is preserved
      try {
        const existingExitsRes = await axios.get(`${API_URL}/api/exit-history/${record.id}`);
        const existingExits = existingExitsRes.data.exits || [];
        const exitNumber = existingExits.length + 1;

        await axios.post(`${API_URL}/api/exit-history`, {
          process_id: record.id,
          store_id: storeKeys.storeId,
          exit_number: exitNumber,
          vehicle_plate: data.plateNumber,
          total_amount: data.amount,
          measurement_unit: data.measurement,
          receipt_count: data.receiptCount || null,
          receipt_number: data.receiptNumber || null,
          exit_type: isPartial ? 'partial' : 'full',
          gate_status: 'pending',
          assigned_gate_keeper_id: null,
          assigned_gate_keeper_name: storeKeys.storeId,
          exited_at: new Date().toISOString()
        });
        console.log(`✅ Exit history record created (Exit #${exitNumber})`);
      } catch (err) {
        console.error('❌ Failed to create exit history record:', err);
      }

      // Update customer_queue with latest exit permit data
      exitPermitData.assigned_gate_keeper_id = null;
      exitPermitData.assigned_gate_keeper_name = storeKeys.storeId;
      // Only update next_service_point to gate-keeper if ALL stores have submitted exit permit
      if (!exitPermitData.status && allExitPermitCompleted) {
        exitPermitData.next_service_point = 'gate-keeper';
      }
      
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
        message: isPartial 
          ? `Partial exit permit sent to Gate ${storeKeys.storeId}.`
          : `Exit Permit sent to Gate ${storeKeys.storeId}!`, 
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
            Status Key: {statusKey} | Records: {records.length}
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

      {/* Current Tab - Table View */}
      {currentTab === 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}
          <Table>
            <TableBody>
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

                        {/* Plate, Receipts & Security Selection */}
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
                              <Chip 
                                label="Assigned" 
                                color="info" 
                                size="small" 
                                sx={{ fontWeight: 'bold', alignSelf: 'flex-start' }}
                              />
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
                            <Stack direction="column" spacing={1}>
                              <Button 
                                variant="contained" 
                                onClick={() => handleSubmit(row, false)} 
                                sx={{ 
                                  borderRadius: '10px', px: 3, fontWeight: 'bold', textTransform: 'none',
                                  background: 'linear-gradient(45deg, #2e3b8b 30%, #5c6bc0 90%)'
                                }}
                                endIcon={<Send />}
                              >
                                Full Completion
                              </Button>
                              <Button 
                                variant="outlined" 
                                color="primary"
                                onClick={() => handleSubmit(row, true)} 
                                sx={{ 
                                  borderRadius: '10px', px: 3, fontWeight: 'bold', textTransform: 'none'
                                }}
                                endIcon={<Send />}
                              >
                                Partial Completion
                              </Button>
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Advanced DataGrid for History Tab */}
      {currentTab === 1 && (
        <Box sx={{ mt: 3, height: 600, width: '100%' }}>
          <DataGrid
            rows={historyRecords}
            columns={historyColumns}
            pageSize={25}
            rowsPerPageOptions={[10, 25, 50, 100]}
            checkboxSelection={false}
            disableSelectionOnClick
            loading={historyLoading}
            components={{
              Toolbar: GridToolbar,
            }}
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            sx={{
              bgcolor: 'white',
              borderRadius: 3,
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#f8f9fa',
                color: '#5c6bc0',
                fontWeight: 700,
                fontSize: '0.9rem',
                borderBottom: '2px solid #e0e0e0',
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: '#f5f7ff',
              },
              '& .MuiDataGrid-toolbarContainer': {
                padding: 2,
                gap: 2,
              },
            }}
          />
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: '#1a237e', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit />
            <Typography variant="h6">Edit Exit Permit</Typography>
          </Box>
          <IconButton onClick={handleEditClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Vehicle Plate"
              fullWidth
              value={editFormData.vehicle_plate || ''}
              onChange={(e) => setEditFormData({ ...editFormData, vehicle_plate: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalShipping />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Receipt Count"
              fullWidth
              type="number"
              value={editFormData.receipt_count || ''}
              onChange={(e) => setEditFormData({ ...editFormData, receipt_count: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Receipt />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Receipt Number (Cash)"
              fullWidth
              value={editFormData.receipt_number || ''}
              onChange={(e) => setEditFormData({ ...editFormData, receipt_number: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ConfirmationNumber />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Total Amount"
              fullWidth
              type="number"
              value={editFormData.total_amount || ''}
              onChange={(e) => setEditFormData({ ...editFormData, total_amount: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Scale />
                  </InputAdornment>
                )
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Measurement Unit</InputLabel>
              <Select
                value={editFormData.measurement_unit || ''}
                onChange={(e) => setEditFormData({ ...editFormData, measurement_unit: e.target.value })}
                label="Measurement Unit"
              >
                {measurementOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="info">
              Note: You can edit all fields. Changes will be saved immediately.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleEditClose} 
            variant="outlined" 
            startIcon={<Close />}
            disabled={editSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSave} 
            variant="contained" 
            startIcon={editSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
            disabled={editSaving}
            sx={{ 
              background: 'linear-gradient(45deg, #2e3b8b 30%, #5c6bc0 90%)'
            }}
          >
            {editSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: 9999, mt: 8 }}
      >
        <Alert variant="filled" severity={snackbar.severity} sx={{ borderRadius: '8px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExitPermit;