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
import { formatTimestamp } from '../../utils/serviceTimeHelper';

const MySwal = withReactContent(Swal);

const DocumentationManagement = () => {
  const [facilityData, setFacilityData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isDocumentationOfficer = userJobTitle === 'Documentation Officer - HP';
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
    // Set default to current Ethiopian month and year
    setSelectedMonth(currentEthiopian.month);
    setSelectedYear(currentEthiopian.year.toString());
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchDispatchedFacilities();
    }
  }, [selectedMonth, selectedYear, searchTerm, page, rowsPerPage]);

  const fetchDispatchedFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate required parameters
      if (!selectedMonth || !selectedYear) {
        setError("Please select both month and year to load facilities.");
        return;
      }
      
      console.log('Fetching facilities with params:', {
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
      
      if (response.data.facilities) {
        setFacilityData(response.data.facilities);
        
        // Show informative message if no facilities found
        if (response.data.facilities.length === 0) {
          setError(`No facilities found for the selected period.`);
        }
      } else {
        setFacilityData([]);
        setError("No facility data received from server.");
      }
      
    } catch (err) {
      console.error("Fetch error:", err);
      
      let errorMessage = "Failed to load dispatched facilities. ";
      
      if (err.response) {
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
        errorMessage += "Network error. Please check your connection and try again.";
      } else {
        errorMessage += err.message || "Please try again.";
      }
      
      setError(errorMessage);
      setFacilityData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePODNumberChange = (facilityId, value) => {
    setFacilityData(prevData =>
      prevData.map(facility =>
        facility.facility_id === facilityId
          ? { ...facility, pod_numbers: value }
          : facility
      )
    );
  };

  const handleArrivalKmChange = (facilityId, value) => {
    setFacilityData(prevData =>
      prevData.map(facility =>
        facility.facility_id === facilityId
          ? { ...facility, arrival_kilometer: value }
          : facility
      )
    );
  };

  const handleSavePODDetails = async (facility) => {
    const reportingMonth = `${selectedMonth} ${selectedYear}`;
    
    // Validate inputs
    if (!facility.pod_numbers || !facility.pod_numbers.trim()) {
      MySwal.fire({
        icon: 'warning',
        title: 'POD Number Required',
        text: 'Please enter at least one POD number before saving.',
      });
      return;
    }

    if (!facility.arrival_kilometer || parseFloat(facility.arrival_kilometer) < 0) {
      MySwal.fire({
        icon: 'warning',
        title: 'Destination Kilometer Required',
        text: 'Please enter a valid destination kilometer before saving.',
      });
      return;
    }

    try {
      setAutoSaving(true);

      // Update facility POD details
      await axios.put(`${api_url}/api/documentation/facility-pod-confirmation`, {
        facility_id: facility.facility_id,
        reporting_month: reportingMonth,
        pod_numbers: facility.pod_numbers.trim(),
        arrival_kilometer: parseFloat(facility.arrival_kilometer),
        route_assignment_id: facility.route_assignment_id,
        confirmed_by: loggedInUserId
      });

      // Refresh data
      fetchDispatchedFacilities();

      MySwal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'POD details saved successfully.',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (err) {
      console.error('Save error:', err);
      MySwal.fire('Error', 'Failed to save POD details.', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  const handlePassToQualityEvaluator = async (facility) => {
    const reportingMonth = `${selectedMonth} ${selectedYear}`;
    
    // Check if POD details are filled
    if (!facility.pod_numbers || !facility.pod_numbers.trim()) {
      MySwal.fire({
        icon: 'warning',
        title: 'POD Number Required',
        text: 'Please enter POD number(s) before passing to Quality Evaluator.',
      });
      return;
    }

    if (!facility.arrival_kilometer || parseFloat(facility.arrival_kilometer) < 0) {
      MySwal.fire({
        icon: 'warning',
        title: 'Destination Kilometer Required',
        text: 'Please enter destination kilometer before passing to Quality Evaluator.',
      });
      return;
    }

    // Confirm action
    const result = await MySwal.fire({
      title: 'Pass to Quality Evaluator?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <strong>Facility:</strong> ${facility.facility_name}<br>
            <strong>Route:</strong> ${facility.route_name}<br>
            <strong>Total ODNs:</strong> ${facility.total_odns}<br>
            <strong>POD Numbers:</strong> ${facility.pod_numbers}<br>
            <strong>Destination KM:</strong> ${facility.arrival_kilometer}
          </div>
          <div style="background: #fff3cd; padding: 10px; border-radius: 5px;">
            <small style="color: #856404;">
              <strong>Note:</strong> This will mark POD as confirmed and pass all ${facility.total_odns} ODNs to Quality Evaluator.
            </small>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Pass to Quality Evaluator',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4caf50',
      width: '600px'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setAutoSaving(true);

      // Update facility POD confirmation
      await axios.put(`${api_url}/api/documentation/facility-pod-confirmation`, {
        facility_id: facility.facility_id,
        reporting_month: reportingMonth,
        pod_numbers: facility.pod_numbers.trim(),
        arrival_kilometer: parseFloat(facility.arrival_kilometer),
        route_assignment_id: facility.route_assignment_id,
        confirmed_by: loggedInUserId
      });

      // Record service time for Documentation Officer
      try {
        const docEndTime = formatTimestamp();
        
        // Get all process IDs for this facility
        const odnIds = facility.odn_ids.split(',');
        
        for (const odnId of odnIds) {
          // Get process_id from ODN
          const odnResponse = await axios.get(`${api_url}/api/odns/${odnId}`);
          const processId = odnResponse.data?.process_id;
          
          if (processId) {
            // Calculate waiting time: current time - Dispatcher end time
            let waitingMinutes = 0;
            try {
              const dispatchResponse = await axios.get(`${api_url}/api/service-time-hp/last-end-time`, {
                params: {
                  process_id: processId,
                  service_unit: 'Dispatcher - HP'
                }
              });
              
              if (dispatchResponse.data.end_time) {
                const prevTime = new Date(dispatchResponse.data.end_time);
                const currTime = new Date(docEndTime);
                const diffMs = currTime - prevTime;
                waitingMinutes = Math.floor(diffMs / 60000);
                waitingMinutes = waitingMinutes > 0 ? waitingMinutes : 0;
              }
            } catch (err) {
              console.error('Failed to get Dispatcher end time:', err);
            }
            
            await axios.post(`${api_url}/api/service-time-hp`, {
              process_id: processId,
              service_unit: 'Documentation Officer - HP',
              start_time: docEndTime,
              end_time: docEndTime,
              waiting_minutes: waitingMinutes,
              officer_id: loggedInUserId,
              officer_name: localStorage.getItem('FullName'),
              status: 'completed',
              notes: `POD confirmed - POD #: ${facility.pod_numbers.trim()}`
            });
            
            console.log(`✅ Documentation Officer service time recorded for process ${processId}`);
          }
        }
      } catch (err) {
        console.error('❌ Failed to record Documentation service time:', err);
      }

      // Refresh data
      fetchDispatchedFacilities();

      MySwal.fire({
        icon: 'success',
        title: 'Success!',
        html: `
          <div style="text-align: center;">
            <p>POD confirmed for <strong>${facility.facility_name}</strong></p>
            <p><strong>${facility.total_odns}</strong> ODNs passed to Quality Evaluator</p>
            <p>POD Numbers: <strong>${facility.pod_numbers.trim()}</strong></p>
          </div>
        `,
        timer: 3000,
        showConfirmButton: false
      });

    } catch (err) {
      console.error('Save error:', err);
      MySwal.fire('Error', 'Failed to pass to Quality Evaluator.', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  // Access control
  if (!isDocumentationOfficer) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to Documentation Officer - HP role only.
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
          .facility-row {
            transition: all 0.2s ease;
          }
          .facility-row:hover {
            background-color: #f5f5f5;
            transform: translateX(4px);
          }
          .confirmed-row {
            background-color: #e8f5e9;
            opacity: 0.8;
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
                  Confirm Proof of Delivery (POD) for dispatched facilities
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
                placeholder="Search by facility name or route..."
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
          </Grid>
        </Card>

        {/* Auto-save indicator */}
        {autoSaving && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LinearProgress sx={{ width: 100 }} />
              <Typography variant="body2">Saving...</Typography>
            </Stack>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            <Typography variant="body2" gutterBottom>
              {error}
            </Typography>
          </Alert>
        )}

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Facilities Table */}
        <Card className="doc-card">
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <FacilityIcon color="primary" />
                <Typography variant="h6">Dispatched Facilities - POD Confirmation</Typography>
                <Chip 
                  label={`${facilityData.length} Facilities`} 
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
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ODNIcon fontSize="small" />
                      <span>ODNs</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <DocumentIcon fontSize="small" />
                      <span>POD Details</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {facilityData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No facilities found for the selected period.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  facilityData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((facility) => {
                    const isFullyConfirmed = facility.confirmed_pods === facility.total_odns;
                    
                    return (
                      <TableRow 
                        key={facility.facility_id}
                        className={`facility-row ${isFullyConfirmed ? 'confirmed-row' : ''}`}
                        hover
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {facility.facility_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {facility.region_name} • {facility.zone_name} • {facility.woreda_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {facility.route_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Chip 
                              label={`${facility.total_odns} ODNs`} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {facility.odn_numbers}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="e.g., POD001, POD002, POD003"
                              value={facility.pod_numbers || ''}
                              onChange={(e) => handlePODNumberChange(facility.facility_id, e.target.value)}
                              disabled={isFullyConfirmed}
                              label="POD Numbers"
                              sx={{ mb: 1 }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              placeholder="Destination kilometer"
                              value={facility.arrival_kilometer || ''}
                              onChange={(e) => handleArrivalKmChange(facility.facility_id, e.target.value)}
                              disabled={isFullyConfirmed}
                              label="Destination KM"
                              inputProps={{ step: 0.01, min: 0 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {isFullyConfirmed ? (
                            <Chip 
                              icon={<ConfirmedIcon />}
                              label="Confirmed" 
                              color="success" 
                              size="small"
                            />
                          ) : (
                            <Stack spacing={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                color="primary"
                                onClick={() => handleSavePODDetails(facility)}
                                startIcon={<SaveIcon />}
                                disabled={!facility.pod_numbers || !facility.arrival_kilometer}
                              >
                                Save
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                color="success"
                                onClick={() => handlePassToQualityEvaluator(facility)}
                                startIcon={<ConfirmedIcon />}
                                disabled={!facility.pod_numbers || !facility.arrival_kilometer}
                              >
                                Pass to QE
                              </Button>
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination 
              component="div" 
              count={facilityData.length} 
              rowsPerPage={rowsPerPage} 
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
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
