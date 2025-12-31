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
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Assignment,
  LocalHospital,
  Inventory,
  BarChart,
  PieChart
} from '@mui/icons-material';

const DashboardAnalytics = () => {
  // Sample data for demonstration
  const stats = [
    {
      title: 'Total Customers',
      value: '2,847',
      change: '+12.5%',
      trend: 'up',
      icon: <People />,
      color: '#2196f3'
    },
    {
      title: 'Active Processes',
      value: '156',
      change: '+8.2%',
      trend: 'up',
      icon: <Assignment />,
      color: '#4caf50'
    },
    {
      title: 'Health Programs',
      value: '89',
      change: '-2.1%',
      trend: 'down',
      icon: <LocalHospital />,
      color: '#f44336'
    },
    {
      title: 'Inventory Items',
      value: '1,234',
      change: '+5.7%',
      trend: 'up',
      icon: <Inventory />,
      color: '#9c27b0'
    }
  ];

  const monthlyData = [
    { month: 'Jan', value: 65 },
    { month: 'Feb', value: 78 },
    { month: 'Mar', value: 82 },
    { month: 'Apr', value: 91 },
    { month: 'May', value: 87 },
    { month: 'Jun', value: 95 }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard Analytics
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive overview of system performance and metrics
        </Typography>
      </Box>

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
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Chip
                      icon={stat.trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                      label={stat.change}
                      size="small"
                      color={stat.trend === 'up' ? 'success' : 'error'}
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
        {/* Monthly Performance Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <BarChart color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Monthly Performance
                </Typography>
              </Stack>
              
              {/* Simple Bar Chart Representation */}
              <Box sx={{ mt: 2 }}>
                {monthlyData.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="body2" sx={{ minWidth: 40 }}>
                        {item.month}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={item.value}
                          sx={{
                            height: 20,
                            borderRadius: 10,
                            bgcolor: 'rgba(25, 118, 210, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 10,
                              bgcolor: '#1976d2'
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 40 }}>
                        {item.value}%
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Process Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <PieChart color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Process Distribution
                </Typography>
              </Stack>
              
              {/* Simple Process Distribution */}
              <Box sx={{ mt: 2 }}>
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Customer Service</Typography>
                      <Typography variant="body2" fontWeight="bold">45%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={45}
                      sx={{
                        mt: 1,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(76, 175, 80, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: '#4caf50'
                        }
                      }}
                    />
                  </Box>
                  
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Health Programs</Typography>
                      <Typography variant="body2" fontWeight="bold">30%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={30}
                      sx={{
                        mt: 1,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: '#f44336'
                        }
                      }}
                    />
                  </Box>
                  
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Inventory</Typography>
                      <Typography variant="body2" fontWeight="bold">25%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={25}
                      sx={{
                        mt: 1,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(156, 39, 176, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: '#9c27b0'
                        }
                      }}
                    />
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardAnalytics;