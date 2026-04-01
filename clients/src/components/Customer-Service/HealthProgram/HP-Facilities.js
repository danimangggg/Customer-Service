import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, TextField, Card, CardContent, CardHeader,
  Button, MenuItem, Container, TablePagination, Stack, Box, Chip, Avatar,
  Tooltip, IconButton, Divider, Grid, Badge, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UndoIcon from '@mui/icons-material/Undo';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import BusinessIcon from '@mui/icons-material/Business';
import RouteIcon from '@mui/icons-material/Route';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FilterListIcon from '@mui/icons-material/FilterList';
import ReplyIcon from '@mui/icons-material/Reply';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axios from 'axios';
import api from '../../../axiosInstance';
import Swal from 'sweetalert2';
import { successToast } from '../../../utils/toast';
import withReactContent from 'sweetalert2-react-content';
import { formatTimestamp } from '../../../utils/serviceTimeHelper';

const MySwal = withReactContent(Swal);

const HpFacilities = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProcesses, setActiveProcesses] = useState([]);
  const [processODNCounts, setProcessODNCounts] = useState({});
  const [processODNData, setProcessODNData] = useState({});
  const [routes, setRoutes] = useState(["All"]); // Initialize with "All" option
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Process Details Dialog States
  const [processDetailOpen, setProcessDetailOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [processServiceDetails, setProcessServiceDetails] = useState([]);
  
  // Filtering States
  const [filterType, setFilterType] = useState("Regular");
  const [filterRoute, setFilterRoute] = useState("All");
  const [filterPeriod, setFilterPeriod] = useState("All");

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isO2COfficer = userJobTitle === 'O2C Officer - HP';
  const isEWMOfficer = userJobTitle === 'EWM Officer - HP';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  const getCurrentEthiopianMonth = (gDate = new Date()) => {
    // Ethiopian New Year starts on September 11 (or 12 in leap years)
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth(); // 0-based (0 = January, 8 = September)
    const gd = gDate.getDate();
    
    // Determine if current Gregorian year is a leap year
    const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
    
    // Ethiopian New Year date for current Gregorian year
    const newYearDay = isLeap ? 12 : 11; // September 12 in leap years, September 11 otherwise
    
    let ethYear, ethMonthIndex;
    
    // Check if we're before or after Ethiopian New Year
    if (gm > 8 || (gm === 8 && gd >= newYearDay)) {
      // After Ethiopian New Year - we're in the new Ethiopian year
      ethYear = gy - 7; // Ethiopian year is 7 years behind after New Year
      
      // Calculate days since Ethiopian New Year
      const newYearDate = new Date(gy, 8, newYearDay); // September 11/12
      const diffDays = Math.floor((gDate - newYearDate) / (24 * 60 * 60 * 1000));
      
      // Each Ethiopian month has 30 days (except Pagume which has 5/6 days)
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12; // Pagume (13th month)
      }
    } else {
      // Before Ethiopian New Year - we're still in the previous Ethiopian year
      ethYear = gy - 8; // Ethiopian year is 8 years behind before New Year
      
      // Calculate from previous year's Ethiopian New Year
      const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
      const prevNewYearDay = prevIsLeap ? 12 : 11;
      const prevNewYearDate = new Date(gy - 1, 8, prevNewYearDay);
      const diffDays = Math.floor((gDate - prevNewYearDate) / (24 * 60 * 60 * 1000));
      
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12; // Pagume
      }
    }
    
    // Ensure month index is within valid range
    ethMonthIndex = Math.max(0, Math.min(ethMonthIndex, 12));
    
    const result = { year: ethYear, monthIndex: ethMonthIndex };
    
    // Debug logging with actual values
    console.log('Ethiopian Calendar Debug:', {
      gregorianDate: gDate.toDateString(),
      gregorianYear: gy,
      gregorianMonth: gm + 1, // Convert to 1-based for readability
      gregorianDay: gd,
      ethiopianYear: ethYear,
      ethiopianMonth: ethiopianMonths[ethMonthIndex],
      ethiopianMonthIndex: ethMonthIndex,
      isLeapYear: isLeap,
      newYearDay: newYearDay
    });
    
    return result;
  };

  const initialEth = getCurrentEthiopianMonth();
  const currentEthiopianMonth = ethiopianMonths[initialEth.monthIndex];
  const currentEthiopianYear = initialEth.year;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [facRes, procRes, routesRes] = await Promise.all([
          api.get(`${api_url}/api/facilities`),
          api.get(`${api_url}/api/active-processes`),
          api.get(`${api_url}/api/routes`)
        ]);
        const allFacilities = facRes.data || [];
        setFacilities(allFacilities); // Store all facilities, not just those with routes
        const processes = procRes.data || [];
        setActiveProcesses(processes);
        
        // Set routes from database
        const routesData = routesRes.data || [];
        const routeNames = ["All", ...routesData.map(route => route.route_name)];
        setRoutes(routeNames);
        
        // Fetch ODN counts for all active processes
        if (processes.length > 0) {
          await fetchODNCounts(processes);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load facilities data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();

    // Cleanup function to remove global functions
    return () => {
      if (window.editODN) delete window.editODN;
      if (window.deleteODN) delete window.deleteODN;
      if (window.addNewODN) delete window.addNewODN;
    };
  }, [api_url]);

  // Silent background polling — refreshes processes every 30s without disturbing the user
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const [procRes, facRes] = await Promise.all([
          api.get(`${api_url}/api/active-processes`),
          api.get(`${api_url}/api/facilities`),
        ]);
        const processes = procRes.data || [];
        setActiveProcesses(processes);
        setFacilities(facRes.data || []);
        if (processes.length > 0) {
          await fetchODNCounts(processes);
        }
      } catch (err) {
        // silent — don't show error to user on background refresh
      }
    };

    const interval = setInterval(silentRefresh, 4000);
    return () => clearInterval(interval);
  }, [api_url]);

  // Function to fetch ODN counts for processes
  const fetchODNCounts = async (processes) => {
    try {
      console.log('Fetching ODN counts for processes:', processes.map(p => ({ id: p.id, facility_id: p.facility_id, status: p.status })));
      const counts = {};
      const odnData = {};
      await Promise.all(
        processes.map(async (proc) => {
          try {
            console.log(`Fetching ODNs for process ${proc.id}`);
            const response = await axios.get(`${api_url}/api/odns/${proc.id}`);
            const odns = response.data.data || [];
            console.log(`Process ${proc.id} ODNs:`, odns);
            counts[proc.id] = odns.length;
            odnData[proc.id] = odns;
          } catch (err) {
            console.error(`Error fetching ODNs for process ${proc.id}:`, err);
            counts[proc.id] = 0;
            odnData[proc.id] = [];
          }
        })
      );
      console.log('Final ODN counts:', counts);
      console.log('Final ODN data:', odnData);
      setProcessODNCounts(counts);
      // Store ODN data for EWM display
      setProcessODNData(odnData);
    } catch (err) {
      console.error("Error fetching ODN counts:", err);
    }
  };

  // --- START PROCESS ---
  const handleStartProcess = async (facilityId) => {
    try {
      const isSpecialType = filterType === "Emergency" || filterType === "Breakdown";
      const reportingMonthStr = isSpecialType ? null : `${currentEthiopianMonth} ${currentEthiopianYear}`;
      const payload = {
        facility_id: facilityId,
        service_point: "o2c",
        status: "o2c_started",
        userId: loggedInUserId ? parseInt(loggedInUserId, 10) : undefined,
        reporting_month: reportingMonthStr,
        process_type: filterType.toLowerCase(),
      };
      const res = await axios.post(`${api_url}/api/start-process`, payload);
      if (res.status === 201 || res.status === 200) {
        setActiveProcesses(prev => [...prev, { 
          id: res.data.process_id, 
          facility_id: facilityId, 
          status: "o2c_started",
          o2c_officer_name: res.data.officerName, 
          o2c_officer_id: loggedInUserId, 
          reporting_month: reportingMonthStr,
          process_type: filterType.toLowerCase()
        }]);
        // Initialize ODN count for new process
        setProcessODNCounts(prev => ({
          ...prev,
          [res.data.process_id]: 0
        }));
        successToast('Process Started');
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to start process', 'error');
    }
  };

  // --- REVERT PROCESS ---
  const handleRevertProcess = async (processId) => {
    const result = await Swal.fire({
      title: 'Revert process?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, revert',
    });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${api_url}/api/process/${processId}`);
      setActiveProcesses(prev => prev.filter(p => p.id !== processId));
      // Remove ODN count for this process
      setProcessODNCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[processId];
        return newCounts;
      });
      successToast('Reverted');
    } catch (err) {
      Swal.fire('Error', 'Could not revert', 'error');
    }
  };

  // --- MANAGE ODNS ---
  const handleManageODNs = async (processId) => {
    try {
      const response = await axios.get(`${api_url}/api/odns/${processId}`);
      const odns = response.data.data || [];
      
      const odnRows = odns.length > 0 
        ? odns.map((odn, index) => 
            `<tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px; text-align: center;">${index + 1}</td>
              <td style="padding: 8px;">${odn.odn_number}</td>
              <td style="padding: 8px; font-size: 12px; color: #666;">${new Date(odn.created_at).toLocaleString()}</td>
              <td style="padding: 8px; text-align: center;">
                <button onclick="editODN(${odn.id}, '${odn.odn_number}')" style="background: #1976d2; color: white; border: none; padding: 4px 8px; margin-right: 4px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                  Edit
                </button>
                <button onclick="deleteODN(${odn.id})" style="background: #d32f2f; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                  Delete
                </button>
              </td>
            </tr>`
          ).join('')
        : '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #666;">No ODN numbers saved yet</td></tr>';

      // Add global functions for edit and delete
      window.editODN = (odnId, currentValue) => handleEditODN(odnId, currentValue, processId);
      window.deleteODN = (odnId) => handleDeleteODN(odnId, processId);
      window.addNewODN = () => handleAddNewODN(processId);

      MySwal.fire({
        title: 'Manage ODN Numbers',
        html: `
          <div style="text-align: left;">
            <div style="margin-bottom: 15px;">
              <button onclick="addNewODN()" style="background: #4caf50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                + Add New ODN
              </button>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">#</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">ODN Number</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Created</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${odnRows}
              </tbody>
            </table>
          </div>
        `,
        confirmButtonText: 'Close',
        width: '700px',
        customClass: {
          htmlContainer: 'swal-manage-odns'
        }
      });
      
    } catch (err) {
      console.error('Manage ODNs error:', err);
      Swal.fire('Error', 'Failed to load ODN numbers.', 'error');
    }
  };

  // --- ADD NEW ODN ---
  const handleAddNewODN = async (processId) => {
    const { value: odnNumber } = await MySwal.fire({
      title: 'Add New ODN',
      input: 'text',
      inputPlaceholder: 'Enter ODN Number',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Please enter an ODN number';
        }
      }
    });

    if (odnNumber) {
      try {
        await axios.post(`${api_url}/api/save-odn`, { 
          process_id: processId, 
          odn_number: odnNumber.trim()
        });
        
        // Update ODN count for this process
        setProcessODNCounts(prev => ({
          ...prev,
          [processId]: (prev[processId] || 0) + 1
        }));
        
        successToast('ODN number saved successfully.');
        // Refresh the manage ODNs modal
        setTimeout(() => handleManageODNs(processId), 500);
        
      } catch (err) {
        console.error('Add ODN error:', err);
        Swal.fire('Error', 'Failed to save ODN number.', 'error');
      }
    }
  };
  // --- NAVIGATE TO HP PICKLIST PAGE ---
  const handleViewODNDetails = (processId, facilityName, facility, odnNumber) => {
    // Navigate to HP picklist page with the process ID and ODN number
    navigate(`/hp-picklist/${processId}?odn=${encodeURIComponent(odnNumber)}`);
  };
  const handleEditODN = async (odnId, currentValue, processId) => {
    const { value: newOdnNumber } = await MySwal.fire({
      title: 'Edit ODN Number',
      input: 'text',
      inputValue: currentValue,
      inputPlaceholder: 'Enter ODN Number',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Please enter an ODN number';
        }
      }
    });

    if (newOdnNumber) {
      try {
        await axios.put(`${api_url}/api/odn/${odnId}`, { 
          odn_number: newOdnNumber.trim()
        });
        
        successToast('ODN number updated successfully.');
        // Refresh the manage ODNs modal
        setTimeout(() => handleManageODNs(processId), 500);
        
      } catch (err) {
        console.error('Edit ODN error:', err);
        Swal.fire('Error', 'Failed to update ODN number.', 'error');
      }
    }
  };

  // --- DELETE ODN ---
  const handleDeleteODN = async (odnId, processId) => {
    const result = await Swal.fire({
      title: 'Delete ODN?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d32f2f'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${api_url}/api/odn/${odnId}`);
        
        // Update ODN count for this process
        setProcessODNCounts(prev => ({
          ...prev,
          [processId]: Math.max(0, (prev[processId] || 0) - 1)
        }));
        
        successToast('ODN number deleted successfully.');
        // Refresh the manage ODNs modal
        setTimeout(() => handleManageODNs(processId), 500);
        
      } catch (err) {
        console.error('Delete ODN error:', err);
        Swal.fire('Error', 'Failed to delete ODN number.', 'error');
      }
    }
  };
  // --- COMPLETE PROCESS ---
  const handleCompleteProcess = async (processId) => {
    // Check if process has any ODNs
    const odnCount = processODNCounts[processId] || 0;
    
    if (odnCount === 0) {
      if (filterType !== "Regular" && filterType !== "Vaccine") {
        Swal.fire({
          title: 'Cannot Complete',
          text: 'You must add at least one ODN number before completing the process.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      // Regular type: offer RRF Not Sent option; Vaccine: offer VRF Not Sent option
      const isVaccine = filterType === "Vaccine";
      const result = await Swal.fire({
        title: 'No ODN Numbers Added',
        text: `This process has no ODN numbers. How would you like to proceed?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: isVaccine ? 'VRF Not Sent' : 'RRF Not Sent',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ff9800',
        cancelButtonColor: '#6c757d'
      });

      if (!result.isConfirmed) return;

      try {
        const process = activeProcesses.find(p => p.id === processId);
        const facilityName = process?.facility?.facility_name || 'Unknown';
        const notSentLabel = isVaccine
          ? `VRF not sent - ${facilityName} - Process ${processId}`
          : `RRF not sent - ${facilityName} - Process ${processId}`;
        await axios.post(`${api_url}/api/save-odn`, {
          process_id: processId,
          odn_number: notSentLabel
        });
        setProcessODNCounts(prev => ({ ...prev, [processId]: 1 }));
        await axios.post(`${api_url}/api/complete-process`, { process_id: processId, rrf_not_sent: true });
        setActiveProcesses(prev =>
          prev.map(p => p.id === processId ? { ...p, status: 'ewm_goods_issued' } : p)
        );
        successToast(`Process completed with "${isVaccine ? 'VRF' : 'RRF'} not sent" status.`);
      } catch (err) {
        console.error('Complete process error:', err);
        Swal.fire('Error', 'Failed to complete process.', 'error');
      }
      return;
    }
      // Normal completion flow - has ODNs
      const result = await Swal.fire({
        title: 'Complete Process?',
        text: 'This will mark the process as completed. You can still manage ODNs after completion.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Complete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#4caf50'
      });

      if (result.isConfirmed) {
        try {
          await axios.post(`${api_url}/api/complete-process`, { 
            process_id: processId
          });
          
          // Record service time for O2C Officer - HP
          try {
            const o2cEndTime = formatTimestamp();
            
            // No previous service for O2C (it's the first step in HP flow)
            const waitingMinutes = 0;
            
            await axios.post(`${api_url}/api/service-time-hp`, {
              process_id: processId,
              service_unit: 'O2C Officer - HP',
              start_time: o2cEndTime,
              end_time: o2cEndTime,
              waiting_minutes: waitingMinutes,
              officer_id: loggedInUserId,
              officer_name: localStorage.getItem('FullName'),
              status: 'completed',
              notes: `O2C process completed with ${odnCount} ODN(s)`
            });
            
            console.log(`✅ O2C Officer - HP service time recorded`);
          } catch (err) {
            console.error('❌ Failed to record O2C service time:', err);
            // Don't fail the completion if service time recording fails
          }
          
          // Update the process status in local state
          setActiveProcesses(prev => 
            prev.map(p => 
              p.id === processId 
                ? { ...p, status: 'o2c_completed' }
                : p
            )
          );
          
          successToast('Process has been marked as completed.');
          
        } catch (err) {
          console.error('Complete process error:', err);
          Swal.fire('Error', 'Failed to complete process.', 'error');
        }
      }
  };

  // --- EWM COMPLETE PROCESS ---
  const handleEWMCompleteProcess = async (processId) => {
    const result = await Swal.fire({
      title: 'Complete EWM Process?',
      text: 'This will mark the EWM process as completed and notify TM Manager.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Complete EWM',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4caf50'
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`${api_url}/api/ewm-complete-process`, { 
          process_id: processId
        });
        
        // Notify TM that goods are ready
        await axios.post(`${api_url}/api/tm-notify`, { 
          process_id: processId
        });
        
        // Update the process status in local state
        setActiveProcesses(prev => 
          prev.map(p => 
            p.id === processId 
              ? { ...p, status: 'ewm_completed' }
              : p
          )
        );
        
        successToast('EWM Process completed and TM Manager notified.');
        
      } catch (err) {
        console.error('EWM Complete process error:', err);
        Swal.fire('Error', 'Failed to complete EWM process.', 'error');
      }
    }
  };

  // --- COMPLETE INDIVIDUAL ODN ---
  const handleCompleteODN = async (odnId, processId) => {
    const result = await Swal.fire({
      title: 'Complete ODN?',
      text: 'This will mark this ODN as EWM completed.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Complete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4caf50'
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`${api_url}/api/complete-odn`, { 
          odn_id: odnId
        });
        
        // Record service time for EWM Officer - HP
        try {
          const ewmEndTime = formatTimestamp();
          
          // Calculate waiting time: current time - O2C end time
          let waitingMinutes = 0;
          try {
            const o2cResponse = await axios.get(`${api_url}/api/service-time-hp/last-end-time`, {
              params: {
                process_id: processId,
                service_unit: 'O2C Officer - HP'
              }
            });
            
            if (o2cResponse.data.end_time) {
              const prevTime = new Date(o2cResponse.data.end_time);
              const currTime = new Date(ewmEndTime);
              const diffMs = currTime - prevTime;
              waitingMinutes = Math.floor(diffMs / 60000);
              waitingMinutes = waitingMinutes > 0 ? waitingMinutes : 0;
            }
          } catch (err) {
            console.error('Failed to get O2C end time:', err);
          }
          
          await axios.post(`${api_url}/api/service-time-hp`, {
            process_id: processId,
            service_unit: 'EWM Officer - HP',
            start_time: ewmEndTime,
            end_time: ewmEndTime,
            waiting_minutes: waitingMinutes,
            officer_id: loggedInUserId,
            officer_name: localStorage.getItem('FullName'),
            status: 'completed',
            notes: `EWM ODN completed: ${odnId}`
          });
          
          console.log(`✅ EWM Officer - HP service time recorded: ${waitingMinutes} minutes`);
        } catch (err) {
          console.error('❌ Failed to record EWM service time:', err);
          // Don't fail the completion if service time recording fails
        }
        
        // Update the ODN status in local state
        setProcessODNData(prev => {
          const newData = { ...prev };
          if (newData[processId]) {
            newData[processId] = newData[processId].map(odn => 
              odn.id === odnId 
                ? { ...odn, status: 'ewm_completed' }
                : odn
            );
            
            // Check if ALL ODNs for this process are now completed
            const allODNsCompleted = newData[processId].every(odn => odn.status === 'ewm_completed');
            
            if (allODNsCompleted) {
              // Update process status to ewm_completed
              setActiveProcesses(prevProc => 
                prevProc.map(p => 
                  p.id === parseInt(processId) 
                    ? { ...p, status: 'ewm_completed' }
                    : p
                )
              );
            }
          }
          return newData;
        });
        
        successToast('ODN has been marked as EWM completed.');
        
      } catch (err) {
        console.error('Complete ODN error:', err);
        Swal.fire('Error', 'Failed to complete ODN.', 'error');
      }
    }
  };
  const handleEWMRevertProcess = async (processId) => {
    const result = await Swal.fire({
      title: 'Revert to O2C?',
      text: 'This will revert the process back to O2C started status.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Revert',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ff9800'
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`${api_url}/api/ewm-revert-process`, { 
          process_id: processId
        });
        
        // Update the process status in local state
        setActiveProcesses(prev => 
          prev.map(p => 
            p.id === processId 
              ? { ...p, status: 'o2c_started' }
              : p
          )
        );
        
        successToast('Process has been reverted to O2C started.');
        
      } catch (err) {
        console.error('EWM Revert process error:', err);
        Swal.fire('Error', 'Failed to revert process.', 'error');
      }
    }
  };

  // --- RETURN PROCESS TO O2C FOR CORRECTIONS ---
  const handleReturnToO2C = async (processId) => {
    const result = await Swal.fire({
      title: 'Return to O2C Officer?',
      text: 'This will return the process to O2C Officer for corrections. The process status will change from "O2C Completed" back to "O2C Pending" so the O2C Officer can update any mistaken information.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Return for Corrections',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ff9800'
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`${api_url}/api/return-to-o2c`, { 
          process_id: processId
        });
        
        // Update the process status in local state
        setActiveProcesses(prev => 
          prev.map(p => 
            p.id === processId 
              ? { ...p, status: 'completed' }
              : p
          )
        );
        
        successToast('Process has been returned to O2C Officer for corrections.');
        
      } catch (err) {
        console.error('Return to O2C error:', err);
        Swal.fire('Error', 'Failed to return process to O2C Officer.', 'error');
      }
    }
  };

  // --- FETCH PROCESS SERVICE DETAILS ---
  const fetchProcessServiceDetails = async (processId) => {
    try {
      const response = await axios.get(`${api_url}/api/hp-customers/${processId}/service-details`);
      setProcessServiceDetails(response.data.serviceDetails || []);
    } catch (err) {
      console.error('Error fetching HP process service details:', err);
      setProcessServiceDetails([]);
    }
  };

  // --- VIEW PROCESS DETAILS ---
  const handleViewProcessDetails = async (process, facility) => {
    setSelectedProcess({ ...process, facility });
    setProcessDetailOpen(true);
    await fetchProcessServiceDetails(process.id);
  };

  // --- FILTERING LOGIC ---
  // Helper function to determine if current month is even or odd
  const getCurrentPeriod = () => {
    const monthIndex = initialEth.monthIndex; // 0-based index
    const monthNumber = monthIndex + 1; // Convert to 1-based for period calculation
    return monthNumber % 2 === 0 ? 'even' : 'odd';
  };

  const currentPeriod = getCurrentPeriod();

  // Helper function to check if facility is HP
  const isHPFacility = (facility) => {
    return !!facility.is_hp_site;
  };

  // Helper function to check if facility should be visible based on period and type
  const shouldShowFacility = (facility) => {
    if (filterType === "Emergency" || filterType === "Breakdown") {
      return isHPFacility(facility);
    }
    
    if (filterType === "Vaccine") {
      return !!facility.is_vaccine_site;
    }
    
    // For EWM officers: show any HP facility — period filter is irrelevant,
    // the proc lookup below will determine if there's an active process
    if (isEWMOfficer) {
      return !!facility.is_hp_site;
    }
    
    // O2C Officers: filter by current period
    if (!facility.is_hp_site) return false;
    if (facility.period === 'Monthly') return true;
    if (currentPeriod === 'odd' && facility.period === 'Odd') return true;
    if (currentPeriod === 'even' && facility.period === 'Even') return true;
    if (!facility.period) return true;
    return false;
  };

  // For EWM Officers: Create rows for each ODN instead of each facility
  let filteredData = []; // Initialize as empty array
  
  console.log('Debug Info:', {
    totalFacilities: facilities.length,
    currentPeriod: currentPeriod,
    filterType: filterType,
    currentEthiopianMonth: currentEthiopianMonth,
    currentEthiopianYear: currentEthiopianYear
  });
  
  if (isEWMOfficer) {
    const isSpecialType = filterType === "Emergency" || filterType === "Breakdown";
    // Create a row for each ODN
    facilities.forEach(f => {
      const matchesSearch = (f.facility_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (f.route || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRoute = isSpecialType || filterRoute === "All" || f.route === filterRoute;
      const shouldShow = shouldShowFacility(f);
      
      if (matchesSearch && matchesRoute && shouldShow) {
        const validStatuses = ['o2c_completed', 'ewm_completed', 'tm_notified', 'tm_confirmed', 'freight_order_sent_to_ewm', 'vehicle_requested', 'vehicle_assigned', 'dispatched'];
        let proc;
        if (isSpecialType) {
          // Emergency/Breakdown: match by process_type, no reporting_month filter
          proc = activeProcesses.find(a =>
            a.facility_id === f.id &&
            a.process_type === filterType.toLowerCase() &&
            validStatuses.includes(a.status)
          );
        } else {
          const selReporting = `${currentEthiopianMonth} ${currentEthiopianYear}`;
          proc = activeProcesses.find(a => 
            a.facility_id === f.id && 
            a.reporting_month === selReporting &&
            a.process_type === filterType.toLowerCase() &&
            validStatuses.includes(a.status)
          );
        }
        
        if (proc) {
          const odnList = processODNData[proc.id] || [];
          if (odnList.length > 0) {
            odnList
              .filter(odn => odn.status !== 'ewm_completed')
              .forEach(odn => {
                filteredData.push({
                  ...f,
                  process: proc,
                  odn: odn,
                  uniqueId: `${f.id}-${odn.id}`
                });
              });
          }
        }
      }
    });
    
    // Debug info for EWM officers (after processing)
    console.log('EWM Filtered Facilities:', filteredData.length);
  } else {
    // O2C Officers: Original facility-based filtering
    const isSpecialType = filterType === "Emergency" || filterType === "Breakdown";
    filteredData = facilities.filter(f => {
      const matchesSearch = (f.facility_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (f.route || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRoute = isSpecialType || filterRoute === "All" || f.route === filterRoute;
      const shouldShow = shouldShowFacility(f);
      
      if (isSpecialType) {
        // Emergency/Breakdown: always show facility, multiple concurrent processes allowed
        return matchesSearch && shouldShow;
      }

      const selReporting = `${currentEthiopianMonth} ${currentEthiopianYear}`;
      
      // Vaccine: hide if a vaccine process already exists this month (once per month rule)
      if (filterType === "Vaccine") {
        const vaccineProc = activeProcesses.find(a =>
          a.facility_id === f.id &&
          a.process_type === 'vaccine' &&
          a.reporting_month === selReporting
        );
        const vaccineProcODNs = vaccineProc ? (processODNData[vaccineProc.id] || []) : [];
        const vaccineODNQualityDone = vaccineProcODNs.some(o => o.quality_confirmed);
        const vaccineDone = vaccineProc && (
          (vaccineProc.status !== 'o2c_started' && vaccineProc.status !== 'completed') ||
          (vaccineProc.status === 'completed' && vaccineODNQualityDone)
        );
        return matchesSearch && matchesRoute && shouldShow && !vaccineDone;
      }

      const proc = activeProcesses.find(a =>
        a.facility_id === f.id && a.reporting_month === selReporting && a.process_type !== 'vaccine'
      );
      // Hide if process is already past O2C stage
      // 'completed' means returned to O2C for corrections — show it, UNLESS ODN is already quality_confirmed
      const procODNs = proc ? (processODNData[proc.id] || []) : [];
      const odnQualityDone = procODNs.some(o => o.quality_confirmed);
      const alreadyDone = proc && (proc.status !== 'o2c_started' && proc.status !== 'completed') || (proc && proc.status === 'completed' && odnQualityDone);
      
      return matchesSearch && matchesRoute && shouldShow && !alreadyDone;
    });
    
    console.log('O2C Debug Info:', {
      totalFacilitiesAfterFilter: filteredData.length,
      filterRoute: filterRoute,
      sampleFacilities: facilities.slice(0, 3).map(f => ({
        name: f.facility_name,
        route: f.route,
        period: f.period,
        shouldShow: shouldShowFacility(f)
      }))
    });
  }

  // Get unique routes for filter dropdown - now using routes from database
  // const routes = ["All", ...new Set(facilities.map(f => f.route).filter(Boolean))]; // OLD: hardcoded from facilities
  // Routes are now fetched from database in useEffect

  // Access control - only allow specific job titles
  if (!isO2COfficer && !isEWMOfficer) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to O2C Officer - HP and EWM Officer - HP roles only.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            <strong>Current JobTitle in localStorage:</strong> "{userJobTitle}"
          </Typography>
          <Typography>
            <strong>Expected values:</strong> "O2C Officer - HP" or "EWM Officer - HP"
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <style>
        {`
          .swal-manage-odns table {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }
          .swal-manage-odns tbody tr:hover {
            background-color: #f8f9fa;
          }
          .swal-manage-odns button:hover {
            opacity: 0.8;
            transform: translateY(-1px);
          }
          .facility-card {
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
          }
          .facility-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-left-color: #1976d2;
          }
          .stats-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 16px;
          }
          .stats-card-2 {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            border-radius: 16px;
          }
          .stats-card-3 {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            border-radius: 16px;
          }
          .header-gradient {
            background: #f5f5f5;
            color: #333;
            border-bottom: 1px solid #e0e0e0;
            padding: 24px;
            border-radius: 16px 16px 0 0;
          }
          .action-button {
            transition: all 0.2s ease;
          }
          .action-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
        `}
      </style>
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Header Section */}
        <Card sx={{ mb: 3, overflow: 'hidden' }}>
          <Box className="header-gradient">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <BusinessIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                  {isO2COfficer ? 'O2C Health Program Facilities' : 
                   isEWMOfficer ? 'EWM Health Program Facilities' : 
                   'Health Program Facilities'}
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  {isO2COfficer ? 'Manage operational facilities and ODN tracking' :
                   isEWMOfficer ? 'Review and process completed O2C facilities' :
                   'Facility management system'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }} className="facility-card">
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <FilterListIcon color="primary" />
                <Typography variant="h6">Filters & Current Period</Typography>
              </Stack>
            }
            sx={{ pb: 1 }}
          />
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField 
                  placeholder="Search facilities or routes..." 
                  size="small" 
                  fullWidth 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{ 
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField 
                  select 
                  label="Route" 
                  size="small" 
                  fullWidth 
                  value={filterRoute} 
                  onChange={(e) => setFilterRoute(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, display: (filterType === 'Emergency' || filterType === 'Breakdown') ? 'none' : undefined }}
                >
                  {routes.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField 
                  select 
                  label="Type" 
                  size="small" 
                  fullWidth 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="Regular">HP Regular</MenuItem>
                  <MenuItem value="Vaccine">Vaccine</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Current Period
                  </Typography>
                  <Chip 
                    label={currentPeriod.toUpperCase()}
                    color={currentPeriod === 'even' ? 'primary' : 'secondary'}
                    variant="filled"
                    sx={{ fontWeight: 'bold', minWidth: 80 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ethiopian Calendar
                  </Typography>
                  <Chip 
                    icon={<CalendarTodayIcon />}
                    label={`${currentEthiopianMonth} ${currentEthiopianYear}`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Facilities Table */}
        <Card className="facility-card">
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <BusinessIcon color="primary" />
                <Typography variant="h6">Facilities Overview</Typography>
                <Chip 
                  label={`${filteredData.length} facilities`} 
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
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BusinessIcon fontSize="small" />
                      <span>Facility Details</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', display: (filterType === 'Emergency' || filterType === 'Breakdown') ? 'none' : undefined }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <RouteIcon fontSize="small" />
                      <span>Route</span>
                    </Stack>
                  </TableCell>
                  {isEWMOfficer && (
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AssignmentIcon fontSize="small" />
                        <span>ODN Number</span>
                      </Stack>
                    </TableCell>
                  )}
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                      <AssignmentIcon fontSize="small" />
                      <span>Actions</span>
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => {
                  if (isEWMOfficer) {
                    // EWM Officer: Each row is an ODN
                    const f = item; // facility data
                    const proc = item.process;
                    const odn = item.odn;
                    
                    // Process is inactive if it has passed EWM stage
                    // EWM stage status: 'o2c_completed'
                    // Passed EWM: 'ewm_completed', 'vehicle_requested', 'vehicle_assigned', 'dispatched', etc.
                    const hasPassedEWM = proc && proc.status !== 'o2c_completed';
                    const isInactive = hasPassedEWM;
                    const isODNCompleted = odn.status === 'ewm_completed';

                    return (
                      <TableRow 
                        key={item.uniqueId} 
                        hover 
                        sx={{ 
                          '&:hover': { bgcolor: 'grey.50' },
                          bgcolor: isInactive ? 'grey.100' : 'inherit',
                          opacity: isInactive ? 0.6 : 1
                        }}
                      >
                        <TableCell>
                          <Chip   
                            label={(page * rowsPerPage) + index + 1} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary">
                              {f.facility_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {f.region_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: (filterType === 'Emergency' || filterType === 'Breakdown') ? 'none' : undefined }}>
                          <Chip 
                            icon={<RouteIcon />}
                            label={f.route} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={odn.odn_number}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                            {!isODNCompleted && !isInactive && (
                              <>
                                <Tooltip title="Complete ODN">
                                  <Button 
                                    variant="contained" 
                                    color="success" 
                                    size="small" 
                                    startIcon={<CheckCircleIcon />} 
                                    onClick={() => handleCompleteODN(odn.id, proc.id)}
                                    className="action-button"
                                    sx={{ borderRadius: 2 }}
                                  >
                                    Complete
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Return to O2C for Corrections">
                                  <Button 
                                    variant="outlined" 
                                    color="warning" 
                                    size="small" 
                                    startIcon={<ReplyIcon />} 
                                    onClick={() => handleReturnToO2C(proc.id)}
                                    className="action-button"
                                    sx={{ borderRadius: 2 }}
                                  >
                                    Return
                                  </Button>
                                </Tooltip>
                                <Tooltip title="View Details">
                                  <Button 
                                    variant="contained" 
                                    color="primary" 
                                    size="small" 
                                    startIcon={<VisibilityIcon />} 
                                    onClick={() => handleViewODNDetails(proc.id, f.facility_name, f, odn.odn_number)}
                                    className="action-button"
                                    sx={{ borderRadius: 2 }}
                                  >
                                    Detail
                                  </Button>
                                </Tooltip>
                              </>
                            )}
                            {isODNCompleted && (
                              <Chip 
                                label="ODN Completed"
                                size="small" 
                                icon={<CheckCircleIcon />}
                                sx={{ 
                                  bgcolor: 'grey.300',
                                  color: 'grey.700',
                                  '& .MuiChip-icon': { color: 'grey.600' }
                                }}
                              />
                            )}
                            {isInactive && (
                              <Chip 
                                label={`Passed to ${proc.status === 'ewm_completed' ? 'TM Manager' : 
                                       proc.status === 'vehicle_requested' ? 'Dispatch' : 
                                       'Next Stage'}`}
                                size="small" 
                                icon={<CheckCircleIcon />}
                                sx={{ 
                                  bgcolor: 'grey.300',
                                  color: 'grey.700',
                                  '& .MuiChip-icon': { color: 'grey.600' }
                                }}
                              />
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    // O2C Officer: Each row is a facility (original logic)
                    const f = item;
                    const isSpecialTypeRow = filterType === "Emergency" || filterType === "Breakdown";
                    let proc;
                    if (isSpecialTypeRow) {
                      // Emergency/Breakdown: only show active O2C processes (not completed ones)
                      proc = activeProcesses.find(a =>
                        a.facility_id === f.id &&
                        a.process_type === filterType.toLowerCase() &&
                        (a.status === 'o2c_started' || a.status === 'completed')
                      );
                    } else {
                      const selReporting = `${currentEthiopianMonth} ${currentEthiopianYear}`;
                      const expectedType = filterType.toLowerCase();
                      proc = activeProcesses.find(a =>
                        a.facility_id === f.id &&
                        a.reporting_month === selReporting &&
                        a.process_type === expectedType
                      );
                    }
                    const isOwner = proc && String(proc.o2c_officer_id) === String(loggedInUserId);
                    const hasODNs = proc && (processODNCounts[proc.id] || 0) > 0;
                    const odnCount = proc ? (processODNCounts[proc.id] || 0) : 0;
                    
                    // For emergency/breakdown: never inactive — always allow new process
                    const hasPassedO2C = !isSpecialTypeRow && proc && !['o2c_started', 'completed'].includes(proc.status);
                    const isInactive = hasPassedO2C;

                    return (
                      <TableRow 
                        key={f.id} 
                        hover 
                        sx={{ 
                          '&:hover': { bgcolor: 'grey.50' },
                          bgcolor: isInactive ? 'grey.100' : 'inherit',
                          opacity: isInactive ? 0.6 : 1
                        }}
                      >
                        <TableCell>
                          <Chip 
                            label={(page * rowsPerPage) + index + 1} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary">
                              {f.facility_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {f.region_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ display: (filterType === 'Emergency' || filterType === 'Breakdown') ? 'none' : undefined }}>
                          <Chip 
                            icon={<RouteIcon />}
                            label={f.route} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          {proc ? (
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" flexWrap="wrap">
                              {isOwner ? (
                                <>
                                  {!isInactive && (
                                    <>
                                      {!hasODNs && (
                                        <Tooltip title="Revert Process">
                                          <Button 
                                            variant="outlined" 
                                            color="warning" 
                                            size="small" 
                                            startIcon={<UndoIcon />} 
                                            onClick={() => handleRevertProcess(proc.id)}
                                            className="action-button"
                                            sx={{ borderRadius: 2 }}
                                          >
                                            Revert
                                          </Button>
                                        </Tooltip>
                                      )}
                                      <Tooltip title="Complete Process">
                                        <Button 
                                          variant="contained" 
                                          color="success" 
                                          size="small" 
                                          startIcon={<CheckCircleIcon />} 
                                          onClick={() => handleCompleteProcess(proc.id)}
                                          className="action-button"
                                          sx={{ borderRadius: 2 }}
                                        >
                                          Complete
                                        </Button>
                                      </Tooltip>
                                      <Tooltip title="Manage ODNs">
                                        <Badge badgeContent={odnCount} color="info">
                                          <Button 
                                            variant="outlined" 
                                            color="secondary" 
                                            size="small" 
                                            startIcon={<ManageAccountsIcon />} 
                                            onClick={() => handleManageODNs(proc.id)}
                                            className="action-button"
                                            sx={{ borderRadius: 2 }}
                                          >
                                            Manage ODNs
                                          </Button>
                                        </Badge>
                                      </Tooltip>
                                    </>
                                  )}
                                  {isInactive && (
                                    <Chip 
                                      label={`Passed to ${proc.status === 'o2c_completed' ? 'EWM' : 
                                             proc.status === 'ewm_completed' ? 'PI' : 
                                             proc.status === 'vehicle_requested' ? 'Dispatch' : 
                                             'Next Stage'}`}
                                      color="default" 
                                      size="small" 
                                      icon={<CheckCircleIcon />}
                                    />
                                  )}
                                </>
                              ) : (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                    <PersonIcon fontSize="small" />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" color="text.primary" fontWeight="medium">
                                      {proc.o2c_officer_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {isInactive ? 'Passed O2C' : 'Process Owner'}
                                    </Typography>
                                  </Box>
                                  {isInactive && (
                                    <Chip 
                                      label="Inactive" 
                                      color="default" 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  )}
                                </Stack>
                              )}
                            </Stack>
                          ) : (
                            <Tooltip title="Start New Process">
                              <Button 
                                variant="contained" 
                                color="success" 
                                size="small" 
                                startIcon={<PlayArrowIcon />} 
                                onClick={() => handleStartProcess(f.id)} 
                                disabled={filterType === "Regular" && !f.route}
                                className="action-button"
                                sx={{ borderRadius: 2 }}
                              >
                                Start Process
                              </Button>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }
                })}
              </TableBody>
            </Table>
            <TablePagination 
              component="div" 
              count={filteredData.length} 
              rowsPerPage={rowsPerPage} 
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </TableContainer>
        </Card>

        {/* Process Details Dialog */}
        <Dialog 
          open={processDetailOpen} 
          onClose={() => setProcessDetailOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <InfoIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  HP Process Details
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {selectedProcess?.facility?.facility_name || 'N/A'}
                </Typography>
              </Box>
            </Stack>
            <IconButton 
              onClick={() => setProcessDetailOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ mt: 3 }}>
            {selectedProcess && (
              <Grid container spacing={3}>
                {/* Process Information */}
                <Grid item xs={12}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    borderRadius: 2
                  }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontWeight: 700,
                        color: '#667eea',
                        mb: 2
                      }}>
                        Process Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Process ID</Typography>
                              <Typography variant="body1" fontWeight="bold">{selectedProcess.id}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Reporting Month</Typography>
                              <Typography variant="body1" fontWeight="bold">{selectedProcess.reporting_month || 'N/A'}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Status</Typography>
                              <Chip 
                                label={selectedProcess.status?.toUpperCase() || 'N/A'} 
                                color={
                                  selectedProcess.status === 'o2c_completed' ? 'success' :
                                  selectedProcess.status === 'ewm_completed' ? 'info' :
                                  selectedProcess.status === 'dispatched' ? 'primary' :
                                  'default'
                                }
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack spacing={1}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Facility</Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {selectedProcess.facility?.facility_name || 'N/A'}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Region</Typography>
                              <Typography variant="body1">{selectedProcess.facility?.region_name || 'N/A'}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Route</Typography>
                              <Chip 
                                icon={<RouteIcon />}
                                label={selectedProcess.facility?.route || 'N/A'} 
                                size="small"
                                color="secondary"
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Service Time Details */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontWeight: 700,
                    color: '#667eea',
                    borderBottom: '2px solid #667eea',
                    pb: 1,
                    mb: 2
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AccessTimeIcon />
                      <span>Service Time Tracking</span>
                    </Stack>
                  </Typography>
                  {processServiceDetails.length > 0 ? (
                    <TableContainer component={Paper} sx={{ 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      borderRadius: 2
                    }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 700 }}>Service Unit</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Officer</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Start Time</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>End Time</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {processServiceDetails.map((service, index) => (
                            <TableRow key={index} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {service.service_unit}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>
                                    <PersonIcon fontSize="small" />
                                  </Avatar>
                                  <Typography variant="body2">{service.officer_name || 'N/A'}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {service.start_time ? new Date(service.start_time).toLocaleString() : 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {service.end_time ? new Date(service.end_time).toLocaleString() : 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${service.waiting_minutes || 0} min`}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={service.status || 'N/A'} 
                                  color={service.status === 'completed' ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      No service time records found for this process.
                    </Alert>
                  )}
                </Grid>

                {/* ODN Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontWeight: 700,
                    color: '#667eea',
                    borderBottom: '2px solid #667eea',
                    pb: 1,
                    mb: 2
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AssignmentIcon />
                      <span>ODN Numbers</span>
                    </Stack>
                  </Typography>
                  {processODNData[selectedProcess.id] && processODNData[selectedProcess.id].length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {processODNData[selectedProcess.id].map((odn, index) => (
                        <Chip
                          key={index}
                          label={odn.odn_number}
                          color={odn.status === 'ewm_completed' ? 'success' : 'primary'}
                          variant="outlined"
                          icon={odn.status === 'ewm_completed' ? <CheckCircleIcon /> : <AssignmentIcon />}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      No ODN numbers added yet.
                    </Alert>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <Button 
              onClick={() => setProcessDetailOpen(false)}
              variant="contained"
              sx={{ borderRadius: 2 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default HpFacilities;