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
import OdnRdfManager from './OdnRdfManager';
 
const OutstandingCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [customerOdns, setCustomerOdns] = useState({}); // Store ODNs by customer ID
    
    // ODN Manager state
    const [odnManagerOpen, setOdnManagerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

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
            const customerRes = await axios.get(`${api_url}/api/serviceList`, {
                params: { store: normalizedUserStore }
            });
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
    
    const fetchOdnsForCustomers = async (customerIds) => {
        if (customerIds.length === 0) return;
        
        try {
            // Fetch ODNs for each customer
            const odnPromises = customerIds.map(customerId => 
                axios.get(`${api_url}/api/rdf-odns/${customerId}`)
                    .then(res => ({ customerId, odns: res.data.odns || [] }))
                    .catch(err => {
                        console.error(`Failed to fetch ODNs for customer ${customerId}:`, err);
                        return { customerId, odns: [] };
                    })
            );
            
            const results = await Promise.all(odnPromises);
            
            // Build ODN map
            const odnMap = {};
            results.forEach(({ customerId, odns }) => {
                odnMap[customerId] = odns;
            });
            
            setCustomerOdns(odnMap);
        } catch (error) {
            console.error('Error fetching ODNs:', error);
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
        const interval = setInterval(fetchData, 60000); // Poll every 60 seconds (reduced from 30)
        
        return () => clearInterval(interval);
    }, []);
    
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
            // Queue Manager sees customers with O2C completed status that have ODNs for their store
            // This is now handled by the Queue Manager component itself
            filtered = [];
        } else {
            const jobTitleToServicePointMap = {
                "Customer Service Officer": "customer service", "EWM Officer": "ewm", "Finance": "finance"
            };
            const normalizedJobTitle = jobTitleToServicePointMap[jobTitle] || jobTitle.toLowerCase();
            
            if (jobTitle === "EWM Officer") {
                // For EWM Officers, show customers that have ODNs for their store
                // and where next_service_point is 'ewm'
                filtered = customers.filter(c =>
                    c.next_service_point?.toLowerCase() === 'ewm' &&
                    c.odn_numbers // Has ODNs for this store
                );
            } else {
                filtered = customers.filter(c => c.next_service_point?.toLowerCase() === normalizedJobTitle);
            }
        }
        return filtered;
    }, [customers, jobTitle, userId, normalizedUserStore]);
    
    // Fetch ODNs when filtered customers change (for EWM Officers only)
    useEffect(() => {
        if (jobTitle === 'EWM Officer' && filterAndSortCustomers.length > 0) {
            const customerIds = filterAndSortCustomers.map(c => c.id);
            fetchOdnsForCustomers(customerIds);
        }
    }, [filterAndSortCustomers, jobTitle]);

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
        // Get ODNs from state for this customer
        const odns = customerOdns[customer.id] || [];
        
        // Filter ODNs for the current user's store
        const storeOdns = odns.filter(odn => odn.store === normalizedUserStore);
        
        if (storeOdns.length === 0) {
            return 'No ODNs';
        }
        
        // Return comma-separated list of ODN numbers
        return storeOdns.map(odn => odn.odn_number).join(', ');
    };

    // Availability is now managed by Queue Manager through odns_rdf table
    // This function is no longer needed
    const handleAvailabilityChange = async (customer, isAvailable) => {
        Swal.fire('Info', 'Availability is now managed by the Queue Manager', 'info');
    };

    const completeStoreTask = async (customer) => {
        try {
            const ewmEndTime = new Date().toISOString();
            
            // Update ODN status to 'ewm_completed' for this store
            const response = await axios.put(`${api_url}/api/odns-rdf/complete-ewm`, {
                process_id: customer.id,
                store: normalizedUserStore,
                officer_id: localStorage.getItem('EmployeeID'),
                officer_name: localStorage.getItem('FullName')
            });

            if (!response.data.success) {
                Swal.fire('Error', 'Failed to complete EWM process', 'error');
                return;
            }

            // Record EWM service time
            try {
                // SIMPLIFIED: Only record end_time
                const ewmEndTime = new Date().toISOString();
                
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
                    service_unit: `EWM ${normalizedUserStore}`,
                    end_time: formatForMySQL(ewmEndTime),
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

            // Check if all stores have completed their ODNs
            const allOdnsResponse = await axios.get(`${api_url}/api/rdf-odns/${customer.id}`);
            const allOdns = allOdnsResponse.data.odns;
            const allCompleted = allOdns.every(odn => odn.ewm_status === 'completed');

            if (allCompleted) {
                // Update customer_queue to move to Dispatch
                // DON'T set completed_at here - only Gate Keeper sets it when allowing exit
                await updateServiceStatus(
                    customer,
                    'ewm_completed',
                    null,
                    undefined,
                    'Dispatch',
                    undefined  // Don't set completed_at
                );
                Swal.fire('Completed!', 'All stores have completed this task. Service is now sent to Dispatch.', 'success');
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
        let startedAt = customer.started_at; // Keep original registration time
        let additionalData = {};

        if (action === 'notify') {
            newStatus = 'notifying';
        } else if (action === 'start') {
            newStatus = 'o2c_started';
            // Don't record o2c_started_at - we only need completion time
            // The start time is implicitly the registration_completed_at or started_at
        } else if (action === 'stop') {
            newStatus = 'started';
            startedAt = null;
        }
        await updateServiceStatus(customer, newStatus, startedAt, undefined, undefined, undefined, additionalData);
    };

    const canCancel = async (customer) => {
        if (customer.next_service_point?.toLowerCase() !== 'ewm') {
            return true; // Allow cancel for non-EWM orders
        }

        // For EWM orders, check if any ODN has started or completed the process
        try {
            const odnResponse = await axios.get(`${api_url}/api/rdf-odns/${customer.id}`);
            const odns = odnResponse.data.odns || [];
            
            const hasStarted = odns.some(odn => 
                odn.ewm_status === 'started' || odn.ewm_status === 'completed'
            );
            
            return !hasStarted;
        } catch (error) {
            console.error('Error checking ODN status:', error);
            return false; // Safer to not allow cancel if we can't check
        }
    };


    const handleCancel = async (customer) => {
        // Check if cancellation is allowed
        const canCancelResult = await canCancel(customer);
        
        if (!canCancelResult) {
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
                // Check if at least one ODN exists for this process
                let existingOdns = [];
                try {
                    const odnResponse = await axios.get(`${api_url}/api/rdf-odns/${customer.id}`);
                    if (!odnResponse.data.success || odnResponse.data.odns.length === 0) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'No ODNs Found',
                            text: 'You must add at least one Outbound Delivery Number (ODN) before sending to EWM. Please use the "Manage ODNs" button to add ODNs.',
                            confirmButtonText: 'OK'
                        });
                        return;
                    }
                    existingOdns = odnResponse.data.odns;
                } catch (error) {
                    console.error('Error checking ODNs:', error);
                    Swal.fire('Error', 'Failed to verify ODNs. Please try again.', 'error');
                    return;
                }
                
                // Get unique stores from existing ODNs
                const storesWithOdns = [...new Set(existingOdns.map(odn => odn.store))];
                
                // Show confirmation with ODN summary
                const odnSummary = storesWithOdns.map(store => {
                    const storeOdns = existingOdns.filter(odn => odn.store === store);
                    return `<strong>${store}:</strong> ${storeOdns.length} ODN(s)`;
                }).join('<br/>');

                const { isConfirmed: finalConfirm } = await Swal.fire({
                    title: 'Confirm Completion',
                    html: `
                        <div style="text-align:left;">
                            <p>You are about to send this process to EWM with the following ODNs:</p>
                            <div style="margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                                ${odnSummary}
                            </div>
                            <p><strong>Total ODNs:</strong> ${existingOdns.length}</p>
                        </div>
                    `,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Complete',
                    cancelButtonText: 'Cancel'
                });

                if (!finalConfirm) {
                    Swal.fire('Cancelled', 'Service completion cancelled.', 'info');
                    return;
                }

                // Set store assignments based on ODNs - no longer needed in customer_queue
                // ODN tracking is now in odns_rdf table
                updateData = {};
            } else {
                // For Finance, no store assignments needed
                updateData = {};
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
                    // SIMPLIFIED: Only record end_time
                    const o2cEndTime = new Date().toISOString();
                    
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
                        end_time: formatForMySQL(o2cEndTime),
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
    

    const handleManageOdns = (customer) => {
        setSelectedCustomer(customer);
        setOdnManagerOpen(true);
    };

    const handleCloseOdnManager = () => {
        setOdnManagerOpen(false);
        setSelectedCustomer(null);
        fetchData(); // Refresh data when closing
    };

    const handleRevert = async (customer) => {
        try {
            // Revert ODN status to 'pending' for this store
            const response = await axios.put(`${api_url}/api/odns-rdf/revert-ewm`, {
                process_id: customer.id,
                store: normalizedUserStore
            });
            
            if (response.data.success) {
                Swal.fire('Success', 'Your store\'s EWM process has been reverted.', 'success');
                fetchData();
            } else {
                Swal.fire('Error', 'Failed to revert your store\'s process.', 'error');
            }
        } catch (error) {
            console.error('Error reverting EWM:', error);
            Swal.fire('Error', 'Failed to revert your store\'s process.', 'error');
        }
    };
    
    const handleEWMStart = async (customer) => {
        // Update ODN status to 'ewm_started' for this store
        try {
            const response = await axios.put(`${api_url}/api/odns-rdf/start-ewm`, {
                process_id: customer.id,
                store: normalizedUserStore,
                officer_id: localStorage.getItem('EmployeeID'),
                officer_name: localStorage.getItem('FullName')
            });
            
            if (response.data.success) {
                Swal.fire('Success', 'EWM process started for your store', 'success');
                fetchData();
            }
        } catch (error) {
            console.error('Error starting EWM:', error);
            Swal.fire('Error', 'Failed to start EWM process', 'error');
        }
    };

    const getOutboundDeliveryNumber = (customer) => {
        // Get ODNs from state for this customer
        const odns = customerOdns[customer.id] || [];
        
        // Filter ODNs for the current user's store
        const storeOdns = odns.filter(odn => odn.store === normalizedUserStore);
        
        if (storeOdns.length === 0) {
            return 'No ODNs';
        }
        
        // Return comma-separated list of ODN numbers
        return storeOdns.map(odn => odn.odn_number).join(', ');
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
                                const isO2CActive = customer.next_service_point?.toLowerCase() === 'o2c';
                                // Show Manage ODNs only after Start button is clicked (status = 'o2c_started')
                                const canManageOdns = normalizedStatus === 'o2c_started' || isO2CCompleted;
                                const rowStyle = (jobTitle === 'O2C Officer' && isO2CCompleted) ? { backgroundColor: '#f0f0f0' } : {};
                                
                                const showNotifyButton = customer.next_service_point?.toLowerCase() === 'o2c' && (normalizedStatus === null || normalizedStatus === '' || normalizedStatus === 'started');
                                const showStartAndStopButtons = normalizedStatus === 'notifying';
                                const showCompleteButton = normalizedStatus === 'o2c_started';

                                const myStoreStatus = getStoreODN(customer);
                                
                                // Get ODN status for this store
                                const storeOdns = customerOdns[customer.id]?.filter(odn => odn.store === normalizedUserStore) || [];
                                const hasStartedOdns = storeOdns.some(odn => odn.ewm_status === 'started');
                                const allCompleted = storeOdns.length > 0 && storeOdns.every(odn => odn.ewm_status === 'completed');
                                
                                // Show Start button if no ODNs have been started yet
                                const showEWMStartButton = !hasStartedOdns && !allCompleted;
                                // Show Complete/Revert buttons if at least one ODN has been started
                                const showEWMCompleteAndRevertButtons = hasStartedOdns && !allCompleted;
                                
                                return (
                                    <TableRow key={customer.id} sx={rowStyle}>
                                        <TableCell>{name}</TableCell>
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
                                                    {customer.is_available === 1 ? (
                                                        <CheckCircleIcon color="success" />
                                                    ) : (
                                                        <CancelIcon color="error" />
                                                    )}
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
                                                                onClick={() => handleManageOdns(customer)}
                                                                size="small"
                                                            >
                                                                Manage ODNs
                                                            </Button>
                                                            <Button
                                                                variant="contained"
                                                                color="error"
                                                                onClick={() => handleCancel(customer)}
                                                                size="small"
                                                            >
                                                                Cancel
                                                            </Button>
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
                                                            {/* Show Manage ODNs button only after Start is clicked */}
                                                            {showCompleteButton && (
                                                                <Button
                                                                    variant="contained"
                                                                    color="info"
                                                                    onClick={() => handleManageOdns(customer)}
                                                                    size="small"
                                                                >
                                                                    Manage ODNs
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="contained"
                                                                color="error"
                                                                onClick={() => handleCancel(customer)}
                                                                size="small"
                                                            >
                                                                Cancel
                                                            </Button>
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
            
            {/* ODN Manager Dialog */}
            {selectedCustomer && (
                <OdnRdfManager
                    open={odnManagerOpen}
                    onClose={handleCloseOdnManager}
                    processId={selectedCustomer.id}
                    facilityName={getFacilityDetails(selectedCustomer.facility_id).name}
                />
            )}
        </>
    );
};

export default OutstandingCustomers;