import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Card, CardContent, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  LocalShipping as TruckIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const TMManager = () => {
  const [phase1Processes, setPhase1Processes] = useState([]);
  const [phase2Processes, setPhase2Processes] = useState([]);
  const [page1, setPage1] = useState(0);
  const [page2, setPage2] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('phase1'); // 'phase1' or 'phase2'
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedDeliverer, setSelectedDeliverer] = useState('');
  const [departureKilometer, setDepartureKilometer] = useState('');
  const [processType, setProcessType] = useState('regular');

  const loggedInUserId = localStorage.getItem('UserId');
  const loggedInUserName = localStorage.getItem('FullName');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isTMManager = userJobTitle === 'TM Manager';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Ethiopian calendar
  const getCurrentEthiopianMonth = () => {
    const ethiopianMonths = [
      'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
    ];
    
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
      year: ethYear
    };
  };

  const currentEthiopian = getCurrentEthiopianMonth();

  useEffect(() => {
    fetchPhase1Processes();
    fetchPhase2Processes();
    fetchVehicles();
    fetchDriversAndDeliverers();
  }, [processType]);

  const fetchPhase1Processes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${api_url}/api/tm-processes`, {
        params: { month: currentEthiopian.month, year: currentEthiopian.year, process_type: processType }
      });
      setPhase1Processes(response.data.processes || []);
    } catch (err) {
      console.error("Fetch Phase 1 error:", err);
      setError("Failed to load Phase 1 processes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPhase2Processes = async () => {
    try {
      const response = await axios.get(`${api_url}/api/tm-vehicle-assignment-processes`, {
        params: { month: currentEthiopian.month, year: currentEthiopian.year, process_type: processType }
      });
      setPhase2Processes(response.data.processes || []);
    } catch (err) {
      console.error("Fetch Phase 2 error:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${api_url}/api/vehicles/available`);
      setVehicles(response.data || []);
      console.log('Vehicles loaded:', response.data?.length || 0);
    } catch (err) {
      console.error("Fetch vehicles error:", err);
    }
  };

  const fetchDriversAndDeliverers = async () => {
    try {
      // Fetch all employees
      const response = await axios.get(`${api_url}/api/get-employee`);
      const allEmployees = Array.isArray(response.data) ? response.data : [];
      
      // Filter for drivers only (job title contains "Driver")
      const driversOnly = allEmployees.filter(emp => 
        emp.jobTitle && emp.jobTitle.toLowerCase().includes('driver')
      );
      
      // Filter for deliverers only (job title contains "Deliverer")
      const deliverersOnly = allEmployees.filter(emp => 
        emp.jobTitle && emp.jobTitle.toLowerCase().includes('deliverer')
      );
      
      setDrivers(driversOnly.length > 0 ? driversOnly : allEmployees);
      setDeliverers(deliverersOnly.length > 0 ? deliverersOnly : allEmployees);
      console.log('Drivers loaded:', driversOnly.length, 'Deliverers loaded:', deliverersOnly.length);
    } catch (err) {
      console.error("Fetch drivers/deliverers error:", err);
    }
  };

  const handleCreateFreightOrder = (process) => {
    setSelectedProcess(process);
    setSelectedVehicle('');
    setDialogType('phase1');
    setOpenDialog(true);
  };

  const handleAssignDriver = (process) => {
    setSelectedProcess(process);
    setSelectedDriver('');
    setSelectedDeliverer('');
    setDepartureKilometer('');
    setDialogType('phase2');
    setOpenDialog(true);
  };

  const handleSaveFreightOrder = async () => {
    if (!selectedVehicle) {
      Swal.fire('Error', 'Please select a vehicle', 'error');
      return;
    }

    try {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);

      await axios.post(`${api_url}/api/tm-create-freight-order`, {
        process_id: selectedProcess.id,
        vehicle_id: vehicle.id,
        vehicle_name: vehicle.vehicle_name,
        tm_officer_id: loggedInUserId,
        tm_officer_name: loggedInUserName
      });

      // Record service time for TM Manager - Phase 1
      try {
        await axios.post(`${api_url}/api/service-time-hp`, {
          process_id: selectedProcess.id,
          service_unit: 'TM Manager - HP',
          end_time: new Date().toISOString(),
          officer_id: loggedInUserId,
          officer_name: loggedInUserName,
          status: 'completed',
          notes: `Vehicle assigned: ${vehicle.vehicle_name}`
        });
      } catch (err) {
        console.error('Failed to record TM Manager service time:', err);
      }

      Swal.fire('Success!', 'Vehicle assigned successfully', 'success');
      setOpenDialog(false);
      fetchPhase1Processes();
      fetchPhase2Processes();
    } catch (err) {
      console.error('Vehicle assignment error:', err);
      Swal.fire('Error', 'Failed to assign vehicle', 'error');
    }
  };

  const handleSaveDriverAssignment = async () => {
    if (!selectedDriver || !selectedDeliverer) {
      Swal.fire('Error', 'Please select both driver and deliverer', 'error');
      return;
    }

    if (!departureKilometer || isNaN(departureKilometer)) {
      Swal.fire('Error', 'Please enter valid departure kilometer', 'error');
      return;
    }

    try {
      const driver = drivers.find(d => d.id === selectedDriver);
      const deliverer = deliverers.find(d => d.id === selectedDeliverer);

      await axios.post(`${api_url}/api/tm-assign-vehicle`, {
        process_id: selectedProcess.id,
        driver_id: driver.id,
        driver_name: driver.full_name || (driver.first_name + ' ' + driver.last_name),
        deliverer_id: deliverer.id,
        deliverer_name: deliverer.full_name || (deliverer.first_name + ' ' + deliverer.last_name),
        departure_kilometer: parseFloat(departureKilometer),
        tm_officer_id: loggedInUserId,
        tm_officer_name: loggedInUserName
      });

      // Record service time for TM Manager - Phase 2
      try {
        await axios.post(`${api_url}/api/service-time-hp`, {
          process_id: selectedProcess.id,
          service_unit: 'TM Manager - HP',
          end_time: new Date().toISOString(),
          officer_id: loggedInUserId,
          officer_name: loggedInUserName,
          status: 'completed',
          notes: `Driver & deliverer assigned`
        });
      } catch (err) {
        console.error('Failed to record TM Manager service time:', err);
      }

      Swal.fire('Success!', 'Driver and deliverer assigned successfully', 'success');
      setOpenDialog(false);
      fetchPhase1Processes();
      fetchPhase2Processes();
    } catch (err) {
      console.error('Driver assignment error:', err);
      Swal.fire('Error', 'Failed to assign driver and deliverer', 'error');
    }
  };

  const handleExportExcel = () => {
    const rows = phase1Processes.map((p, i) => ({
      '#': i + 1,
      'Facility': p.facility?.facility_name || 'Unknown',
      'Route': p.facility?.route || 'N/A',
      'Region': p.facility?.region_name || 'N/A',
      'Reporting Month': p.reporting_month || 'N/A',
      'Process Type': p.process_type || 'N/A',
      'Status': p.status || 'N/A',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EWM Completed');
    XLSX.writeFile(wb, `EWM_Completed_${processType}_${Date.now()}.xlsx`);
  };

  if (!isTMManager) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to TM Manager role only.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Header */}
        <Card sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', color: 'white', p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <TruckIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  TM Manager - Transportation Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Phase 1: Vehicle Assignment | Phase 2: Driver & Deliverer Assignment
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Type Filter */}
        <Card sx={{ mb: 2, p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body2" color="text.secondary">Process Type:</Typography>
            <TextField select size="small" value={processType} onChange={e => setProcessType(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="regular">HP Regular</MenuItem>
              <MenuItem value="emergency">Emergency</MenuItem>
              <MenuItem value="breakdown">Breakdown</MenuItem>
              <MenuItem value="vaccine">Vaccine</MenuItem>
            </TextField>
          </Stack>
        </Card>

        {/* PHASE 1: Vehicle Assignment */}
        <Card sx={{ mb: 4 }}>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <CarIcon color="primary" />
                <Typography variant="h6">Phase 1: Vehicle Assignment</Typography>
                <Chip 
                  label={`${phase1Processes.length} processes`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Stack>
            }
            subheader="Assign vehicle to processes that completed EWM Phase 1 (status: ewm_completed)"
            action={
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportExcel}
                disabled={phase1Processes.length === 0}
                sx={{ mt: 1, mr: 1 }}
              >
                Export Excel
              </Button>
            }
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Facility</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Region</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {phase1Processes.slice(page1 * rowsPerPage, page1 * rowsPerPage + rowsPerPage).map((process, index) => (
                  <TableRow key={process.id} hover>
                    <TableCell>
                      <Chip 
                        label={(page1 * rowsPerPage) + index + 1} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary">
                        {process.facility?.facility_name || 'Unknown Facility'}
                      </Typography>
                      {!process.facility && (
                        <Typography variant="caption" color="error">
                          Facility not found (ID: {process.facility_id})
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {process.facility?.route ? (
                        <Chip 
                          label={process.facility.route} 
                          size="small" 
                          color="secondary" 
                          variant="outlined" 
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {process.facility?.region_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        variant="contained" 
                        color="primary" 
                        size="small" 
                        startIcon={<CarIcon />} 
                        onClick={() => handleCreateFreightOrder(process)}
                        disabled={!process.facility}
                      >
                        Assign Vehicle
                      </Button>
                      {!process.facility && (
                        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                          Facility not found
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination 
              component="div" 
              count={phase1Processes.length} 
              rowsPerPage={rowsPerPage} 
              page={page1}
              onPageChange={(_, p) => setPage1(p)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        </Card>

        {/* PHASE 2: Driver & Deliverer Assignment */}
        <Card sx={{ mb: 4 }}>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon color="success" />
                <Typography variant="h6">Phase 2: Driver & Deliverer Assignment</Typography>
                <Chip 
                  label={`${phase2Processes.length} processes`} 
                  size="small" 
                  color="success" 
                  variant="outlined" 
                />
              </Stack>
            }
            subheader="Assign driver and deliverer to processes with PI vehicle requests (status: biller_completed)"
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Facility</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Region</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {phase2Processes.slice(page2 * rowsPerPage, page2 * rowsPerPage + rowsPerPage).map((process, index) => (
                  <TableRow key={process.id} hover>
                    <TableCell>
                      <Chip 
                        label={(page2 * rowsPerPage) + index + 1} 
                        size="small" 
                        color="success" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary">
                        {process.facility?.facility_name || 'Unknown Facility'}
                      </Typography>
                      {!process.facility && (
                        <Typography variant="caption" color="error">
                          Facility not found (ID: {process.facility_id})
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {process.facility?.route ? (
                        <Chip 
                          label={process.facility.route} 
                          size="small" 
                          color="secondary" 
                          variant="outlined" 
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {process.facility?.region_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        variant="contained" 
                        color="success" 
                        size="small" 
                        startIcon={<PersonIcon />} 
                        onClick={() => handleAssignDriver(process)}
                        disabled={!process.facility}
                      >
                        Assign Driver
                      </Button>
                      {!process.facility && (
                        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                          Facility not found
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination 
              component="div" 
              count={phase2Processes.length} 
              rowsPerPage={rowsPerPage} 
              page={page2}
              onPageChange={(_, p) => setPage2(p)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        </Card>

        {/* Phase 1: Vehicle Assignment Dialog */}
        <Dialog open={openDialog && dialogType === 'phase1'} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <CarIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Phase 1: Assign Vehicle</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedProcess?.facility?.facility_name}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Vehicle</InputLabel>
                <Select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  label="Vehicle"
                >
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_name} - {vehicle.plate_number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveFreightOrder} 
              variant="contained" 
              startIcon={<CarIcon />}
            >
              Assign Vehicle
            </Button>
          </DialogActions>
        </Dialog>

        {/* Phase 2: Driver & Deliverer Assignment Dialog */}
        <Dialog open={openDialog && dialogType === 'phase2'} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Phase 2: Assign Driver & Deliverer</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedProcess?.facility?.facility_name}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Driver</InputLabel>
                <Select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  label="Driver"
                >
                  {drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Deliverer</InputLabel>
                <Select
                  value={selectedDeliverer}
                  onChange={(e) => setSelectedDeliverer(e.target.value)}
                  label="Deliverer"
                >
                  {deliverers.map((deliverer) => (
                    <MenuItem key={deliverer.id} value={deliverer.id}>
                      {deliverer.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Departure Kilometer"
                type="number"
                value={departureKilometer}
                onChange={(e) => setDepartureKilometer(e.target.value)}
                placeholder="Enter departure kilometer reading"
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDriverAssignment} 
              variant="contained" 
              color="success"
              startIcon={<PersonIcon />}
            >
              Assign Driver & Deliverer
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default TMManager;
