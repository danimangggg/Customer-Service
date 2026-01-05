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
  CardContent,
  TablePagination,
  InputAdornment,
  Fade,
  Stack,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  DirectionsCar as CarIcon,
  LocalShipping as TruckIcon,
  Build as MaintenanceIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState({});
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    vehicle_name: '',
    plate_number: '',
    vehicle_type: 'Truck',
    status: 'Active',
    description: ''
  });

  const vehicleTypes = ['Truck', 'Van', 'Pickup', 'Motorcycle', 'Car', 'Bus', 'Other'];
  const statusOptions = ['Active', 'Inactive', 'Maintenance', 'Retired'];

  useEffect(() => {
    fetchVehicles();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, filterType, filterStatus]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/vehicles`, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          type: filterType,
          status: filterStatus
        }
      });
      setVehicles(response.data.vehicles);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showSnackbar('Failed to fetch vehicles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/vehicles/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.vehicle_name.trim()) {
      showSnackbar('Vehicle name is required', 'error');
      return;
    }
    
    if (!formData.plate_number.trim()) {
      showSnackbar('Plate number is required', 'error');
      return;
    }

    try {
      console.log('Submitting form data:', formData); // Debug log
      
      if (editingVehicle) {
        const response = await axios.put(`${API_URL}/api/vehicles/${editingVehicle.id}`, formData);
        console.log('Update response:', response.data); // Debug log
        showSnackbar('Vehicle updated successfully', 'success');
      } else {
        const response = await axios.post(`${API_URL}/api/vehicles`, formData);
        console.log('Create response:', response.data); // Debug log
        showSnackbar('Vehicle created successfully', 'success');
      }
      handleCloseDialog();
      fetchVehicles();
      fetchStats();
    } catch (error) {
      console.error('Submit error:', error); // Debug log
      const message = error.response?.data?.error || error.message || 'Operation failed';
      showSnackbar(message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/vehicles/${vehicleToDelete.id}`);
      showSnackbar('Vehicle deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setVehicleToDelete(null);
      fetchVehicles();
      fetchStats();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete vehicle';
      showSnackbar(message, 'error');
    }
  };

  const handleOpenDialog = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        vehicle_name: vehicle.vehicle_name,
        plate_number: vehicle.plate_number,
        vehicle_type: vehicle.vehicle_type,
        status: vehicle.status,
        description: vehicle.description || ''
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        vehicle_name: '',
        plate_number: '',
        vehicle_type: 'Truck',
        status: 'Active',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVehicle(null);
  };

  const handleDeleteClick = (vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteConfirmOpen(true);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'default';
      case 'Maintenance': return 'warning';
      case 'Retired': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <ActiveIcon />;
      case 'Inactive': return <InactiveIcon />;
      case 'Maintenance': return <MaintenanceIcon />;
      default: return <CarIcon />;
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'Truck': return <TruckIcon />;
      case 'Car': return <CarIcon />;
      default: return <CarIcon />;
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
          .vehicle-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .vehicle-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
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
        <Card className="vehicle-card animate-fade-in" elevation={0}>
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
                    <TruckIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ 
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      mb: 1
                    }}>
                      Vehicle Management
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 300,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      Manage your fleet vehicles and transportation assets
                    </Typography>
                  </Box>
                </Stack>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
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
                  Add Vehicle
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Box sx={{ p: 4, pb: 2 }}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <ActiveIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.totalVehicles || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Vehicles
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <ActiveIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.activeVehicles || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Active
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
                    <MaintenanceIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.maintenanceVehicles || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Maintenance
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
                    <InactiveIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.inactiveVehicles || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Inactive
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>

            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Type</InputLabel>
                  <Select
                    value={filterType}
                    label="Filter by Type"
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {vehicleTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Filter by Status"
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
                <TableHead sx={{ bgcolor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vehicle</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Plate Number</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          {getVehicleIcon(vehicle.vehicle_type)}
                          <Typography fontWeight="bold">{vehicle.vehicle_name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={vehicle.plate_number} 
                          variant="outlined" 
                          color="primary"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>{vehicle.vehicle_type}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(vehicle.status)}
                          label={vehicle.status}
                          color={getStatusColor(vehicle.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {vehicle.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(vehicle)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(vehicle)}
                        >
                          <DeleteIcon />
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

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vehicle Name"
                  value={formData.vehicle_name}
                  onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Plate Number"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle Type</InputLabel>
                  <Select
                    value={formData.vehicle_type}
                    label="Vehicle Type"
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  >
                    {vehicleTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingVehicle ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the vehicle "{vehicleToDelete?.vehicle_name}" 
              with plate number "{vehicleToDelete?.plate_number}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default VehicleManagement;