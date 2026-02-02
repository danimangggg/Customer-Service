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
  Alert,
  Snackbar,
  Grid,
  Card,
  TablePagination,
  InputAdornment,
  Stack,
  Avatar,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Route as RouteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const RouteManagementCRUD = () => {
  const [routes, setRoutes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    route_name: ''
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRoutes();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [page, rowsPerPage, searchTerm]);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/routes-crud`, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        }
      });
      setRoutes(response.data.routes);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Error fetching routes:', error);
      showSnackbar('Failed to fetch routes', 'error');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingRoute) {
        await axios.put(`${API_URL}/api/routes-crud/${editingRoute.id}`, formData);
        showSnackbar('Route updated successfully', 'success');
      } else {
        await axios.post(`${API_URL}/api/routes-crud`, formData);
        showSnackbar('Route created successfully', 'success');
      }
      handleCloseDialog();
      fetchRoutes();
    } catch (error) {
      const message = error.response?.data?.error || 'Operation failed';
      showSnackbar(message, 'error');
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      route_name: route.route_name
    });
    setOpenDialog(true);
  };

  const handleDelete = async (route) => {
    const result = await MySwal.fire({
      title: 'Delete Route?',
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
            🗑️
          </div>
          <p style="font-size: 18px; color: #333; margin-bottom: 10px;">
            Are you sure you want to delete
          </p>
          <p style="font-size: 20px; font-weight: bold; color: #1976d2; margin-bottom: 15px;">
            "${route.route_name}"?
          </p>
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">
            This action cannot be undone and will remove all associated data.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#2196f3',
      confirmButtonText: 'Yes, Delete It!',
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
        await axios.delete(`${API_URL}/api/routes-crud/${route.id}`);
        
        // Success animation
        await MySwal.fire({
          title: 'Deleted!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #4caf50; margin-bottom: 20px;">
                ✅
              </div>
              <p style="font-size: 18px; color: #333;">
                Route <strong>"${route.route_name}"</strong> has been successfully deleted.
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#4caf50',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
        
        fetchRoutes();
      } catch (error) {
        const message = error.response?.data?.error || 'Failed to delete route';
        
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

  const handleOpenDialog = () => {
    setEditingRoute(null);
    setFormData({
      route_name: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRoute(null);
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
            background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
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
                      Create and manage delivery routes
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
                  Add Route
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* Search */}
          <Box sx={{ p: 4 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search routes..."
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

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ 
                  bgcolor: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                  '& .MuiTableCell-head': {
                    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    borderBottom: 'none',
                    py: 3,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }
                }}>
                  <TableRow>
                    <TableCell sx={{ width: '30%' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <RouteIcon />
                        <span>Route Information</span>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ width: '50%' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AssignmentIcon />
                        <span>Assigned Facilities</span>
                      </Stack>
                    </TableCell>
                    <TableCell align="center" sx={{ width: '20%' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route.id} hover sx={{ '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.04)' } }}>
                      <TableCell sx={{ py: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ 
                            bgcolor: 'primary.main', 
                            width: 40, 
                            height: 40,
                            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                          }}>
                            <RouteIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold" color="primary.main">
                              {route.route_name}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 3, maxWidth: 400 }}>
                        {route.facilities && route.facilities.length > 0 ? (
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {route.facilities.length} {route.facilities.length === 1 ? 'facility' : 'facilities'} assigned
                            </Typography>
                            <Box sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 1,
                              maxHeight: 120,
                              overflowY: 'auto',
                              '&::-webkit-scrollbar': {
                                width: '4px',
                              },
                              '&::-webkit-scrollbar-track': {
                                background: '#f1f1f1',
                                borderRadius: '4px',
                              },
                              '&::-webkit-scrollbar-thumb': {
                                background: '#c1c1c1',
                                borderRadius: '4px',
                              },
                            }}>
                              {route.facilities.map((facility, index) => (
                                <Chip
                                  key={index}
                                  label={facility.facility_name}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  sx={{
                                    borderRadius: 2,
                                    fontWeight: 500,
                                    '&:hover': {
                                      bgcolor: 'primary.light',
                                      color: 'white',
                                      transform: 'translateY(-1px)',
                                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                                    },
                                    transition: 'all 0.2s ease'
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            py: 2,
                            px: 3,
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            border: '2px dashed',
                            borderColor: 'grey.300'
                          }}>
                            <Stack alignItems="center" spacing={1}>
                              <AssignmentIcon color="disabled" fontSize="large" />
                              <Typography variant="body2" color="text.secondary" fontWeight="500">
                                No facilities assigned
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                Assign facilities to this route
                              </Typography>
                            </Stack>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 3 }}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(route)}
                            sx={{ 
                              bgcolor: 'primary.light',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'primary.main',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(route)}
                            sx={{ 
                              bgcolor: 'error.light',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'error.main',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <DeleteIcon />
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

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <RouteIcon />
              <Typography variant="h6">
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Route Name"
              value={formData.route_name}
              onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
              required
              sx={{ mt: 2 }}
              placeholder="Enter route name (e.g., City Center Route)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={!formData.route_name.trim()}
            >
              {editingRoute ? 'Update' : 'Create'}
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

export default RouteManagementCRUD;