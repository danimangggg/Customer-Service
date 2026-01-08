import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Card,
  TablePagination,
  InputAdornment,
  Stack,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Route as RouteIcon,
  DirectionsCar as VehicleIcon,
  Person as DriverIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompletedIcon,
  PlayArrow as InProgressIcon,
  Pause as AssignedIcon,
  Cancel as CancelledIcon,
  AccessTime as DelayedIcon,
  CalendarMonth as CalendarIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Function to get current Ethiopian month (moved outside component)
const getCurrentEthiopianMonth = (gDate = new Date()) => {
  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];
  
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
  
  return {
    month: ethiopianMonths[ethMonthIndex],
    year: ethYear,
    monthIndex: ethMonthIndex
  };
};

const RouteManagement = () => {
  const [readyRoutes, setReadyRoutes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState({});
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Get current Ethiopian month and year
  const currentEthiopian = getCurrentEthiopianMonth();
  const currentEthiopianMonth = currentEthiopian.month;
  const currentEthiopianYear = currentEthiopian.year;

  // Form state for assignment
  const [formData, setFormData] = useState({
    route_id: '',
    vehicle_id: '',
    driver_id: '',
    deliverer_id: '',
    notes: ''
  });

  const statusOptions = ['Assigned', 'Not Assigned'];
  const ethiopianMonths = [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
    'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
  ];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReadyRoutes();
      fetchStats();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [page, rowsPerPage, searchTerm, filterStatus, currentEthiopianMonth, currentEthiopianYear]);

  useEffect(() => {
    fetchDrivers();
    fetchDeliverers();
    fetchVehicles();
  }, []);

  const fetchReadyRoutes = async () => {
    try {
      console.log('Fetching ready routes for:', {
        month: currentEthiopianMonth,
        year: currentEthiopianYear,
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm
      });
      
      const response = await axios.get(`${API_URL}/api/ready-routes`, {
        params: {
          month: currentEthiopianMonth,
          year: currentEthiopianYear,
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          status: filterStatus
        }
      });
      
      console.log('Ready routes response:', response.data);
      setReadyRoutes(response.data.routes || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching ready routes:', error);
      MySwal.fire('Error', 'Failed to fetch ready routes', 'error');
      setReadyRoutes([]);
      setTotalCount(0);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/drivers/available`);
      console.log('Drivers fetched:', response.data);
      setDrivers(response.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchDeliverers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/deliverers/available`);
      console.log('Deliverers fetched:', response.data);
      setDeliverers(response.data);
    } catch (error) {
      console.error('Error fetching deliverers:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/vehicles`);
      console.log('Vehicles fetched:', response.data);
      // Handle both response formats: direct array or { vehicles: [...] }
      const vehiclesData = response.data.vehicles || response.data;
      // Filter for active vehicles only
      const activeVehicles = Array.isArray(vehiclesData) 
        ? vehiclesData.filter(vehicle => vehicle.status === 'Active')
        : [];
      setVehicles(activeVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ready-routes/stats`, {
        params: {
          month: currentEthiopianMonth,
          year: currentEthiopianYear
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.route_id || !formData.vehicle_id || !formData.driver_id) {
        MySwal.fire('Error', 'Please fill in all required fields (Route, Vehicle, Driver)', 'error');
        return;
      }

      // Create route assignment
      const assignmentData = {
        ...formData,
        ethiopian_month: currentEthiopianMonth,
        ethiopian_year: currentEthiopianYear
      };

      await axios.post(`${API_URL}/api/route-assignments`, assignmentData);
      MySwal.fire('Success', 'Route assignment created successfully', 'success');
      
      handleCloseDialog();
      fetchReadyRoutes();
      fetchStats();
    } catch (error) {
      console.error('Error creating assignment:', error);
      MySwal.fire('Error', 'Failed to create route assignment', 'error');
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      route_id: route.id,
      vehicle_id: route.assigned_vehicle_id || '',
      driver_id: route.assigned_driver_id || '',
      deliverer_id: route.assigned_deliverer_id || '',
      notes: route.notes || ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRoute(null);
    setFormData({
      route_id: '',
      vehicle_id: '',
      driver_id: '',
      deliverer_id: '',
      notes: ''
    });
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
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
          .route-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .route-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            color: white;
            padding: 32px;
            border-radius: 16px 16px 0 0;
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
          .stats-card {
            transition: all 0.3s ease;
            border-radius: 16px;
            padding: 20px;
            position: relative;
            overflow: hidden;
            cursor: pointer;
          }
          .stats-card:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          }
        `}
      </style>
      
      <Box sx={{ p: 3 }}>
        <Card className="route-card animate-fade-in" elevation={0}>
          {/* Header */}
          <Box className="header-gradient">
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 64, 
                    height: 64,
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}>
                    <RouteIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ 
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      mb: 1
                    }}>
                      Vehicle Requested Routes
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 300,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      Routes requested for vehicles by PI Officers
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Stats Cards and Ethiopian Calendar */}
          <Box sx={{ p: 4, pb: 2 }}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Ethiopian Calendar Display */}
              <Grid item xs={12} md={6}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CalendarIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {currentEthiopianMonth} {currentEthiopianYear}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Ethiopian Calendar
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              {/* Expected Routes */}
              <Grid item xs={12} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <RouteIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.expectedCount || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Requested
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              {/* Assigned Routes */}
              <Grid item xs={12} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <AssignedIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.assignedCount || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Assigned
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>

            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by facility name..."
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
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ 
                  bgcolor: '#ff9800',
                  '& .MuiTableCell-head': {
                    backgroundColor: '#ff9800',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    borderBottom: '2px solid #ffffff'
                  }
                }}>
                  <TableRow>
                    <TableCell>Route</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <BusinessIcon fontSize="small" />
                        <span>Facilities</span>
                      </Stack>
                    </TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Deliverer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {readyRoutes.map((route) => (
                    <TableRow key={route.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          {route.route_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {route.facilities && route.facilities.length > 0 ? (
                            <Box>
                              <Typography variant="body2" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                                {route.facilities.length} Facilities
                              </Typography>
                              {route.facilities.map((facility, idx) => (
                                <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                                  • {facility.facility_name}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Chip 
                              label={`${route.completed_facilities}/${route.total_facilities} Completed`}
                              color="success"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {route.vehicle_name ? (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {route.vehicle_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {route.plate_number}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip 
                            label="Not Assigned"
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {route.driver_name ? (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {route.driver_name}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip 
                            label="Not Assigned"
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {route.deliverer_name ? (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {route.deliverer_name}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip 
                            label="Not Assigned"
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {route.assigned_vehicle_id ? (
                          <Chip 
                            label="Assigned"
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Chip 
                            label="Ready"
                            color="warning"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(route)}
                            size="small"
                            title="Assign Transportation"
                          >
                            <EditIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </Card>

        {/* Assignment Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <RouteIcon />
              <Typography variant="h6">
                Assign Transportation Resources
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Route Display (read-only) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Route"
                  value={editingRoute ? editingRoute.route_name : ''}
                  disabled
                  InputProps={{
                    startAdornment: <RouteIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              
              {/* Vehicle Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Vehicle</InputLabel>
                  <Select
                    value={formData.vehicle_id}
                    label="Vehicle"
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <VehicleIcon />
                          <Box>
                            <Typography>{vehicle.vehicle_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {vehicle.plate_number} - {vehicle.vehicle_type}
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Driver Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Driver</InputLabel>
                  <Select
                    value={formData.driver_id}
                    label="Driver"
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                  >
                    {drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DriverIcon />
                          <Box>
                            <Typography>{driver.full_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {driver.user_name}
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Deliverer Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Deliverer</InputLabel>
                  <Select
                    value={formData.deliverer_id}
                    label="Deliverer"
                    onChange={(e) => setFormData({ ...formData, deliverer_id: e.target.value })}
                  >
                    <MenuItem value="">
                      <Typography color="text.secondary">No deliverer assigned</Typography>
                    </MenuItem>
                    {deliverers.map((deliverer) => (
                      <MenuItem key={deliverer.id} value={deliverer.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DriverIcon />
                          <Box>
                            <Typography>{deliverer.full_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {deliverer.user_name}
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Ethiopian Month Display (read-only) */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ethiopian Month"
                  value={`${currentEthiopianMonth} ${currentEthiopianYear}`}
                  disabled
                  InputProps={{
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              
              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Assign Transportation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ 
            '& .MuiSnackbarContent-root': {
              marginRight: '20px',
              marginBottom: '20px'
            },
            '& .MuiAlert-root': {
              marginRight: '20px',
              marginBottom: '20px'
            },
            zIndex: 9999
          }}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ minWidth: '300px' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default RouteManagement;