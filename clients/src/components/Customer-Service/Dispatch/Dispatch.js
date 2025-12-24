import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
    Box, Typography, CircularProgress, Paper, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Button, Chip, Snackbar, Alert
} from '@mui/material';
import dayjs from 'dayjs';

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
    const [odnKey, setOdnKey] = useState(null); // Dynamic key for aaX_odn

    const TARGET_PRIMARY_STATUSES = useMemo(() => ['ewm_completed'], []); 

    // 1. Initialize Store Info and dynamic column keys
    useEffect(() => {
        const storedStore = localStorage.getItem('store'); 
        if (storedStore) {
            const storeId = storedStore.toUpperCase().trim();
            setStore(storeId); 
            
            const match = storeId.match(/AA(\d)/i);
            if (match) {
                setStoreCompletionField(`store_completed_${match[1]}`);
                setOdnKey(`${storeId.toLowerCase()}_odn`); // Sets 'aa1_odn', etc.
            }
        } else {
            setError("Configuration Error: Store ID not found in Local Storage.");
        }
    }, []);

    // 2. Fetch Facilities Lookup
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
            }
        };
        fetchFacilities();
    }, []);

    // 3. Fetch and Filter List
    const fetchDispatchList = useCallback(async () => {
        if (Object.keys(facilitiesMap).length === 0 || !storeCompletionField) return; 
        
        try {
            const response = await axios.get(`${API_URL}/api/serviceList`);
            const allItems = response.data;
            
            const filteredItems = allItems.filter(item => {
                const primaryStatus = (item.status || "").toLowerCase().trim();
                const storeStatus = (item[storeCompletionField] || "").toLowerCase().trim();

                const isReadyToStart = TARGET_PRIMARY_STATUSES.includes(primaryStatus);
                const isInProgress = ['dispatch_started', 'notifying'].includes(storeStatus);
                const isNotDone = storeStatus !== 'dispatch_completed';

                return isNotDone && (isReadyToStart || isInProgress);
            }).sort((a, b) => new Date(a.started_at) - new Date(b.started_at));

            setDispatchList(filteredItems);
        } catch (err) {
            console.error('Error fetching dispatch list:', err);
        } finally {
            setLoading(false);
        }
    }, [facilitiesMap, storeCompletionField, TARGET_PRIMARY_STATUSES]);

    useEffect(() => {
        if (Object.keys(facilitiesMap).length > 0 && storeCompletionField) {
            fetchDispatchList();
            const interval = setInterval(fetchDispatchList, 10000);
            return () => clearInterval(interval);
        }
    }, [fetchDispatchList, facilitiesMap, storeCompletionField]);

    // 4. Update Status Logic
    const handleStatusUpdate = async (item, newStatus) => {
        try {
            setLoading(true);
            
            const isFinalStep = newStatus === 'completed';
            const statusValue = isFinalStep ? 'dispatch_completed' : newStatus;
            const nextPoint = isFinalStep ? 'Exit-Permit' : 'dispatch';

            const payload = {
                ...item,
                status: statusValue, 
                next_service_point: nextPoint,
                [storeCompletionField]: statusValue 
            };

            await axios.put(`${API_URL}/api/update-service-point`, payload); 
            
            setSnackbar({ 
                open: true, 
                message: isFinalStep ? "Order sent to Exit Permit registry" : `Process: ${newStatus}`, 
                severity: 'success' 
            });

            fetchDispatchList(); 
        } catch (err) {
            setSnackbar({ open: true, message: "Update failed", severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getFacilityName = (facilityId) => facilitiesMap[facilityId]?.facility_name || `ID: ${facilityId}`;

    if (loading && dispatchList.length === 0) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                Logistics Dispatch Console 🚚
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
                Store ID: <strong>{store}</strong>
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 2 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: '#e3f2fd' } }}>
                            <TableCell>#</TableCell>
                            <TableCell>Facility Name</TableCell>
                            <TableCell>ODN Number</TableCell> {/* Replaced Status with ODN */}
                            <TableCell>Customer</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {dispatchList.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>No pending dispatches.</TableCell></TableRow>
                        ) : (
                            dispatchList.map((item, index) => {
                                const storeStatus = (item[storeCompletionField] || "").toLowerCase().trim();
                                return (
                                    <TableRow key={item.id} hover>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{getFacilityName(item.facility_id)}</TableCell>
                                        
                                        {/* Show Dynamic ODN Column */}
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                                {item[odnKey] || "Pending..."}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>{item.customer_type || 'Retail'}</TableCell>
                                        
                                        <TableCell align="center">
                                            {storeStatus === 'notifying' ? (
                                                <>
                                                    <Button size="small" variant="outlined" color="error" onClick={() => handleStatusUpdate(item, 'dispatch_started')} sx={{ mr: 1 }}>
                                                        Stop
                                                    </Button>
                                                    <Button size="small" variant="contained" color="success" onClick={() => handleStatusUpdate(item, 'completed')}>
                                                        Complete
                                                    </Button>
                                                </>
                                            ) : storeStatus === 'dispatch_started' ? (
                                                <Button size="small" variant="contained" color="warning" onClick={() => handleStatusUpdate(item, 'notifying')}>
                                                    Notify Delegate
                                                </Button>
                                            ) : (
                                                <Button size="small" variant="contained" color="info" onClick={() => handleStatusUpdate(item, 'dispatch_started')}>
                                                    Start Dispatch
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default DispatcherAccount;