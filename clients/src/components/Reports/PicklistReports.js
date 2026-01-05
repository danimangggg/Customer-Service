import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Stack,
  TablePagination,
  InputAdornment,
  Fade,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Assignment as PicklistIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  TrendingUp as TrendIcon,
  Person as OperatorIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  DateRange as DateIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const PicklistReports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [picklists, setPicklists] = useState([]);
  const [operatorPerformance, setOperatorPerformance] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    store: '',
    status: '',
    search: ''
  });

  const statusOptions = ['Completed', 'Pending', 'In Progress', 'Failed'];
  const storeOptions = ['AA1', 'AA2', 'AA3', 'AA4', 'AA5'];

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchPicklists(),
        fetchOperatorPerformance()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Failed to fetch report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reports/picklists/stats`, {
        params: filters
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPicklists = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reports/picklists`, {
        params: {
          ...filters,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      setPicklists(response.data.picklists);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Error fetching picklists:', error);
    }
  };

  const fetchOperatorPerformance = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reports/picklists/operators`, {
        params: filters
      });
      setOperatorPerformance(response.data);
    } catch (error) {
      console.error('Error fetching operator performance:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filters change
  };

  const handleExport = async (format = 'json') => {
    try {
      const response = await axios.get(`${API_URL}/api/reports/picklists/export`, {
        params: { ...filters, format },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `picklist-report-${dayjs().format('YYYY-MM-DD')}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `picklist-report-${dayjs().format('YYYY-MM-DD')}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      showSnackbar('Report exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showSnackbar('Failed to export report', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'in progress': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CompletedIcon />;
      case 'pending': return <PendingIcon />;
      default: return <PicklistIcon />;
    }
  };

  if (loading && !stats.totalPicklists) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

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
          .report-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .report-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
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
        <Card className="report-card animate-fade-in" elevation={0}>
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
                    <ReportIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ 
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      mb: 1
                    }}>
                      Picklist Reports
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 300,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      Comprehensive picklist analytics and performance metrics
                    </Typography>
                  </Box>
                </Stack>
                
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('csv')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      px: 3,
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
                    Export CSV
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('json')}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 'bold',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Export JSON
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ p: 4 }}>
            {/* Filters */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Store</InputLabel>
                  <Select
                    value={filters.store}
                    label="Store"
                    onChange={(e) => handleFilterChange('store', e.target.value)}
                  >
                    <MenuItem value="">All Stores</MenuItem>
                    {storeOptions.map((store) => (
                      <MenuItem key={store} value={store}>{store}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
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

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PicklistIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.totalPicklists || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Picklists
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
                        {stats.completedPicklists || 0}
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
                  background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PendingIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.pendingPicklists || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Pending
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.completionRate || 0}%
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Completion Rate
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Status Distribution */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Status Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.picklistsByStatus || []}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label
                      >
                        {(stats.picklistsByStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Grid>

              {/* Store Distribution */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Picklists by Store
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.picklistsByStore || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="store" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Grid>

              {/* Daily Trend */}
              <Grid item xs={12}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Daily Picklist Trend (Last 30 Days)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.dailyTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#e91e63" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Grid>
            </Grid>

            {/* Picklist Table */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ p: 3, pb: 0 }}>
                Detailed Picklist Records
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ODN</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Process ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Store</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Operator</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {picklists.map((picklist) => (
                      <TableRow key={picklist.id} hover>
                        <TableCell>{picklist.id}</TableCell>
                        <TableCell>
                          <Chip 
                            label={picklist.odn || 'N/A'} 
                            variant="outlined" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{picklist.process_id || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            icon={<StoreIcon />}
                            label={picklist.store || 'N/A'} 
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(picklist.status)}
                            label={picklist.status || 'Unknown'}
                            color={getStatusColor(picklist.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <OperatorIcon fontSize="small" />
                            <Typography variant="body2">
                              {picklist.operator?.full_name || 'N/A'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {picklist.createdAt ? dayjs(picklist.createdAt).format('MMM DD, YYYY HH:mm') : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
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
            </Card>
          </Box>
        </Card>

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

export default PicklistReports;