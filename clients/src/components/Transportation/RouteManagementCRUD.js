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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const RouteManagementCRUD = () => {
  const [routes, setRoutes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState({});
  
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

  useEffect(() => {
    fetchStats();
  }, []);

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

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/routes-crud/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      fetchStats();
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
    if (window.confirm(`Are you sure you want to delete "${route.route_name}"?`)) {
      try {
        await axios.delete(`${API_URL}/api/routes-crud/${route.id}`);
        showSnackbar('Route deleted successfully', 'success');
        fetchRoutes();
        fetchStats();
      } catch (error) {
        const message = error.response?.data?.error || 'Failed to delete route';
        showSnackbar(message, 'error');
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

          {/* Stats Cards */}
          <Box sx={{ p: 4, pb: 2 }}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <RouteIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.totalRoutes || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Routes
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <AssignmentIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.routesWithAssignments?.length || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Active Routes
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <AddIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.recentRoutes?.length || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Recent Routes
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>

            {/* Search */}
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
                  bgcolor: '#2196f3',
                  '& .MuiTableCell-head': {
                    backgroundColor: '#2196f3',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    borderBottom: '2px solid #ffffff'
                  }
                }}>
                  <TableRow>
                    <TableCell>Route Name</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <RouteIcon color="primary" />
                          <Typography fontWeight="bold">{route.route_name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {dayjs(route.created_at).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(route)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(route)}
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