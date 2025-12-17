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

    // --- STATE for Store Info ---
    const [store, setStore] = useState(null); 
    const [storeCompletionField, setStoreCompletionField] = useState(null); 

    // Define the single primary status that triggers initial visibility: ewm_completed
    const TARGET_PRIMARY_STATUSES = useMemo(() => ['ewm_completed'], []); 

    // Define all statuses where the Dispatcher MUST see the item (the 3 stages of their work).
    const DISPATCHER_ACTIVE_STATUSES = useMemo(() => ['ewm_completed', 'dispatch_started', 'notifying'], []);


    // 1. Get Store ID from Local Storage and set the dynamic field
    useEffect(() => {
        const storedStore = localStorage.getItem('store'); 
        if (storedStore) {
            setStore(storedStore); 
            const match = storedStore.match(/AA(\d)/i);
            if (match) {
                setStoreCompletionField(`store_completed_${match[1]}`);
            }
        } else {
            console.warn("User store not found in localStorage ('store'). Cannot load dispatch list.");
            setError("Configuration Error: Store ID not found in Local Storage. Cannot load dispatch list.");
        }
    }, []);

    // --- Data Fetching: Facilities (for lookup table) ---
    useEffect(() => {
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
    }, []);


    // --- Data Fetching: Service List (FINAL CORRECTED FILTERING) ---
    const fetchDispatchList = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        if (Object.keys(facilitiesMap).length === 0 || !storeCompletionField) {
            setLoading(false);
            return; 
        }
        
        try {
            const response = await axios.get(`${API_URL}/api/serviceList`);
            const allItems = response.data;
            
            // FILTER: 
            const filteredItems = allItems
                .filter(item => {
                    const primaryStatus = item.status?.toLowerCase();
                    const storeStatus = item[storeCompletionField]?.toLowerCase();

                    // Condition 1: Primary status must be one of the ready/in-progress statuses (e.g., ewm_completed)
                    const isReadyPrimaryStatus = TARGET_PRIMARY_STATUSES.includes(primaryStatus);
                    
                    // Condition 2: Store's custom status must be one of the active stages the Dispatcher is currently managing.
                    // This ensures the item is only removed when storeStatus is 'completed' (which is NOT in DISPATCHER_ACTIVE_STATUSES).
                    const isDispatchStage = DISPATCHER_ACTIVE_STATUSES.includes(storeStatus);

                    return isReadyPrimaryStatus && isDispatchStage;
                })
                .sort((a, b) => new Date(a.started_at) - new Date(b.started_at));

            setDispatchList(filteredItems);

        } catch (err) {
            console.error('Error fetching dispatch list:', err);
            setError('Failed to load dispatch list.');
        } finally {
            setLoading(false);
        }
    }, [facilitiesMap, storeCompletionField, TARGET_PRIMARY_STATUSES, DISPATCHER_ACTIVE_STATUSES]);

    useEffect(() => {
        if (Object.keys(facilitiesMap).length > 0 && storeCompletionField) {
            fetchDispatchList();
            const interval = setInterval(fetchDispatchList, 5000);
            return () => clearInterval(interval);
        }
    }, [fetchDispatchList, facilitiesMap, storeCompletionField]);


    // --- Status Update Logic (Handles status freezing and store tracking) ---
    const handleStatusUpdate = async (item, newStatus) => {
        try {
            setLoading(true);
            
            let completedAtValue = null;
            let nextServicePointValue = 'dispatch'; 
            let delegateId = item.assigned_officer_id || null; 
            
            // 1. Primary status remains the original status (ewm_completed) until final action
            let statusToSend = item.status; 
            
            // 2. Prepare Store Completion Update (Track Dispatcher's status with status name)
            const storeUpdate = {};
            const storeUpdateValue = newStatus.toLowerCase(); 
            
            if (storeCompletionField) {
                storeUpdate[storeCompletionField] = storeUpdateValue;
            }
            
            // 3. Handle Final Completion (ONLY time primary status changes)
            if (newStatus.toLowerCase() === 'completed') {
                completedAtValue = dayjs().format(); 
                nextServicePointValue = null; 
                statusToSend = 'completed'; // ONLY here does the primary status change
            }
            
            // === CONSTRUCTING THE PAYLOAD ===
            const putData = {
                ...item, 
                id: item.id, 
                status: statusToSend, 
                next_service_point: nextServicePointValue, 
                assigned_officer_id: delegateId, 
                completed_at: completedAtValue,
                ...(Object.keys(storeUpdate).length > 0) && storeUpdate
            };

            await axios.put(`${API_URL}/api/update-service-point`, putData); 
            
            
            // --- OPTIMISTICALLY UPDATE LOCAL STATE (Remove immediately if 'completed') ---
            setDispatchList(prevList => {
                // If status changed to 'completed', filter the item out immediately
                if (newStatus.toLowerCase() === 'completed') {
                    return prevList.filter(i => i.id !== item.id);
                }
                // Otherwise, update the item's custom field for button visibility
                return prevList.map(i => {
                    if (i.id === item.id) {
                        return {
                            ...i,
                            ...storeUpdate,
                            status: statusToSend, 
                            completed_at: completedAtValue,
                        };
                    }
                    return i;
                });
            });

            
            let successMessage = `Store tracking set to **'${newStatus.toUpperCase()}'** successfully!`;
            if (newStatus.toLowerCase() === 'completed') {
                 successMessage = `Process **COMPLETED** successfully. Item removed from queue.`;
            }

            setSnackbar({ 
                open: true, 
                message: successMessage, 
                severity: 'success' 
            });

            // Fetch in background to confirm data consistency
            fetchDispatchList(); 

        } catch (err) {
            console.error(`Error updating status for ID ${item.id}:`, err.response?.data || err.message);
            setSnackbar({ 
                open: true, 
                message: `Failed to update status. Error: ${err.response?.data?.message || err.message}`, 
                severity: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };


    // --- Helper Functions ---
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

    // This helper function now uses the item's store-specific status to determine the color/label
    const getStoreStatusChip = (item) => {
        const storeStatus = item[storeCompletionField]?.toLowerCase();
        
        switch (storeStatus) {
            case 'ewm_completed':
                return <Chip label="Ready for Dispatch" color="primary" variant="outlined" size="small" />;
            case 'dispatch_started':
                return <Chip label="Dispatch Started" color="info" variant="outlined" size="small" />;
            case 'notifying':
                return <Chip label="Notifying Delegate" color="warning" size="small" />;
            case 'completed':
                return <Chip label="Delivered" color="success" size="small" />;
            default:
                // Fallback to primary status if store-specific status is missing/unexpected
                return <Chip label={item.status || 'N/A'} size="small" />;
        }
    };

    // --- Main Render (Button Logic based on the store_completed_X field) ---

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
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Active Store: **{store || 'N/A'}**
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
                                        🎉 Queue is clear!
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            dispatchList.map((item, index) => (
                                <TableRow 
                                    key={item.id} 
                                    sx={{ 
                                        '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' }, 
                                    }}
                                >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{getFacilityName(item.facility_id)}</TableCell>
                                    <TableCell>{formatWaitingTime(item.started_at)}</TableCell>
                                    <TableCell>{item.customer_type || 'Retail'}</TableCell>
                                    <TableCell>{item.delegate_phone || 'N/A'}</TableCell>
                                    <TableCell>{getStoreStatusChip(item)}</TableCell>
                                    <TableCell align="center" sx={{ minWidth: '350px' }}>
                                        
                                        {/* Dynamic Button Logic based on the store_completed_X status */}
                                        {(() => {
                                            const storeStatus = item[storeCompletionField]?.toLowerCase();

                                            // STATE 3: Notifying -> Show Stop & Completed
                                            if (storeStatus === 'notifying') {
                                                return (
                                                    <>
                                                        <Button 
                                                            variant="outlined" 
                                                            size="small" 
                                                            color="error" 
                                                            onClick={() => handleStatusUpdate(item, 'dispatch_started')}
                                                            sx={{ mr: 1 }}
                                                            disabled={loading}
                                                        >
                                                            Stop
                                                        </Button>
                                                        <Button 
                                                            variant="contained" 
                                                            size="small" 
                                                            color="success" 
                                                            onClick={() => handleStatusUpdate(item, 'completed')}
                                                            disabled={loading}
                                                        >
                                                            Completed
                                                        </Button>
                                                    </>
                                                );
                                            } 
                                            // STATE 2: Dispatch Started / Stopped -> Show Notify Delegate
                                            else if (storeStatus === 'dispatch_started') {
                                                return (
                                                    <Button 
                                                        variant="contained" 
                                                        size="small" 
                                                        color="warning" 
                                                        onClick={() => handleStatusUpdate(item, 'notifying')}
                                                        disabled={loading}
                                                    >
                                                        Notify Delegate
                                                    </Button>
                                                );
                                            } 
                                            // STATE 1: Initial state (ewm_completed) -> Show Start Dispatch
                                            else if (storeStatus === 'ewm_completed') {
                                                return (
                                                    <Button 
                                                        variant="contained" 
                                                        size="small" 
                                                        color="info" 
                                                        onClick={() => handleStatusUpdate(item, 'dispatch_started')}
                                                        disabled={loading}
                                                    >
                                                        Start Dispatch
                                                    </Button>
                                                );
                                            }
                                            else {
                                                // Fallback for unexpected or missing status 
                                                return <Chip label={`Unexpected Status: ${storeStatus || 'N/A'}`} size="small" />;
                                            }
                                        })()}
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
                    {snackbar.message.includes('**') ? <span dangerouslySetInnerHTML={{ __html: snackbar.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} /> : snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DispatcherAccount;