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
  CheckCircle as CompletedIcon,
  PlayArrow as InProgressIcon,
  Pause as AssignedIcon,
  Cancel as CancelledIcon,
  AccessTime as DelayedIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const RouteManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState({});
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    route_id: '',
    vehicle_id: '',
    driver_id: '',
    deliverer_id: '',
    notes: ''
  });

  const statusOptions = ['Assigned', 'In Progress', 'Completed', 'Cancelled', 'Delayed'];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAssignments();
      fetchStats();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [page, rowsPerPage, searchTerm, filterStatus]);

  useEffect(() => {
    fetchRoutes();
    fetchDrivers();
    fetchDeliverers();
    fetchVehicles();
  }, []);

  const fetchAssignments = async () => {
    try {
      console.log('Fetching assignments with params:', {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: filterStatus
      });
      
      const response = await axios.get(`${API_URL}/api/route-assignments`, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          status: filterStatus
        }
      });
      
      console.log('Assignments response:', response.data);
      setAssignments(response.data.assignments || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      console.error('Error details:', error.response?.data);
      showSnackbar('Failed to fetch route assignments', 'error');
      // Set empty arrays to prevent UI issues
      setAssignments([]);
      setTotalCount(0);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/routes`);
      console.log('Routes fetched:', response.data);
      setRoutes(response.data);
    } catch (error) {
      console.error('Error fetching routes:', error);
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
      const response = await axios.get(`${API_URL}/api/route-assignments/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${API_URL}/api/route-assignments`, formData);
      showSnackbar('Route assignment created successfully', 'success');
      handleCloseDialog();
      fetchAssignments();
      fetchStats();
    } catch (error) {
      const message = error.response?.data?.error || 'Operation failed';
      showSnackbar(message, 'error');
    }
  };

  const handleStatusUpdate = async (assignmentId, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/route-assignments/${assignmentId}/status`, {
        status: newStatus
      });
      showSnackbar(`Status updated to ${newStatus}`, 'success');
      fetchAssignments();
      fetchStats();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update status';
      showSnackbar(message, 'error');
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      route_id: '',
      vehicle_id: '',
      driver_id: '',
      deliverer_id: '',
      notes: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned': return 'info';
      case 'In Progress': return 'warning';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      case 'Delayed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Assigned': return <AssignedIcon />;
      case 'In Progress': return <InProgressIcon />;
      case 'Completed': return <CompletedIcon />;
      case 'Cancelled': return <CancelledIcon />;
      case 'Delayed': return <DelayedIcon />;
      default: return <AssignmentIcon />;
    }
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
                      Route Management
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 300,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      Assign routes to vehicles and drivers
                    </Typography>
                  </Box>
                </Stack>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 'bold',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  Assign Route
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Box sx={{ p: 4, pb: 2 }}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <AssignmentIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.totalAssignments || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Assignments
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <InProgressIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.inProgressCount || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        In Progress
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CompletedIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.completedCount || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Completed
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
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
                  placeholder="Search routes, locations..."
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
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Deliverer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id} hover>
                      <TableCell>
                        <Box>
                          <Typography fontWeight="bold">{assignment.route?.route_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Route ID: {assignment.route?.id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <VehicleIcon fontSize="small" />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {assignment.vehicle?.vehicle_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assignment.vehicle?.plate_number}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DriverIcon fontSize="small" />
                          <Typography variant="body2">
                            {assignment.driver?.full_name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DriverIcon fontSize="small" />
                          <Typography variant="body2">
                            {assignment.deliverer?.full_name || 'Not assigned'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(assignment.status)}
                          label={assignment.status}
                          color={getStatusColor(assignment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleStatusUpdate(assignment.id, 'In Progress')}
                          disabled={assignment.status === 'Completed' || assignment.status === 'Cancelled'}
                        >
                          <EditIcon />
                        </IconButton>
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
              <Typography variant="h6">Assign Route</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Route</InputLabel>
                  <Select
                    value={formData.route_id}
                    label="Route"
                    onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                  >
                    {routes.map((route) => (
                      <MenuItem key={route.id} value={route.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <RouteIcon />
                          <Typography>{route.route_name}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
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
              Assign Route
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