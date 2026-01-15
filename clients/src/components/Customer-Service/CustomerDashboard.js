import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  useTheme,
  Chip,
  Fade,
  Slide,
  Stack,
} from '@mui/material';
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
  Line,
} from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// A complete and self-contained React component for a customer service dashboard.
const CustomerServiceDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyCompletedData, setDailyCompletedData] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [dailyAverageWaitingTime, setDailyAverageWaitingTime] = useState([]);
  const [dailyRegistrationTrend, setDailyRegistrationTrend] = useState([]);
  const theme = useTheme();

  // Define a new, vibrant color palette for charts and cards
  const customColors = {
    primary: '#6366F1', // Indigo
    secondary: '#8B5CF6', // Violet
    success: '#10B981', // Emerald
    warning: '#FBBF24', // Amber
    error: '#EF4444', // Red
    info: '#3B82F6', // Blue
    neutral: '#E5E7EB', // Gray
  };
  
  // Main effect to fetch all data and process it on component mount
  useEffect(() => {
    const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3000';

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [customerRes] = await Promise.all([
          axios.get(`${api_url}/api/serviceList`),
        ]);
        const fetchedCustomers = customerRes.data;

        // Process daily completed tasks data
        const dailyCompletedCounts = fetchedCustomers.reduce((acc, customer) => {
          if (customer.status?.toLowerCase() === 'completed' && customer.completed_at) {
            const date = dayjs(customer.completed_at).format('MMM DD');
            acc[date] = (acc[date] || 0) + 1;
          }
          return acc;
        }, {});
        const processedCompletedData = Object.keys(dailyCompletedCounts).map(date => ({
          date,
          'Completed Tasks': dailyCompletedCounts[date],
        })).sort((a, b) => dayjs(a.date, 'MMM DD').isAfter(dayjs(b.date, 'MMM DD')) ? 1 : -1);

        // Process status distribution data
        let completed = 0;
        let inProgress = 0;
        let canceled = 0;
        fetchedCustomers.forEach(customer => {
          const status = customer.status?.toLowerCase();
          if (status === 'completed') {
            completed++;
          } else if (status === 'canceled') {
            canceled++;
          } else { // This will now catch any status that is not completed or canceled
            inProgress++;
          }
        });
        const processedStatusData = [
          { name: 'Completed', value: completed, color: customColors.success },
          { name: 'In Progress', value: inProgress, color: customColors.warning },
          { name: 'Canceled', value: canceled, color: customColors.error },
        ].filter(item => item.value > 0);

        // Process daily average waiting time data
        const dailyTimes = fetchedCustomers.reduce((acc, customer) => {
          if (customer.completed_at && customer.started_at) {
            const date = dayjs(customer.completed_at).format('MMM DD');
            const waitingTime = dayjs(customer.completed_at).diff(dayjs(customer.started_at), 'hour');
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(waitingTime);
          }
          return acc;
        }, {});
        const processedWaitingTimeData = Object.keys(dailyTimes).map(date => {
          const times = dailyTimes[date];
          const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
          return {
            date,
            'Average Waiting Time (hrs)': parseFloat(averageTime.toFixed(2)),
          };
        }).sort((a, b) => dayjs(a.date, 'MMM DD').isAfter(dayjs(b.date, 'MMM DD')) ? 1 : -1);
        
        // Process daily registration trend data
        const dailyRegistrationCounts = fetchedCustomers.reduce((acc, customer) => {
          const date = dayjs(customer.started_at).format('MMM DD');
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});
        const processedRegistrationData = Object.keys(dailyRegistrationCounts).map(date => ({
          date,
          'Daily Registrations': dailyRegistrationCounts[date],
        })).sort((a, b) => dayjs(a.date, 'MMM DD').isAfter(dayjs(b.date, 'MMM DD')) ? 1 : -1);

        // Update all states in one go
        setCustomers(fetchedCustomers);
        setDailyCompletedData(processedCompletedData);
        setStatusDistribution(processedStatusData);
        setDailyAverageWaitingTime(processedWaitingTimeData);
        setDailyRegistrationTrend(processedRegistrationData);

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Calculate key metrics
  const totalRegistrations = customers.length;
  const completedCustomers = customers.filter(c => c.status?.toLowerCase() === 'completed').length;

  // Calculate average waiting time for the last two weeks
  const twoWeeksAgo = dayjs().subtract(14, 'days');
  const recentCompletedCustomers = customers.filter(c => c.completed_at && dayjs(c.completed_at).isAfter(twoWeeksAgo));
  const recentWaitingTimes = recentCompletedCustomers.map(c => dayjs(c.completed_at).diff(dayjs(c.started_at), 'hour'));
  const recentAverageWaitingTime = recentWaitingTimes.length > 0 ? (recentWaitingTimes.reduce((sum, time) => sum + time, 0) / recentWaitingTimes.length).toFixed(2) : 'N/A';

  // Helper function to render custom tooltip for charts
  const renderTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight="bold">{label}</Typography>
          {payload.map((p, index) => (
            <Typography key={index} variant="body2" sx={{ color: p.color }}>
              {p.name}: {p.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // Custom legend for the Pie Chart
  const renderPieLegend = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
      {statusDistribution.map((entry, index) => (
        <Chip
          key={`legend-${index}`}
          label={`${entry.name}: ${entry.value}`}
          sx={{
            bgcolor: entry.color,
            color: theme.palette.getContrastText(entry.color),
            fontWeight: 'bold',
            '& .MuiChip-label': {
              pl: 1,
            },
          }}
        />
      ))}
    </Box>
  );

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
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          .animate-fade-in {
            animation: fadeInUp 0.6s ease-out;
          }
          .dashboard-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .dashboard-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px;
            border-radius: 20px 20px 0 0;
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
            border-radius: 20px;
            padding: 24px;
            position: relative;
            overflow: hidden;
            cursor: pointer;
          }
          .stats-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          }
          .stats-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            pointer-events: none;
          }
          .chart-card {
            transition: all 0.3s ease;
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.08);
          }
          .chart-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.1);
          }
          .metric-icon {
            animation: pulse 2s infinite;
          }
        `}
      </style>
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Box className="dashboard-card animate-fade-in" sx={{ mx: 'auto', maxWidth: '95%', minHeight: '100vh' }}>
          {/* Header Section */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            p: 4,
            borderRadius: '20px 20px 0 0'
          }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                width: 56, 
                height: 56,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <TrendingUpIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="600" sx={{ mb: 0.5 }}>
                  Customer Service Dashboard
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Real-time analytics and performance insights
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Content Section */}
          <Box sx={{ p: 4 }}>
            {loading ? (
              <Fade in={loading}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 12,
                  gap: 3
                }}>
                  <CircularProgress size={80} thickness={4} />
                  <Typography variant="h5" color="text.secondary">
                    Loading dashboard analytics...
                  </Typography>
                </Box>
              </Fade>
            ) : (
              <Grid container spacing={4}>
                {/* Enhanced Summary Cards */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box className="stats-card" sx={{ 
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    color: 'white'
                  }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box className="metric-icon" sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)',
                        p: 1.5,
                        borderRadius: 2
                      }}>
                        <PeopleIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight="600">
                          {totalRegistrations.toLocaleString()}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                          Total Registrations
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Box className="stats-card" sx={{ 
                    background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
                    color: 'white'
                  }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box className="metric-icon" sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)',
                        p: 1.5,
                        borderRadius: 2
                      }}>
                        <CheckCircleIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight="600">
                          {completedCustomers.toLocaleString()}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                          Tasks Completed
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Box className="stats-card" sx={{ 
                    background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)',
                    color: 'white'
                  }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box className="metric-icon" sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)',
                        p: 1.5,
                        borderRadius: 2
                      }}>
                        <AccessTimeIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight="600">
                          {recentAverageWaitingTime}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                          Avg. Wait Time (hrs)
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Grid>

                {/* Enhanced Charts */}
                <Grid item xs={12} md={6}>
                  <Paper className="chart-card" sx={{ p: 3, minHeight: 420 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <Box sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        p: 1,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TrendingUpIcon fontSize="small" />
                      </Box>
                      <Typography variant="h6" fontWeight="600">
                        Daily Completed Tasks
                      </Typography>
                    </Stack>
                    <ResponsiveContainer width="100%" height={330}>
                      <BarChart data={dailyCompletedData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#666', fontSize: 11 }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                          tick={{ fill: '#666', fontSize: 11 }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <Tooltip content={renderTooltip} />
                        <Legend wrapperStyle={{ fontSize: '13px' }} />
                        <Bar 
                          dataKey="Completed Tasks" 
                          fill="url(#barGradient)"
                          radius={[4, 4, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1976d2" />
                            <stop offset="100%" stopColor="#1565c0" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper className="chart-card" sx={{ p: 3, minHeight: 420 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <Box sx={{ 
                        bgcolor: 'success.main', 
                        color: 'white',
                        p: 1,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CheckCircleIcon fontSize="small" />
                      </Box>
                      <Typography variant="h6" fontWeight="600">
                        Task Status Distribution
                      </Typography>
                    </Stack>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={55}
                          paddingAngle={5}
                          fill="#8884d8"
                          labelLine={false}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={renderTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                    {renderPieLegend()}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper className="chart-card" sx={{ p: 3, minHeight: 380 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <Box sx={{ 
                        bgcolor: 'warning.main', 
                        color: 'white',
                        p: 1,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <AccessTimeIcon fontSize="small" />
                      </Box>
                      <Typography variant="h6" fontWeight="600">
                        Average Waiting Time Trend
                      </Typography>
                    </Stack>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyAverageWaitingTime} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#666', fontSize: 11 }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                          tick={{ fill: '#666', fontSize: 11 }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <Tooltip content={renderTooltip} />
                        <Legend wrapperStyle={{ fontSize: '13px' }} />
                        <Line
                          type="monotone"
                          dataKey="Average Waiting Time (hrs)"
                          stroke="#ed6c02"
                          strokeWidth={2.5}
                          dot={{ fill: '#ed6c02', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#ed6c02', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper className="chart-card" sx={{ p: 3, minHeight: 380 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <Box sx={{ 
                        bgcolor: 'info.main', 
                        color: 'white',
                        p: 1,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <PeopleIcon fontSize="small" />
                      </Box>
                      <Typography variant="h6" fontWeight="600">
                        Daily Registration Trend
                      </Typography>
                    </Stack>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyRegistrationTrend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#666', fontSize: 11 }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis 
                          tick={{ fill: '#666', fontSize: 11 }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <Tooltip content={renderTooltip} />
                        <Legend wrapperStyle={{ fontSize: '13px' }} />
                        <Line
                          type="monotone"
                          dataKey="Daily Registrations"
                          stroke="#0288d1"
                          strokeWidth={2.5}
                          dot={{ fill: '#0288d1', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#0288d1', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default CustomerServiceDashboard;
