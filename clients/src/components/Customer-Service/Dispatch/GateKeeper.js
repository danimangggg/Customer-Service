import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import api from '../../../axiosInstance';
import { recordServiceTimeAuto, formatTimestamp } from '../../../utils/serviceTimeHelper';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, 
  Snackbar, Alert, Chip, Card, CardContent, Stack, Divider,
  Badge, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Autocomplete, TextField
} from '@mui/material';
import { 
  Security, CheckCircle, LocalShipping, Receipt, 
  Scale, Inventory, Storefront, ExitToApp, Block,
  NotificationsActive, VolumeUp, VolumeOff, Logout
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const GateKeeper = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [previousCount, setPreviousCount] = useState(0);
  const [newRecordsCount, setNewRecordsCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false); // Track if audio is enabled
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [storeSelectionDialog, setStoreSelectionDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedStores, setSelectedStores] = useState([]);
  const [availableStores, setAvailableStores] = useState([]);
  const [assignedStores, setAssignedStores] = useState([]); // Use state instead of useMemo
  const [hasCheckedStore, setHasCheckedStore] = useState(false);
  const audioRef = useRef(null);
  const notificationIntervalRef = useRef(null);
  const isFetchingRef = useRef(false);
  const hasCheckedStoreRef = useRef(false);

  // Access control - only for Gate Keeper users
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const hasAccess = userJobTitle === 'Gate Keeper';

  // Initialize audio
  // Initialize audio - Simple approach like AllPicklists
  useEffect(() => {
    audioRef.current = new Audio('/audio/notification/notification.mp3');
    audioRef.current.load();

    // Unlock audio on first user interaction
    const unlockAudio = () => {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setAudioEnabled(true);
          console.log('✅ Audio unlocked');
          window.removeEventListener('click', unlockAudio);
          window.removeEventListener('touchstart', unlockAudio);
        })
        .catch(() => {});
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Check for store selection on mount
  useEffect(() => {
    const checkStoreSelection = async () => {
      if (!hasAccess || hasCheckedStoreRef.current) return;
      
      hasCheckedStoreRef.current = true;
      console.log('=== GATE KEEPER STORE SELECTION CHECK ===');
      
      const userId = localStorage.getItem('UserId') || localStorage.getItem('EmployeeID');
      console.log('User ID:', userId);
      console.log('Has Access:', hasAccess);
      
      try {
        // First check localStorage for existing selection (in case of page refresh)
        const storedStores = localStorage.getItem('GateKeeperStores');
        if (storedStores && storedStores !== '[]') {
          try {
            const stores = JSON.parse(storedStores);
            if (stores.length > 0) {
              console.log('Found stores in localStorage (page refresh):', stores);
              setAssignedStores(stores);
              setLoading(false);
              return; // Don't show dialog, user already selected stores
            }
          } catch (e) {
            console.error('Error parsing stored stores:', e);
          }
        }
        
        // No localStorage data, check database for active sessions
        console.log('Checking for active sessions in database...');
        const sessionsResponse = await axios.get(`${API_URL}/api/gate-keeper-sessions/${userId}`);
        console.log('Sessions response:', sessionsResponse.data);
        
        if (sessionsResponse.data.success && sessionsResponse.data.sessions.length > 0) {
          // User has active sessions from previous login, load them
          const stores = sessionsResponse.data.sessions.map(s => s.store);
          console.log('Found active sessions for stores:', stores);
          localStorage.setItem('GateKeeperStores', JSON.stringify(stores));
          localStorage.setItem('GateKeeperStore', stores[0]);
          setAssignedStores(stores);
          setLoading(false);
        } else {
          // No active sessions, show store selection dialog (fresh login)
          console.log('No active sessions, fetching available stores...');
          
          // Fetch available stores
          const storesResponse = await api.get(`${API_URL}/api/stores`);
          console.log('Stores API response:', storesResponse.data);
          
          const storeNames = storesResponse.data.map(store => store.store_name);
          console.log('Available stores:', storeNames);
          
          setAvailableStores(storeNames);
          console.log('Opening store selection dialog');
          setStoreSelectionDialog(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking store selection:', error);
        setLoading(false);
      }
    };
    
    checkStoreSelection();
  }, [hasAccess]);

  // Play notification sound - Simple approach
  const playNotificationSound = () => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch(() => console.warn('Audio blocked, user interaction needed.'));
    }
  };

  // Show notification for new records
  const showNewRecordNotification = (count) => {
    setNewRecordsCount(count);
    setNotificationDialog(true);
    
    // Play sound immediately
    playNotificationSound();
    
    // Clear any existing interval
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
    }
    
    // Play sound repeatedly every 3 seconds until dialog is closed
    notificationIntervalRef.current = setInterval(() => {
      playNotificationSound();
    }, 3000);
  };

  // Stop notification sound when dialog is closed
  const closeNotificationDialog = () => {
    setNotificationDialog(false);
    setNewRecordsCount(0);
    
    // Stop the repeating sound
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
    }
  };

  // Fetch Data Logic - show records for assigned stores
  const fetchData = useCallback(async (isAutoRefresh = false) => {
    console.log('=== FETCH DATA CALLED ===');
    console.log('isAutoRefresh:', isAutoRefresh);
    console.log('assignedStores:', assignedStores);
    
    if (!assignedStores || assignedStores.length === 0) {
      console.log('No stores assigned, skipping fetch');
      setLoading(false);
      return; // Don't fetch if no stores assigned
    }
    
    if (!isAutoRefresh) setLoading(true);
    try {
      console.log('=== GATE KEEPER DEBUG ===');
      console.log('Gate Keeper Name:', localStorage.getItem('FullName'));
      console.log('Assigned Stores:', assignedStores);
      
      const [facilityRes] = await Promise.all([
        axios.get(`${API_URL}/api/facilities`)
      ]);
      
      // Fetch pending exit history records for all assigned stores
      const pendingByStore = await Promise.all(
        assignedStores.map(storeName =>
          axios.get(`${API_URL}/api/exit-history-pending/${storeName}`)
            .then(r => r.data.data || [])
            .catch(() => [])
        )
      );
      const allPending = pendingByStore.flat();

      // Enrich with facility data (facility_name already comes from SQL JOIN)
      const processedRecords = allPending.map(row => ({
        ...row,
        actual_facility_name: row.facility_name || '—'
      }));

      // Check for new records and trigger notification
      if (isAutoRefresh && processedRecords.length > previousCount) {
        const newCount = processedRecords.length - previousCount;
        showNewRecordNotification(newCount);
      }
      
      setPreviousCount(processedRecords.length);

      console.log(`Filtered records for gate keeper (${assignedStores.join(', ')}):`, processedRecords.length);
      
      setRecords(processedRecords);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [previousCount, soundEnabled, assignedStores]);

  // Auto-Refresh Effect (every 15 seconds)
  useEffect(() => {
    // Don't start auto-refresh if store selection dialog is open or no stores assigned
    if (storeSelectionDialog || !assignedStores || assignedStores.length === 0) return;
    
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => {
      clearInterval(interval);
      // Clean up notification sound interval on unmount
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, [fetchData, storeSelectionDialog, assignedStores.length]);

  const handleVehicleAction = async (record, action) => {
    const actionText = action === 'allow' ? 'Allow Exit' : 'Cancel Exit';
    const actionColor = action === 'allow' ? '#4caf50' : '#f44336';
    const actionIcon = action === 'allow' ? '✅' : '❌';
    const isPartial = record.exit_type === 'partial';

    const result = await Swal.fire({
      title: `${actionIcon} ${actionText}`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Vehicle:</strong> ${record.vehicle_plate}</p>
          <p><strong>Facility:</strong> ${record.facility_name || '—'}</p>
          <p><strong>Amount:</strong> ${record.total_amount} ${record.measurement_unit}</p>
          <p><strong>Receipts:</strong> ${record.receipt_count || '—'}</p>
          ${record.receipt_number ? `<p><strong>Receipt #:</strong> ${record.receipt_number}</p>` : ''}
          <p><strong>Store:</strong> ${record.store_id}</p>
          <p><strong>Type:</strong> ${isPartial ? 'Partial Exit' : 'Full Exit'}</p>
        </div>
      `,
      icon: action === 'allow' ? 'success' : 'warning',
      showCancelButton: true,
      confirmButtonColor: actionColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const gateKeeperId = localStorage.getItem('UserId') || localStorage.getItem('EmployeeID');
      const gateKeeperName = localStorage.getItem('FullName');
      const newGateStatus = action === 'allow' ? 'allowed' : 'denied';

      // 1. Update this exit_history row's gate_status
      await axios.put(`${API_URL}/api/exit-history/${record.id}/gate-status`, {
        gate_status: newGateStatus,
        gate_keeper_id: gateKeeperId,
        gate_keeper_name: gateKeeperName
      });
      console.log(`✅ exit_history row ${record.id} updated to ${newGateStatus}`);

      // 2. Update ODN gate status for this store
      try {
        await axios.put(`${API_URL}/api/odns-rdf/update-gate-status`, {
          process_id: record.process_id,
          store: record.store_id,
          gate_status: newGateStatus,
          officer_id: gateKeeperId,
          officer_name: gateKeeperName
        });
      } catch (err) {
        console.error('❌ Failed to update ODN gate status:', err);
      }

      // 3. If partial and allowed: reset ODN statuses to pending for next round
      if (action === 'allow' && isPartial) {
        try {
          await axios.put(`${API_URL}/api/odns-rdf/update-exit-permit-status`, {
            process_id: record.process_id,
            store: record.store_id,
            exit_permit_status: 'pending',
            officer_id: gateKeeperId,
            officer_name: gateKeeperName
          });
          await axios.put(`${API_URL}/api/odns-rdf/update-gate-status`, {
            process_id: record.process_id,
            store: record.store_id,
            gate_status: 'pending',
            officer_id: gateKeeperId,
            officer_name: gateKeeperName
          });
          console.log(`✅ Partial exit: reset ${record.store_id} statuses to pending for next visit`);
        } catch (err) {
          console.error('❌ Failed to reset partial exit statuses:', err);
        }
      }

      // 3b. If full exit and allowed: mark exit_permit_status = completed on ODN
      if (action === 'allow' && !isPartial) {
        try {
          await axios.put(`${API_URL}/api/odns-rdf/update-exit-permit-status`, {
            process_id: record.process_id,
            store: record.store_id,
            exit_permit_status: 'completed',
            officer_id: gateKeeperId,
            officer_name: gateKeeperName
          });
        } catch (err) {
          console.error('❌ Failed to set exit_permit_status completed:', err);
        }
      }

      // 4. If full exit and allowed: check if ALL full exit_history rows are allowed → mark process completed
      if (action === 'allow' && !isPartial) {
        try {
          const allExitsRes = await axios.get(`${API_URL}/api/exit-history/${record.process_id}`);
          const allExits = allExitsRes.data.exits || [];
          const fullExits = allExits.filter(e => e.exit_type === 'full');
          const allAllowed = fullExits.length > 0 && fullExits.every(e =>
            e.id === record.id ? true : e.gate_status === 'allowed'
          );
          if (allAllowed) {
            await axios.put(`${API_URL}/api/update-service-status/${record.process_id}`, {
              status: 'completed',
              completed_at: new Date().toISOString()
            });
            console.log('✅ All full exits allowed — process marked completed');
          }
        } catch (err) {
          console.error('❌ Failed to check completion:', err);
        }
      }

      // 5. Record service time
      try {
        await axios.post(`${API_URL}/api/service-time`, {
          process_id: record.process_id,
          service_unit: `Gate Keeper - ${record.store_id}`,
          end_time: formatTimestamp(),
          officer_id: gateKeeperId,
          officer_name: gateKeeperName,
          status: 'completed',
          notes: `Gate ${newGateStatus} exit for vehicle ${record.vehicle_plate}`
        });
      } catch (err) {
        console.error('❌ Failed to record service time:', err);
      }

      setSnackbar({
        open: true,
        message: `Vehicle ${record.vehicle_plate} ${action === 'allow' ? 'allowed to exit' : 'denied exit'} for ${record.store_id}!`,
        severity: action === 'allow' ? 'success' : 'warning'
      });

      fetchData(true);
    } catch (error) {
      console.error('Gate action error:', error);
      setSnackbar({ open: true, message: 'Action failed. Please try again.', severity: 'error' });
    }
  };

  const handleStoreSelection = async () => {
    if (selectedStores.length === 0) return;
    
    try {
      const userId = localStorage.getItem('UserId') || localStorage.getItem('EmployeeID');
      
      console.log('=== SAVING STORE SELECTION ===');
      console.log('User ID:', userId);
      console.log('Selected Stores:', selectedStores);
      
      // Create sessions in database
      await axios.post(`${API_URL}/api/gate-keeper-sessions`, {
        user_id: userId,
        stores: selectedStores
      });
      
      console.log('✅ Sessions created in database');
      
      // Save to localStorage
      localStorage.setItem('GateKeeperStores', JSON.stringify(selectedStores));
      localStorage.setItem('GateKeeperStore', selectedStores[0]);
      
      console.log('✅ Stores saved to localStorage');
      
      // Update state to trigger re-render and fetchData
      setAssignedStores(selectedStores);
      
      // Close dialog - this will trigger fetchData via the useEffect
      setStoreSelectionDialog(false);
      
      console.log('✅ Dialog closed, fetchData should start now');
      
    } catch (error) {
      console.error('❌ Error saving store selection:', error);
      alert('Failed to save store selection. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      const userId = localStorage.getItem('UserId') || localStorage.getItem('EmployeeID');
      
      // Deactivate Gate Keeper sessions in database
      await axios.post(`${API_URL}/api/gate-keeper-sessions/logout`, {
        user_id: userId
      });
    } catch (error) {
      console.error('Error deactivating sessions:', error);
    }
    
    localStorage.removeItem('GateKeeperStore');
    localStorage.removeItem('GateKeeperStores');
    localStorage.clear();
    navigate('/sign-in');
  };

  console.log('=== GATE KEEPER COMPONENT STATE ===');
  console.log('Loading:', loading);
  console.log('Records length:', records.length);
  console.log('Has access:', hasAccess);
  console.log('User job title:', userJobTitle);

  if (loading && records.length === 0) {
    console.log('Showing loading spinner...');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress thickness={5} size={60} />
      </Box>
    );
  }

  // Access control check
  if (!hasAccess) {
    console.log('Access denied, showing error...');
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

  console.log('=== RENDERING GATE KEEPER ===');
  console.log('Store dialog open:', storeSelectionDialog);
  console.log('Assigned stores:', assignedStores);
  console.log('Records:', records.length);

  return (
    <Box sx={{ 
      p: { xs: 0.5, sm: 1, md: 1.5 }, 
      backgroundColor: '#f4f6f8', 
      minHeight: '100vh',
      // Ultra-compact for small tablets
      fontSize: { xs: '10px', sm: '12px', md: '14px' }
    }}>
      
      {/* Header - Ultra Compact for Tablets */}
      <Box sx={{ 
        mb: { xs: 1, sm: 1.5, md: 2 }, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 0.75, sm: 1 }
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            color: '#1a237e',
            fontSize: { xs: '1.1rem', sm: '1.4rem', md: '1.8rem' },
            lineHeight: 1.2
          }}>
            Gate Security Control - {(assignedStores && assignedStores.length > 0) ? assignedStores.join(', ') : 'No Store Selected'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{
            fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' }
          }}>
            Vehicle Exit Authorization System
          </Typography>
        </Box>
        
        {/* Notification Controls and Status - Ultra Compact */}
        <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }} alignItems="center">
          <IconButton 
            onClick={() => {
              setSoundEnabled(!soundEnabled);
            }}
            color={soundEnabled ? "primary" : "default"}
            sx={{ 
              bgcolor: soundEnabled ? 'rgba(25, 118, 210, 0.1)' : 'rgba(0,0,0,0.05)',
              '&:hover': { bgcolor: soundEnabled ? 'rgba(25, 118, 210, 0.2)' : 'rgba(0,0,0,0.1)' },
              width: { xs: 28, sm: 36, md: 42 },
              height: { xs: 28, sm: 36, md: 42 }
            }}
          >
            {soundEnabled ? (
              <VolumeUp sx={{ 
                fontSize: { xs: 14, sm: 18, md: 20 },
                color: audioEnabled ? 'inherit' : '#ff9800' // Orange if audio not enabled yet
              }} />
            ) : (
              <VolumeOff sx={{ fontSize: { xs: 14, sm: 18, md: 20 } }} />
            )}
          </IconButton>
          
          <Badge 
            badgeContent={newRecordsCount > 0 ? newRecordsCount : null} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.7rem' },
                minWidth: { xs: '14px', sm: '16px', md: '18px' },
                height: { xs: '14px', sm: '16px', md: '18px' }
              }
            }}
          >
            <Chip 
              label={`${records.length} Vehicles Ready`} 
              color="primary" 
              variant="filled" 
              icon={records.length > 0 ? <NotificationsActive sx={{ fontSize: { xs: 12, sm: 14, md: 16 } }} /> : <Security sx={{ fontSize: { xs: 12, sm: 14, md: 16 } }} />}
              sx={{ 
                fontWeight: 'bold', 
                px: { xs: 0.5, sm: 0.75, md: 1 }, 
                py: { xs: 0.75, sm: 1, md: 1.5 }, 
                borderRadius: '6px',
                fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
                animation: newRecordsCount > 0 ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' },
                  '100%': { transform: 'scale(1)' }
                }
              }} 
            />
          </Badge>
        </Stack>
      </Box>

      {/* Summary Cards - Ultra Compact */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.75, sm: 1 }} sx={{ mb: { xs: 1, sm: 1.5 } }}>
        <Card sx={{ 
          flex: 1, 
          borderRadius: { xs: 1, sm: 1.5, md: 2 }, 
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          minHeight: { xs: '50px', sm: '60px', md: '80px' }
        }}>
          <CardContent sx={{ p: { xs: 0.75, sm: 1, md: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={{ xs: 0.75, sm: 1 }}>
              <Security sx={{ 
                fontSize: { xs: 18, sm: 22, md: 28 }, 
                color: '#2196f3' 
              }} />
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{
                  fontSize: { xs: '0.75rem', sm: '0.85rem', md: '1rem' },
                  lineHeight: 1.2
                }}>
                  Security Gate
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' }
                }}>
                  Authorized Exit Control
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        
        <Card sx={{ 
          flex: 1, 
          borderRadius: { xs: 1, sm: 1.5, md: 2 }, 
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          minHeight: { xs: '50px', sm: '60px', md: '80px' }
        }}>
          <CardContent sx={{ p: { xs: 0.75, sm: 1, md: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={{ xs: 0.75, sm: 1 }}>
              <LocalShipping sx={{ 
                fontSize: { xs: 18, sm: 22, md: 28 }, 
                color: '#4caf50' 
              }} />
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{
                  fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.2rem' }
                }}>
                  {records.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' }
                }}>
                  Vehicles Awaiting Clearance
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Table Container - Ultra Compact for Tablets */}
      <TableContainer component={Paper} sx={{ 
        borderRadius: { xs: 1, sm: 1.5, md: 2 }, 
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
        // Ultra compact height for small tablets
        maxHeight: { xs: 'calc(100vh - 160px)', sm: 'calc(100vh - 180px)', md: 'calc(100vh - 220px)' },
        overflowX: 'auto'
      }}>
        <Table stickyHeader>
          <TableHead sx={{ bgcolor: '#ffffff' }}>
            <TableRow>
              <TableCell sx={{ 
                fontWeight: 700, 
                color: '#5c6bc0',
                fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                minWidth: { xs: '120px', sm: '140px', md: '170px' },
                py: { xs: 0.75, sm: 1 }
              }}>
                VEHICLE & FACILITY
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 700, 
                color: '#5c6bc0',
                fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                minWidth: { xs: '110px', sm: '130px', md: '150px' },
                py: { xs: 0.75, sm: 1 }
              }}>
                SHIPMENT DETAILS
              </TableCell>
              <TableCell align="center" sx={{ 
                fontWeight: 700, 
                color: '#5c6bc0',
                fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                minWidth: { xs: '100px', sm: '120px', md: '140px' },
                py: { xs: 0.75, sm: 1 }
              }}>
                GATE ACTION
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
                  <Security sx={{ fontSize: { xs: 24, sm: 28, md: 32 }, color: '#e0e0e0', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary" sx={{
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
                  }}>
                    No vehicles assigned to you.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                  }}>
                    Vehicles will appear here when Dispatch-Documentation assigns them to you.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              records.map((row) => {
                const isCash = row.customer_type?.toLowerCase() === 'cash';
                
                return (
                  <TableRow key={row.id} sx={{ 
                    '&:hover': { bgcolor: '#fcfdff' },
                    height: { xs: 'auto', sm: 'auto' }
                  }}>
                    {/* Vehicle & Facility Info - Ultra Compact */}
                    <TableCell sx={{ 
                      verticalAlign: 'top', 
                      py: { xs: 0.75, sm: 1, md: 1.5 },
                      px: { xs: 0.5, sm: 0.75, md: 1 }
                    }}>
                      <Box sx={{ mb: { xs: 0.5, sm: 0.75 } }}>
                        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                          <LocalShipping sx={{ 
                            fontSize: { xs: 12, sm: 14, md: 16 }, 
                            color: '#2196f3' 
                          }} />
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: '#1976d2',
                            fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem' }
                          }}>
                            {row.vehicle_plate}
                          </Typography>
                        </Stack>
                        <Divider sx={{ my: 0.5 }} />
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Storefront sx={{ 
                            fontSize: { xs: 8, sm: 10, md: 12 }, 
                            color: '#7986cb' 
                          }} />
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' }
                          }}>
                            {row.facility_name || row.store_id}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ 
                          mt: 0.5, 
                          display: 'block',
                          fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' }
                        }}>
                          Customer: {row.customer_type || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Shipment Details - Ultra Compact */}
                    <TableCell sx={{ 
                      verticalAlign: 'top', 
                      py: { xs: 0.75, sm: 1, md: 1.5 },
                      px: { xs: 0.5, sm: 0.75, md: 1 }
                    }}>
                      <Stack spacing={{ xs: 0.5, sm: 0.75 }}>
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                            <Scale sx={{ 
                              fontSize: { xs: 10, sm: 12, md: 14 }, 
                              color: '#ff9800' 
                            }} />
                            <Typography variant="h6" sx={{ 
                              fontWeight: 700,
                              fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }
                            }}>
                              {row.total_amount} {row.measurement_unit}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Receipt sx={{ 
                              fontSize: { xs: 8, sm: 10, md: 12 }, 
                              color: '#9c27b0' 
                            }} />
                            <Typography variant="body2" sx={{
                              fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' }
                            }}>
                              <strong>{row.receipt_count}</strong> Receipts
                            </Typography>
                          </Stack>
                        </Box>
                        
                        {isCash && row.receipt_number && (
                          <Box sx={{ 
                            bgcolor: '#fff3e0', 
                            p: { xs: 0.25, sm: 0.5, md: 0.75 }, 
                            borderRadius: 1, 
                            border: '1px solid #ffcc02' 
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600, 
                              color: '#f57c00',
                              fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.7rem' }
                            }}>
                              Cash Receipt: {row.receipt_number}
                            </Typography>
                          </Box>
                        )}
                        
                        <Chip 
                          label="Documentation Complete" 
                          color="success" 
                          size="small" 
                          icon={<CheckCircle sx={{ fontSize: { xs: 8, sm: 10, md: 12 } }} />}
                          sx={{ 
                            fontWeight: 'bold', 
                            alignSelf: 'flex-start',
                            fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                            height: { xs: '18px', sm: '20px', md: '24px' }
                          }}
                        />
                      </Stack>
                    </TableCell>

                    {/* Gate Actions - Ultra Compact */}
                    <TableCell align="center" sx={{ 
                      verticalAlign: 'middle',
                      px: { xs: 0.25, sm: 0.5, md: 0.75 }
                    }}>
                      <Stack direction="column" spacing={{ xs: 2, sm: 2.5, md: 3 }} alignItems="center">
                        <Button 
                          variant="contained" 
                          color="success"
                          onClick={() => handleVehicleAction(row, 'allow')} 
                          sx={{ 
                            borderRadius: '6px', 
                            px: { xs: 0.75, sm: 1, md: 1.5 }, 
                            py: { xs: 0.5, sm: 0.75, md: 1 },
                            fontWeight: 'bold', 
                            textTransform: 'none',
                            minWidth: { xs: '70px', sm: '80px', md: '100px' },
                            fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
                            minHeight: { xs: '28px', sm: '32px', md: '36px' }
                          }}
                          startIcon={<ExitToApp sx={{ fontSize: { xs: '10px', sm: '12px', md: '16px' } }} />}
                        >
                          Allow Exit
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error"
                          onClick={() => handleVehicleAction(row, 'deny')} 
                          sx={{ 
                            borderRadius: '6px', 
                            px: { xs: 0.75, sm: 1, md: 1.5 }, 
                            py: { xs: 0.5, sm: 0.75, md: 1 },
                            fontWeight: 'bold', 
                            textTransform: 'none',
                            minWidth: { xs: '70px', sm: '80px', md: '100px' },
                            fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
                            minHeight: { xs: '28px', sm: '32px', md: '36px' }
                          }}
                          startIcon={<Block sx={{ fontSize: { xs: '10px', sm: '12px', md: '16px' } }} />}
                        >
                          Cancel
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

      {/* Store Selection Dialog */}
      <Dialog
        open={storeSelectionDialog}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: '280px', sm: '400px', md: '500px' },
            p: 2,
            '& .MuiDialogTitle-root + .MuiIconButton-root': {
              display: 'none'
            }
          }
        }}
      >
        <Box sx={{ textAlign: 'center', pb: 1, pt: 2 }}>
          <Storefront sx={{ fontSize: 48, color: '#2196f3', mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            Select Your Gate(s)
          </Typography>
        </Box>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Select one or more store gates you are assigned to. You will see vehicles for all selected stores.
          </Typography>
          <Autocomplete
            multiple
            options={availableStores}
            value={selectedStores}
            onChange={(event, newValue) => setSelectedStores(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Store Gates"
                placeholder="Select stores..."
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  {...getTagProps({ index })}
                  color="primary"
                  sx={{ m: 0.5 }}
                />
              ))
            }
            sx={{ width: '100%' }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {selectedStores.length} store(s) selected
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            <Button
              onClick={handleStoreSelection}
              variant="contained"
              color="primary"
              disabled={selectedStores.length === 0}
              sx={{ px: 4, py: 1 }}
            >
              Confirm Selection
            </Button>
            <Button
              onClick={() => setStoreSelectionDialog(false)}
              variant="outlined"
              color="secondary"
              sx={{ px: 4, py: 1 }}
            >
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* New Records Notification Dialog */}
      <Dialog
        open={notificationDialog}
        onClose={closeNotificationDialog}
        PaperProps={{
          sx: {
            borderRadius: { xs: 1.5, sm: 2, md: 3 },
            minWidth: { xs: '240px', sm: '280px', md: '350px' },
            bgcolor: '#fff3e0',
            border: '2px solid #ff9800'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          color: '#e65100',
          fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
          py: { xs: 1.5, sm: 2 }
        }}>
          <NotificationsActive sx={{ 
            fontSize: { xs: 28, sm: 32, md: 40 }, 
            color: '#ff9800', 
            mb: 1 
          }} />
          <Typography variant="h5" fontWeight="bold" sx={{
            fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' }
          }}>
            New Exit Permit Alert!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 1.5, px: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" sx={{ 
            mb: 1.5,
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
          }}>
            {newRecordsCount} new vehicle{newRecordsCount > 1 ? 's' : ''} assigned to you
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{
            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' }
          }}>
            Please review and process the exit permit{newRecordsCount > 1 ? 's' : ''} below.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: { xs: 1.5, sm: 2 } }}>
          <Button 
            onClick={closeNotificationDialog}
            variant="contained"
            color="warning"
            sx={{ 
              borderRadius: 1.5,
              px: { xs: 2, sm: 2.5, md: 3 },
              py: { xs: 0.75, sm: 1 },
              fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' }
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Actions */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ zIndex: 9999, mt: 8 }}
      >
        <Alert 
          variant="filled" 
          severity={snackbar.severity} 
          sx={{ 
            borderRadius: '8px',
            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
            minWidth: { xs: '250px', sm: '280px', md: '320px' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GateKeeper;