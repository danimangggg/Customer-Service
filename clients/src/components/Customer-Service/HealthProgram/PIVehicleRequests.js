import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Card, CardContent, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, Grid, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, IconButton
} from '@mui/material';
import {
  DirectionsCar as VehicleIcon,
  Route as RouteIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarTodayIcon,
  LocalShipping as RequestIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as DriverIcon,
  PersonOutline as DelivererIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const PIVehicleRequests = () => {
  const [routeData, setRouteData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [assignmentData, setAssignmentData] = useState({
    vehicle_id: '',
    driver_id: '',
    deliverer_id: '',
    notes: ''
  });

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isPIOfficer = userJobTitle === 'PI Officer-HP';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Ethiopian calendar function
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
      year: ethYear,
      monthIndex: ethMonthIndex
    };
  };

  const currentEthiopian = getCurrentEthiopianMonth();
  const currentEthiopianMonth = currentEthiopian.month;
  const currentEthiopianYear = currentEthiopian.year;

  useEffect(() => {
    fetchRouteData();
    fetchStats();
    fetchVehicles();
    fetchDrivers();
    fetchDeliverers();
  }, [currentEthiopianMonth, currentEthiopianYear]);

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${api_url}/api/pi-vehicle-requests`, {
        params: {
          month: currentEthiopianMonth,
          year: currentEthiopianYear
        }
      });
      
      setRouteData(response.data.routes || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load route data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${api_url}/api/pi-vehicle-requests/stats`, {
        params: {
          month: currentEthiopianMonth,
          year: currentEthiopianYear
        }
      });
      setStats(response.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${api_url}/api/vehicles/available`);
      setVehicles(response.data);
    } catch (err) {
      console.error("Vehicles fetch error:", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${api_url}/api/drivers/available`);
      setDrivers(response.data);
    } catch (err) {
      console.error("Drivers fetch error:", err);
    }
  };

  const fetchDeliverers = async () => {
    try {
      const response = await axios.get(`${api_url}/api/deliverers/available`);
      setDeliverers(response.data);
    } catch (err) {
      console.error("Deliverers fetch error:", err);
    }
  };

  const handleRequestVehicle = async (routeId, routeName) => {
    const result = await MySwal.fire({
      title: 'Request Vehicle?',
      text: `Request vehicle for route: ${routeName}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Request Vehicle',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4caf50'
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`${api_url}/api/pi-vehicle-requests/request`, {
          route_id: routeId,
          month: currentEthiopianMonth,
          year: currentEthiopianYear,
          requested_by: loggedInUserId
        });
        
        MySwal.fire('Success!', 'Vehicle request submitted successfully.', 'success');
        fetchRouteData();
        fetchStats();
        
      } catch (err) {
        console.error('Request vehicle error:', err);
        MySwal.fire('Error', 'Failed to submit vehicle request.', 'error');
      }
    }
  };

  const handleAssignVehicle = (route) => {
    setEditingRoute(route);
    setAssignmentData({
      vehicle_id: '',
      driver_id: '',
      deliverer_id: '',
      notes: ''
    });
    setOpenAssignDialog(true);
  };

  const handleSaveAssignment = async () => {
    if (!assignmentData.vehicle_id || !assignmentData.driver_id) {
      MySwal.fire('Error', 'Vehicle and Driver are required.', 'error');
      return;
    }

    try {
      await axios.post(`${api_url}/api/route-assignments`, {
        route_id: editingRoute.route_id,
        vehicle_id: assignmentData.vehicle_id,
        driver_id: assignmentData.driver_id,
        deliverer_id: assignmentData.deliverer_id || null,
        ethiopian_month: currentEthiopianMonth,
        notes: assignmentData.notes
      });

      MySwal.fire('Success!', 'Vehicle assignment created successfully.', 'success');
      setOpenAssignDialog(false);
      setEditingRoute(null);
      fetchRouteData();
      fetchStats();
    } catch (err) {
      console.error('Assignment error:', err);
      MySwal.fire('Error', 'Failed to create vehicle assignment.', 'error');
    }
  };

  const handleDeleteRequest = async (routeId, routeName) => {
    const result = await MySwal.fire({
      title: 'Delete Vehicle Request?',
      text: `Delete vehicle request for route: ${routeName}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f44336'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${api_url}/api/pi-vehicle-requests/${routeId}`, {
          params: {
            month: currentEthiopianMonth,
            year: currentEthiopianYear
          }
        });
        
        MySwal.fire('Success!', 'Vehicle request deleted successfully.', 'success');
        fetchRouteData();
        fetchStats();
        
      } catch (err) {
        console.error('Delete request error:', err);
        MySwal.fire('Error', 'Failed to delete vehicle request.', 'error');
      }
    }
  };

  // Access control
  if (!isPIOfficer) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to PI Officer-HP role only.
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
          .pi-card {
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
          }
          .pi-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-left-color: #1976d2;
          }
          .header-gradient {
            background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
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
                <VehicleIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                  PI Vehicle Requests
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Monitor routes and request vehicles when all facilities complete EWM
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

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Routes Table */}
        <Card className="pi-card">
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <RouteIcon color="primary" />
                <Typography variant="h6">Routes Status</Typography>
                <Chip 
                  label={`${routeData.length} routes`} 
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
                      <RouteIcon fontSize="small" />
                      <span>Route</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BusinessIcon fontSize="small" />
                      <span>Facilities</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AssignmentIcon fontSize="small" />
                      <span>ODN Numbers</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                      <VehicleIcon fontSize="small" />
                      <span>Actions</span>
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {routeData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((route, index) => {
                  // Calculate remaining facilities that need to complete EWM
                  const remainingFacilities = route.total_facilities_in_route - route.ewm_completed_facilities - route.vehicle_requested_facilities;
                  const allFacilitiesReady = remainingFacilities === 0;
                  
                  // Route is inactive if it has passed PI stage (vehicle already requested/assigned)
                  const hasPassedPI = route.vehicle_requested === 1;
                  const isInactive = hasPassedPI;
                  
                  return (
                    <TableRow 
                      key={route.route_id} 
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
                          {route.route_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Route ID: {route.route_id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {allFacilitiesReady ? (
                          <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>
                            {route.facilities.length} Facilities (All EWM Completed ✓)
                          </Typography>
                        ) : (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" fontWeight="bold" color="warning.main">
                              {route.facilities.length} Facilities
                            </Typography>
                            <Typography variant="caption" color="error.main" fontWeight="bold">
                              {remainingFacilities} facility(ies) pending EWM completion
                            </Typography>
                          </Box>
                        )}
                        {route.facilities.map((facility, idx) => {
                          const isCompleted = facility.process_status === 'ewm_completed' || facility.process_status === 'vehicle_requested';
                          const isPending = facility.process_status === 'no_process' || (!isCompleted && facility.process_status !== 'vehicle_requested');
                          return (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="body2">
                                • {facility.facility_name}
                              </Typography>
                              {isCompleted ? (
                                <Chip 
                                  label="✓" 
                                  size="small" 
                                  color="success" 
                                  sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                                />
                              ) : (
                                <Chip 
                                  label={facility.process_status === 'no_process' ? 'Not Started' : 'Pending'} 
                                  size="small" 
                                  color="warning" 
                                  sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {route.facilities.map((facility, idx) => (
                          <Box key={idx} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {facility.facility_name}:
                            </Typography>
                            <Box sx={{ ml: 1 }}>
                              {facility.odns.map((odn, odnIdx) => (
                                <Chip 
                                  key={odnIdx}
                                  label={odn.odn_number}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {route.vehicle_requested ? (
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Chip 
                            label="Vehicle Requested" 
                            color="success" 
                            size="small" 
                            icon={<VehicleIcon />}
                          />
                          {!isInactive && (
                            <>
                              <IconButton 
                                color="primary" 
                                size="small" 
                                onClick={() => handleAssignVehicle(route)}
                                title="Assign Vehicle"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton 
                                color="error" 
                                size="small" 
                                onClick={() => handleDeleteRequest(route.route_id, route.route_name)}
                                title="Delete Request"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      ) : (
                        <Box>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            size="small" 
                            startIcon={<RequestIcon />} 
                            onClick={() => handleRequestVehicle(route.route_id, route.route_name)}
                            sx={{ borderRadius: 2 }}
                            disabled={!allFacilitiesReady || isInactive}
                          >
                            Request Vehicle
                          </Button>
                          {!allFacilitiesReady && (
                            <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                              {remainingFacilities} facility(ies) pending
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
            <TablePagination 
              component="div" 
              count={routeData.length} 
              rowsPerPage={rowsPerPage} 
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </TableContainer>
        </Card>

        {/* Vehicle Assignment Dialog */}
        <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <VehicleIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Assign Vehicle</Typography>
                <Typography variant="body2" color="text.secondary">
                  Route: {editingRoute?.route_name}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Vehicle</InputLabel>
                  <Select
                    value={assignmentData.vehicle_id}
                    label="Vehicle"
                    onChange={(e) => setAssignmentData({ ...assignmentData, vehicle_id: e.target.value })}
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <VehicleIcon fontSize="small" />
                          <span>{vehicle.vehicle_name} - {vehicle.plate_number}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Driver</InputLabel>
                  <Select
                    value={assignmentData.driver_id}
                    label="Driver"
                    onChange={(e) => setAssignmentData({ ...assignmentData, driver_id: e.target.value })}
                  >
                    {drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DriverIcon fontSize="small" />
                          <span>{driver.full_name}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Deliverer (Optional)</InputLabel>
                  <Select
                    value={assignmentData.deliverer_id}
                    label="Deliverer (Optional)"
                    onChange={(e) => setAssignmentData({ ...assignmentData, deliverer_id: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {deliverers.map((deliverer) => (
                      <MenuItem key={deliverer.id} value={deliverer.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DelivererIcon fontSize="small" />
                          <span>{deliverer.full_name}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={assignmentData.notes}
                  onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })}
                  placeholder="Optional notes about the assignment..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenAssignDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAssignment} 
              variant="contained" 
              startIcon={<VehicleIcon />}
            >
              Assign Vehicle
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default PIVehicleRequests;