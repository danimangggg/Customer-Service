import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Assignment,
  LocalHospital,
  Send,
  LocalShipping,
  CheckCircle,
  Star,
  TrendingUp,
  FilterList
} from '@mui/icons-material';
import axios from 'axios';

const HPDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Ethiopian months
  const ethiopianMonths = [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
    'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
  ];

  // Ethiopian years (current and previous years)
  const ethiopianYears = ['2018', '2017', '2016'];

  useEffect(() => {
    // Set default to current Ethiopian month and year
    const currentMonth = 'Tir';
    const currentYear = '2018';
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    
    fetchDashboardData(currentMonth, currentYear);
  }, []);

  const fetchDashboardData = async (month = selectedMonth, year = selectedYear) => {
    try {
      setLoading(true);
      const params = {};
      if (month && year) {
        params.month = month;
        params.year = year;
      }
      
      const response = await axios.get(`${api_url}/api/hp-dashboard-data`, { params });
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching HP dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    fetchDashboardData(month, selectedYear);
  };

  const handleYearChange = (event) => {
    const year = event.target.value;
    setSelectedYear(year);
    fetchDashboardData(selectedMonth, year);
  };

  const handleClearFilter = () => {
    setSelectedMonth('');
    setSelectedYear('');
    fetchDashboardData('', '');
  };

  const MetricCard = ({ title, value, icon, color, subtitle, progress, isMonthDependent = false }) => (
    <Card sx={{ 
      height: '100%', 
      position: 'relative', 
      overflow: 'visible',
      opacity: isMonthDependent && !selectedMonth ? 0.8 : 1,
      border: isMonthDependent && selectedMonth ? 2 : 1,
      borderColor: isMonthDependent && selectedMonth ? `${color}.200` : 'grey.200',
      background: isMonthDependent && selectedMonth 
        ? `linear-gradient(135deg, ${color === 'primary' ? '#e3f2fd' : 
                                     color === 'success' ? '#e8f5e8' : 
                                     color === 'warning' ? '#fff3e0' : 
                                     color === 'info' ? '#e1f5fe' : 
                                     color === 'error' ? '#ffebee' : '#f5f5f5'} 0%, #ffffff 100%)`
        : '#ffffff',
      boxShadow: isMonthDependent && selectedMonth ? 3 : 1,
      transform: isMonthDependent && selectedMonth ? 'translateY(-2px)' : 'none',
      transition: 'all 0.3s ease-in-out'
    }}>
      <CardContent>
        {isMonthDependent && selectedMonth && (
          <Box sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: `${color}.500`,
            boxShadow: `0 0 8px ${color === 'primary' ? '#1976d2' : 
                                  color === 'success' ? '#2e7d32' : 
                                  color === 'warning' ? '#ed6c02' : 
                                  color === 'info' ? '#0288d1' : 
                                  color === 'error' ? '#d32f2f' : '#666'}`
          }} />
        )}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box sx={{ 
            bgcolor: `${color}.100`, 
            borderRadius: 2, 
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isMonthDependent && selectedMonth ? `0 2px 8px ${color === 'primary' ? 'rgba(25, 118, 210, 0.2)' : 
                                                                        color === 'success' ? 'rgba(46, 125, 50, 0.2)' : 
                                                                        color === 'warning' ? 'rgba(237, 108, 2, 0.2)' : 
                                                                        color === 'info' ? 'rgba(2, 136, 209, 0.2)' : 
                                                                        color === 'error' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(0,0,0,0.1)'}` : 'none'
          }}>
            {React.cloneElement(icon, { sx: { color: `${color}.600`, fontSize: 28 } })}
          </Box>
          <Typography variant="h4" fontWeight="bold" color={`${color}.600`}>
            {value}
          </Typography>
        </Stack>
        <Typography variant="h6" fontWeight="medium" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mb={1}>
            {subtitle}
          </Typography>
        )}
        {isMonthDependent && (
          <Chip 
            label={selectedMonth && selectedYear ? `${selectedMonth} ${selectedYear}` : 'All Time'} 
            size="small" 
            color={selectedMonth && selectedYear ? color : 'default'}
            variant={selectedMonth && selectedYear ? 'filled' : 'outlined'}
            sx={{ 
              mb: 1,
              fontWeight: selectedMonth && selectedYear ? 600 : 400,
              boxShadow: selectedMonth && selectedYear ? 1 : 0
            }}
          />
        )}
        {progress !== undefined && (
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: `${color}.100`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: `${color}.600`,
                  borderRadius: 4
                }
              }} 
            />
            <Typography variant="caption" color="text.secondary" mt={0.5}>
              {progress.toFixed(1)}% Complete
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const data = dashboardData || {};
  const expectedVsDone = data.expectedVsDone || {};

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header with Filter */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <LocalHospital sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                Health Program Dashboard
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Comprehensive overview of HP operations
              </Typography>
            </Box>
          </Stack>
          
          {/* Filter Controls */}
          <Stack direction="row" spacing={2} alignItems="center">
            <FilterList sx={{ color: 'primary.main' }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={handleMonthChange}
              >
                <MenuItem value="">All Time</MenuItem>
                {ethiopianMonths.map((month) => (
                  <MenuItem key={month} value={month}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={handleYearChange}
              >
                <MenuItem value="">All</MenuItem>
                {ethiopianYears.map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {(selectedMonth || selectedYear) && (
              <Chip 
                label="Clear Filter" 
                onClick={handleClearFilter}
                onDelete={handleClearFilter}
                color="secondary"
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Main Metrics Grid */}
      <Grid container spacing={3} mb={4}>
        {/* Total Facilities - First and NOT month dependent */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="HP Facilities"
            value={data.totalFacilities || 0}
            icon={<LocalHospital />}
            color="secondary"
            subtitle="Health facilities with routes (Total)"
            isMonthDependent={false}
          />
        </Grid>

        {/* Month-dependent cards */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total ODNs"
            value={data.totalODNs || 0}
            icon={<Assignment />}
            color="primary"
            subtitle="ODNs for selected period"
            isMonthDependent={true}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="RRF Sent"
            value={data.rrfSent || 0}
            icon={<Send />}
            color="success"
            subtitle="Facilities that reported RRF sent"
            progress={data.totalFacilities > 0 ? (data.rrfSent / data.totalFacilities) * 100 : 0}
            isMonthDependent={true}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Dispatched ODNs"
            value={data.dispatchedODNs || 0}
            icon={<LocalShipping />}
            color="warning"
            subtitle="ODNs ready for delivery"
            progress={data.totalODNs > 0 ? (data.dispatchedODNs / data.totalODNs) * 100 : 0}
            isMonthDependent={true}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="POD Confirmed"
            value={data.podConfirmed || 0}
            icon={<CheckCircle />}
            color="info"
            subtitle="Proof of delivery confirmed"
            progress={data.dispatchedODNs > 0 ? (data.podConfirmed / data.dispatchedODNs) * 100 : 0}
            isMonthDependent={true}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Quality Evaluated"
            value={data.qualityEvaluated || 0}
            icon={<Star />}
            color="error"
            subtitle="Quality assessments completed"
            progress={data.podConfirmed > 0 ? (data.qualityEvaluated / data.podConfirmed) * 100 : 0}
            isMonthDependent={true}
          />
        </Grid>
      </Grid>

      {/* Expected vs Done Section */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <TrendingUp sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Performance Overview: Expected vs Done
          </Typography>
          {selectedMonth && selectedYear && (
            <Chip 
              label={`${selectedMonth} ${selectedYear}`} 
              color="primary" 
              variant="outlined"
            />
          )}
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'success.50', border: 1, borderColor: 'success.200' }}>
              <CardContent>
                <Typography variant="h6" color="success.main" gutterBottom>
                  Expected Facilities
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  {expectedVsDone.expected || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total HP facilities to process
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
              <CardContent>
                <Typography variant="h6" color="primary.main" gutterBottom>
                  Completed Facilities
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  {expectedVsDone.done || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Facilities with completed processes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance Summary */}
        <Box mt={3}>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Achievement Rate {selectedMonth && selectedYear ? `(${selectedMonth} ${selectedYear})` : '(All Time)'}
            </Typography>
            <Chip 
              label={`${expectedVsDone.expected > 0 ? ((expectedVsDone.done / expectedVsDone.expected) * 100).toFixed(1) : 0}%`}
              color={expectedVsDone.done >= expectedVsDone.expected ? 'success' : 'warning'}
              size="large"
              sx={{ fontWeight: 'bold', fontSize: '1rem' }}
            />
          </Stack>
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={expectedVsDone.expected > 0 ? Math.min((expectedVsDone.done / expectedVsDone.expected) * 100, 100) : 0}
              sx={{ 
                height: 12, 
                borderRadius: 6,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: expectedVsDone.done >= expectedVsDone.expected ? 'success.main' : 'warning.main'
                }
              }} 
            />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default HPDashboard;