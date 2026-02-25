import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    Box, Typography, CircularProgress, Paper, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Button, Chip, Snackbar, Alert,
    Container, Card, Avatar, Stack, Fade
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const DispatcherAccount = () => {
    const [dispatchList, setDispatchList] = useState([]);
    const [facilitiesMap, setFacilitiesMap] = useState({}); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [customerOdns, setCustomerOdns] = useState({}); // Store ODNs by customer ID
    
    // --- STATE for Store Info ---
    const [store, setStore] = useState(null);

    const TARGET_PRIMARY_STATUSES = useMemo(() => ['ewm_completed'], []);

    // 1. Initialize Store Info and periodically refresh from server
    useEffect(() => {
        const storedStore = localStorage.getItem('store'); 
        console.log('Stored store from localStorage:', storedStore);
        
        if (storedStore) {
            const storeId = storedStore.toUpperCase().trim();
            setStore(storeId);
            console.log('Store configuration set:', { storeId });
        } else {
            console.error('No store found in localStorage');
            // Set a default store for testing
            const defaultStore = 'AA1';
            setStore(defaultStore);
            console.log('Using default store configuration:', defaultStore);
        }

        // Periodically check if store has changed in the database
        const checkStoreUpdate = async () => {
            try {
                const userId = localStorage.getItem('UserId');
                if (!userId) return;
                
                const response = await axios.get(`${API_URL}/api/users-management/${userId}`);
                const serverStore = response.data.store;
                
                if (serverStore && serverStore !== storedStore) {
                    console.log('🔄 Store updated from server:', serverStore);
                    localStorage.setItem('store', serverStore);
                    setStore(serverStore.toUpperCase().trim());
                    
                    // Show notification
                    Swal.fire({
                        icon: 'info',
                        title: 'Store Updated',
                        text: `Your store has been updated to ${serverStore}`,
                        timer: 3000
                    });
                }
            } catch (err) {
                console.error('Error checking store update:', err);
            }
        };
        
        // Check immediately and then every 30 seconds
        checkStoreUpdate();
        const storeCheckInterval = setInterval(checkStoreUpdate, 30000);
        
        return () => clearInterval(storeCheckInterval);
    }, []);

    // 2. Fetch Facilities Lookup
    useEffect(() => {
        const fetchFacilities = async () => {
            try {
                console.log('Fetching facilities from:', `${API_URL}/api/facilities`);
                const response = await axios.get(`${API_URL}/api/facilities`);
                console.log('Facilities response:', response.data);
                const map = response.data.reduce((acc, facility) => {
                    acc[facility.id] = facility;
                    return acc;
                }, {});
                setFacilitiesMap(map);
                console.log('Facilities map created:', map);
            } catch (err) {
                console.error('Error fetching facilities:', err);
                setError(`Failed to load facilities: ${err.message}`);
            }
        };
        fetchFacilities();
    }, []);

    // 3. Fetch and Filter List
    const fetchDispatchList = useCallback(async () => {
        console.log('fetchDispatchList called with:', { 
            facilitiesMapLength: Object.keys(facilitiesMap).length,
            store
        });
        
        if (Object.keys(facilitiesMap).length === 0 || !store) {
            console.log('Skipping fetch - missing dependencies');
            return; 
        }
        
        try {
            console.log('Fetching TV display customers from:', `${API_URL}/api/tv-display-customers`);
            const response = await axios.get(`${API_URL}/api/tv-display-customers`);
            const allItems = response.data;
            console.log('TV display customers response:', allItems);
            
            // Filter items that have ODNs for this store and are ready for dispatch
            const filteredItems = allItems.filter(item => {
                const primaryStatus = (item.status || "").toLowerCase().trim();
                const storeDetails = item.store_details || {};
                const storeInfo = storeDetails[store];
                
                // Must have ODNs for this store
                if (!storeInfo) return false;
                
                const ewmStatus = (storeInfo.ewm_status || '').toLowerCase();
                const dispatchStatus = (storeInfo.dispatch_status || '').toLowerCase();
                
                // Show if:
                // 1. EWM is completed and dispatch not completed yet
                // 2. Dispatch is in progress (started or notifying)
                const isReadyToStart = ewmStatus === 'completed' && dispatchStatus === 'pending';
                const isInProgress = ['started', 'notifying'].includes(dispatchStatus);
                const isNotDone = dispatchStatus !== 'completed';
                
                return isNotDone && (isReadyToStart || isInProgress);
            }).sort((a, b) => new Date(a.started_at) - new Date(b.started_at));

            console.log('Filtered dispatch items:', filteredItems);
            setDispatchList(filteredItems);
            
            // Extract ODN data from store_details
            const odnMap = {};
            filteredItems.forEach(item => {
                const storeInfo = item.store_details[store];
                if (storeInfo) {
                    odnMap[item.id] = storeInfo.odns.map(odnNumber => ({
                        odn_number: odnNumber,
                        store: store,
                        ewm_status: storeInfo.ewm_status,
                        dispatch_status: storeInfo.dispatch_status
                    }));
                }
            });
            setCustomerOdns(odnMap);
            
        } catch (err) {
            console.error('Error fetching dispatch list:', err);
            setError(`Failed to load dispatch list: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [facilitiesMap, store, TARGET_PRIMARY_STATUSES]);

    useEffect(() => {
        console.log('Main effect triggered with:', { 
            facilitiesMapLength: Object.keys(facilitiesMap).length,
            store
        });
        
        if (Object.keys(facilitiesMap).length > 0 && store) {
            fetchDispatchList();
            const interval = setInterval(fetchDispatchList, 10000);
            return () => clearInterval(interval);
        } else {
            // Set a timeout to prevent infinite loading
            const timeout = setTimeout(() => {
                if (loading) {
                    console.log('Loading timeout reached, stopping loading state');
                    setLoading(false);
                    if (Object.keys(facilitiesMap).length === 0) {
                        setError('Failed to load facilities data');
                    }
                    if (!store) {
                        setError('Store configuration not available');
                    }
                }
            }, 10000); // 10 second timeout
            
            return () => clearTimeout(timeout);
        }
    }, [fetchDispatchList, facilitiesMap, store, loading]);

    // Helper function to get ODNs for a customer
    const getCustomerOdns = (customerId) => {
        const odns = customerOdns[customerId] || [];
        const storeOdns = odns.filter(odn => odn.store === store);
        
        if (storeOdns.length === 0) {
            return 'Pending';
        }
        
        return storeOdns.map(odn => odn.odn_number).join(', ');
    };

    // 5. Update Status Logic
    const handleStatusUpdate = async (item, newStatus) => {
        try {
            setLoading(true);
            
            const isFinalStep = newStatus === 'completed';
            
            // Update ODN dispatch status
            const dispatchStatusValue = isFinalStep ? 'completed' : 
                                       newStatus === 'notifying' ? 'notifying' : 'started';
            
            try {
                // Update ODN dispatch status
                const response = await axios.put(`${API_URL}/api/odns-rdf/update-dispatch-status`, {
                    process_id: item.id,
                    store: store,
                    dispatch_status: dispatchStatusValue,
                    dispatcher_id: localStorage.getItem('EmployeeID'),
                    dispatcher_name: localStorage.getItem('FullName')
                });
                
                if (!response.data.success) {
                    throw new Error('Failed to update dispatch status');
                }
            } catch (error) {
                console.error('Error updating ODN dispatch status:', error);
                setSnackbar({ open: true, message: "Update failed", severity: 'error' });
                setLoading(false);
                return;
            }
            
            // If completing, update customer_queue to move to Exit Permit
            if (isFinalStep) {
                try {
                    // Check if all stores have completed dispatch
                    const odnResponse = await axios.get(`${API_URL}/api/rdf-odns/${item.id}`);
                    const allOdns = odnResponse.data.odns || [];
                    const allDispatchCompleted = allOdns.every(odn => odn.dispatch_status === 'completed');
                    
                    if (allDispatchCompleted) {
                        // All stores completed, move to Exit Permit
                        await axios.put(`${API_URL}/api/update-service-point`, {
                            id: item.id,
                            status: 'dispatch_completed',
                            next_service_point: 'Exit-Permit'
                            // Don't set completed_at here - only when Gate Keeper allows exit
                        });
                    }
                } catch (error) {
                    console.error('Error updating customer queue:', error);
                }
                
                // Record dispatcher service time
                try {
                    // SIMPLIFIED: Only record end_time
                    const dispatchEndTime = new Date().toISOString();
                    
                    // Format datetime for MySQL
                    const formatForMySQL = (dateValue) => {
                        if (!dateValue) return null;
                        const d = new Date(dateValue);
                        return d.getFullYear() + '-' +
                               String(d.getMonth() + 1).padStart(2, '0') + '-' +
                               String(d.getDate()).padStart(2, '0') + ' ' +
                               String(d.getHours()).padStart(2, '0') + ':' +
                               String(d.getMinutes()).padStart(2, '0') + ':' +
                               String(d.getSeconds()).padStart(2, '0');
                    };
                    
                    const serviceTimeData = {
                        process_id: item.id,
                        service_unit: `Dispatcher - ${store}`,
                        end_time: formatForMySQL(dispatchEndTime),
                        officer_id: localStorage.getItem('EmployeeID'),
                        officer_name: localStorage.getItem('FullName'),
                        status: 'completed',
                        notes: `Dispatch completed for store ${store}`
                    };
                    
                    await axios.post(`${API_URL}/api/service-time`, serviceTimeData);
                    console.log('✅ Dispatcher service time recorded');
                } catch (err) {
                    console.error('❌ Failed to record Dispatcher service time:', err);
                }
            }
            
            setSnackbar({ 
                open: true, 
                message: isFinalStep ? "Order sent to Exit Permit registry" : `Process: ${newStatus}`, 
                severity: 'success' 
            });

            fetchDispatchList(); 
        } catch (err) {
            console.error('Error in handleStatusUpdate:', err);
            setSnackbar({ open: true, message: "Update failed", severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getFacilityName = (facilityId) => facilitiesMap[facilityId]?.facility_name || `ID: ${facilityId}`;

    if (loading && dispatchList.length === 0) 
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Fade in={loading}>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3
                    }}>
                        <CircularProgress size={60} thickness={4} />
                        <Typography variant="h6" color="text.secondary">
                            Loading dispatch console...
                        </Typography>
                    </Box>
                </Fade>
            </Container>
        );

    return (
        <>
            <style>
                {`
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .animate-fade-in {
                        animation: fadeInUp 0.6s ease-out;
                    }
                    .dispatch-card {
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                        background: rgba(255, 255, 255, 0.95);
                        border-radius: 20px;
                        border: 1px solid rgba(25, 118, 210, 0.1);
                    }
                    .dispatch-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    }
                    .header-gradient {
                        background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                        color: white;
                        padding: 32px;
                        border-radius: 20px 20px 0 0;
                        position: relative;
                        overflow: hidden;
                    }
                    .header-gradient::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                        pointer-events: none;
                    }
                    .enhanced-table {
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    }
                    .table-header {
                        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                        border-bottom: 2px solid #e2e8f0;
                    }
                    .table-row {
                        transition: all 0.2s ease;
                        border-bottom: 1px solid rgba(0,0,0,0.05);
                    }
                    .table-row:hover {
                        background: linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(247, 147, 30, 0.05) 100%);
                        transform: translateX(4px);
                    }
                    .action-button {
                        border-radius: 12px;
                        font-weight: 600;
                        text-transform: none;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .action-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                    }
                `}
            </style>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Card className="dispatch-card animate-fade-in" elevation={0}>
                    {/* Header Section */}
                    <Box className="header-gradient">
                        <Stack direction="row" alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                            <Avatar sx={{ 
                                bgcolor: 'rgba(255,255,255,0.2)', 
                                width: 64, 
                                height: 64,
                                backdropFilter: 'blur(10px)',
                                border: '2px solid rgba(255,255,255,0.3)'
                            }}>
                                <LocalShippingIcon fontSize="large" />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h3" fontWeight="bold" sx={{ 
                                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    mb: 1
                                }}>
                                    Logistics Dispatch Console
                                </Typography>
                                <Typography variant="h6" sx={{ 
                                    opacity: 0.9, 
                                    fontWeight: 300,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                    Store: <strong>{store}</strong>
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Content Section */}
                    <Box sx={{ p: 4 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TableContainer component={Paper} className="enhanced-table">
                            <Table stickyHeader>
                                <TableHead className="table-header">
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>
                                            #
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <AssignmentIcon fontSize="small" />
                                                <span>Facility Name</span>
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>
                                            ODN Number
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>
                                            Customer Type
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dispatchList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                                <Stack alignItems="center" spacing={2}>
                                                    <LocalShippingIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                                                    <Typography variant="h6" color="text.secondary">
                                                        No pending dispatches
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        All dispatch orders are up to date
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        dispatchList.map((item, index) => {
                                            // Get dispatch status from store_details
                                            const storeInfo = item.store_details?.[store] || {};
                                            const dispatchStatus = (storeInfo.dispatch_status || 'pending').toLowerCase().trim();
                                            
                                            return (
                                                <TableRow key={item.id} className="table-row">
                                                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                                        {getFacilityName(item.facility_id)}
                                                    </TableCell>
                                                    
                                                    <TableCell>
                                                        <Chip
                                                            label={getCustomerOdns(item.id)}
                                                            color={getCustomerOdns(item.id) !== 'Pending' ? "primary" : "default"}
                                                            variant="outlined"
                                                            sx={{ fontWeight: 'bold', borderRadius: 2 }}
                                                        />
                                                    </TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            label={item.customer_type || 'Retail'}
                                                            color="secondary"
                                                            size="small"
                                                            variant="filled"
                                                        />
                                                    </TableCell>
                                                    
                                                    <TableCell align="center">
                                                        <Stack direction="row" spacing={1} justifyContent="center">
                                                            {dispatchStatus === 'notifying' ? (
                                                                <>
                                                                    <Button 
                                                                        size="small" 
                                                                        variant="outlined" 
                                                                        color="error" 
                                                                        onClick={() => handleStatusUpdate(item, 'dispatch_started')}
                                                                        startIcon={<StopIcon />}
                                                                        className="action-button"
                                                                    >
                                                                        Stop
                                                                    </Button>
                                                                    <Button 
                                                                        size="small" 
                                                                        variant="contained" 
                                                                        color="success" 
                                                                        onClick={() => handleStatusUpdate(item, 'completed')}
                                                                        startIcon={<CheckCircleIcon />}
                                                                        className="action-button"
                                                                    >
                                                                        Complete
                                                                    </Button>
                                                                </>
                                                            ) : dispatchStatus === 'started' ? (
                                                                <Button 
                                                                    size="small" 
                                                                    variant="contained" 
                                                                    color="warning" 
                                                                    onClick={() => handleStatusUpdate(item, 'notifying')}
                                                                    startIcon={<NotificationsIcon />}
                                                                    className="action-button"
                                                                >
                                                                    Notify Delegate
                                                                </Button>
                                                            ) : (
                                                                <Button 
                                                                    size="small" 
                                                                    variant="contained" 
                                                                    color="info" 
                                                                    onClick={() => handleStatusUpdate(item, 'dispatch_started')}
                                                                    startIcon={<PlayArrowIcon />}
                                                                    className="action-button"
                                                                >
                                                                    Start Dispatch
                                                                </Button>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Card>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
};

export default DispatcherAccount;