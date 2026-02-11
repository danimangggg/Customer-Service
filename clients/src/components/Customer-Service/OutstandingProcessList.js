import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Typography, CircularProgress, Box, Chip, Checkbox, IconButton,
    Container, Card, CardHeader, Avatar, Stack, Divider, Fade, Tooltip,
    LinearProgress, Grid
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNavigate } from 'react-router-dom';
 
const OutstandingCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    const jobTitle = localStorage.getItem("JobTitle");
    const userId = localStorage.getItem("UserId");
    const userStore = localStorage.getItem("store");
    const normalizedUserStore = (userStore || '').toUpperCase();

    const navigate = useNavigate();
    const api_url = process.env.REACT_APP_API_URL;

    const handleDetail = (customerId) => {
        navigate(`/picklist/${customerId}`);
    };

    const updateServiceStatus = async (customer, newStatus, startedAt = null, assignedOfficerId = undefined, nextServicePoint = undefined, completedAt = undefined, data = undefined) => {
        const payload = {
            id: customer.id,
            status: newStatus,
            started_at: (startedAt !== null) ? startedAt : customer.started_at,
            next_service_point: (nextServicePoint !== undefined) ? nextServicePoint : customer.next_service_point,
            assigned_officer_id: assignedOfficerId !== undefined ? assignedOfficerId : customer.assigned_officer_id,
            completed_at: (completedAt !== undefined) ? completedAt : customer.completed_at,
            ...data
        };
        console.log("Payload sent to update-service-point:", payload);
        try {
            await axios.put(`${api_url}/api/update-service-point`, payload);
            // Only re-fetch if the status change was successful
            fetchData();
            Swal.fire('Success', `Customer status updated to ${newStatus}.`, 'success');
            return true;
        } catch (error) {
            console.error("Error updating service status:", error.response ? error.response.data : error.message);
            // Do NOT show Swal if the error is from the silent auto-cancel check
            if (newStatus !== 'Canceled') {
                Swal.fire('Error', 'Failed to update service status', 'error');
            }
            return false;
        }
    };
    
    // START: Auto-Cancellation Logic
    const autoCancelOverdueCustomers = async (data) => {
        const overdueCustomers = data.filter(customer => {
            // Only check active customers that haven't been canceled, completed, or rejected
            if (customer.status?.toLowerCase() === 'completed' || customer.status?.toLowerCase() === 'canceled' || customer.status?.toLowerCase() === 'rejected') {
                return false;
            }
            if (!customer.started_at) {
                return false;
            }

            const start = new Date(customer.started_at);
            const now = new Date();
            const diffMs = now - start;
            // 48 hours in milliseconds (48 * 60 * 60 * 1000)
            const fortyEightHoursMs = 172800000; 

            return diffMs > fortyEightHoursMs;
        });

        if (overdueCustomers.length > 0) {
            console.log(`Auto-cancelling ${overdueCustomers.length} overdue customer(s).`);
            for (const customer of overdueCustomers) {
                // Perform silent cancellation
                try {
                    const payload = {
                        id: customer.id,
                        status: 'Canceled',
                        next_service_point: "Auto-Canceled",
                        completed_at: new Date().toISOString()
                    };
                    await axios.put(`${api_url}/api/update-service-point`, payload);
                } catch (error) {
                    console.error(`Failed to auto-cancel customer ${customer.id}:`, error.message);
                }
            }
            // Re-fetch data once after all cancellations
            await fetchData();
        }
    };
    // END: Auto-Cancellation Logic

    const fetchData = async () => {
        try {
            const customerRes = await axios.get(`${api_url}/api/serviceList`);
            const fetchedCustomers = customerRes.data;
            setCustomers(fetchedCustomers);
            console.log("Data fetched from API successfully.");
            
            // Run the auto-cancel check immediately after fetching
            await autoCancelOverdueCustomers(fetchedCustomers);

        } catch (error) {
            console.error("Error fetching customer data:", error.response ? error.response.data : error.message);
            // Only show a critical error if it's not during the silent auto-cancel process
            if (loading) {
                Swal.fire('Error', 'Failed to fetch customer data.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStaticData = async () => {
        try {
            const [facilityRes, employeeRes, storeRes] = await Promise.all([
                axios.get(`${api_url}/api/facilities`),
                axios.get(`${api_url}/api/get-employee`),
                axios.get(`${api_url}/api/stores`),
            ]);
            setFacilities(facilityRes.data);
            setEmployees(employeeRes.data);
            setStores(storeRes.data);
        } catch (error) {
            console.error("Error fetching static data:", error.response ? error.response.data : error.message);
            Swal.fire('Error', 'Failed to fetch facility, employee, or store data.', 'error');
        }
    };

    useEffect(() => {
        fetchStaticData();
        fetchData();
        
        // Polling interval for near real-time updates and auto-cancellation check
        const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
        
        return () => clearInterval(interval);
    }, []);

    const getFacilityDetails = (facilityId) => {
        const facility = facilities.find(f => f.id === facilityId);
        return {
            name: facility?.facility_name || 'N/A',
            woreda: facility?.woreda_name || 'N/A',
        };
    };

    const getWaitingHours = (started_at) => {
        if (!started_at) return 'N/A';
        const now = new Date();
        const start = new Date(started_at);
        const diffMs = now - start;
        if (diffMs < 0) return '0h 0m';

        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours}h ${minutes}m`;
    };

    const getAssignedUserFullName = (assigned_officer_id) => {
        const matched = employees.find(emp => String(emp.id) === String(assigned_officer_id));
        return matched?.full_name || 'N/A';
    };

    const getStoreODN = (customer) => {
        if (normalizedUserStore === 'AA1') return customer.aa1_odn || 'N/A';
        if (normalizedUserStore === 'AA2') return customer.aa2_odn || 'N/A';
        if (normalizedUserStore === 'AA3') return customer.aa3_odn || 'N/A';
        return 'N/A';
    };

    const handleAvailabilityChange = async (customer, isAvailable) => {
        const availabilityValue = isAvailable ? 'A' : 'NA';
        const storeMapping = {
            'AA1': 'availability_aa1',
            'AA2': 'availability_aa2',
            'AA3': 'availability_aa3',
        };
        const availabilityField = storeMapping[normalizedUserStore];
        if (!availabilityField) {
            Swal.fire('Error', 'Invalid store configuration.', 'error');
            return;
        }
        try {
            const payload = { id: customer.id, [availabilityField]: availabilityValue };
            await axios.put(`${api_url}/api/update-service-point`, payload);
            Swal.fire('Updated!', 'Customer availability status changed.', 'success');
            fetchData();
        } catch (error) {
            console.error("Error updating availability:", error.response ? error.response.data : error.message);
            Swal.fire('Error', 'Failed to update availability.', 'error');
        }
    };

    const completeStoreTask = async (customer) => {
        const completionData = {
            id: customer.id,
            store_completed_1: customer.store_completed_1,
            store_completed_2: customer.store_completed_2,
            store_completed_3: customer.store_completed_3,
        };
        
        // Update the specific store's completion status to 'ewm_completed'
        if (normalizedUserStore === 'AA1') {
            completionData.store_completed_1 = 'ewm_completed';
        } else if (normalizedUserStore === 'AA2') {
            completionData.store_completed_2 = 'ewm_completed';
        } else if (normalizedUserStore === 'AA3') {
            completionData.store_completed_3 = 'ewm_completed';
        }

        try {
            const ewmEndTime = new Date().toISOString();
            
            // Add EWM tracking to completion data
            if (!customer.ewm_started_at) {
                completionData.ewm_started_at = ewmEndTime;
                completionData.ewm_officer_id = localStorage.getItem('EmployeeID');
                completionData.ewm_officer_name = localStorage.getItem('FullName');
            }
            completionData.ewm_completed_at = ewmEndTime;
            
            await axios.put(`${api_url}/api/update-service-point`, completionData);

            // Record EWM service time
            try {
                const o2cEndTime = customer.o2c_completed_at || customer.started_at;
                const ewmStartTime = customer.ewm_started_at || ewmEndTime;
                
                // Calculate waiting time
                let waitingMinutes = 0;
                if (o2cEndTime && ewmStartTime) {
                    const o2cEnd = new Date(o2cEndTime);
                    const ewmStart = new Date(ewmStartTime);
                    const diffMs = ewmStart - o2cEnd;
                    waitingMinutes = Math.floor(diffMs / 60000);
                    if (waitingMinutes < 0) waitingMinutes = 0;
                }
                
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
                    process_id: customer.id,
                    service_unit: `EWM Officer - ${normalizedUserStore}`,
                    start_time: formatForMySQL(ewmStartTime),
                    end_time: formatForMySQL(ewmEndTime),
                    waiting_minutes: waitingMinutes,
                    officer_id: localStorage.getItem('EmployeeID'),
                    officer_name: localStorage.getItem('FullName'),
                    status: 'completed',
                    notes: `Completed EWM process for store ${normalizedUserStore}`
                };
                
                const serviceTimeResponse = await axios.post(`${api_url}/api/service-time`, serviceTimeData);
                console.log('✅ EWM service time recorded:', serviceTimeResponse.data);
            } catch (err) {
                console.error('❌ Failed to record EWM service time:', err);
                console.error('Error details:', err.response?.data);
            }

            const serviceListRes = await axios.get(`${api_url}/api/serviceList`);
            const customerAfterUpdate = serviceListRes.data.find(c => c.id === customer.id);

            if (!customerAfterUpdate) {
                Swal.fire('Error', 'Customer data not found after update.', 'error');
                return;
            }

            const isStore1Completed = !customerAfterUpdate.store_id_1 || customerAfterUpdate.store_completed_1 === 'ewm_completed';
            const isStore2Completed = !customerAfterUpdate.store_id_2 || customerAfterUpdate.store_completed_2 === 'ewm_completed';
            const isStore3Completed = !customerAfterUpdate.store_id_3 || customerAfterUpdate.store_completed_3 === 'ewm_completed';
            
            // The global status only changes if ALL stores are completed
            const allStoresCompleted = isStore1Completed && isStore2Completed && isStore3Completed;

            if (allStoresCompleted) {
                await updateServiceStatus(
                    customerAfterUpdate,
                    'ewm_completed',
                    null,
                    undefined,
                    'Dispatch',
                    new Date().toISOString()
                );
                Swal.fire('Completed!', 'All stores have completed this task. Service is now complete and sent to Customer.', 'success');
            } else {
                Swal.fire('Completed!', 'You have completed your part. Waiting for other stores to complete their tasks.', 'success');
            }
            fetchData();
        } catch (error) {
            console.error("Error completing store task:", error.response ? error.response.data : error.message);
            Swal.fire('Error', 'Failed to complete store task', 'error');
        }
    };

    const handleShare = async (customer) => {
        const otherO2COfficers = employees.filter(emp => emp.jobTitle === 'O2C Officer' && String(emp.id) !== String(userId));

        if (otherO2COfficers.length === 0) {
            Swal.fire('No other O2C Officers available.', 'There are no other officers to share this task with.', 'info');
            return;
        }

        const officerOptions = otherO2COfficers.reduce((acc, emp) => {
            acc[emp.id] = emp.full_name;
            return acc;
        }, {});

        const { value: selectedOfficerId, isConfirmed } = await Swal.fire({
            title: 'Share with another O2C Officer',
            text: 'Select an officer to share this task with:',
            input: 'select',
            inputOptions: officerOptions,
            inputPlaceholder: 'Select Officer',
            showCancelButton: true,
            confirmButtonText: 'Share',
        });

        if (isConfirmed && selectedOfficerId) {
            try {
                await updateServiceStatus(
                    customer,
                    'started',
                    customer.started_at,
                    selectedOfficerId,
                    'O2C',
                    null,
                );
                Swal.fire('Success', 'Task has been shared with the selected officer.', 'success');
            } catch (error) {
                Swal.fire('Error', 'Failed to share the task.', 'error');
            }
        }
    };

    const handleO2CStatusFlow = async (customer, action) => {
        let newStatus = customer.status;
        let startedAt = customer.started_at;
        let additionalData = {};

        if (action === 'notify') {
            newStatus = 'notifying';
        } else if (action === 'start') {
            newStatus = 'o2c_started';
            if (!customer.started_at || customer.status !== 'o2c_started') {
                startedAt = new Date().toISOString();
            }
            // Track when O2C officer starts working
            if (!customer.o2c_started_at) {
                additionalData.o2c_started_at = new Date().toISOString();
                additionalData.o2c_officer_id = localStorage.getItem('EmployeeID');
                additionalData.o2c_officer_name = localStorage.getItem('FullName');
            }
        } else if (action === 'stop') {
            newStatus = 'started';
            startedAt = null;
        }
        await updateServiceStatus(customer, newStatus, startedAt, undefined, undefined, undefined, additionalData);
    };

    const canCancel = (customer) => {
        const storeIds = [];
        if (customer.store_id_1) storeIds.push('1');
        if (customer.store_id_2) storeIds.push('2');
        if (customer.store_id_3) storeIds.push('3');

        if (customer.next_service_point?.toLowerCase() !== 'ewm') {
            return true; // Allow cancel for non-EWM orders
        }

        // For EWM orders, check if any assigned store has started or completed the process
        const hasStarted = storeIds.some(index => {
            const status = customer[`store_completed_${index}`];
            return status === 'ewm_started' || status === 'ewm_completed';
        });

        return !hasStarted;
    };


    const handleCancel = async (customer) => {
        // This check is now also in the button's disabled state, but good to double-check
        if (!canCancel(customer)) {
            Swal.fire({
                title: 'Cancellation Not Allowed',
                text: 'This service cannot be cancelled because the process has already started at one or more stores.',
                icon: 'warning'
            });
            return;
        }

        const { isConfirmed } = await Swal.fire({
            title: 'Confirm Cancellation',
            text: 'Are you sure you want to cancel this service?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, cancel it!',
            cancelButtonText: 'No, do not cancel',
        });

        if (isConfirmed) {
            try {
                // Use the shared update function to set status to 'Canceled'
                await updateServiceStatus(
                    customer,
                    'Canceled',
                    customer.started_at,
                    customer.assigned_officer_id,
                    "Canceled",
                    new Date().toISOString()
                );
                Swal.fire('Canceled!', 'The service has been successfully canceled.', 'success');
            } catch (error) {
                Swal.fire('Error', 'Failed to cancel the service.', 'error');
            }
        }
    };

    const handleApprove = async (customer) => {
        const { isConfirmed } = await Swal.fire({
            title: 'Confirm Approval',
            text: 'Are you sure you want to approve this customer and send to Customer Service?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, approve it!',
            cancelButtonText: 'No, cancel',
        });
        if (!isConfirmed) {
            Swal.fire('Cancelled', 'Approval action cancelled.', 'info');
            return;
        }
        try {
            await updateServiceStatus(
                customer,
                'approved',
                customer.started_at,
                undefined,
                'Customer Service',
                null
            );
            Swal.fire('Updated!', 'Customer approved and sent to Customer Service.', 'success');
            fetchData();
        } catch (error) {
            console.error("Error approving customer:", error.response ? error.response.data : error.message);
            Swal.fire('Error', 'Failed to approve customer.', 'error');
        }
    };

    const handleReject = async (customer) => {
        const { isConfirmed } = await Swal.fire({
            title: 'Confirm Rejection',
            text: 'Are you sure you want to reject this customer? This action is permanent.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, reject it!',
            cancelButtonText: 'No, cancel',
        });
        if (!isConfirmed) {
            Swal.fire('Cancelled', 'Rejection action cancelled.', 'info');
            return;
        }
        try {
            await updateServiceStatus(
                customer,
                'rejected',
                customer.started_at,
                undefined,
                customer.next_service_point,
                null
            );
            Swal.fire('Updated!', 'Customer has been rejected.', 'success');
            fetchData();
        } catch (error) {
            console.error("Error rejecting customer:", error.response ? error.response.data : error.message);
            Swal.fire('Error', 'Failed to reject customer.', 'error');
        }
    };

    const handleComplete = async (customer) => {
        if (jobTitle === 'O2C Officer') {
            let nextOptions = {};
            if (customer.customer_type === 'Credit') {
                nextOptions = { EWM: 'EWM' };
            } else if (customer.customer_type === 'Cash') {
                nextOptions = { Finance: 'Finance', EWM: 'EWM' };
            } else {
                Swal.fire("Error", "Customer type not recognized.", "error");
                return;
            }

            const { value: selectedRole, isConfirmed: roleConfirmed } = await Swal.fire({
                title: 'Select next service point',
                text: 'Select next service point',
                input: 'select',
                inputOptions: nextOptions,
                inputPlaceholder: 'Select next service point',
                showCancelButton: true,
                confirmButtonText: 'Submit',
                inputValidator: (value) => {
                    if (!value) {
                        return 'You must select a next service point.';
                    }
                }
            });
            if (!roleConfirmed || !selectedRole) {
                Swal.fire('Cancelled', 'Service completion cancelled.', 'info');
                return;
            }

            let updateData = {};
            let newStatus = 'o2c_completed';
            let nextServicePoint = selectedRole;

            if (selectedRole === 'EWM') {
                // Filter stores to only show the ones that match the existing database structure
                const availableStores = stores.filter(store => 
                    ['AA1', 'AA2', 'AA3'].includes(store.store_name)
                );

                if (availableStores.length === 0) {
                    Swal.fire('Error', 'No compatible stores found in database. Please ensure AA1, AA2, or AA3 stores exist.', 'error');
                    return;
                }

                // Generate store checkboxes dynamically from available stores
                const storeCheckboxes = availableStores.map(store => 
                    `<label><input type="checkbox" id="store${store.store_name}" value="${store.store_name}"> ${store.store_name} - ${store.description || 'No description'}</label>`
                ).join('<br/>');

                const { value: selectedStores, isConfirmed: storeConfirmed } = await Swal.fire({
                    title: 'Select Store(s)',
                    html: `
                        <div style="text-align:left;line-height:1.9">
                          ${storeCheckboxes}
                        </div>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    confirmButtonText: 'Next',
                    preConfirm: () => {
                        const picks = [];
                        availableStores.forEach(store => {
                            const checkbox = document.getElementById(`store${store.store_name}`);
                            if (checkbox && checkbox.checked) {
                                picks.push(store.store_name);
                            }
                        });
                        return picks;
                    }
                });

                if (!storeConfirmed || selectedStores.length === 0) {
                    Swal.fire('Cancelled', 'Store assignment cancelled or no stores selected.', 'info');
                    return;
                }

                const odnMap = {};
                let storesToEnter = [...selectedStores];
                let isCancelled = false;

                while (storesToEnter.length > 0 && !isCancelled) {
                    const { value: formValues, isConfirmed } = await Swal.fire({
                        title: 'Enter ODN for each store',
                        html: `
                            <select id="swal-store" class="swal2-input">
                                ${storesToEnter.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                            <input id="swal-odn" class="swal2-input" placeholder="Enter ODN for selected store">
                        `,
                        showCancelButton: true,
                        confirmButtonText: storesToEnter.length > 1 ? 'Save & Continue' : 'Save & Finish',
                        cancelButtonText: 'Cancel',
                        preConfirm: () => {
                            const store = document.getElementById('swal-store').value;
                            const odn = document.getElementById('swal-odn').value;
                            if (!store || !odn) {
                                Swal.showValidationMessage('Both store and ODN are required.');
                                return false;
                            }
                            return { store, odn };
                        }
                    });

                    if (isConfirmed) {
                        odnMap[formValues.store] = formValues.odn;
                        storesToEnter = storesToEnter.filter(s => s !== formValues.store);
                    } else {
                        isCancelled = true;
                    }
                }

                if (isCancelled) {
                    Swal.fire('Cancelled', 'Service completion cancelled.', 'info');
                    return;
                }

                updateData = {
                    aa1_odn: odnMap['AA1'] || null,
                    aa2_odn: odnMap['AA2'] || null,
                    aa3_odn: odnMap['AA3'] || null,
                    store_id_1: selectedStores.includes('AA1') ? 'AA1' : null,
                    store_id_2: selectedStores.includes('AA2') ? 'AA2' : null,
                    store_id_3: selectedStores.includes('AA3') ? 'AA3' : null,
                    store_completed_1: selectedStores.includes('AA1') ? 'o2c_completed' : 'completed',
                    store_completed_2: selectedStores.includes('AA2') ? 'o2c_completed' : 'completed',
                    store_completed_3: selectedStores.includes('AA3') ? 'o2c_completed' : 'completed',
                };
            } else {
                updateData = {
                    aa1_odn: null, aa2_odn: null, aa3_odn: null,
                    store_id_1: null, store_id_2: null, store_id_3: null,
                    store_completed_1: 'completed', store_completed_2: 'completed', store_completed_3: 'completed',
                };
            }

            try {
                const o2cEndTime = new Date().toISOString();
                
                // Add O2C completion tracking to updateData
                updateData.o2c_completed_at = o2cEndTime;
                if (!customer.o2c_officer_id) {
                    updateData.o2c_officer_id = localStorage.getItem('EmployeeID');
                    updateData.o2c_officer_name = localStorage.getItem('FullName');
                }
                
                await updateServiceStatus(
                    customer,
                    newStatus,
                    null,
                    undefined,
                    nextServicePoint,
                    undefined,
                    updateData
                );
                
                // Record service time for O2C Officer
                try {
                    // Get the previous step end time (registration completion)
                    const registrationEndTime = customer.registration_completed_at || customer.started_at;
                    const o2cStartTime = customer.o2c_started_at || customer.started_at;
                    
                    // Calculate waiting time (time between registration end and O2C start)
                    let waitingMinutes = 0;
                    if (registrationEndTime && o2cStartTime) {
                        const regEnd = new Date(registrationEndTime);
                        const o2cStart = new Date(o2cStartTime);
                        const diffMs = o2cStart - regEnd;
                        waitingMinutes = Math.floor(diffMs / 60000);
                        if (waitingMinutes < 0) waitingMinutes = 0;
                    }
                    
                    // Format datetime for MySQL (YYYY-MM-DD HH:MM:SS)
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
                        process_id: customer.id,
                        service_unit: 'O2C',
                        start_time: formatForMySQL(o2cStartTime),
                        end_time: formatForMySQL(o2cEndTime),
                        waiting_minutes: waitingMinutes,
                        officer_id: localStorage.getItem('EmployeeID'),
                        officer_name: localStorage.getItem('FullName'),
                        status: 'completed',
                        notes: `Completed O2C process, forwarded to ${nextServicePoint}`
                    };
                    
                    const serviceTimeResponse = await axios.post(`${api_url}/api/service-time`, serviceTimeData);
                    console.log('✅ O2C service time recorded:', serviceTimeResponse.data);
                } catch (err) {
                    console.error('❌ Failed to record O2C service time:', err);
                    console.error('Error details:', err.response?.data);
                    // Don't fail the completion if service time recording fails
                }
                
                Swal.fire('Success', 'Service point updated', 'success');
                fetchData();
            } catch (error) {
                console.error("Error updating service point:", error.response ? error.response.data : error.message);
                Swal.fire('Error', 'Failed to update service point', 'error');
            }

        } else if (jobTitle === 'Finance') {
            const nextOptions = { O2C: 'O2C', Manager: 'Manager', 'Customer Service': 'Customer Service' };
            const { value: selectedRole, isConfirmed } = await Swal.fire({
                title: 'Select next service point',
                input: 'select',
                inputOptions: nextOptions,
                inputPlaceholder: 'Select',
                showCancelButton: true,
            });
            if (!isConfirmed) return;

            let assignedOfficerId = customer.assigned_officer_id;
            let newStatus = customer.status;

            if (selectedRole === 'O2C') {
                if (!customer.assigned_officer_id) {
                    const { value: selectedUserId, isConfirmed: userConfirmedAssignment } = await Swal.fire({
                        title: 'Assign O2C Officer',
                        input: 'select',
                        inputOptions: employees.filter(emp => emp.jobTitle === 'O2C Officer').reduce((acc, emp) => { acc[emp.id] = emp.full_name; return acc; }, {}),
                        inputPlaceholder: 'Select an O2C Officer',
                        showCancelButton: true,
                    });
                    if (!userConfirmedAssignment) {
                        Swal.fire('Cancelled', 'No O2C Officer assigned. Action cancelled.', 'info');
                        return;
                    }
                    assignedOfficerId = selectedUserId;
                } else {
                    Swal.fire('Info', 'O2C Officer is already assigned. Keeping current assignment.', 'info');
                }
                newStatus = 'started';
            }

            try {
                await updateServiceStatus(
                    customer,
                    newStatus,
                    customer.started_at,
                    assignedOfficerId,
                    selectedRole,
                );
                Swal.fire('Updated!', `Service point updated to ${selectedRole}.`, 'success');
                fetchData();
            } catch (error) {
                console.error("Error updating service point:", error.response ? error.response.data : error.message);
                Swal.fire('Error', 'Failed to update service', 'error');
            }
        } else if (jobTitle === 'Customer Service Officer') {
            const nextOptions = { O2C: 'O2C', Finance: 'Finance' };
            const { value: selectedRole, isConfirmed } = await Swal.fire({
                title: 'Select next service point',
                input: 'select',
                inputOptions: nextOptions,
                inputPlaceholder: 'Select',
                showCancelButton: true,
            });
            if (!isConfirmed) return;

            let assignedOfficerId = customer.assigned_officer_id;
            let newStatus = customer.status;

            if (selectedRole === 'O2C') {
                if (!customer.assigned_officer_id) {
                    const { value: selectedUserId, isConfirmed: userConfirmedAssignment } = await Swal.fire({
                        title: 'Assign O2C Officer',
                        input: 'select',
                        inputOptions: employees.filter(emp => emp.jobTitle === 'O2C Officer').reduce((acc, emp) => { acc[emp.id] = emp.full_name; return acc; }, {}),
                        inputPlaceholder: 'Select an O2C Officer',
                        showCancelButton: true,
                    });
                    if (!userConfirmedAssignment) {
                        Swal.fire('Cancelled', 'No O2C Officer assigned. Action cancelled.', 'info');
                        return;
                    }
                    assignedOfficerId = selectedUserId;
                } else {
                    Swal.fire('Info', 'O2C Officer is already assigned. Keeping current assignment.', 'info');
                }
                newStatus = 'started';
            }

            try {
                await updateServiceStatus(
                    customer,
                    newStatus,
                    customer.started_at,
                    assignedOfficerId,
                    selectedRole
                );
                Swal.fire('Updated!', `Service point updated to ${selectedRole}.`, 'success');
                fetchData();
            } catch (error) {
                console.error("Error updating service point:", error.response ? error.response.data : error.message);
                Swal.fire('Error', 'Failed to update service', 'error');
            }
        } else if (jobTitle === 'EWM Officer') {
            await completeStoreTask(customer);
        } else {
            Swal.fire("Notice", "Unhandled service point or user role. Please check the data.", "info");
        }
    };
    

    const handleEditOdn = async (customer) => {
        const stores = [];
        if (customer.store_id_1) stores.push('AA1');
        if (customer.store_id_2) stores.push('AA2');
        if (customer.store_id_3) stores.push('AA3');

        const odnMap = {
            'AA1': customer.aa1_odn || '',
            'AA2': customer.aa2_odn || '',
            'AA3': customer.aa3_odn || '',
        };

        let htmlContent = '';
        stores.forEach(store => {
            const storeStatus = customer[`store_completed_${store.slice(-1)}`];
            const isStarted = storeStatus === 'ewm_started' || storeStatus === 'ewm_completed';
            const message = isStarted ? `(Process ${storeStatus})` : '';
            const readOnly = isStarted ? 'readonly' : '';

            htmlContent += `
                <div style="margin-top: 10px;">
                    <label for="odn-${store}" style="display: block; text-align: left;">ODN for ${store}:</label>
                    <input id="odn-${store}" class="swal2-input" value="${odnMap[store]}" placeholder="Enter ODN for ${store}" ${readOnly}>
                    ${message ? `<p style="color: red; font-size: 0.8em; margin: 5px 0 0;">${message}</p>` : ''}
                </div>
            `;
        });

        const result = await Swal.fire({
            title: 'Edit ODN for Stores',
            html: htmlContent,
            showCancelButton: true,
            confirmButtonText: 'Save Changes',
            preConfirm: () => {
                const newOdnMap = {};
                let hasUnfilledField = false;
                stores.forEach(store => {
                    const inputElement = document.getElementById(`odn-${store}`);
                    const storeStatus = customer[`store_completed_${store.slice(-1)}`];
                    
                    if (storeStatus === 'o2c_completed') {
                        const odn = inputElement.value;
                        if (!odn) {
                            hasUnfilledField = true;
                        }
                        newOdnMap[store] = odn;
                    } else {
                        newOdnMap[store] = odnMap[store];
                    }
                });
                if (hasUnfilledField) {
                    Swal.showValidationMessage('All editable ODN fields must be filled out.');
                    return false;
                }
                return newOdnMap;
            }
        });

        if (result.isConfirmed) {
            const newOdnMap = result.value;
            const updateData = {
                aa1_odn: newOdnMap['AA1'],
                aa2_odn: newOdnMap['AA2'],
                aa3_odn: newOdnMap['AA3'],
            };
            try {
                await updateServiceStatus(
                    customer,
                    customer.status,
                    customer.started_at,
                    customer.assigned_officer_id,
                    customer.next_service_point,
                    undefined,
                    updateData
                );
                Swal.fire('Success', 'ODNs have been updated.', 'success');
                fetchData();
            } catch (error) {
                console.error("Error updating ODNs:", error.response ? error.response.data : error.message);
                Swal.fire('Error', 'Failed to update ODNs', 'error');
            }
        }
    };

    const handleRevert = async (customer) => {
        const storeMapping = {
            'AA1': 'store_completed_1',
            'AA2': 'store_completed_2',
            'AA3': 'store_completed_3',
        };
        const myStoreCompletedField = storeMapping[normalizedUserStore];
        
        if (myStoreCompletedField) {
            const payload = {
                id: customer.id,
                [myStoreCompletedField]: 'o2c_completed',
            };
            try {
                await axios.put(`${api_url}/api/update-service-point`, payload);
                Swal.fire('Success', 'Your store\'s process has been reverted.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'Failed to revert your store\'s process.', 'error');
            }
        } else {
            Swal.fire('Error', 'Invalid store configuration for reversion.', 'error');
        }
    };
    
    const handleEWMStart = async (customer) => {
        const storeMapping = {
            'AA1': 'store_completed_1',
            'AA2': 'store_completed_2',
            'AA3': 'store_completed_3',
        };
        const myStoreCompletedField = storeMapping[normalizedUserStore];
        
        if (myStoreCompletedField) {
            const payload = {
                id: customer.id,
                [myStoreCompletedField]: 'ewm_started',
            };
            try {
                await axios.put(`${api_url}/api/update-service-point`, payload);
                Swal.fire('Success', 'Your store\'s process has started.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'Failed to start your store\'s process.', 'error');
            }
        } else {
            Swal.fire('Error', 'Invalid store configuration.', 'error');
        }
    };
    
    const canO2CEditODN = (customer) => {
        const hasStores = customer.store_id_1 || customer.store_id_2 || customer.store_id_3;
        if (!hasStores || customer.next_service_point?.toLowerCase() !== 'ewm') return false;

        const storesCompleted = [customer.store_completed_1, customer.store_completed_2, customer.store_completed_3]
            .filter(Boolean)
            .every(s => s === 'ewm_completed');
        
        return !storesCompleted;
    };
    
    const filterAndSortCustomers = useMemo(() => {
        if (!jobTitle || !userId) return [];
        let filtered = [];
        if (jobTitle === "Admin") {
            filtered = customers;
        } else if (jobTitle === "O2C Officer") {
            filtered = customers.filter(c =>
                String(c.assigned_officer_id) === String(userId) &&
                (c.next_service_point?.toLowerCase() === 'o2c' || c.next_service_point?.toLowerCase() === 'ewm') &&
                c.status?.toLowerCase() !== 'completed'
            );
            filtered.sort((a, b) => {
                const statusA = a.status?.toLowerCase();
                const statusB = b.status?.toLowerCase();
                if (statusA === 'o2c_completed' && statusB !== 'o2c_completed') return 1;
                if (statusA !== 'o2c_completed' && statusB === 'o2c_completed') return -1;
                return 0;
            });
        } else if (jobTitle === 'Manager') {
            filtered = customers.filter(c =>
                c.next_service_point?.toLowerCase() === 'manager' &&
                c.status?.toLowerCase() !== 'rejected' &&
                c.status?.toLowerCase() !== 'approved'
            );
        } else if (jobTitle === 'Queue Manager') {
            const storeMapping = {
                'AA1': { storeIdField: 'store_id_1', completedField: 'store_completed_1', availabilityField: 'availability_aa1' },
                'AA2': { storeIdField: 'store_id_2', completedField: 'store_completed_2', availabilityField: 'availability_aa2' },
                'AA3': { storeIdField: 'store_id_3', completedField: 'store_completed_3', availabilityField: 'availability_aa3' },
            };
            const myStoreProps = storeMapping[normalizedUserStore];
            if (!myStoreProps) return [];
            
            filtered = customers.filter(c =>
                c.next_service_point?.toLowerCase() === 'ewm' &&
                c[myStoreProps.storeIdField] === normalizedUserStore &&
                c[myStoreProps.completedField] !== 'ewm_completed'
            );
        } else {
            const jobTitleToServicePointMap = {
                "Customer Service Officer": "customer service", "EWM Officer": "ewm", "Finance": "finance"
            };
            const normalizedJobTitle = jobTitleToServicePointMap[jobTitle] || jobTitle.toLowerCase();
            
            if (jobTitle === "EWM Officer") {
                const storeToCheck = normalizedUserStore.toLowerCase();
                const storeMapping = {
                    'aa1': { storeIdField: 'store_id_1', odn: 'aa1_odn', completed: 'store_completed_1', availability: 'availability_aa1' },
                    'aa2': { storeIdField: 'store_id_2', odn: 'aa2_odn', completed: 'store_completed_2', availability: 'availability_aa2' },
                    'aa3': { storeIdField: 'store_id_3', odn: 'aa3_odn', completed: 'store_completed_3', availability: 'availability_aa3' },
                };
                const storeProps = storeMapping[storeToCheck];
                
                if (storeProps) {
                    filtered = customers.filter(c =>
                        c.next_service_point?.toLowerCase() === normalizedJobTitle &&
                        c[storeProps.storeIdField] === normalizedUserStore &&
                        c[storeProps.completed] !== 'ewm_completed'
                    );
                } else {
                    filtered = [];
                }
            } else {
                filtered = customers.filter(c => c.next_service_point?.toLowerCase() === normalizedJobTitle);
            }
        }
        return filtered;
    }, [customers, jobTitle, userId, normalizedUserStore]);


    const getOutboundDeliveryNumber = (customer) => {
        if (customer.store_id_1 === normalizedUserStore) {
            return customer.aa1_odn || 'N/A';
        }
        if (customer.store_id_2 === normalizedUserStore) {
            return customer.aa2_odn || 'N/A';
        }
        if (customer.store_id_3 === normalizedUserStore) {
            return customer.aa3_odn || 'N/A';
        }
        return 'N/A';
    };
    
    const getStoreStatus = (customer, storeId) => {
        if (storeId === 'AA1') return customer.store_completed_1 || 'N/A';
        if (storeId === 'AA2') return customer.store_completed_2 || 'N/A';
        if (storeId === 'AA3') return customer.store_completed_3 || 'N/A';
        return 'N/A';
    };

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
                    .outstanding-card {
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                        background: rgba(255, 255, 255, 0.95);
                        border-radius: 20px;
                        border: 1px solid rgba(25, 118, 210, 0.1);
                    }
                    .outstanding-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    }
                    .header-gradient {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                        background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
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
                <Card className="outstanding-card animate-fade-in" elevation={0}>
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
                                <AssignmentIcon fontSize="large" />
                            </Avatar>
                            <Box>
                                <Typography variant="h3" fontWeight="bold" sx={{ 
                                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    mb: 1
                                }}>
                                    Outstanding Customers
                                </Typography>
                                <Typography variant="h6" sx={{ 
                                    opacity: 0.9, 
                                    fontWeight: 300,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                    Manage and track customer service requests
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Content Section */}
                    <Box sx={{ p: 4 }}>
                        {loading ? (
                            <Fade in={loading}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    py: 8,
                                    gap: 3
                                }}>
                                    <CircularProgress size={60} thickness={4} />
                                    <Typography variant="h6" color="text.secondary">
                                        Loading customer data...
                                    </Typography>
                                </Box>
                            </Fade>
                        ) : (
                            <TableContainer component={Paper} className="enhanced-table">
                                <Table>
                                    <TableHead className="table-header">
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <PeopleIcon fontSize="small" />
                                                    <span>Facility</span>
                                                </Stack>
                                            </TableCell>
                                            {jobTitle === 'Queue Manager' && (
                                                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>
                                                    Woreda
                                                </TableCell>
                                            )}
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>
                                                Customer Type
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <TrendingUpIcon fontSize="small" />
                                                    <span>Waiting</span>
                                                </Stack>
                                            </TableCell>
                                            {jobTitle === 'EWM Officer' && (
                                                <>
                                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>My ODN</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }} align="center">Action</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }} align="center">Availability</TableCell>
                                                </>
                                            )}

                                            {/* Queue Manager Columns */}
                                            {jobTitle === 'Queue Manager' && <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Current Service Point</TableCell>}
                                            {jobTitle === 'Queue Manager' && <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>My ODN</TableCell>}
                                            {jobTitle === 'Queue Manager' && <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Availability</TableCell>}

                                            {jobTitle === 'O2C Officer' && <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Action</TableCell>}

                                            {jobTitle === 'Manager' && <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Current Service Point</TableCell>}
                                            {jobTitle === 'Manager' && <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Status</TableCell>}
                                            {jobTitle === 'Manager' && <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Action</TableCell>}

                                            {jobTitle === 'Customer Service Officer' && <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Current Service Point</TableCell>}
                                            {jobTitle === 'Customer Service Officer' && <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Status</TableCell>}
                                            {jobTitle === 'Customer Service Officer' && <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Action</TableCell>}

                                            {jobTitle === 'Finance' && <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Current Service Point</TableCell>}
                                            {jobTitle === 'Finance' && <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Status</TableCell>}
                                            {jobTitle === 'Finance' && <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'text.primary' }}>Action</TableCell>}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center">
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        ) : filterAndSortCustomers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center">
                                                    No outstanding customers found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filterAndSortCustomers.map((customer) => {
                                const { name, woreda } = getFacilityDetails(customer.facility_id);
                                const normalizedStatus = customer.status ? String(customer.status).trim().toLowerCase() : null;
                                const isO2CCompleted = customer.next_service_point?.toLowerCase() === 'ewm';
                                const rowStyle = (jobTitle === 'O2C Officer' && isO2CCompleted) ? { backgroundColor: '#f0f0f0' } : {};
                                
                                const showNotifyButton = customer.next_service_point?.toLowerCase() === 'o2c' && (normalizedStatus === null || normalizedStatus === '' || normalizedStatus === 'started');
                                const showStartAndStopButtons = normalizedStatus === 'notifying';
                                const showCompleteButton = normalizedStatus === 'o2c_started';

                                const myStoreStatus = getStoreStatus(customer, normalizedUserStore);
                                const showEWMStartButton = myStoreStatus === 'o2c_completed';
                                const showEWMCompleteAndRevertButtons = myStoreStatus === 'ewm_started';
                                
                                return (
                                    <TableRow key={customer.id} sx={rowStyle}>
                                        <TableCell>{name}</TableCell>
                                        {jobTitle === 'Queue Manager' && <TableCell>{woreda}</TableCell>}
                                        <TableCell>{customer.customer_type}</TableCell>
                                        <TableCell>{getWaitingHours(customer.started_at)}</TableCell>

                                        {jobTitle === 'EWM Officer' && (
                                            <>
                                                <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{getStoreODN(customer)}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        {showEWMStartButton && (
                                                            <Button
                                                                variant="contained"
                                                                color="info"
                                                                onClick={() => handleEWMStart(customer)}
                                                                size="small"
                                                            >
                                                                Start
                                                            </Button>
                                                        )}
                                                        {showEWMCompleteAndRevertButtons && (
                                                            <>
                                                                <Button
                                                                    variant="contained"
                                                                    color="secondary"
                                                                    onClick={() => handleRevert(customer)}
                                                                    size="small"
                                                                >
                                                                    Revert
                                                                </Button>
                                                                <Button
                                                                    variant="contained"
                                                                    color="success"
                                                                    onClick={() => handleComplete(customer)}
                                                                    size="small"
                                                                >
                                                                    Complete
                                                                </Button>
                                                                <Button
                                                                        variant="outlined"
                                                                        color="primary"
                                                                        onClick={() => handleDetail(customer.id)}
                                                                        size="small"
                                                                    >
                                                                        Detail
                                                                    </Button>
                                                            </>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ textAlign: 'center' }}>
                                                    {customer[`availability_${normalizedUserStore.toLowerCase()}`] === 'A' ? (
                                                        <CheckCircleIcon color="success" />
                                                    ) : (
                                                        <CancelIcon color="error" />
                                                    )}
                                                </TableCell>
                                            </>
                                        )}
                                        
                                        {jobTitle === 'Queue Manager' && (
                                            <>
                                                <TableCell>{customer.next_service_point || 'N/A'}</TableCell>
                                                {/* START: ODN Wrapping for Queue Manager */}
                                                <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                    {getOutboundDeliveryNumber(customer)}
                                                </TableCell>
                                                {/* END: ODN Wrapping for Queue Manager */}
                                                <TableCell>
                                                    <Checkbox
                                                        checked={
                                                            (normalizedUserStore === 'AA1' && customer.availability_aa1 === 'A') ||
                                                            (normalizedUserStore === 'AA2' && customer.availability_aa2 === 'A') ||
                                                            (normalizedUserStore === 'AA3' && customer.availability_aa3 === 'A')
                                                        }
                                                        onChange={(e) => handleAvailabilityChange(customer, e.target.checked)}
                                                    />
                                                </TableCell>
                                            </>
                                        )}

                                        {jobTitle === 'O2C Officer' && (
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                    {isO2CCompleted && (
                                                        <>
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() => handleEditOdn(customer)}
                                                                size="small"
                                                                disabled={!canO2CEditODN(customer)}
                                                            >
                                                                Edit ODN
                                                            </Button>
                                                            {canCancel(customer) && (
                                                                <Button
                                                                    variant="contained"
                                                                    color="error"
                                                                    onClick={() => handleCancel(customer)}
                                                                    size="small"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                    {!isO2CCompleted && (
                                                        <>
                                                            {(showNotifyButton && !showStartAndStopButtons) && (
                                                                <Button
                                                                    variant="outlined"
                                                                    onClick={() => handleShare(customer)}
                                                                    size="small"
                                                                >
                                                                    Share
                                                                </Button>
                                                            )}
                                                            {showNotifyButton && (
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    onClick={() => handleO2CStatusFlow(customer, 'notify')}
                                                                    size="small"
                                                                >
                                                                    Notify
                                                                </Button>
                                                            )}
                                                            {showStartAndStopButtons && (
                                                                <>
                                                                    <Button
                                                                        variant="contained"
                                                                        color="success"
                                                                        onClick={() => handleO2CStatusFlow(customer, 'start')}
                                                                        size="small"
                                                                    >
                                                                        Start
                                                                    </Button>
                                                                    <Button
                                                                        variant="contained"
                                                                        color="secondary"
                                                                        onClick={() => handleO2CStatusFlow(customer, 'stop')}
                                                                        size="small"
                                                                    >
                                                                        Stop
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {showCompleteButton && (
                                                                <Button
                                                                    variant="contained"
                                                                    color="success"
                                                                    onClick={() => handleComplete(customer)}
                                                                    size="small"
                                                                >
                                                                    Complete
                                                                </Button>
                                                            )}
                                                            {canCancel(customer) && (
                                                                <Button
                                                                    variant="contained"
                                                                    color="error"
                                                                    onClick={() => handleCancel(customer)}
                                                                    size="small"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        )}

                                        {jobTitle === 'Manager' && (
                                            <>
                                                <TableCell>{customer.next_service_point || "N/A"}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={customer.status || 'pending'}
                                                        color={customer.status === 'rejected' ? 'error' : customer.status === 'approved' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button
                                                            variant="contained"
                                                            color="success"
                                                            onClick={() => handleApprove(customer)}
                                                            size="small"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            color="error"
                                                            onClick={() => handleReject(customer)}
                                                            size="small"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </>
                                        )}
                                        {jobTitle === 'Finance' && (
                                            <>
                                                <TableCell>{customer.next_service_point || "N/A"}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={customer.status || 'pending'}
                                                        color={customer.status === 'rejected' ? 'error' : customer.status === 'approved' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() => handleComplete(customer)}
                                                        size="small"
                                                    >
                                                        Complete
                                                    </Button>
                                                </TableCell>
                                            </>
                                        )}
                                        {jobTitle === 'Customer Service Officer' && (
                                            <>
                                                <TableCell>{customer.next_service_point || "N/A"}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={customer.status || 'pending'}
                                                        color={customer.status === 'rejected' ? 'error' : customer.status === 'approved' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() => handleComplete(customer)}
                                                        size="small"
                                                    >
                                                        Complete
                                                    </Button>
                                                </TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                );
                                            })
                                        )}
                                    </TableBody>
                </Table>
                            </TableContainer>
                        )}
                    </Box>
                </Card>
            </Container>
        </>
    );
};

export default OutstandingCustomers;