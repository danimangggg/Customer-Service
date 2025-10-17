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
    <Slide direction="right" in={true} mountOnEnter unmountOnExit timeout={500}>
      <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 4,
          pb: 2,
          borderBottom: `2px solid ${customColors.primary}`,
          gap: 2,
        }}>
          <TrendingUpIcon sx={{ fontSize: { xs: 40, md: 50 }, color: customColors.primary }} />
          <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
            Customer Service Dashboard
          </Typography>
        </Box>

        {loading ? (
          <Fade in={loading}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8, py: 6, bgcolor: 'background.paper', borderRadius: 3, boxShadow: theme.shadows[3] }}>
              <CircularProgress size={70} thickness={5} color="primary" />
            </Box>
          </Fade>
        ) : (
          <Grid container spacing={4}>
            {/* Summary Cards */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: customColors.info, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Typography variant="h6" fontWeight="bold">Total Registrations</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <PeopleIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h3" fontWeight="bold">{totalRegistrations}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: customColors.success, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Typography variant="h6" fontWeight="bold">Tasks Completed</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h3" fontWeight="bold">{completedCustomers}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: customColors.secondary, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <Typography variant="h6" fontWeight="bold">Avg. Waiting Time (2 wks)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h3" fontWeight="bold">{recentAverageWaitingTime}</Typography>
                  <Typography variant="h6" sx={{ ml: 1 }}>hrs</Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Daily Completed Tasks Bar Chart */}
            <Grid item xs={12} md={6}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 3, minHeight: 400 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Daily Completed Tasks</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyCompletedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} />
                    <YAxis tick={{ fill: theme.palette.text.secondary }} />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Bar dataKey="Completed Tasks" fill={customColors.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Status Distribution Pie Chart */}
            <Grid item xs={12} md={6}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 3, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Task Status Distribution</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
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

            {/* Daily Average Waiting Time Line Chart */}
            <Grid item xs={12} md={6}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 3, minHeight: 350 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Daily Average Waiting Time Trend</Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyAverageWaitingTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} />
                    <YAxis tick={{ fill: theme.palette.text.secondary }} />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Average Waiting Time (hrs)"
                      stroke={customColors.primary}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Daily Customer Registration Trend Line Chart */}
            <Grid item xs={12} md={6}>
              <Paper elevation={4} sx={{ p: 3, borderRadius: 3, minHeight: 350 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Daily Registration Trend</Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyRegistrationTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} />
                    <YAxis tick={{ fill: theme.palette.text.secondary }} />
                    <Tooltip content={renderTooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Daily Registrations"
                      stroke={customColors.secondary}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

          </Grid>
        )}
      </Box>
    </Slide>
  );
};

export default CustomerServiceDashboard;
