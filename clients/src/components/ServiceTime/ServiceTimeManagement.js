import { useState, useEffect } from 'react';
import {
  Container, Typography, Card, CardContent, Grid, Box, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Divider, Alert, LinearProgress, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, TablePagination, InputAdornment
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  CheckCircle as CompletedIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const ServiceTimeManagement = () => {
  const [serviceTimes, setServiceTimes] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceUnitFilter, setServiceUnitFilter] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    process_id: '',
    service_unit: '',
    start_time: '',
    end_time: '',
    status: 'in_progress',
    notes: ''
  });

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3003';

  // Access control - only for regular process officers
  const hasAccess = ['O2C Officer', 'EWM Officer', 'Customer Service Officer'].includes(userJobTitle);

  useEffect(() => {
    if (hasAccess) {
      fetchServiceTimes();
      fetchStats();
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, serviceUnitFilter]);

  const fetchServiceTimes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${api_url}/api/service-times`, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          status: statusFilter,
          service_unit: serviceUnitFilter
        }
      });
      
      setServiceTimes(response.data.serviceTimes || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load service times. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${api_url}/api/service-times/stats`);
      setStats(response.data.stats || {});
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const handleCreateService = () => {
    setEditingService(null);
    setFormData({
      process_id: '',
      service_unit: '',
      start_time: new Date().toISOString().slice(0, 16),
      end_time: '',
      status: 'in_progress',
      notes: ''
    });
    setDialogOpen(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      process_id: service.process_id,
      service_unit: service.service_unit,
      start_time: service.start_time ? new Date(service.start_time).toISOString().slice(0, 16) : '',
      end_time: service.end_time ? new Date(service.end_time).toISOString().slice(0, 16) : '',
      status: service.status,
      notes: service.notes || ''
    });
    setDialogOpen(true);
  };

  const handleSaveService = async () => {
    try {
      const payload = {
        ...formData,
        [editingService ? 'updated_by' : 'created_by']: parseInt(loggedInUserId)
      };

      if (editingService) {
        await axios.put(`${api_url}/api/service-times/${editingService.id}`, payload);
        MySwal.fire('Success!', 'Service time updated successfully.', 'success');
      } else {
        await axios.post(`${api_url}/api/service-times`, payload);
        MySwal.fire('Success!', 'Service time created successfully.', 'success');
      }

      setDialogOpen(false);
      fetchServiceTimes();
      fetchStats();
    } catch (err) {
      console.error('Save error:', err);
      MySwal.fire('Error', 'Failed to save service time.', 'error');
    }
  };

  const handleDeleteService = async (serviceId) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the service time record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${api_url}/api/service-times/${serviceId}`);
        MySwal.fire('Deleted!', 'Service time has been deleted.', 'success');
        fetchServiceTimes();
        fetchStats();
      } catch (err) {
        console.error('Delete error:', err);
        MySwal.fire('Error', 'Failed to delete service time.', 'error');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CompletedIcon sx={{ color: '#4caf50' }} />;
      case 'in_progress': return <StartIcon sx={{ color: '#2196f3' }} />;
      case 'paused': return <PauseIcon sx={{ color: '#ff9800' }} />;
      default: return <TimeIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in_progress': return '#2196f3';
      case 'paused': return '#ff9800';
      default: return '#607d8b';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Access control
  if (!hasAccess) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to regular process officers only (O2C Officer, EWM Officer, Customer Service Officer).
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
          .service-card {
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
          }
          .service-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-left-color: #2196f3;
          }
          .header-gradient {
            background: linear-gradient(135deg, #2196f3 0%, #64b5f6 100%);
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
                <TimeIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                  Service Time Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Track service unit start and end times for regular customer processes
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3, bgcolor: '#2196f3', color: 'white' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <StatsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total_services || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Services
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3, bgcolor: '#4caf50', color: 'white' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <CompletedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.completed_services || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completed
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3, bgcolor: '#ff9800', color: 'white' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <StartIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.in_progress_services || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    In Progress
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3, bgcolor: '#9c27b0', color: 'white' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <TimeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatDuration(stats.avg_duration_minutes)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Avg Duration
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search services..."
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Service Unit"
                value={serviceUnitFilter}
                onChange={(e) => setServiceUnitFilter(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateService}
                sx={{ height: 56 }}
              >
                Add Service Time
              </Button>
            </Grid>
          </Grid>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Service Times Table */}
        <Card className="service-card">
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TimeIcon color="primary" />
                <span>Service Time Records</span>
              </Stack>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Process ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Service Unit</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Start Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>End Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serviceTimes.map((service) => (
                    <TableRow 
                      key={service.id}
                      hover 
                      sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          #{service.process_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {service.customer_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {service.service_unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(service.start_time).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {service.end_time ? new Date(service.end_time).toLocaleString() : 'Ongoing'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDuration(service.duration_minutes)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(service.status)}
                          label={service.status.replace('_', ' ').toUpperCase()}
                          sx={{ 
                            bgcolor: getStatusColor(service.status),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditService(service)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteService(service.id)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingService ? 'Edit Service Time' : 'Add New Service Time'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Process ID"
                  type="number"
                  value={formData.process_id}
                  onChange={(e) => setFormData({...formData, process_id: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Service Unit"
                  value={formData.service_unit}
                  onChange={(e) => setFormData({...formData, service_unit: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="paused">Paused</MenuItem>
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
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveService} variant="contained">
              {editingService ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default ServiceTimeManagement;