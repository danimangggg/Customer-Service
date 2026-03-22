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
  CheckCircle,
  Star,
  TrendingUp,
  FilterList
} from '@mui/icons-material';
import api from '../../../axiosInstance';

const MetricCard = ({ title, value, icon, color, subtitle, progress, progressLabel = 'Complete', isMonthDependent = false, selectedMonth, selectedYear }) => (
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
        {progress != null && (
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
              {progress.toFixed(1)}% {progressLabel}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

const HPDashboard = ({ branchCode = '' }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [processType, setProcessType] = useState('regular');

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Ethiopian months
  const ethiopianMonths = [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
    'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
  ];

  // Function to convert Gregorian date to Ethiopian date (accurate conversion)
  const getCurrentEthiopianMonth = (gDate = new Date()) => {
    // Ethiopian New Year starts on September 11 (or 12 in leap years)
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth(); // 0-based (0 = January, 8 = September)
    const gd = gDate.getDate();
    
    // Determine if current Gregorian year is a leap year
    const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
    
    // Ethiopian New Year date for current Gregorian year
    const newYearDay = isLeap ? 12 : 11; // September 12 in leap years, September 11 otherwise
    
    let ethYear, ethMonthIndex;
    
    // Check if we're before or after Ethiopian New Year
    if (gm > 8 || (gm === 8 && gd >= newYearDay)) {
      // After Ethiopian New Year - we're in the new Ethiopian year
      ethYear = gy - 7; // Ethiopian year is 7 years behind after New Year
      
      // Calculate days since Ethiopian New Year
      const newYearDate = new Date(gy, 8, newYearDay); // September 11/12
      const diffDays = Math.floor((gDate - newYearDate) / (24 * 60 * 60 * 1000));
      
      // Each Ethiopian month has 30 days (except Pagume which has 5/6 days)
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12; // Pagume (13th month)
      }
    } else {
      // Before Ethiopian New Year - we're still in the previous Ethiopian year
      ethYear = gy - 8; // Ethiopian year is 8 years behind before New Year
      
      // Calculate from previous year's Ethiopian New Year
      const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
      const prevNewYearDay = prevIsLeap ? 12 : 11;
      const prevNewYearDate = new Date(gy - 1, 8, prevNewYearDay);
      const diffDays = Math.floor((gDate - prevNewYearDate) / (24 * 60 * 60 * 1000));
      
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12; // Pagume
      }
    }
    
    // Ensure month index is within valid range
    ethMonthIndex = Math.max(0, Math.min(ethMonthIndex, 12));
    
    return {
      year: ethYear,
      monthIndex: ethMonthIndex,
      month: ethiopianMonths[ethMonthIndex]
    };
  };

  // Ethiopian years (generate dynamically based on current year)
  const getCurrentEthiopianYear = () => {
    const ethDate = getCurrentEthiopianMonth();
    const currentYear = ethDate.year;
    return [
      currentYear.toString(),
      (currentYear - 1).toString(),
      (currentYear - 2).toString()
    ];
  };

  const ethiopianYears = getCurrentEthiopianYear();

  useEffect(() => {
    // Set default to current Ethiopian month and year
    const currentEthDate = getCurrentEthiopianMonth();
    setSelectedMonth(currentEthDate.month);
    setSelectedYear(currentEthDate.year.toString());
    
    fetchDashboardData(currentEthDate.month, currentEthDate.year.toString());
  }, []);

  const fetchDashboardData = async (month = selectedMonth, year = selectedYear, type = processType) => {
    try {
      setLoading(true);
      const params = {};
      if (month && year) {
        params.month = month;
        params.year = year;
      }
      if (type) params.process_type = type;
      if (branchCode) params.branch_code = branchCode;
      
      const response = await api.get(`${api_url}/api/hp-dashboard-data`, { params });
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
    fetchDashboardData(month, selectedYear, processType);
  };

  const handleYearChange = (event) => {
    const year = event.target.value;
    setSelectedYear(year);
    fetchDashboardData(selectedMonth, year, processType);
  };

  const handleTypeChange = (event) => {
    const type = event.target.value;
    setProcessType(type);
    fetchDashboardData(selectedMonth, selectedYear, type);
  };

  const handleClearFilter = () => {
    setSelectedMonth('');
    setSelectedYear('');
    fetchDashboardData('', '', processType);
  };

  // MetricCard is defined outside this component

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
                {processType === 'vaccine' ? 'Vaccine Dashboard' : 'Health Program Dashboard'}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {processType === 'vaccine' ? 'Comprehensive overview of Vaccine operations' : 'Comprehensive overview of HP operations'}
              </Typography>
            </Box>
          </Stack>
          
          {/* Filter Controls */}
          <Stack direction="row" spacing={2} alignItems="center">
            <FilterList sx={{ color: 'primary.main' }} />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Type</InputLabel>
              <Select value={processType} label="Type" onChange={handleTypeChange}>
                <MenuItem value="regular">HP Regular</MenuItem>
                <MenuItem value="vaccine">Vaccine</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Month</InputLabel>
              <Select value={selectedMonth} label="Month" onChange={handleMonthChange}>
                <MenuItem value="">All Time</MenuItem>
                {ethiopianMonths.map((month) => (
                  <MenuItem key={month} value={month}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select value={selectedYear} label="Year" onChange={handleYearChange}>
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
        {/* Total Facilities - NOT month dependent */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title={processType === 'vaccine' ? 'Vaccine Facilities' : 'HP Facilities'}
            value={data.totalFacilities || 0}
            icon={<LocalHospital />}
            color="secondary"
            subtitle={`${processType === 'vaccine' ? 'Vaccine' : 'Health'} facilities with routes (Total)`}
            isMonthDependent={false}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </Grid>

        {/* Expected This Month */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Expected This Month"
            value={data.expectedThisMonth ?? data.totalFacilities ?? 0}
            icon={<TrendingUp />}
            color="info"
            subtitle="Facilities due this month (by period)"
            isMonthDependent={true}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </Grid>

        {/* Completed — 3rd card */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Completed"
            value={data.qualityEvaluated || 0}
            icon={<Star />}
            color="error"
            subtitle="Quality assessments completed"
            progress={data.expectedThisMonth > 0 ? (data.qualityEvaluated / data.expectedThisMonth) * 100 : 0}
            isMonthDependent={true}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </Grid>

        {/* RRF/VRF Sent */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title={processType === 'vaccine' ? 'VRF Sent' : 'RRF Sent'}
            value={data.rrfSent || 0}
            icon={<Send />}
            color="success"
            subtitle={`Facilities that reported ${processType === 'vaccine' ? 'VRF' : 'RRF'} sent`}
            progress={data.expectedThisMonth > 0 ? (data.rrfSent / data.expectedThisMonth) * 100 : 0}
            progressLabel="Sent"
            isMonthDependent={true}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </Grid>

        {/* RRF/VRF Not Sent */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title={processType === 'vaccine' ? 'VRF Not Sent' : 'RRF Not Sent'}
            value={data.rrfNotSentCount || 0}
            icon={<Assignment />}
            color="warning"
            subtitle={`Facilities labelled ${processType === 'vaccine' ? 'VRF' : 'RRF'} not sent`}
            progress={data.expectedThisMonth > 0 ? (data.rrfNotSentCount / data.expectedThisMonth) * 100 : 0}
            progressLabel="Not Sent"
            isMonthDependent={true}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </Grid>

        {/* POD Confirmed — facilities count */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="POD Confirmed"
            value={data.podConfirmed || 0}
            icon={<CheckCircle />}
            color="info"
            subtitle="Facilities with POD confirmed"
            progress={data.expectedThisMonth > 0 ? (data.podConfirmed / data.expectedThisMonth) * 100 : 0}
            isMonthDependent={true}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
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
                  {data.expectedThisMonth ?? expectedVsDone.expected ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total {processType === 'vaccine' ? 'Vaccine' : 'HP'} facilities to process
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
              label={`${(data.expectedThisMonth ?? expectedVsDone.expected) > 0 ? ((expectedVsDone.done / (data.expectedThisMonth ?? expectedVsDone.expected)) * 100).toFixed(1) : 0}%`}
              color={expectedVsDone.done >= (data.expectedThisMonth ?? expectedVsDone.expected) ? 'success' : 'warning'}
              size="large"
              sx={{ fontWeight: 'bold', fontSize: '1rem' }}
            />
          </Stack>
          <Box mt={2}>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((data.expectedThisMonth ?? expectedVsDone.expected) > 0 ? (expectedVsDone.done / (data.expectedThisMonth ?? expectedVsDone.expected)) * 100 : 0, 100)}
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