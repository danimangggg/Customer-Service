import { useState, useEffect } from 'react';
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FilterListIcon from '@mui/icons-material/FilterList';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const HpFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeProcesses, setActiveProcesses] = useState([]);
  const [processODNCounts, setProcessODNCounts] = useState({});
  const [processODNData, setProcessODNData] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering States
  const [filterRegion, setFilterRegion] = useState("All");

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isO2COfficer = userJobTitle === 'O2C Officer - HP';
  const isEWMOfficer = userJobTitle === 'EWM Officer - HP';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  const getCurrentEthiopianMonth = (gDate = new Date()) => {
    const gy = gDate.getFullYear();
    const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
    const newYear = new Date(gy, 8, isLeap ? 12 : 11);
    let ethYear, diffDays;
    if (gDate >= newYear) {
      ethYear = gy - 7;
      diffDays = Math.floor((gDate - newYear) / (24 * 60 * 60 * 1000));
    } else {
      const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
      const prevNewYear = new Date(gy - 1, 8, prevIsLeap ? 12 : 11);
      ethYear = gy - 8;
      diffDays = Math.floor((gDate - prevNewYear) / (24 * 60 * 60 * 1000));
    }
    const monthIndex = Math.floor(diffDays / 30);
    return { year: ethYear, monthIndex: Math.max(0, Math.min(monthIndex, 12)) };
  };

  const initialEth = getCurrentEthiopianMonth();
  const [selectedYear, setSelectedYear] = useState(initialEth.year);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(initialEth.monthIndex);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [facRes, procRes] = await Promise.all([
          axios.get(`${api_url}/api/facilities`),
          axios.get(`${api_url}/api/active-processes`)
        ]);
        const assigned = (facRes.data || []).filter(f => f.route && f.route.toString().trim().length > 0);
        setFacilities(assigned);
        const processes = procRes.data || [];
        setActiveProcesses(processes);
        
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
      const reportingMonthStr = `${ethiopianMonths[selectedMonthIndex]} ${selectedYear}`;
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
  // --- VIEW ODN DETAILS FOR EWM ---
  const handleViewODNDetails = async (processId, facilityName, facility) => {
    try {
      const response = await axios.get(`${api_url}/api/odns/${processId}`);
      const odns = response.data.data || [];
      
      if (odns.length === 0) {
        Swal.fire('No ODNs', 'No ODN numbers found for this process.', 'info');
        return;
      }

      // Get process details
      const process = activeProcesses.find(p => p.id === processId);
      
      const odnList = odns.map((odn, index) => 
        `<div style="padding: 12px; border: 1px solid #e0e0e0; margin-bottom: 10px; border-radius: 8px; background: ${odn.status === 'ewm_completed' ? '#e8f5e8' : '#fff8e1'};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #1976d2; font-size: 16px;">ODN ${index + 1}:</strong> 
              <span style="font-size: 18px; font-weight: bold; color: #333; margin-left: 8px;">${odn.odn_number}</span>
            </div>
            <div style="text-align: right;">
              <div style="background: ${odn.status === 'ewm_completed' ? '#4caf50' : '#ff9800'}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; margin-bottom: 4px;">
                ${odn.status === 'ewm_completed' ? 'EWM COMPLETED' : 'PENDING'}
              </div>
              <small style="color: #666; display: block;">Created: ${new Date(odn.created_at).toLocaleString()}</small>
            </div>
          </div>
        </div>`
      ).join('');

      const completedCount = odns.filter(odn => odn.status === 'ewm_completed').length;
      const pendingCount = odns.length - completedCount;

      MySwal.fire({
        title: `Facility Process Details`,
        html: `
          <div style="text-align: left;">
            <!-- Facility Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 20px; display: flex; align-items: center;">
                <span style="background: rgba(255,255,255,0.2); padding: 8px; border-radius: 8px; margin-right: 12px;">🏥</span>
                ${facilityName}
              </h2>
              <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                <div><strong>Region:</strong> ${facility.region_name || 'N/A'}</div>
                <div><strong>Route:</strong> ${facility.route || 'N/A'}</div>
                <div><strong>Process ID:</strong> #${processId}</div>
                <div><strong>Reporting Month:</strong> ${process?.reporting_month || 'N/A'}</div>
              </div>
            </div>

            <!-- Statistics -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px;">
              <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${odns.length}</div>
                <div style="color: #666; font-size: 12px;">Total ODNs</div>
              </div>
              <div style="background: #fff3e0; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #ff9800;">${pendingCount}</div>
                <div style="color: #666; font-size: 12px;">Pending</div>
              </div>
              <div style="background: #e8f5e8; padding: 16px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #4caf50;">${completedCount}</div>
                <div style="color: #666; font-size: 12px;">Completed</div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 14px; font-weight: bold;">Progress</span>
                <span style="font-size: 14px;">${completedCount}/${odns.length} ODNs Completed</span>
              </div>
              <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #4caf50, #66bb6a); height: 100%; width: ${odns.length > 0 ? (completedCount / odns.length) * 100 : 0}%; transition: width 0.3s ease;"></div>
              </div>
            </div>

            <!-- ODN List -->
            <div style="max-height: 400px; overflow-y: auto;">
              <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px;">ODN Details</h3>
              ${odnList}
            </div>

            <!-- Officer Information -->
            ${process?.o2c_officer_name ? `
              <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 20px;">
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">Process Information</h4>
                <div style="font-size: 13px; color: #666;">
                  <div><strong>O2C Officer:</strong> ${process.o2c_officer_name}</div>
                  <div><strong>Status:</strong> <span style="color: #4caf50; font-weight: bold;">${process.status?.toUpperCase() || 'N/A'}</span></div>
                </div>
              </div>
            ` : ''}
          </div>
        `,
        confirmButtonText: 'Close',
        width: '700px',
        customClass: {
          htmlContainer: 'swal-facility-details'
        }
      });
      
    } catch (err) {
      console.error('View facility details error:', err);
      Swal.fire('Error', 'Failed to load facility details.', 'error');
    }
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
        
        // Update the ODN status in local state
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

  // --- FILTERING LOGIC ---
  // For EWM Officers: Create rows for each ODN instead of each facility
  let filteredData = []; // Initialize as empty array
  
  if (isEWMOfficer) {
    // Create a row for each ODN
    facilities.forEach(f => {
      const matchesSearch = (f.facility_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (f.route || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = filterRegion === "All" || f.region_name === filterRegion;
      
      if (matchesSearch && matchesRegion) {
        const proc = activeProcesses.find(a => a.facility_id === f.id && a.status === 'o2c_completed');
        
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
    console.log('O2C Completed Processes:', activeProcesses.filter(p => p.status === 'o2c_completed'));
    console.log('Available Facilities (first 5):', facilities.slice(0, 5).map(f => `Facility ID ${f.id}: ${f.facility_name}`));
    console.log('Facility-Process Matches:');
    facilities.slice(0, 5).forEach(f => {
      const proc = activeProcesses.find(a => a.facility_id === f.id && a.status === 'o2c_completed');
      console.log(`Facility ${f.id} (${f.facility_name}) - Route: "${f.route}" ${proc ? '✓ Has O2C completed process' : '✗ No O2C completed process'}`);
    });
    console.log('Facilities with O2C processes but no route:');
    activeProcesses.filter(p => p.status === 'o2c_completed').forEach(proc => {
      const facility = facilities.find(f => f.id === proc.facility_id);
      if (facility && (!facility.route || facility.route.trim() === '')) {
        console.log(`Process ${proc.id} - Facility ${facility.id} (${facility.facility_name}) has no route`);
      }
    });
  } else {
    // O2C Officers: Original facility-based filtering
    filteredData = facilities.filter(f => {
      const matchesSearch = (f.facility_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (f.route || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = filterRegion === "All" || f.region_name === filterRegion;
      
      const selReporting = `${ethiopianMonths[selectedMonthIndex]} ${selectedYear}`;
      const proc = activeProcesses.find(a => a.facility_id === f.id && a.reporting_month === selReporting);
      return matchesSearch && matchesRegion && (!proc || proc.status !== 'o2c_completed');
    });
  }

  const regions = ["All", ...new Set(facilities.map(f => f.region_name).filter(Boolean))];

  // Calculate statistics based on user role
  const totalFacilities = filteredData.length;
  const activeProcessCount = activeProcesses.length;
  const totalODNs = Object.values(processODNCounts).reduce((sum, count) => sum + count, 0);
  
  // Role-specific statistics
  const o2cCompletedCount = activeProcesses.filter(p => p.status === 'o2c_completed').length;
  const ewmCompletedCount = activeProcesses.filter(p => p.status === 'ewm_completed').length;
  const pendingEWMCount = isEWMOfficer ? o2cCompletedCount - ewmCompletedCount : 0;

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
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mr: 1 }}
              onClick={() => {
                localStorage.setItem('JobTitle', 'O2C Officer - HP');
                window.location.reload();
              }}
            >
              Set as O2C Officer
            </Button>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => {
                localStorage.setItem('JobTitle', 'EWM Officer - HP');
                window.location.reload();
              }}
            >
              Set as EWM Officer
            </Button>
          </Box>
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

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card className="stats-card" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {totalFacilities}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Facilities
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className="stats-card-2" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {isEWMOfficer ? pendingEWMCount : activeProcessCount}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {isEWMOfficer ? 'Pending EWM' : 'Active Processes'}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className="stats-card-3" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {isEWMOfficer ? ewmCompletedCount : totalODNs}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {isEWMOfficer ? 'EWM Completed' : 'Total ODNs'}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

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
                <Typography variant="h6">Filters & Search</Typography>
              </Stack>
            }
            sx={{ pb: 1 }}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
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
                  label="Region" 
                  size="small" 
                  fullWidth 
                  value={filterRegion} 
                  onChange={(e) => setFilterRegion(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {regions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField 
                  select 
                  label="Year" 
                  size="small" 
                  fullWidth 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {[initialEth.year, initialEth.year - 1, initialEth.year - 2].map(y => 
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField 
                  select 
                  label="Month" 
                  size="small" 
                  fullWidth 
                  value={selectedMonthIndex} 
                  onChange={(e) => setSelectedMonthIndex(parseInt(e.target.value, 10))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {ethiopianMonths.map((m, idx) => 
                    <MenuItem key={m} value={idx}>{m}</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Chip 
                    icon={<CalendarTodayIcon />}
                    label={`${ethiopianMonths[selectedMonthIndex]} ${selectedYear}`}
                    color="primary"
                    variant="outlined"
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
                  {isEWMOfficer && (
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircleIcon fontSize="small" />
                        <span>Status</span>
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
                    const isODNCompleted = odn.status === 'ewm_completed';

                    return (
                      <TableRow key={item.uniqueId} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
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
                        <TableCell>
                          <Chip 
                            label={isODNCompleted ? 'EWM Completed' : 'Pending'}
                            size="small"
                            color={isODNCompleted ? 'success' : 'warning'}
                            icon={isODNCompleted ? <CheckCircleIcon /> : undefined}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                            {!isODNCompleted && (
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
                            <Tooltip title="View Details">
                              <Button 
                                variant="outlined" 
                                color="info" 
                                size="small" 
                                startIcon={<VisibilityIcon />} 
                                onClick={() => handleViewODNDetails(proc.id, f.facility_name, f)}
                                className="action-button"
                                sx={{ borderRadius: 2 }}
                              >
                                Detail
                              </Button>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    // O2C Officer: Each row is a facility (original logic)
                    const f = item;
                    const selReporting = `${ethiopianMonths[selectedMonthIndex]} ${selectedYear}`;
                    const proc = activeProcesses.find(a => a.facility_id === f.id && a.reporting_month === selReporting);
                    const isOwner = proc && String(proc.o2c_officer_id) === String(loggedInUserId);
                    const hasODNs = proc && (processODNCounts[proc.id] || 0) > 0;
                    const odnCount = proc ? (processODNCounts[proc.id] || 0) : 0;
                    const isCompleted = proc && proc.status === 'o2c_completed';

                    return (
                      <TableRow key={f.id} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
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
                                  {!hasODNs && !isCompleted && (
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
                                  {!isCompleted && (
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
                                  )}
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
                                  {isCompleted && (
                                    <Chip 
                                      label="Completed" 
                                      color="success" 
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
                                      {isCompleted ? 'Completed' : 'Process Owner'}
                                    </Typography>
                                  </Box>
                                  {isCompleted && (
                                    <Chip 
                                      label="Completed" 
                                      color="success" 
                                      size="small" 
                                      icon={<CheckCircleIcon />}
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
                                disabled={!f.route}
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