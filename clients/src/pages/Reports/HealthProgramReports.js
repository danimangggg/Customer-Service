import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Stack,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  LocalHospital,
  TrendingUp,
  TrendingDown,
  Business,
  Assignment,
  CheckCircle,
  Description,
  LocationOn,
  HealthAndSafety
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
  Cell
} from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const HealthProgramReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear().toString(),
    region: ''
  });

  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsResponse, facilitiesResponse] = await Promise.all([
        axios.get(`${API_URL}/api/reports/health-program/analytics`, { params: filters }),
        axios.get(`${API_URL}/api/reports/health-program/facilities`, { params: filters })
      ]);
      
      setAnalytics(analyticsResponse.data);
      setFacilities(facilitiesResponse.data);
    } catch (err) {
      console.error('Error fetching health program data:', err);
      setError('Failed to load health program data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const healthMetrics = [
    {
      title: 'HP Facilities',
      value: analytics.summary?.totalFacilities || 0,
      change: '+0%',
      trend: 'neutral',
      icon: <LocalHospital />,
      color: '#f44336'
    },
    {
      title: 'Active Processes',
      value: analytics.summary?.totalProcesses || 0,
      change: `${analytics.summary?.processCompletionRate || 0}% completed`,
      trend: 'up',
      icon: <Assignment />,
      color: '#2196f3'
    },
    {
      title: 'Total ODNs',
      value: analytics.summary?.totalODNs || 0,
      change: `${analytics.summary?.odnCompletionRate || 0}% completed`,
      trend: 'up',
      icon: <Description />,
      color: '#4caf50'
    },
    {
      title: 'Completed Processes',
      value: analytics.summary?.completedProcesses || 0,
      change: `${analytics.summary?.processCompletionRate || 0}% rate`,
      trend: 'up',
      icon: <HealthAndSafety />,
      color: '#9c27b0'
    }
  ];

  const getRatingColor = (rate) => {
    if (rate >= 95) return 'success';
    if (rate >= 85) return 'info';
    if (rate >= 70) return 'warning';
    return 'error';
  };

  const getRatingText = (rate) => {
    if (rate >= 95) return 'Excellent';
    if (rate >= 85) return 'Very Good';
    if (rate >= 70) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Health Program Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Real-time analysis of health program facilities, processes, and performance metrics
        </Typography>
      </Box>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Ethiopian Month</InputLabel>
            <Select
              value={filters.month}
              label="Ethiopian Month"
              onChange={(e) => handleFilterChange('month', e.target.value)}
            >
              <MenuItem value="">All Months</MenuItem>
              {ethiopianMonths.map((month) => (
                <MenuItem key={month} value={month}>{month}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Year"
            type="number"
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            inputProps={{ min: 2010, max: 2030 }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Region"
            value={filters.region}
            onChange={(e) => handleFilterChange('region', e.target.value)}
            placeholder="Filter by region..."
          />
        </Grid>
      </Grid>

      {/* Health Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {healthMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}05 100%)`,
              border: `1px solid ${metric.color}30`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease'
              },
              transition: 'all 0.3s ease'
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: metric.color, width: 56, height: 56 }}>
                    {metric.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {metric.value.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {metric.title}
                    </Typography>
                    <Chip
                      icon={metric.trend === 'up' ? <TrendingUp /> : metric.trend === 'down' ? <TrendingDown /> : <CheckCircle />}
                      label={metric.change}
                      size="small"
                      color={metric.trend === 'up' ? 'success' : metric.trend === 'down' ? 'error' : 'info'}
                      variant="outlined"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Facilities by Region */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Business color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  HP Facilities by Region
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.distributions?.facilitiesByRegion || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region_name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Process Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Assignment color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Process Status Distribution
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.distributions?.processStatus || []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {(analytics.distributions?.processStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Process Trend */}
        <Grid item xs={12}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Monthly HP Process Trend
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.trends?.monthlyProcesses || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="reporting_month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2196f3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* HP Facility Performance Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <LocationOn color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Health Program Facility Performance
                </Typography>
              </Stack>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)' }}>
                      <TableCell fontWeight="bold">Facility Name</TableCell>
                      <TableCell fontWeight="bold">Location</TableCell>
                      <TableCell align="center" fontWeight="bold">Total Processes</TableCell>
                      <TableCell align="center" fontWeight="bold">Completed</TableCell>
                      <TableCell align="center" fontWeight="bold">Total ODNs</TableCell>
                      <TableCell align="center" fontWeight="bold">Completion Rate</TableCell>
                      <TableCell align="center" fontWeight="bold">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facilities.slice(0, 10).map((facility, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <LocalHospital color="action" />
                            <Typography variant="body2" fontWeight="medium">
                              {facility.facility_name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {facility.region_name}, {facility.zone_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {facility.woreda_name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={facility.total_processes || 0} 
                            color="primary" 
                            variant="outlined" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {facility.completed_processes || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="bold">
                            {facility.total_odns || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={facility.completion_rate || 0}
                              sx={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(76, 175, 80, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  bgcolor: facility.completion_rate >= 95 ? '#4caf50' : facility.completion_rate >= 85 ? '#2196f3' : facility.completion_rate >= 70 ? '#ff9800' : '#f44336'
                                }
                              }}
                            />
                            <Typography variant="body2" fontWeight="bold">
                              {facility.completion_rate || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={getRatingText(facility.completion_rate || 0)} 
                            color={getRatingColor(facility.completion_rate || 0)} 
                            variant="outlined" 
                            size="small" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HealthProgramReports;