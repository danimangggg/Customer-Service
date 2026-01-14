import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, TextField, Card, CardContent, CardHeader,
  Button, MenuItem, Container, TablePagination, Stack, Box, Chip, Avatar,
  Tooltip, IconButton, Divider, Grid, Badge, LinearProgress, Alert
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
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

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
  
  // Filtering States
  const [filterType, setFilterType] = useState("Regular");
  const [filterRoute, setFilterRoute] = useState("All");

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
          axios.get(`${api_url}/api/facilities`),
          axios.get(`${api_url}/api/active-processes`),
          axios.get(`${api_url}/api/routes`) // Fetch routes from routes table
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
      const reportingMonthStr = `${currentEthiopianMonth} ${currentEthiopianYear}`;
      const payload = {
        facility_id: facilityId,
        service_point: "o2c",
        status: "o2c_started",
        userId: loggedInUserId ? parseInt(loggedInUserId, 10) : undefined,
        reporting_month: reportingMonthStr,
      };
      const res = await axios.post(`${api_url}/api/start-process`, payload);
      if (res.status === 201 || res.status === 200) {
        setActiveProcesses(prev => [...prev, { 
          id: res.data.process_id, 
          facility_id: facilityId, 
          status: "o2c_started", // Add the missing status field
          o2c_officer_name: res.data.officerName, 
          o2c_officer_id: loggedInUserId, 
          reporting_month: reportingMonthStr 
        }]);
        // Initialize ODN count for new process
        setProcessODNCounts(prev => ({
          ...prev,
          [res.data.process_id]: 0
        }));
        Swal.fire('Success', 'Process Started', 'success');
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
      Swal.fire('Reverted', '', 'success');
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
        
        Swal.fire('Saved!', 'ODN number saved successfully.', 'success');
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
        
        Swal.fire('Updated!', 'ODN number updated successfully.', 'success');
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
        
        Swal.fire('Deleted!', 'ODN number deleted successfully.', 'success');
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
      // No ODNs added - show alert with options
      const result = await Swal.fire({
        title: 'No ODN Numbers Added',
        text: 'This process has no ODN numbers. How would you like to proceed?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'RRF Not Sent',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ff9800',
        cancelButtonColor: '#6c757d'
      });

      if (result.isDismissed || !result.isConfirmed) {
        // User cancelled - do nothing
        return;
      }

      if (result.isConfirmed) {
        // User selected "RRF Not Sent" - add this as ODN and complete
        try {
          // First add "RRF not sent" as ODN
          await axios.post(`${api_url}/api/save-odn`, { 
            process_id: processId, 
            odn_number: 'RRF not sent'
          });
          
          // Update ODN count for this process
          setProcessODNCounts(prev => ({
            ...prev,
            [processId]: 1
          }));
          
          // Then complete the process
          await axios.post(`${api_url}/api/complete-process`, { 
            process_id: processId
          });
          
          // Update the process status in local state
          setActiveProcesses(prev => 
            prev.map(p => 
              p.id === processId 
                ? { ...p, status: 'o2c_completed' }
                : p
            )
          );
          
          Swal.fire('Completed!', 'Process completed with "RRF not sent" status.', 'success');
          
        } catch (err) {
          console.error('Complete process with RRF error:', err);
          Swal.fire('Error', 'Failed to complete process.', 'error');
        }
      }
    } else {
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
          
          // Update the process status in local state
          setActiveProcesses(prev => 
            prev.map(p => 
              p.id === processId 
                ? { ...p, status: 'o2c_completed' }
                : p
            )
          );
          
          Swal.fire('Completed!', 'Process has been marked as completed.', 'success');
          
        } catch (err) {
          console.error('Complete process error:', err);
          Swal.fire('Error', 'Failed to complete process.', 'error');
        }
      }
    }
  };

  // --- EWM COMPLETE PROCESS ---
  const handleEWMCompleteProcess = async (processId) => {
    const result = await Swal.fire({
      title: 'Complete EWM Process?',
      text: 'This will mark the EWM process as completed.',
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
        
        // Update the process status in local state
        setActiveProcesses(prev => 
          prev.map(p => 
            p.id === processId 
              ? { ...p, status: 'ewm_completed' }
              : p
          )
        );
        
        Swal.fire('Completed!', 'EWM Process has been marked as completed.', 'success');
        
      } catch (err) {
        console.error('EWM Complete process error:', err);
        Swal.fire('Error', 'Failed to complete EWM process.', 'error');
      }
    }
  };

  // --- COMPLETE INDIVIDUAL ODN ---
  const handleCompleteODN = async (odnId) => {
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
        
        // For EWM Officers: Remove the completed process from view immediately
        if (isEWMOfficer) {
          // Find which process this ODN belongs to
          let processIdToRemove = null;
          Object.keys(processODNData).forEach(processId => {
            const odnExists = processODNData[processId].find(odn => odn.id === odnId);
            if (odnExists) {
              processIdToRemove = processId;
            }
          });
          
          if (processIdToRemove) {
            // Update process status to ewm_completed so it disappears from EWM view
            setActiveProcesses(prev => 
              prev.map(p => 
                p.id === parseInt(processIdToRemove) 
                  ? { ...p, status: 'ewm_completed' }
                  : p
              )
            );
            
            // Remove the process ODN data
            setProcessODNData(prev => {
              const newData = { ...prev };
              delete newData[processIdToRemove];
              return newData;
            });
            
            // Remove ODN count
            setProcessODNCounts(prev => {
              const newData = { ...prev };
              delete newData[processIdToRemove];
              return newData;
            });
          }
        } else {
          // For O2C Officers: Just update the ODN status in local state
          setProcessODNData(prev => {
            const newData = { ...prev };
            Object.keys(newData).forEach(processId => {
              newData[processId] = newData[processId].map(odn => 
                odn.id === odnId 
                  ? { ...odn, status: 'ewm_completed' }
                  : odn
              );
            });
            return newData;
          });
        }
        
        Swal.fire('Completed!', 'ODN has been marked as EWM completed.', 'success');
        
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
        
        Swal.fire('Reverted!', 'Process has been reverted to O2C started.', 'success');
        
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
      text: 'This will return the process to O2C Officer for corrections. The process status will change from "O2C Completed" back to "Completed" so the O2C Officer can update any mistaken information.',
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
        
        Swal.fire('Returned!', 'Process has been returned to O2C Officer for corrections.', 'success');
        
      } catch (err) {
        console.error('Return to O2C error:', err);
        Swal.fire('Error', 'Failed to return process to O2C Officer.', 'error');
      }
    }
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
    const hasRoute = facility.route && facility.route.toString().trim().length > 0;
    const hasPeriod = facility.period && facility.period.toString().trim().length > 0;
    return hasRoute && hasPeriod;
  };

  // Helper function to check if facility should be visible based on period and type
  const shouldShowFacility = (facility) => {
    console.log('Checking facility:', facility.facility_name, {
      route: facility.route,
      period: facility.period,
      isHP: isHPFacility(facility),
      filterType: filterType
    });

    if (filterType === "Emergency") {
      // Emergency: show only HP facilities regardless of period
      return isHPFacility(facility);
    }
    
    // Regular: apply period-based filtering AND require route assignment
    if (!facility.route || facility.route.toString().trim().length === 0) {
      return false; // Regular mode requires route assignment
    }
    
    if (!facility.period) {
      return false; // Don't show facilities without period set
    }
    
    const facilityPeriod = facility.period.toLowerCase();
    
    // Monthly facilities are always shown
    if (facilityPeriod === 'monthly') {
      return true;
    }
    
    // Show even period facilities only in even months (Tikimt=2, Tahsas=4, etc.)
    if (facilityPeriod === 'even' && currentPeriod === 'even') {
      return true;
    }
    
    // Show odd period facilities only in odd months (Meskerem=1, Hidar=3, etc.)
    if (facilityPeriod === 'odd' && currentPeriod === 'odd') {
      return true;
    }
    
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
    // Create a row for each ODN
    facilities.forEach(f => {
      const matchesSearch = (f.facility_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (f.route || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRoute = filterRoute === "All" || f.route === filterRoute;
      const shouldShow = shouldShowFacility(f);
      
      if (matchesSearch && matchesRoute && shouldShow) {
        // EWM officers should only see processes that have completed O2C stage
        const selReporting = `${currentEthiopianMonth} ${currentEthiopianYear}`;
        const proc = activeProcesses.find(a => 
          a.facility_id === f.id && 
          a.reporting_month === selReporting &&
          (a.status === 'o2c_completed' || a.status === 'ewm_completed' || 
           a.status === 'vehicle_requested' || a.status === 'vehicle_assigned' || 
           a.status === 'dispatched') // Only show if O2C is completed or beyond
        );
        
        if (proc) {
          const odnList = processODNData[proc.id] || [];
          if (odnList.length > 0) {
            // Create a row for each ODN
            odnList.forEach(odn => {
              filteredData.push({
                ...f,
                process: proc,
                odn: odn,
                uniqueId: `${f.id}-${odn.id}` // Unique identifier for React keys
              });
            });
          }
        }
      }
    });
    
    // Debug info for EWM officers (after processing)
    console.log('EWM Debug Info');
    console.log('Total Facilities:', facilities.length);
    console.log('Total Processes:', activeProcesses.length);
    console.log('O2C Completed Processes:', activeProcesses.filter(p => p.status === 'o2c_completed').length);
    console.log('Filtered Facilities:', filteredData.length);
    console.log('Current Period:', currentPeriod);
    console.log('Filter Type:', filterType);
  } else {
    // O2C Officers: Original facility-based filtering
    filteredData = facilities.filter(f => {
      const matchesSearch = (f.facility_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (f.route || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRoute = filterRoute === "All" || f.route === filterRoute;
      const shouldShow = shouldShowFacility(f);
      
      const selReporting = `${currentEthiopianMonth} ${currentEthiopianYear}`;
      const proc = activeProcesses.find(a => a.facility_id === f.id && a.reporting_month === selReporting);
      
      // O2C Officer should see:
      // 1. Facilities with no process (can start new), OR
      // 2. Facilities with any process status (active or passed)
      const shouldShowForO2C = true; // Show all that match other filters
      
      return matchesSearch && matchesRoute && shouldShow && shouldShowForO2C;
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
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
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
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
                        <TableCell>
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
                            {!isInactive && !isODNCompleted && (
                              <Tooltip title="Complete ODN">
                                <Button 
                                  variant="contained" 
                                  color="success" 
                                  size="small" 
                                  startIcon={<CheckCircleIcon />} 
                                  onClick={() => handleCompleteODN(odn.id)}
                                  className="action-button"
                                  sx={{ borderRadius: 2 }}
                                >
                                  Complete
                                </Button>
                              </Tooltip>
                            )}
                            {!isInactive && (
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
                            )}
                            <Tooltip title="View Details">
                              <Button 
                                variant="outlined" 
                                color="info" 
                                size="small" 
                                startIcon={<VisibilityIcon />} 
                                onClick={() => handleViewODNDetails(proc.id, f.facility_name, f, odn.odn_number)}
                                className="action-button"
                                sx={{ borderRadius: 2 }}
                                disabled={isInactive}
                              >
                                Detail
                              </Button>
                            </Tooltip>
                            {isInactive && (
                              <Chip 
                                label={`Passed to ${proc.status === 'ewm_completed' ? 'PI' : 
                                       proc.status === 'vehicle_requested' ? 'Dispatch' : 
                                       'Next Stage'}`}
                                color="default" 
                                size="small" 
                                icon={<CheckCircleIcon />}
                              />
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    // O2C Officer: Each row is a facility (original logic)
                    const f = item;
                    const selReporting = `${currentEthiopianMonth} ${currentEthiopianYear}`;
                    const proc = activeProcesses.find(a => a.facility_id === f.id && a.reporting_month === selReporting);
                    const isOwner = proc && String(proc.o2c_officer_id) === String(loggedInUserId);
                    const hasODNs = proc && (processODNCounts[proc.id] || 0) > 0;
                    const odnCount = proc ? (processODNCounts[proc.id] || 0) : 0;
                    
                    // Process is inactive if it has passed O2C stage
                    // O2C stage statuses: 'o2c_started', 'completed'
                    // Passed O2C: 'o2c_completed', 'ewm_completed', 'vehicle_requested', 'vehicle_assigned', 'dispatched', etc.
                    const hasPassedO2C = proc && !['o2c_started', 'completed'].includes(proc.status);
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
                        <TableCell>
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
      </Container>
    </>
  );
};

export default HpFacilities;