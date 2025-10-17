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
} from '@mui/material';
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
    axios.get(`${api_url}/api/regions`).then(res => setRegions(res.data));
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      axios.get(`${api_url}/api/zones`).then(res => {
        const filtered = res.data.filter(z => z.region_name === selectedRegion);
        setZones(filtered);
        setSelectedZone('');
        setSelectedWoreda('');
        setSelectedFacility('');
        setWoredas([]);
        setFacilities([]);
      });
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedZone) {
      axios.get(`${api_url}/api/woredas`).then(res => {
        const filtered = res.data.filter(w => w.zone_name === selectedZone);
        setWoredas(filtered);
        setSelectedWoreda('');
        setSelectedFacility('');
        setFacilities([]);
      });
    }
  }, [selectedZone]);

  useEffect(() => {
    if (selectedWoreda) {
      axios.get(`${api_url}/api/facilities`).then(res => {
        const filtered = res.data.filter(f => f.woreda_name === selectedWoreda);
        setFacilities(filtered);
        setSelectedFacility('');
      });
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

    // Get current date and time and format for the backend
    const formattedStartedAt = dayjs().tz(dayjs.tz.guess()).format('YYYY-MM-DD HH:mm:ssZ');
    
    const payload = {
      facility_id: selectedFacility,
      customer_type: customerType,
      current_service_point: 'Registration',
      next_service_point: nextServicePoint,
      assigned_officer_id: assignedOfficerId,
      status: 'started',
      started_at: formattedStartedAt,
      delegate: delegate,
      delegate_phone: delegatePhone,
      letter_number: letterNumber,
    };

    axios.post(`${api_url}/api/customer-queue`, payload).then(() => {
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
    <Box sx={{ py: 5, px: 2 }}>
      <Paper
        elevation={3}
        sx={{
          maxWidth: 700,
          mx: 'auto',
          p: 4,
          borderRadius: 3,
        }}
      >
        <Typography variant="h4" align="center" fontWeight={600} gutterBottom>
          Register Customer
        </Typography>

        <Grid container spacing={2}>
          {/* Region / Zone */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Region"
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
            >
              {regions.map(r => (
                <MenuItem key={r.id} value={r.region_name}>
                  {r.region_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Zone"
              value={selectedZone}
              onChange={e => setSelectedZone(e.target.value)}
            >
              {zones.map(z => (
                <MenuItem key={z.id} value={z.zone_name}>
                  {z.zone_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Woreda / Facility */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Woreda"
              value={selectedWoreda}
              onChange={e => setSelectedWoreda(e.target.value)}
            >
              {woredas.map(w => (
                <MenuItem key={w.id} value={w.woreda_name}>
                  {w.woreda_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Facility"
              value={selectedFacility}
              onChange={e => setSelectedFacility(e.target.value)}
            >
              {facilities.map(f => (
                <MenuItem key={f.id} value={f.id}>
                  {f.facility_name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* New Date and Time Picker - COMMENTED OUT
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Registration Date"
              type="datetime-local"
              value={startedAt}
              onChange={e => setStartedAt(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          */}
          
          {/* Delegate / Delegate Phone */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Delegate Name"
              value={delegate}
              onChange={e => setDelegate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Delegate Phone"
              value={delegatePhone}
              onChange={e => setDelegatePhone(e.target.value)}
            />
          </Grid>

          {/* Letter Number */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Letter Number"
              value={letterNumber}
              onChange={e => setLetterNumber(e.target.value)}
            />
          </Grid>

          {/* Customer Type (spans full) */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Customer Type"
              value={customerType}
              onChange={handleCustomerTypeChange}
            >
              <MenuItem value="Cash">Cash Sale</MenuItem>
              <MenuItem value="Credit">Credit Sale</MenuItem>
            </TextField>
          </Grid>

          {/* Dynamic Buttons and Fields based on Customer Type */}
          {customerType === 'Cash' && (
            <>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Assign O2C Officer"
                  value={selectedOfficer}
                  onChange={e => setSelectedOfficer(e.target.value)}
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
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={() => handleSubmit('O2C')}
                >
                  Register & Forward to O2C Officer
                </Button>
              </Grid>
            </>
          )}

          {customerType === 'Credit' && !showCreditO2cSelect && (
            <>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={() => setShowCreditO2cSelect(true)}
                >
                  Register & Forward to O2C Officer
                </Button>
              </Grid>
            </>
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
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={() => handleSubmit('O2C')}
                >
                  Finalize Registration
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      
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
  );
};

export default RegisterCustomer;