import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Typography, CircularProgress, Box, Chip, Checkbox, IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate } from 'react-router-dom';

const OutstandingCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [employees, setEmployees] = useState([]);
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
            const [facilityRes, employeeRes] = await Promise.all([
                axios.get(`${api_url}/api/facilities`),
                axios.get(`${api_url}/api/get-employee`),
            ]);
            setFacilities(facilityRes.data);
            setEmployees(employeeRes.data);
        } catch (error) {
            console.error("Error fetching static data:", error.response ? error.response.data : error.message);
            Swal.fire('Error', 'Failed to fetch facility or employee data.', 'error');
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
            await axios.put(`${api_url}/api/update-service-point`, completionData);

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
                    'Customer',
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

        if (action === 'notify') {
            newStatus = 'notifying';
        } else if (action === 'start') {
            newStatus = 'o2c_started';
            if (!customer.started_at || customer.status !== 'o2c_started') {
                startedAt = new Date().toISOString();
            }
        } else if (action === 'stop') {
            newStatus = 'started';
            startedAt = null;
        }
        await updateServiceStatus(customer, newStatus, startedAt);
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
                const { value: selectedStores, isConfirmed: storeConfirmed } = await Swal.fire({
                    title: 'Select Store(s)',
                    html: `
                        <div style="text-align:left;line-height:1.9">
                          <label><input type="checkbox" id="storeAA1" value="AA1"> AA1</label><br/>
                          <label><input type="checkbox" id="storeAA2" value="AA2"> AA2</label><br/>
                          <label><input type="checkbox" id="storeAA3" value="AA3"> AA3</label>
                        </div>
                    `,
                    focusConfirm: false,
                    showCancelButton: true,
                    confirmButtonText: 'Next',
                    preConfirm: () => {
                        const picks = [];
                        const a1 = document.getElementById('storeAA1');
                        const a2 = document.getElementById('storeAA2');
                        const a3 = document.getElementById('storeAA3');
                        if (a1 && a1.checked) picks.push('AA1');
                        if (a2 && a2.checked) picks.push('AA2');
                        if (a3 && a3.checked) picks.push('AA3');
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
                    store_completed_1: selectedStores.includes('AA1') ? 'o2c_completed' : 'ewm_completed',
                    store_completed_2: selectedStores.includes('AA2') ? 'o2c_completed' : 'ewm_completed',
                    store_completed_3: selectedStores.includes('AA3') ? 'o2c_completed' : 'ewm_completed',
                };
            } else {
                updateData = {
                    aa1_odn: null, aa2_odn: null, aa3_odn: null,
                    store_id_1: null, store_id_2: null, store_id_3: null,
                    store_completed_1: 'ewm_completed', store_completed_2: 'ewm_completed', store_completed_3: 'ewm_completed',
                };
            }

            try {
                await updateServiceStatus(
                    customer,
                    newStatus,
                    null,
                    undefined,
                    nextServicePoint,
                    undefined,
                    updateData
                );
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
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                Outstanding Customers
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>Facility</TableCell>
                            {jobTitle === 'Queue Manager' && <TableCell>Woreda</TableCell>}
                            <TableCell>Customer Type</TableCell>
                            <TableCell>Waiting</TableCell>
                            {jobTitle === 'EWM Officer' && <TableCell>My ODN</TableCell>}
                            {jobTitle === 'EWM Officer' && <TableCell>Action</TableCell>}
                            {jobTitle === 'EWM Officer' && <TableCell>Availability</TableCell>}

                            {/* START: Queue Manager Column Headers */}
                            {jobTitle === 'Queue Manager' && <TableCell>Current Service Point</TableCell>}
                            {jobTitle === 'Queue Manager' && <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>My ODN</TableCell>}
                            {jobTitle === 'Queue Manager' && <TableCell>Availability</TableCell>}
                            {/* END: Queue Manager Column Headers */}

                            {jobTitle === 'O2C Officer' && <TableCell>Action</TableCell>}

                            {jobTitle === 'Manager' && <TableCell>Current Service Point</TableCell>}
                            {jobTitle === 'Manager' && <TableCell>Status</TableCell>}
                            {jobTitle === 'Manager' && <TableCell>Action</TableCell>}

                            {jobTitle === 'Customer Service Officer' && <TableCell>Current Service Point</TableCell>}
                            {jobTitle === 'Customer Service Officer' && <TableCell>Status</TableCell>}
                            {jobTitle === 'Customer Service Officer' && <TableCell>Action</TableCell>}

                            {jobTitle === 'Finance' && <TableCell>Current Service Point</TableCell>}
                            {jobTitle === 'Finance' && <TableCell>Status</TableCell>}
                            {jobTitle === 'Finance' && <TableCell>Action</TableCell>}
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
        </Box>
    );
};

export default OutstandingCustomers;