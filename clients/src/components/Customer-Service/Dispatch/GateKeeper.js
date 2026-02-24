import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { recordServiceTimeAuto, formatTimestamp } from '../../../utils/serviceTimeHelper';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress, 
  Snackbar, Alert, Chip, Card, CardContent, Stack, Divider,
  Badge, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  Security, CheckCircle, LocalShipping, Receipt, 
  Scale, Inventory, Storefront, ExitToApp, Block,
  NotificationsActive, VolumeUp, VolumeOff
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const GateKeeper = () => {
  const [records, setRecords] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [previousCount, setPreviousCount] = useState(0);
  const [newRecordsCount, setNewRecordsCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false); // Track if audio is enabled
  const [notificationDialog, setNotificationDialog] = useState(false);
  const audioRef = useRef(null);

  // Access control - only for Gate Keeper users
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const hasAccess = userJobTitle === 'Gate Keeper';
  
  // Get store assignment (like EWM officers)
  const userStore = localStorage.getItem('store');
  const storeId = userStore ? userStore.toUpperCase().trim() : null;

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/audio/notification/notification.mp3');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.8; // Set volume to 80%
    audioRef.current.load(); // Explicitly load the audio
    console.log('🔊 Audio initialized');
  }, []);

  // Enable audio on first user interaction
  const enableAudio = useCallback(() => {
    if (!audioEnabled && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setAudioEnabled(true);
          console.log('✅ Audio enabled successfully');
          setSnackbar({ open: true, message: '🔊 Sound notifications enabled', severity: 'success' });
        }).catch(err => {
          console.error('❌ Failed to enable audio:', err);
          setSnackbar({ open: true, message: 'Click anywhere to enable sound', severity: 'info' });
        });
      }
    }
  }, [audioEnabled]);

  // Add click listener to enable audio on any user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      enableAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    if (!audioEnabled) {
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);
      console.log('⏳ Waiting for user interaction to enable audio...');
    }

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [audioEnabled, enableAudio]);

  // Play notification sound
  const playNotificationSound = () => {
    console.log('🔔 Playing notification:', { soundEnabled, audioEnabled, hasRef: !!audioRef.current });
    
    if (!soundEnabled) {
      console.log('🔇 Sound disabled');
      return;
    }
    
    if (!audioEnabled) {
      console.log('⚠️ Audio not enabled - need user interaction');
      setSnackbar({ open: true, message: 'Click anywhere to enable sound', severity: 'warning' });
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log('✅ Sound played'))
          .catch(err => {
            console.error('❌ Play failed:', err);
            try {
              const fallback = new Audio('/audio/notification/notification.mp3');
              fallback.volume = 0.8;
              fallback.play().then(() => console.log('✅ Fallback played'));
            } catch (e) {
              console.error('❌ Fallback failed:', e);
            }
          });
      }
    }
  };

  // Show notification for new records
  const showNewRecordNotification = (count) => {
    setNewRecordsCount(count);
    setNotificationDialog(true);
    playNotificationSound();
    
    // Auto-close notification after 10 seconds
    setTimeout(() => {
      setNotificationDialog(false);
      setNewRecordsCount(0);
    }, 10000);
  };

  // Fetch Data Logic - only show records for this gate keeper's store
  const fetchData = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    try {
      console.log('=== GATE KEEPER DEBUG ===');
      console.log('Store ID:', storeId);
      console.log('Gate Keeper Name:', localStorage.getItem('FullName'));
      
      if (!storeId) {
        console.error('No store assigned to this Gate Keeper');
        setSnackbar({ open: true, message: 'No store assigned to your account', severity: 'error' });
        setLoading(false);
        return;
      }
      
      // Fetch from TV display endpoint which has ODN-based data
      const [serviceRes, facilityRes] = await Promise.all([
        axios.get(`${API_URL}/api/tv-display-customers`),
        axios.get(`${API_URL}/api/facilities`)
      ]);
      
      console.log('Service Response:', serviceRes.data);
      
      // Filter records that are ready for gate keeper (exit permit completed for this store)
      const processedRecords = serviceRes.data.filter(row => {
        const storeDetails = row.store_details || {};
        const storeInfo = storeDetails[storeId];
        
        if (!storeInfo) return false;
        
        const exitPermitStatus = (storeInfo.exit_permit_status || '').toLowerCase();
        const gateStatus = (storeInfo.gate_status || '').toLowerCase();
        const globalStatus = (row.status || '').toLowerCase();
        
        console.log(`Customer ${row.id} check:`, {
          store: storeId,
          exitPermitStatus,
          gateStatus,
          globalStatus,
          willShow: exitPermitStatus === 'completed' && (gateStatus === 'pending' || gateStatus === '') && globalStatus !== 'completed'
        });
        
        // Show records where:
        // 1. Exit permit is completed for this store
        // 2. Gate status is pending or empty (not processed yet)
        // 3. Global status is not completed (final completion)
        return exitPermitStatus === 'completed' && 
               (gateStatus === 'pending' || gateStatus === '' || !gateStatus) && 
               globalStatus !== 'completed';
      });

      // Check for new records and trigger notification
      if (isAutoRefresh && processedRecords.length > previousCount) {
        const newCount = processedRecords.length - previousCount;
        showNewRecordNotification(newCount);
      }
      
      setPreviousCount(processedRecords.length);

      console.log('Total records:', serviceRes.data.length);
      console.log('Filtered records for gate keeper:', processedRecords.length);
      
      setRecords(processedRecords);
      setFacilities(facilityRes.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [previousCount, soundEnabled, storeId]);

  // Auto-Refresh Effect (every 15 seconds)
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleVehicleAction = async (record, action) => {
    // Enable audio on user interaction
    enableAudio();
    
    const actionText = action === 'allow' ? 'Allow Exit' : 'Cancel Exit';
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
        // Update ODN gate status for this store
        await axios.put(`${API_URL}/api/odns-rdf/update-gate-status`, {
          process_id: record.id,
          store: storeId,
          gate_status: action === 'allow' ? 'allowed' : 'denied',
          officer_id: localStorage.getItem('EmployeeID'),
          officer_name: localStorage.getItem('FullName')
        });

        // Check if all stores have allowed gate exit
        try {
          const odnResponse = await axios.get(`${API_URL}/api/rdf-odns/${record.id}`);
          const allOdns = odnResponse.data.odns || [];
          const allGateAllowed = allOdns.every(odn => odn.gate_status === 'allowed');
          
          if (allGateAllowed) {
            // All stores allowed exit, mark customer as completed
            await axios.put(`${API_URL}/api/update-service-status/${record.id}`, {
              status: 'completed',
              completed_at: new Date().toISOString()
            });
            console.log('✅ All stores allowed exit, customer marked as completed');
          }
        } catch (err) {
          console.error('❌ Failed to check all gate statuses:', err);
        }

        // Record service time for Gate Keeper
        try {
          const gateProcessedTime = formatTimestamp();
          
          // Record service time directly
          await axios.post(`${API_URL}/api/service-time`, {
            process_id: record.id,
            service_unit: `Gate Keeper - ${storeId}`,
            end_time: gateProcessedTime,
            officer_id: localStorage.getItem('EmployeeID'),
            officer_name: localStorage.getItem('FullName'),
            status: 'completed',
            notes: `Gate ${action === 'allow' ? 'allowed' : 'denied'} exit for vehicle ${record.vehicle_plate}`
          });
          
          console.log(`✅ Gate Keeper service time recorded`);
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
        console.error('Gate action error:', error);
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
            Gate Security Control
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
              enableAudio(); // Enable audio on sound button click
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
                const facility = facilities.find(f => f.id === row.facility_id);
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
                            {facility?.facility_name || row.facility_id}
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
                      <Stack direction="column" spacing={{ xs: 0.5, sm: 0.75 }} alignItems="center">
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

      {/* New Records Notification Dialog */}
      <Dialog
        open={notificationDialog}
        onClose={() => setNotificationDialog(false)}
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
            onClick={() => setNotificationDialog(false)}
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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