import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Grid,
  Paper,
  Snackbar,
  Alert,
  Avatar,
  Stack,
  Fade,
  Zoom,
  Card,
  CardContent,
} from '@mui/material';
import {
  PersonAdd,
  LocationOn,
  Business,
  Phone,
  Email,
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(timezone);

const api_url = process.env.REACT_APP_API_URL;

const RegisterCustomer = () => {
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [officers, setOfficers] = useState([]);
  
  // Loading states
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingWoredas, setLoadingWoredas] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  
  // New state to store customer counts for each officer
  const [assignedCustomerCounts, setAssignedCustomerCounts] = useState({});

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedWoreda, setSelectedWoreda] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  
  const [delegate, setDelegate] = useState('');
  const [delegatePhone, setDelegatePhone] = useState('');
  const [letterNumber, setLetterNumber] = useState('');

  // Initializing with the current date and time in the user's local time zone
  const [startedAt, setStartedAt] = useState(dayjs().tz(dayjs.tz.guess()).format('YYYY-MM-DDTHH:mm'));
  
  // New state to manage visibility of O2C officer selection for Credit sales
  const [showCreditO2cSelect, setShowCreditO2cSelect] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  /* ---------------- Fetching Data ---------------- */
  useEffect(() => {
    setLoadingRegions(true);
    axios.get(`${api_url}/api/regions`).then(res => {
      console.log('Fetched regions:', res.data);
      setRegions(res.data);
      setLoadingRegions(false);
    }).catch(err => {
      console.error('Error fetching regions:', err);
      setSnackbarMessage('Failed to load regions.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setLoadingRegions(false);
    });
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      setLoadingZones(true);
      setZones([]);
      setWoredas([]);
      setFacilities([]);
      setSelectedZone('');
      setSelectedWoreda('');
      setSelectedFacility('');
      
      // Use query parameter to filter zones by region
      axios.get(`${api_url}/api/zones?region=${encodeURIComponent(selectedRegion)}`).then(res => {
        console.log('Filtered zones for region', selectedRegion, ':', res.data);
        setZones(res.data);
        setLoadingZones(false);
      }).catch(err => {
        console.error('Error fetching zones:', err);
        setSnackbarMessage('Failed to load zones.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoadingZones(false);
      });
    } else {
      setZones([]);
      setWoredas([]);
      setFacilities([]);
      setSelectedZone('');
      setSelectedWoreda('');
      setSelectedFacility('');
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedZone) {
      setLoadingWoredas(true);
      setWoredas([]);
      setFacilities([]);
      setSelectedWoreda('');
      setSelectedFacility('');
      
      // Use query parameter to filter woredas by zone
      axios.get(`${api_url}/api/woredas?zone=${encodeURIComponent(selectedZone)}`).then(res => {
        console.log('Filtered woredas for zone', selectedZone, ':', res.data);
        setWoredas(res.data);
        setLoadingWoredas(false);
      }).catch(err => {
        console.error('Error fetching woredas:', err);
        setSnackbarMessage('Failed to load woredas.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoadingWoredas(false);
      });
    } else {
      setWoredas([]);
      setFacilities([]);
      setSelectedWoreda('');
      setSelectedFacility('');
    }
  }, [selectedZone]);

  useEffect(() => {
    if (selectedWoreda) {
      setLoadingFacilities(true);
      setFacilities([]);
      setSelectedFacility('');
      
      // Use the filtered facilities endpoint
      axios.get(`${api_url}/api/filtered-facilities?woreda=${encodeURIComponent(selectedWoreda)}`).then(res => {
        console.log('Filtered facilities for woreda', selectedWoreda, ':', res.data);
        setFacilities(res.data);
        setLoadingFacilities(false);
      }).catch(err => {
        console.error('Error fetching facilities:', err);
        setSnackbarMessage('Failed to load facilities.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoadingFacilities(false);
      });
    } else {
      setFacilities([]);
      setSelectedFacility('');
    }
  }, [selectedWoreda]);

  // Fetch all employees
  useEffect(() => {
    axios
      .get(`${api_url}/api/get-employee`)
      .then(res => setOfficers(res.data))
      .catch(err => {
        console.error('Failed to fetch officers:', err);
        setSnackbarMessage('Failed to load employee data.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
  }, []);

  // Fetch all customers and calculate counts for each officer
  useEffect(() => {
    const fetchAssignedCounts = async () => {
      try {
        const response = await axios.get(`${api_url}/api/serviceList`);
        const allCustomers = response.data;
        const counts = {};

        // Loop through all customers to count active assignments for each officer
        allCustomers.forEach(customer => {
          // Count customers with 'started', 'notifying', or 'o2c_started' status
          // and assigned to an O2C service point
          if (
            (customer.status?.toLowerCase() === 'started' ||
              customer.status?.toLowerCase() === 'notifying' ||
              customer.status?.toLowerCase() === 'o2c_started') &&
            customer.next_service_point?.toLowerCase() === 'o2c'
          ) {
            const officerId = customer.assigned_officer_id;
            if (officerId) {
              counts[officerId] = (counts[officerId] || 0) + 1;
            }
          }
        });
        setAssignedCustomerCounts(counts);
      } catch (err) {
        console.error('Failed to fetch customer data for counts:', err);
      }
    };

    // Only fetch counts if officers are available
    if (officers.length > 0) {
      fetchAssignedCounts();
    }
  }, [officers]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const filteredO2cOfficers = officers.filter(o => o.jobTitle === 'O2C Officer');

  const handleCustomerTypeChange = (e) => {
    setCustomerType(e.target.value);
    setShowCreditO2cSelect(false);
    setSelectedOfficer('');
  };

  const handleSubmit = (forwardPath) => {
    if (!selectedFacility || !customerType) {
      setSnackbarMessage('Please fill in all required fields.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if ((customerType === 'Cash' || forwardPath === 'O2C') && !selectedOfficer) {
      setSnackbarMessage('Please select an O2C Officer.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    let nextServicePoint = forwardPath;
    let assignedOfficerId = null;

    if (nextServicePoint === 'O2C') {
      assignedOfficerId = selectedOfficer;
    }

    // Get current date and time in LOCAL timezone and format for MySQL
    const now = new Date();
    const formattedStartedAt = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
    
    console.log('🕐 Registration timestamp being sent:', formattedStartedAt);
    console.log('🕐 Current browser time:', now.toString());
    
    // Get the current user info from localStorage
    const registeredById = localStorage.getItem('EmployeeID');
    const registeredByName = localStorage.getItem('FullName');
    
    const payload = {
      facility_id: selectedFacility,
      customer_type: customerType,
      current_service_point: 'Registration',
      next_service_point: nextServicePoint,
      assigned_officer_id: assignedOfficerId,
      status: 'started',
      started_at: formattedStartedAt,
      registration_completed_at: formattedStartedAt,
      registered_by_id: registeredById,
      registered_by_name: registeredByName,
      delegate: delegate,
      delegate_phone: delegatePhone,
      letter_number: letterNumber,
    };

    axios.post(`${api_url}/api/customer-queue`, payload).then(async (response) => {
      const customerQueueId = response.data.task?.id;
      
      // Insert service time record for Customer Service Officer
      if (customerQueueId) {
        const serviceTimeData = {
          process_id: customerQueueId,
          service_unit: 'Customer Service Officer',
          start_time: formattedStartedAt,
          end_time: formattedStartedAt,
          waiting_minutes: 0,
          officer_id: registeredById,
          officer_name: registeredByName,
          status: 'completed',
          notes: 'Customer registration completed'
        };
        
        try {
          const serviceTimeResponse = await axios.post(`${api_url}/api/service-time`, serviceTimeData);
          console.log('✅ Service time recorded:', serviceTimeResponse.data);
        } catch (err) {
          console.error('❌ Failed to record service time:', err);
          console.error('Error details:', err.response?.data);
          // Don't fail the registration if service time recording fails
        }
      }
      
      setSnackbarMessage('Customer registered and sent to service point.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setSelectedRegion('');
      setSelectedZone('');
      setSelectedWoreda('');
      setSelectedFacility('');
      setCustomerType('');
      setSelectedOfficer('');
      setDelegate('');
      setDelegatePhone('');
      setLetterNumber('');
      setStartedAt(dayjs().tz(dayjs.tz.guess()).format('YYYY-MM-DDTHH:mm'));
      setShowCreditO2cSelect(false);
    }).catch(err => {
      console.error('Registration failed:', err);
      setSnackbarMessage('Registration failed. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    });
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
          .registration-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .registration-card:hover {
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
          .enhanced-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 16px 32px;
            font-weight: 600;
            text-transform: none;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            border: none;
            color: white;
          }
          .enhanced-button:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #667eea 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
          }
          .form-field {
            transition: all 0.3s ease;
          }
          .form-field:hover {
            transform: translateY(-1px);
          }
        `}
      </style>
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', py: 4, px: 2 }}>
        <Box className="registration-card animate-fade-in" sx={{ maxWidth: 800, mx: 'auto' }}>
          {/* Header Section */}
          <Box className="header-gradient">
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={3}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  width: 64, 
                  height: 64,
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  <PersonAdd sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" fontWeight="bold" sx={{ 
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    mb: 1
                  }}>
                    Register Customer
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    opacity: 0.9, 
                    fontWeight: 300,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    Add new customer to the service queue
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          {/* Form Section */}
          <Box sx={{ p: 4 }}>
            <Grid container spacing={3}>
              {/* Location Section */}
              <Grid item xs={12}>
                <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                      <LocationOn color="primary" />
                      <Typography variant="h6" fontWeight="bold">
                        Location Information
                      </Typography>
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          label="Region"
                          value={selectedRegion}
                          onChange={e => setSelectedRegion(e.target.value)}
                          className="form-field"
                          disabled={loadingRegions}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }
                            }
                          }}
                        >
                          {loadingRegions ? (
                            <MenuItem disabled>Loading regions...</MenuItem>
                          ) : regions.length === 0 ? (
                            <MenuItem disabled>No regions available</MenuItem>
                          ) : (
                            regions.map(r => (
                              <MenuItem key={r.id} value={r.region_name}>
                                {r.region_name}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          label="Zone"
                          value={selectedZone}
                          onChange={e => setSelectedZone(e.target.value)}
                          className="form-field"
                          disabled={!selectedRegion || loadingZones}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }
                            }
                          }}
                        >
                          {loadingZones ? (
                            <MenuItem disabled>Loading zones...</MenuItem>
                          ) : !selectedRegion ? (
                            <MenuItem disabled>Please select a region first</MenuItem>
                          ) : zones.length === 0 ? (
                            <MenuItem disabled>No zones available for selected region</MenuItem>
                          ) : (
                            zones.map(z => (
                              <MenuItem key={z.id} value={z.zone_name}>
                                {z.zone_name}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          label="Woreda"
                          value={selectedWoreda}
                          onChange={e => setSelectedWoreda(e.target.value)}
                          className="form-field"
                          disabled={!selectedZone || loadingWoredas}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }
                            }
                          }}
                        >
                          {loadingWoredas ? (
                            <MenuItem disabled>Loading woredas...</MenuItem>
                          ) : !selectedZone ? (
                            <MenuItem disabled>Please select a zone first</MenuItem>
                          ) : woredas.length === 0 ? (
                            <MenuItem disabled>No woredas available for selected zone</MenuItem>
                          ) : (
                            woredas.map(w => (
                              <MenuItem key={w.id} value={w.woreda_name}>
                                {w.woreda_name}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          label="Facility"
                          value={selectedFacility}
                          onChange={e => setSelectedFacility(e.target.value)}
                          className="form-field"
                          disabled={!selectedWoreda || loadingFacilities}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }
                            }
                          }}
                        >
                          {loadingFacilities ? (
                            <MenuItem disabled>Loading facilities...</MenuItem>
                          ) : !selectedWoreda ? (
                            <MenuItem disabled>Please select a woreda first</MenuItem>
                          ) : facilities.length === 0 ? (
                            <MenuItem disabled>No facilities available for selected woreda</MenuItem>
                          ) : (
                            facilities.map(f => (
                              <MenuItem key={f.id} value={f.id}>
                                {f.facility_name}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Delegate Information */}
              <Grid item xs={12}>
                <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                      <Business color="primary" />
                      <Typography variant="h6" fontWeight="bold">
                        Delegate Information
                      </Typography>
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Delegate Name"
                          value={delegate}
                          onChange={e => setDelegate(e.target.value)}
                          className="form-field"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Delegate Phone"
                          value={delegatePhone}
                          onChange={e => setDelegatePhone(e.target.value)}
                          className="form-field"
                          InputProps={{
                            startAdornment: <Phone color="action" sx={{ mr: 1 }} />
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Letter Number"
                          value={letterNumber}
                          onChange={e => setLetterNumber(e.target.value)}
                          className="form-field"
                          InputProps={{
                            startAdornment: <Email color="action" sx={{ mr: 1 }} />
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Customer Type */}
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Customer Type"
                  value={customerType}
                  onChange={handleCustomerTypeChange}
                  className="form-field"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }
                    }
                  }}
                >
                  <MenuItem value="Cash">Cash Sale</MenuItem>
                  <MenuItem value="Credit">Credit Sale</MenuItem>
                </TextField>
              </Grid>

              {/* Dynamic Officer Selection and Buttons */}
              {customerType === 'Cash' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Assign O2C Officer"
                      value={selectedOfficer}
                      onChange={e => setSelectedOfficer(e.target.value)}
                      className="form-field"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }
                        }
                      }}
                    >
                      {filteredO2cOfficers.map(officer => (
                        <MenuItem key={officer.id} value={officer.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{officer.full_name}</span>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                              ({assignedCustomerCounts[officer.id] || 0})
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={() => handleSubmit('O2C')}
                      className="enhanced-button"
                      sx={{ py: 2 }}
                    >
                      Register & Forward to O2C Officer
                    </Button>
                  </Grid>
                </>
              )}

              {customerType === 'Credit' && !showCreditO2cSelect && (
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => setShowCreditO2cSelect(true)}
                    className="enhanced-button"
                    sx={{ py: 2 }}
                  >
                    Register & Forward to O2C Officer
                  </Button>
                </Grid>
              )}

              {customerType === 'Credit' && showCreditO2cSelect && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Choose O2C Officer"
                      value={selectedOfficer}
                      onChange={e => setSelectedOfficer(e.target.value)}
                      className="form-field"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }
                        }
                      }}
                    >
                      {filteredO2cOfficers.map(officer => (
                        <MenuItem key={officer.id} value={officer.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{officer.full_name}</span>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                              ({assignedCustomerCounts[officer.id] || 0})
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={() => handleSubmit('O2C')}
                      className="enhanced-button"
                      sx={{ py: 2 }}
                    >
                      Finalize Registration
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </Box>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default RegisterCustomer;