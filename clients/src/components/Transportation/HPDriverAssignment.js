import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Card, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';

const HPDriverAssignment = () => {
  const [processes, setProcesses] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedDeliverer, setSelectedDeliverer] = useState('');

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
    fetchProcesses();
    fetchDrivers();
    fetchDeliverers();
  }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${api_url}/api/tm-vehicle-assignment-processes`, {
        params: {
          month: currentEthiopian.month,
          year: currentEthiopian.year
        }
      });
      
      setProcesses(response.data.processes || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load processes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${api_url}/api/drivers/available`);
      setDrivers(response.data || []);
      console.log('Drivers loaded:', response.data?.length || 0);
    } catch (err) {
      console.error("Fetch drivers error:", err);
    }
  };

  const fetchDeliverers = async () => {
    try {
      const response = await axios.get(`${api_url}/api/deliverers/available`);
      setDeliverers(response.data || []);
      console.log('Deliverers loaded:', response.data?.length || 0);
    } catch (err) {
      console.error("Fetch deliverers error:", err);
    }
  };

  const handleAssignDriverDeliverer = (process) => {
    setSelectedProcess(process);
    setSelectedDriver('');
    setSelectedDeliverer('');
    setOpenDialog(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedDriver || !selectedDeliverer) {
      Swal.fire('Error', 'Please select both driver and deliverer', 'error');
      return;
    }

    try {
      const driver = drivers.find(d => d.id === selectedDriver);
      const deliverer = deliverers.find(d => d.id === selectedDeliverer);

      await axios.post(`${api_url}/api/tm-assign-vehicle`, {
        process_id: selectedProcess.id,
        driver_id: driver.id,
        driver_name: driver.full_name,
        deliverer_id: deliverer.id,
        deliverer_name: deliverer.full_name,
        tm_officer_id: loggedInUserId,
        tm_officer_name: loggedInUserName
      });

      Swal.fire('Success!', 'Driver and deliverer assigned successfully', 'success');
      setOpenDialog(false);
      fetchProcesses();
    } catch (err) {
      console.error('Assignment error:', err);
      Swal.fire('Error', 'Failed to assign driver and deliverer', 'error');
    }
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
          <Box sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', color: 'white', p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <PersonIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  HP Driver & Deliverer Assignment
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Assign driver and deliverer to processes with vehicles already assigned
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

        {/* Processes Table */}
        <Card>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon color="secondary" />
                <Typography variant="h6">Processes Ready for Driver & Deliverer Assignment</Typography>
                <Chip 
                  label={`${processes.length} processes`} 
                  size="small" 
                  color="secondary" 
                  variant="outlined" 
                />
              </Stack>
            }
            subheader="Processes with status: ewm_goods_issued (vehicle already assigned)"
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Facility</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Vehicle</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((process, index) => (
                  <TableRow key={process.id} hover>
                    <TableCell>
                      <Chip 
                        label={(page * rowsPerPage) + index + 1} 
                        size="small" 
                        color="secondary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold" color="secondary">
                        {process.facility?.facility_name || 'Unknown Facility'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {process.facility?.region_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {process.facility?.route ? (
                        <Chip 
                          label={process.facility.route} 
                          size="small" 
                          color="info" 
                          variant="outlined" 
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CarIcon fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {process.vehicle_name || 'Not Assigned'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        variant="contained" 
                        color="secondary" 
                        size="small" 
                        startIcon={<PersonIcon />} 
                        onClick={() => handleAssignDriverDeliverer(process)}
                        disabled={!process.facility || !process.vehicle_name}
                      >
                        Assign Driver & Deliverer
                      </Button>
                      {!process.vehicle_name && (
                        <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
                          Vehicle not assigned yet
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination 
              component="div" 
              count={processes.length} 
              rowsPerPage={rowsPerPage} 
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        </Card>

        {/* Driver & Deliverer Assignment Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Assign Driver & Deliverer</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedProcess?.facility?.facility_name}
                </Typography>
                {selectedProcess?.vehicle_name && (
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                    <CarIcon fontSize="small" color="primary" />
                    <Typography variant="caption" color="primary">
                      Vehicle: {selectedProcess.vehicle_name}
                    </Typography>
                  </Stack>
                )}
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
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAssignment} 
              variant="contained" 
              color="secondary"
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

export default HPDriverAssignment;
