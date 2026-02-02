import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  TablePagination,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  Search as SearchIcon,
  LocalShipping as TruckIcon,
  Speed as SpeedIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState({
    id: '',
    vehicle_name: '',
    plate_number: '',
    vehicle_type: 'Truck',
    status: 'Active',
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const api_url = process.env.REACT_APP_API_URL;

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      setPage(0); // Reset to first page when searching
      fetchVehicles();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    fetchVehicles();
  }, [page, rowsPerPage]);

  // Remove client-side filtering since we're doing server-side pagination
  // useEffect(() => {
  //   const filtered = vehicles.filter(vehicle =>
  //     vehicle.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     vehicle.vehicle_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     vehicle.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     vehicle.description?.toLowerCase().includes(searchTerm.toLowerCase())
  //   );
  //   setFilteredVehicles(filtered);
  //   setPage(0);
  // }, [searchTerm, vehicles]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${api_url}/api/vehicles`, {
        params: {
          page: page + 1, // Backend uses 1-based pagination, frontend uses 0-based
          limit: rowsPerPage,
          search: searchTerm
        }
      });
      
      // Handle the response structure
      if (response.data.vehicles) {
        // Structured response with pagination info
        setVehicles(response.data.vehicles);
        setFilteredVehicles(response.data.vehicles);
        setTotalCount(response.data.totalCount || response.data.vehicles.length);
      } else {
        // Simple array response (fallback)
        const vehiclesData = Array.isArray(response.data) ? response.data : [];
        setVehicles(vehiclesData);
        setFilteredVehicles(vehiclesData);
        setTotalCount(vehiclesData.length);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showSnackbar('Error fetching vehicles', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (vehicle = null) => {
    console.log('Opening dialog with vehicle:', vehicle);
    
    if (vehicle) {
      setCurrentVehicle({
        ...vehicle
      });
      setEditMode(true);
      console.log('Set to EDIT mode');
    } else {
      setCurrentVehicle({
        id: '',
        vehicle_name: '',
        plate_number: '',
        vehicle_type: 'Truck',
        status: 'Active',
        description: ''
      });
      setEditMode(false);
      console.log('Set to CREATE mode');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentVehicle({
      id: '',
      vehicle_name: '',
      plate_number: '',
      vehicle_type: 'Truck',
      status: 'Active',
      description: ''
    });
    console.log('Dialog closed and form reset');
  };

  const handleInputChange = (field, value) => {
    setCurrentVehicle(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Basic validation
      if (!currentVehicle.vehicle_name?.trim()) {
        showSnackbar('Vehicle name is required', 'error');
        return;
      }
      
      if (!currentVehicle.plate_number?.trim()) {
        showSnackbar('Plate number is required', 'error');
        return;
      }

      // Prepare the data for saving
      let vehicleData = {
        vehicle_name: currentVehicle.vehicle_name.trim(),
        plate_number: currentVehicle.plate_number.trim(),
        vehicle_type: currentVehicle.vehicle_type,
        status: currentVehicle.status,
        description: currentVehicle.description?.trim() || ''
      };

      // For CREATE mode, explicitly exclude the id field
      if (!editMode) {
        // Remove id field completely for new vehicles
        delete vehicleData.id;
      } else {
        // For EDIT mode, include the id
        vehicleData.id = currentVehicle.id;
      }

      console.log('Saving vehicle:', { 
        editMode, 
        currentVehicleId: currentVehicle.id,
        vehicleData 
      });

      if (editMode) {
        console.log(`Making PUT request to: ${api_url}/api/vehicles/${currentVehicle.id}`);
        await axios.put(`${api_url}/api/vehicles/${currentVehicle.id}`, vehicleData);
        showSnackbar('Vehicle updated successfully');
      } else {
        console.log(`Making POST request to: ${api_url}/api/vehicles`);
        await axios.post(`${api_url}/api/vehicles`, vehicleData);
        showSnackbar('Vehicle added successfully');
      }
      fetchVehicles();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show specific error message from server
      const errorMessage = error.response?.data?.error || 'Error saving vehicle';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (vehicle) => {
    const result = await MySwal.fire({
      title: 'Delete Vehicle?',
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
            🚗
          </div>
          <p style="font-size: 18px; color: #333; margin-bottom: 10px;">
            Are you sure you want to delete this vehicle?
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <p style="font-size: 20px; font-weight: bold; color: #1976d2; margin-bottom: 5px;">
              ${vehicle.plate_number}
            </p>
            <p style="font-size: 16px; color: #666; margin-bottom: 5px;">
              ${vehicle.vehicle_name}
            </p>
            <p style="font-size: 14px; color: #888; margin-bottom: 0;">
              ${vehicle.vehicle_type} • ${vehicle.status}
            </p>
          </div>
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">
            This action cannot be undone and will remove all vehicle data.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#2196f3',
      confirmButtonText: 'Yes, Delete Vehicle!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        confirmButton: 'swal-custom-confirm',
        cancelButton: 'swal-custom-cancel'
      },
      buttonsStyling: true,
      focusConfirm: false,
      focusCancel: true
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${api_url}/api/vehicles/${vehicle.id}`);
        
        // Success animation
        await MySwal.fire({
          title: 'Deleted!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #4caf50; margin-bottom: 20px;">
                ✅
              </div>
              <p style="font-size: 18px; color: #333;">
                Vehicle <strong>"${vehicle.plate_number}"</strong> has been successfully deleted.
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#4caf50',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
        
        fetchVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        const message = error.response?.data?.error || 'Failed to delete vehicle';
        
        // Error animation
        await MySwal.fire({
          title: 'Error!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
                ❌
              </div>
              <p style="font-size: 18px; color: #333;">
                ${message}
              </p>
            </div>
          `,
          icon: 'error',
          confirmButtonColor: '#f44336',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Maintenance': return 'warning';
      case 'Inactive': return 'error';
      case 'Retired': return 'default';
      default: return 'default';
    }
  };

  const getVehicleTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'truck': return <TruckIcon />;
      case 'van': return <CarIcon />;
      default: return <CarIcon />;
    }
  };

  return (
    <>
      <style>
        {`
          /* Custom SweetAlert Styles */
          .swal-custom-popup {
            border-radius: 20px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2) !important;
            border: none !important;
          }
          .swal-custom-title {
            font-size: 28px !important;
            font-weight: bold !important;
            color: #333 !important;
            margin-bottom: 20px !important;
          }
          .swal-custom-confirm {
            border-radius: 25px !important;
            padding: 12px 30px !important;
            font-weight: bold !important;
            font-size: 16px !important;
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3) !important;
            transition: all 0.3s ease !important;
          }
          .swal-custom-confirm:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4) !important;
          }
          .swal-custom-cancel {
            border-radius: 25px !important;
            padding: 12px 30px !important;
            font-weight: bold !important;
            font-size: 16px !important;
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3) !important;
            transition: all 0.3s ease !important;
          }
          .swal-custom-cancel:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4) !important;
          }
        `}
      </style>
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <CarIcon sx={{ fontSize: 40, color: 'white' }} />
              <Box>
                <Typography variant="h4" fontWeight="bold" color="white">
                  Vehicle Management
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Manage your fleet vehicles and assignments
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: 'white',
                color: '#1976d2',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
              }}
            >
              Add Vehicle
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CarIcon color="primary" />
                <Box>
                  <Typography variant="h6">{vehicles.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Vehicles</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <SpeedIcon color="success" />
                <Box>
                  <Typography variant="h6">{vehicles.filter(v => v.status === 'Active').length}</Typography>
                  <Typography variant="body2" color="text.secondary">Active</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CalendarIcon color="warning" />
                <Box>
                  <Typography variant="h6">{vehicles.filter(v => v.status === 'Maintenance').length}</Typography>
                  <Typography variant="body2" color="text.secondary">In Maintenance</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TruckIcon color="info" />
                <Box>
                  <Typography variant="h6">{vehicles.filter(v => v.vehicle_type === 'Truck').length}</Typography>
                  <Typography variant="body2" color="text.secondary">Trucks</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by vehicle name, plate number, type, or description..."
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
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Plate Number</strong></TableCell>
              <TableCell><strong>Vehicle Name</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getVehicleTypeIcon(vehicle.vehicle_type)}
                      <Typography fontWeight="bold">{vehicle.plate_number}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {vehicle.vehicle_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={vehicle.vehicle_type} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={vehicle.status} 
                      color={getStatusColor(vehicle.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {vehicle.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      onClick={() => handleOpenDialog(vehicle)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(vehicle)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Vehicle' : 'Add New Vehicle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vehicle Name"
                value={currentVehicle.vehicle_name}
                onChange={(e) => handleInputChange('vehicle_name', e.target.value)}
                required
                helperText="Required field"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Plate Number"
                value={currentVehicle.plate_number}
                onChange={(e) => handleInputChange('plate_number', e.target.value)}
                required
                helperText="Required field (max 20 characters)"
                inputProps={{ maxLength: 20 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Vehicle Type"
                value={currentVehicle.vehicle_type}
                onChange={(e) => handleInputChange('vehicle_type', e.target.value)}
                required
              >
                <MenuItem value="Truck">Truck</MenuItem>
                <MenuItem value="Van">Van</MenuItem>
                <MenuItem value="Pickup">Pickup</MenuItem>
                <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                <MenuItem value="Car">Car</MenuItem>
                <MenuItem value="Bus">Bus</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={currentVehicle.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={currentVehicle.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
                placeholder="Optional description or notes about the vehicle"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
    </>
  );
};

export default VehicleManagement;