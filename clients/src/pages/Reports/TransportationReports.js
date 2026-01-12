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
  Avatar,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  LocalShipping,
  Route as RouteIcon,
  DirectionsCar,
  TrendingUp,
  CheckCircle,
  Pending,
  Assignment
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003';

const TransportationReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dispatchData, setDispatchData] = useState({});
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear().toString(),
    route_id: ''
  });

  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  const colors = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

  useEffect(() => {
    fetchDispatchData();
  }, [filters]);

  const fetchDispatchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/reports/dispatch`, { params: filters });
      setDispatchData(response.data);
    } catch (err) {
      console.error('Error fetching dispatch data:', err);
      setError('Failed to load transportation reports. Please try again.');
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
      title: 'Total Assignments',
      value: dispatchData.stats?.total_assignments || 0,
      icon: <Assignment />,
      color: '#2196f3'
    },
    {
      title: 'Completed Dispatches',
      value: dispatchData.stats?.completed_dispatches || 0,
      icon: <CheckCircle />,
      color: '#4caf50'
    },
    {
      title: 'In Progress',
      value: dispatchData.stats?.in_progress || 0,
      icon: <Pending />,
      color: '#ff9800'
    },
    {
      title: 'Completion Rate',
      value: `${dispatchData.stats?.completion_rate || 0}%`,
      icon: <TrendingUp />,
      color: '#9c27b0'
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Transportation & Dispatch Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive analysis of route assignments, dispatch performance, and transportation metrics
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
            label="Route ID"
            value={filters.route_id}
            onChange={(e) => handleFilterChange('route_id', e.target.value)}
            placeholder="Filter by route ID..."
          />
        </Grid>
      </Grid>

      {/* Statistics Cards */}
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
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Route Performance Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <RouteIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Route Performance Analysis
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dispatchData.routePerformance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="route_name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_assignments" fill="#2196f3" name="Total Assignments" />
                  <Bar dataKey="completed" fill="#4caf50" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Monthly Dispatch Trend
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dispatchData.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ethiopian_month" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total_assignments" stroke="#2196f3" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="completed" stroke="#4caf50" strokeWidth={2} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Route Performance Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <LocalShipping color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Detailed Route Performance
                </Typography>
              </Stack>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                      <TableCell fontWeight="bold">Route Name</TableCell>
                      <TableCell align="center" fontWeight="bold">Total Assignments</TableCell>
                      <TableCell align="center" fontWeight="bold">Completed</TableCell>
                      <TableCell align="center" fontWeight="bold">Completion Rate</TableCell>
                      <TableCell align="center" fontWeight="bold">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(dispatchData.routePerformance || []).map((route, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <RouteIcon color="action" />
                            <Typography variant="body2" fontWeight="medium">
                              {route.route_name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={route.total_assignments || 0} 
                            color="primary" 
                            variant="outlined" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {route.completed || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <Typography variant="body2" fontWeight="bold">
                              {route.completion_rate || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={route.completion_rate >= 90 ? 'Excellent' : route.completion_rate >= 70 ? 'Good' : 'Needs Improvement'} 
                            color={route.completion_rate >= 90 ? 'success' : route.completion_rate >= 70 ? 'info' : 'warning'} 
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

export default TransportationReports;