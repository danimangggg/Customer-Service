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
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Business,
  Assignment,
  Description,
  Inventory,
  BarChart,
  PieChart,
  CheckCircle,
  Pending,
  Route as RouteIcon
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const DashboardAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [performance, setPerformance] = useState({});
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear().toString()
  });

  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  const colors = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsResponse, performanceResponse] = await Promise.all([
        axios.get(`${API_URL}/api/reports/dashboard/analytics`, { params: filters }),
        axios.get(`${API_URL}/api/reports/dashboard/performance`)
      ]);
      
      setAnalytics(analyticsResponse.data);
      setPerformance(performanceResponse.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
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

  const stats = [
    {
      title: 'Total Facilities',
      value: analytics.summary?.totalFacilities || 0,
      change: '+0%',
      trend: 'neutral',
      icon: <Business />,
      color: '#2196f3'
    },
    {
      title: 'Active Processes',
      value: analytics.summary?.totalProcesses || 0,
      change: `${analytics.summary?.processCompletionRate || 0}% completed`,
      trend: 'up',
      icon: <Assignment />,
      color: '#4caf50'
    },
    {
      title: 'Total ODNs',
      value: analytics.summary?.totalODNs || 0,
      change: `${analytics.summary?.odnCompletionRate || 0}% completed`,
      trend: 'up',
      icon: <Description />,
      color: '#f44336'
    },
    {
      title: 'Total Picklists',
      value: analytics.summary?.totalPicklists || 0,
      change: `${analytics.summary?.picklistCompletionRate || 0}% completed`,
      trend: 'up',
      icon: <Inventory />,
      color: '#9c27b0'
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard Analytics
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Real-time overview of system performance and metrics
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
      </Grid>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
              border: `1px solid ${stat.color}30`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease'
              },
              transition: 'all 0.3s ease'
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Chip
                      icon={stat.trend === 'up' ? <TrendingUp /> : stat.trend === 'down' ? <TrendingDown /> : <CheckCircle />}
                      label={stat.change}
                      size="small"
                      color={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'error' : 'info'}
                      variant="outlined"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Process Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <PieChart color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Process Status Distribution
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
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
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ODN Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <BarChart color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  ODN Status Distribution
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={analytics.distributions?.odnStatus || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2196f3" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Facilities by Region */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Business color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Facilities by Region
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={analytics.distributions?.facilitiesByRegion || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region_name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4caf50" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Route Assignment Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <RouteIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Route Assignment Status
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={analytics.distributions?.routeAssignments || []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {(analytics.distributions?.routeAssignments || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
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
                  Monthly Process Trend
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={analytics.trends?.monthlyProcesses || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="reporting_month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#e91e63" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Performance */}
      {performance.performance && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                  System Performance Metrics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {Math.round(performance.performance.avgProcessingTime || 0)}h
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Processing Time
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {performance.performance.activeUsers || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Users
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Typography variant="h4" fontWeight="bold" color="info.main">
                        {performance.performance.totalUsers || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default DashboardAnalytics;