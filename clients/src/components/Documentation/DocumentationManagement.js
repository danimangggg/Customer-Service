import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Card, CardContent, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, Grid, LinearProgress, Alert,
  Checkbox, TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment
} from '@mui/material';
import {
  Description as DocumentIcon,
  Assignment as ODNIcon,
  Business as FacilityIcon,
  CheckCircle as ConfirmedIcon,
  Cancel as NotConfirmedIcon,
  CalendarToday as CalendarTodayIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Route as RouteIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const PODCheckbox = ({ odn, pendingUpdates, onPODChange }) => {
  const getPODStatus = () => {
    // Check pending updates first
    const pendingUpdate = pendingUpdates[odn.odn_id];
    if (pendingUpdate !== undefined) {
      return Boolean(pendingUpdate.pod_confirmed);
    }
    // Use database value
    return Boolean(Number(odn.pod_confirmed));
  };

  const handleChange = (e) => {
    onPODChange(odn.odn_id, e.target.checked);
  };

  const isChecked = getPODStatus();

  return (
    <Box textAlign="center">
      <Checkbox
        checked={isChecked}
        onChange={handleChange}
        color="success"
        size="medium"
        inputProps={{ 'aria-label': `POD confirmation for ODN ${odn.odn_number}` }}
      />
      <Typography variant="caption" display="block" sx={{ 
        mt: 0.5,
        color: isChecked ? 'success.main' : 'warning.main',
        fontWeight: 'bold'
      }}>
        {isChecked ? '✓ Confirmed' : '⚠ Pending'}
      </Typography>
    </Box>
  );
};

const DocumentationManagement = () => {
  const [odnData, setODNData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [autoSaving, setAutoSaving] = useState(false);

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isDocumentationOfficer = userJobTitle === 'Documentation Officer';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  // Ethiopian calendar function
  const getCurrentEthiopianMonth = () => {
    const gDate = new Date();
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth();
    const gd = gDate.getDate();
    
    const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
    const newYearDay = isLeap ? 12 : 11;
    
    let ethYear, ethMonthIndex;
    
    if (gm > 8 || (gm === 8 && gd >= newYearDay)) {
      ethYear = gy - 7;
      const newYearDate = new Date(gy, 8, newYearDay);
      const diffDays = Math.floor((gDate - newYearDate) / (24 * 60 * 60 * 1000));
      
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12;
      }
    } else {
      ethYear = gy - 8;
      const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
      const prevNewYearDay = prevIsLeap ? 12 : 11;
      const prevNewYearDate = new Date(gy - 1, 8, prevNewYearDay);
      const diffDays = Math.floor((gDate - prevNewYearDate) / (24 * 60 * 60 * 1000));
      
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12;
      }
    }
    
    ethMonthIndex = Math.max(0, Math.min(ethMonthIndex, 12));
    
    return {
      month: ethiopianMonths[ethMonthIndex],
      year: ethYear,
      monthIndex: ethMonthIndex
    };
  };

  const currentEthiopian = getCurrentEthiopianMonth();

  useEffect(() => {
    // Set default to a month that has data (based on diagnosis results)
    // Available months: Tahsas 2018, Hidar 2018, Tir 2018
    setSelectedMonth('Tahsas'); // This month has the most data (6 processes)
    setSelectedYear('2018');
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchDispatchedODNs();
      fetchStats();
    }
  }, [selectedMonth, selectedYear, searchTerm, page, rowsPerPage]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(reasonTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const fetchDispatchedODNs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate required parameters
      if (!selectedMonth || !selectedYear) {
        setError("Please select both month and year to load ODNs.");
        return;
      }
      
      console.log('Fetching ODNs with params:', {
        month: selectedMonth,
        year: selectedYear,
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm
      });
      
      const response = await axios.get(`${api_url}/api/dispatched-odns`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        }
      });
      
      console.log('API Response:', response.data);
      
      if (response.data.odns) {
        setODNData(response.data.odns);
        
        // Show informative message if no ODNs found
        if (response.data.odns.length === 0) {
          setError(`No ODNs found for ${selectedMonth} ${selectedYear}. ${response.data.message || 'Try selecting a different month/year.'}`);
        }
      } else {
        setODNData([]);
        setError("No ODN data received from server.");
      }
      
    } catch (err) {
      console.error("Fetch error:", err);
      
      let errorMessage = "Failed to load dispatched ODNs. ";
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 400) {
          errorMessage += `Invalid parameters: ${data.error || 'Please check month and year selection.'}`;
        } else if (status === 500) {
          errorMessage += `Server error: ${data.details || data.error || 'Please try again or contact support.'}`;
        } else {
          errorMessage += `HTTP ${status}: ${data.error || 'Please try again.'}`;
        }
      } else if (err.request) {
        // Network error
        errorMessage += "Network error. Please check your connection and try again.";
      } else {
        // Other error
        errorMessage += err.message || "Please try again.";
      }
      
      setError(errorMessage);
      setODNData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!selectedMonth || !selectedYear) {
        return; // Don't fetch stats without valid parameters
      }
      
      const response = await axios.get(`${api_url}/api/documentation/stats`, {
        params: {
          month: selectedMonth,
          year: selectedYear
        }
      });
      
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
      // Don't show error for stats, just log it
      setStats({
        totalDispatched: 0,
        confirmedPODs: 0,
        pendingPODs: 0
      });
    }
  };

  const handlePODConfirmationChange = async (odnId, confirmed) => {
    // Get current reason from ODN data or pending updates
    const currentODN = odnData.find(odn => odn.odn_id === odnId);
    const currentReason = pendingUpdates[odnId]?.pod_reason || currentODN?.pod_reason || '';

    // If confirming POD, collect POD number and arrival kilometer
    if (confirmed) {
      const { value: formValues } = await MySwal.fire({
        title: 'POD Confirmation Details',
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">POD Number:</label>
            <input id="pod-number" class="swal2-input" placeholder="Enter POD number..." value="${currentODN?.pod_number || ''}" style="margin-bottom: 15px;">
            
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Arrival Kilometer:</label>
            <input id="arrival-km" class="swal2-input" type="number" step="0.01" min="0" placeholder="Enter arrival kilometer..." value="${currentODN?.arrival_kilometer || ''}" style="margin-bottom: 15px;">
            
            <div style="background: #f0f8ff; padding: 10px; border-radius: 5px; margin-top: 10px;">
              <small style="color: #666;">
                <strong>Route:</strong> ${currentODN?.route_name || 'Unknown'}<br>
                <strong>Facility:</strong> ${currentODN?.facility_name || 'Unknown'}
              </small>
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Confirm POD',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
          const podNumber = document.getElementById('pod-number').value;
          const arrivalKm = document.getElementById('arrival-km').value;
          
          if (!podNumber.trim()) {
            MySwal.showValidationMessage('POD number is required');
            return false;
          }
          
          if (!arrivalKm || parseFloat(arrivalKm) < 0) {
            MySwal.showValidationMessage('Valid arrival kilometer is required');
            return false;
          }
          
          return {
            podNumber: podNumber.trim(),
            arrivalKm: parseFloat(arrivalKm)
          };
        }
      });

      if (formValues) {
        // Update UI immediately for instant feedback
        setPendingUpdates(prev => ({
          ...prev,
          [odnId]: {
            ...prev[odnId],
            pod_confirmed: true,
            pod_reason: '',
            pod_number: formValues.podNumber,
            arrival_kilometer: formValues.arrivalKm
          }
        }));

        // Update ODN data for consistent UI
        setODNData(prevData => 
          prevData.map(odn => 
            odn.odn_id === odnId 
              ? { 
                  ...odn, 
                  pod_confirmed: 1,
                  pod_number: formValues.podNumber,
                  arrival_kilometer: formValues.arrivalKm
                }
              : odn
          )
        );

        // Save to database
        try {
          setAutoSaving(true);
          const update = {
            odn_id: parseInt(odnId),
            pod_confirmed: true,
            pod_reason: '',
            pod_number: formValues.podNumber,
            arrival_kilometer: formValues.arrivalKm,
            route_assignment_id: currentODN?.route_assignment_id
          };

          await axios.put(`${api_url}/api/odns/bulk-pod-confirmation`, {
            updates: [update],
            confirmed_by: loggedInUserId
          });

          // Remove from pending updates since it's saved
          setPendingUpdates(prev => {
            const newState = { ...prev };
            delete newState[odnId];
            return newState;
          });

          // Update stats
          fetchStats();

          MySwal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'POD confirmed with details',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

        } catch (err) {
          console.error('Save error:', err);
          // Revert UI changes if save failed
          setODNData(prevData => 
            prevData.map(odn => 
              odn.odn_id === odnId 
                ? { ...odn, pod_confirmed: 0 }
                : odn
            )
          );
          setPendingUpdates(prev => {
            const newState = { ...prev };
            delete newState[odnId];
            return newState;
          });
          MySwal.fire('Error', 'Failed to save POD confirmation.', 'error');
        } finally {
          setAutoSaving(false);
        }
      }
      return;
    }

    // Update UI immediately for instant feedback
    setPendingUpdates(prev => {
      const newState = {
        ...prev,
        [odnId]: {
          ...prev[odnId],
          pod_confirmed: Boolean(confirmed),
          pod_reason: confirmed ? '' : currentReason
        }
      };
      return newState;
    });

    // Update ODN data for consistent UI
    setODNData(prevData => 
      prevData.map(odn => 
        odn.odn_id === odnId 
          ? { ...odn, pod_confirmed: confirmed ? 1 : 0 }
          : odn
      )
    );

    // For unchecked items, require a reason before saving
    if (!confirmed && !currentReason.trim()) {
      // Show a prompt to enter reason
      const { value: reason } = await MySwal.fire({
        title: 'Reason Required',
        text: 'Please provide a reason why POD is not confirmed:',
        input: 'textarea',
        inputPlaceholder: 'Enter reason here...',
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return 'Reason is required when POD is not confirmed';
          }
        }
      });

      if (reason) {
        // Update the reason in pending updates and ODN data
        setPendingUpdates(prev => ({
          ...prev,
          [odnId]: {
            ...prev[odnId],
            pod_confirmed: false,
            pod_reason: reason.trim()
          }
        }));

        // Save with the provided reason
        try {
          setAutoSaving(true);
          const update = {
            odn_id: parseInt(odnId),
            pod_confirmed: false,
            pod_reason: reason.trim(),
            pod_number: currentODN?.pod_number || '',
            arrival_kilometer: currentODN?.arrival_kilometer || null,
            route_assignment_id: currentODN?.route_assignment_id
          };

          await axios.put(`${api_url}/api/odns/bulk-pod-confirmation`, {
            updates: [update],
            confirmed_by: loggedInUserId
          });

          // Remove from pending updates since it's saved
          setPendingUpdates(prev => {
            const newState = { ...prev };
            delete newState[odnId];
            return newState;
          });

          // Update ODN data
          setODNData(prevData => 
            prevData.map(odn => 
              odn.odn_id === odnId 
                ? { ...odn, pod_confirmed: 0, pod_reason: reason.trim() }
                : odn
            )
          );

          // Update stats
          fetchStats();

          MySwal.fire({
            icon: 'success',
            title: 'Saved!',
            text: 'POD marked as not confirmed with reason',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

        } catch (err) {
          console.error('Save error:', err);
          MySwal.fire('Error', 'Failed to save POD confirmation.', 'error');
          // Revert checkbox state
          setODNData(prevData => 
            prevData.map(odn => 
              odn.odn_id === odnId 
                ? { ...odn, pod_confirmed: 1 }
                : odn
            )
          );
        } finally {
          setAutoSaving(false);
        }
      } else {
        // User cancelled, revert the checkbox
        setODNData(prevData => 
          prevData.map(odn => 
            odn.odn_id === odnId 
              ? { ...odn, pod_confirmed: 1 }
              : odn
          )
        );
        setPendingUpdates(prev => {
          const newState = { ...prev };
          delete newState[odnId];
          return newState;
        });
      }
      return;
    }

    // Save to database immediately
    try {
      setAutoSaving(true);
      const update = {
        odn_id: parseInt(odnId),
        pod_confirmed: confirmed,
        pod_reason: confirmed ? '' : currentReason,
        pod_number: currentODN?.pod_number || '',
        arrival_kilometer: currentODN?.arrival_kilometer || null,
        route_assignment_id: currentODN?.route_assignment_id
      };

      await axios.put(`${api_url}/api/odns/bulk-pod-confirmation`, {
        updates: [update],
        confirmed_by: loggedInUserId
      });

      // Remove from pending updates since it's saved
      setPendingUpdates(prev => {
        const newState = { ...prev };
        delete newState[odnId];
        return newState;
      });

      // Update stats
      fetchStats();

      // Show brief success message
      MySwal.fire({
        icon: 'success',
        title: 'Saved!',
        text: confirmed ? 'POD confirmed' : 'POD marked as not confirmed',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
    } catch (err) {
      console.error('Save error:', err);
      // Revert UI changes if save failed
      setODNData(prevData => 
        prevData.map(odn => 
          odn.odn_id === odnId 
            ? { ...odn, pod_confirmed: !confirmed ? 1 : 0 }
            : odn
        )
      );
      setPendingUpdates(prev => {
        const newState = { ...prev };
        delete newState[odnId];
        return newState;
      });
      MySwal.fire('Error', 'Failed to save POD confirmation.', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  const autoSavePODChange = async (odnId, confirmed) => {
    try {
      setAutoSaving(true);
      const update = {
        odn_id: parseInt(odnId),
        pod_confirmed: confirmed,
        pod_reason: confirmed ? '' : (pendingUpdates[odnId]?.pod_reason || '')
      };

      await axios.put(`${api_url}/api/odns/bulk-pod-confirmation`, {
        updates: [update],
        confirmed_by: loggedInUserId
      });

      // Remove from pending updates since it's now saved
      setPendingUpdates(prev => {
        const newState = { ...prev };
        delete newState[odnId];
        return newState;
      });

      // Only refresh stats, not the full data to avoid conflicts
      fetchStats();
      
    } catch (err) {
      console.error('Auto-save error:', err);
      // Revert the local changes if save failed
      setODNData(prevData => 
        prevData.map(odn => 
          odn.odn_id === odnId 
            ? { ...odn, pod_confirmed: !confirmed ? 1 : 0 }
            : odn
        )
      );
      setPendingUpdates(prev => {
        const newState = { ...prev };
        delete newState[odnId];
        return newState;
      });
      MySwal.fire('Error', 'Failed to save POD confirmation. Change reverted.', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  const handleReasonChange = (odnId, reason) => {
    setPendingUpdates(prev => ({
      ...prev,
      [odnId]: {
        ...prev[odnId],
        pod_reason: reason
      }
    }));

    // Auto-save reason after 2 seconds of no typing
    clearTimeout(reasonTimeouts.current[odnId]);
    reasonTimeouts.current[odnId] = setTimeout(async () => {
      try {
        setAutoSaving(true);
        const currentPODStatus = pendingUpdates[odnId]?.pod_confirmed !== undefined 
          ? pendingUpdates[odnId].pod_confirmed 
          : Boolean(Number(odnData.find(odn => odn.odn_id === odnId)?.pod_confirmed));

        const update = {
          odn_id: parseInt(odnId),
          pod_confirmed: currentPODStatus,
          pod_reason: reason
        };

        await axios.put(`${api_url}/api/odns/bulk-pod-confirmation`, {
          updates: [update],
          confirmed_by: loggedInUserId
        });

        // Remove from pending updates
        setPendingUpdates(prev => {
          const newState = { ...prev };
          if (newState[odnId]) {
            delete newState[odnId].pod_reason;
            if (Object.keys(newState[odnId]).length === 0) {
              delete newState[odnId];
            }
          }
          return newState;
        });

        // Show brief success message
        MySwal.fire({
          icon: 'success',
          title: 'Saved!',
          text: 'Reason updated',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });

        // If this was an unchecked item that now has a reason, 
        // save the complete POD status
        if (!currentPODStatus && reason.trim()) {
          // Clear the timeout and save immediately
          clearTimeout(reasonTimeouts.current[odnId]);
          await saveUnconfirmedPOD(odnId, reason);
          return; // Exit early since saveUnconfirmedPOD handles everything
        }
        
      } catch (err) {
        console.error('Reason save error:', err);
      } finally {
        setAutoSaving(false);
      }
    }, 2000);
  };

  const reasonTimeouts = React.useRef({});

  // Helper function to save unchecked POD with reason
  const saveUnconfirmedPOD = async (odnId, reason) => {
    try {
      setAutoSaving(true);
      const update = {
        odn_id: parseInt(odnId),
        pod_confirmed: false,
        pod_reason: reason
      };

      await axios.put(`${api_url}/api/odns/bulk-pod-confirmation`, {
        updates: [update],
        confirmed_by: loggedInUserId
      });

      // Update ODN data
      setODNData(prevData => 
        prevData.map(odn => 
          odn.odn_id === odnId 
            ? { ...odn, pod_confirmed: 0, pod_reason: reason }
            : odn
        )
      );

      // Remove from pending updates
      setPendingUpdates(prev => {
        const newState = { ...prev };
        delete newState[odnId];
        return newState;
      });

      // Update stats
      fetchStats();

      MySwal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'POD marked as not confirmed with reason',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

    } catch (err) {
      console.error('Save unconfirmed POD error:', err);
      MySwal.fire('Error', 'Failed to save POD status.', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  const reasonSaveTimeouts = React.useRef({});

  const autoSaveReasonChange = async (odnId, reason) => {
    try {
      const currentPODStatus = pendingUpdates[odnId]?.pod_confirmed !== undefined 
        ? pendingUpdates[odnId].pod_confirmed 
        : Boolean(Number(odnData.find(odn => odn.odn_id === odnId)?.pod_confirmed));

      const update = {
        odn_id: parseInt(odnId),
        pod_confirmed: currentPODStatus,
        pod_reason: reason
      };

      await axios.put(`${api_url}/api/odns/bulk-pod-confirmation`, {
        updates: [update],
        confirmed_by: loggedInUserId
      });

      // Remove from pending updates since it's now saved
      setPendingUpdates(prev => {
        const newState = { ...prev };
        if (newState[odnId]) {
          delete newState[odnId].pod_reason;
          if (Object.keys(newState[odnId]).length === 0) {
            delete newState[odnId];
          }
        }
        return newState;
      });
      
    } catch (err) {
      console.error('Auto-save reason error:', err);
    }
  };

  const handleSaveUpdates = async () => {
    const updates = Object.entries(pendingUpdates).map(([odn_id, data]) => {
      const currentODN = odnData.find(odn => odn.odn_id === parseInt(odn_id));
      return {
        odn_id: parseInt(odn_id),
        pod_confirmed: data.pod_confirmed,
        pod_reason: data.pod_reason,
        pod_number: data.pod_number,
        arrival_kilometer: data.arrival_kilometer,
        route_assignment_id: currentODN?.route_assignment_id
      };
    });

    if (updates.length === 0) {
      MySwal.fire('Info', 'No changes to save.', 'info');
      return;
    }

    try {
      setAutoSaving(true);
      await axios.put(`${api_url}/api/odns/bulk-pod-confirmation`, {
        updates,
        confirmed_by: loggedInUserId
      });
      
      MySwal.fire('Success!', 'POD confirmations updated successfully.', 'success');
      setPendingUpdates({});
      fetchDispatchedODNs();
      fetchStats();
      
    } catch (err) {
      console.error('Save updates error:', err);
      MySwal.fire('Error', 'Failed to save POD confirmations.', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  const getPODReason = (odn) => {
    const pendingUpdate = pendingUpdates[odn.odn_id];
    if (pendingUpdate !== undefined) {
      return pendingUpdate.pod_reason || '';
    }
    return odn.pod_reason || '';
  };

  // Access control
  if (!isDocumentationOfficer) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to Documentation Officer role only.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            <strong>Current JobTitle:</strong> "{userJobTitle}"
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <style>
        {`
          .doc-card {
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
          }
          .doc-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-left-color: #9c27b0;
          }
          .stats-card {
            background: linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%);
            color: white;
            border-radius: 16px;
          }
          .stats-card-2 {
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white;
            border-radius: 16px;
          }
          .stats-card-3 {
            background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
            color: white;
            border-radius: 16px;
          }
          .header-gradient {
            background: linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%);
            color: white;
            padding: 24px;
            border-radius: 16px 16px 0 0;
          }
        `}
      </style>
      
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Header Section */}
        <Card sx={{ mb: 3, overflow: 'hidden' }}>
          <Box className="header-gradient">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <DocumentIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                  Documentation Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Confirm Proof of Delivery (POD) for dispatched ODNs
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {/* Filters */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Ethiopian Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Ethiopian Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {ethiopianMonths.map((month) => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                inputProps={{ min: 2010, max: 2030 }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search by ODN number or facility name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveUpdates}
                disabled={Object.keys(pendingUpdates).length === 0}
                sx={{ 
                  height: 56,
                  bgcolor: Object.keys(pendingUpdates).length > 0 ? 'warning.main' : 'success.main',
                  '&:hover': {
                    bgcolor: Object.keys(pendingUpdates).length > 0 ? 'warning.dark' : 'success.dark'
                  }
                }}
              >
                {Object.keys(pendingUpdates).length > 0 ? 'Save Remaining' : 'All Saved'}
                {Object.keys(pendingUpdates).length > 0 && (
                  <Chip 
                    label={Object.keys(pendingUpdates).length} 
                    size="small" 
                    sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.3)' }}
                  />
                )}
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card className="stats-card" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <ODNIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalDispatched || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Dispatched
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className="stats-card-2" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <ConfirmedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.confirmedPODs || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    POD Confirmed
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className="stats-card-3" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <NotConfirmedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.pendingPODs || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending POD
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Auto-save indicator */}
        {autoSaving && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LinearProgress sx={{ width: 100 }} />
              <Typography variant="body2">Auto-saving...</Typography>
            </Stack>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            <Typography variant="body2" gutterBottom>
              {error}
            </Typography>
            {error.includes('No ODNs found') && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                💡 Try selecting "Tahsas 2018" or "Hidar 2018" - these months have available data.
              </Typography>
            )}
          </Alert>
        )}

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* ODNs Table */}
        <Card className="doc-card">
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <ODNIcon color="primary" />
                <Typography variant="h6">Dispatched ODNs - POD Confirmation</Typography>
                <Chip 
                  label={`${odnData.length} ODNs`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Stack>
            }
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ODNIcon fontSize="small" />
                      <span>ODN Number</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FacilityIcon fontSize="small" />
                      <span>Facility</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <RouteIcon fontSize="small" />
                      <span>Route</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                      <ConfirmedIcon fontSize="small" />
                      <span>POD Confirmed</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <DocumentIcon fontSize="small" />
                      <span>POD Details</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <NotConfirmedIcon fontSize="small" />
                      <span>Reason (if not confirmed)</span>
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {odnData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((odn, index) => (
                  <TableRow 
                    key={`${odn.odn_id}-${odn.pod_confirmed}-${pendingUpdates[odn.odn_id]?.pod_confirmed || 'none'}`}
                    hover 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      bgcolor: pendingUpdates[odn.odn_id] ? 'warning.50' : 'inherit',
                      borderLeft: pendingUpdates[odn.odn_id] ? '3px solid orange' : 'none'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {odn.odn_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {odn.facility_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {odn.region_name} • {odn.zone_name} • {odn.woreda_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {odn.route_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <PODCheckbox 
                        odn={odn}
                        pendingUpdates={pendingUpdates}
                        onPODChange={handlePODConfirmationChange}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {(odn.pod_number || pendingUpdates[odn.odn_id]?.pod_number) && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>POD #:</strong> {pendingUpdates[odn.odn_id]?.pod_number || odn.pod_number}
                          </Typography>
                        )}
                        {(odn.arrival_kilometer || pendingUpdates[odn.odn_id]?.arrival_kilometer) && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Arrival KM:</strong> {pendingUpdates[odn.odn_id]?.arrival_kilometer || odn.arrival_kilometer}
                          </Typography>
                        )}
                        {!odn.pod_number && !pendingUpdates[odn.odn_id]?.pod_number && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No POD details yet
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Enter reason if POD not confirmed..."
                        value={getPODReason(odn)}
                        onChange={(e) => handleReasonChange(odn.odn_id, e.target.value)}
                        disabled={pendingUpdates[odn.odn_id]?.pod_confirmed || Boolean(Number(odn.pod_confirmed))}
                        multiline
                        rows={2}
                        required={!Boolean(Number(odn.pod_confirmed)) && !pendingUpdates[odn.odn_id]?.pod_confirmed}
                        error={
                          (!Boolean(Number(odn.pod_confirmed)) && !pendingUpdates[odn.odn_id]?.pod_confirmed) && 
                          !getPODReason(odn).trim()
                        }
                        helperText={
                          (!Boolean(Number(odn.pod_confirmed)) && !pendingUpdates[odn.odn_id]?.pod_confirmed) && 
                          !getPODReason(odn).trim() ? 
                          'Reason required when POD not confirmed' : ''
                        }
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            fontSize: '0.875rem' 
                          } 
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination 
              component="div" 
              count={odnData.length} 
              rowsPerPage={rowsPerPage} 
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </TableContainer>
        </Card>
      </Container>
    </>
  );
};

export default DocumentationManagement;