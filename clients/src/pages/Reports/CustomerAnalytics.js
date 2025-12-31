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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  People,
  PersonAdd,
  TrendingUp,
  LocationOn,
  Business,
  Phone,
  Email,
  Schedule,
  Star
} from '@mui/icons-material';

const CustomerAnalytics = () => {
  // Sample customer data
  const customerStats = [
    {
      title: 'Total Customers',
      value: '3,247',
      change: '+15.2%',
      trend: 'up',
      icon: <People />,
      color: '#2196f3'
    },
    {
      title: 'New Registrations',
      value: '89',
      change: '+23.1%',
      trend: 'up',
      icon: <PersonAdd />,
      color: '#4caf50'
    },
    {
      title: 'Active Customers',
      value: '2,891',
      change: '+8.7%',
      trend: 'up',
      icon: <Business />,
      color: '#ff9800'
    },
    {
      title: 'Customer Satisfaction',
      value: '4.6/5',
      change: '+0.3',
      trend: 'up',
      icon: <Star />,
      color: '#9c27b0'
    }
  ];

  const customerByRegion = [
    { region: 'Addis Ababa', customers: 1247, percentage: 38.4 },
    { region: 'Oromia', customers: 892, percentage: 27.5 },
    { region: 'Amhara', customers: 567, percentage: 17.5 },
    { region: 'SNNPR', customers: 341, percentage: 10.5 },
    { region: 'Tigray', customers: 200, percentage: 6.1 }
  ];

  const customerTypes = [
    { type: 'Healthcare Facilities', count: 1456, color: '#f44336' },
    { type: 'Pharmaceutical Companies', count: 892, color: '#2196f3' },
    { type: 'Medical Equipment Suppliers', count: 567, color: '#4caf50' },
    { type: 'Research Institutions', count: 332, color: '#ff9800' }
  ];

  const recentActivities = [
    { action: 'New customer registration', customer: 'Bethel Medical Center', time: '2 hours ago', type: 'registration' },
    { action: 'Process completed', customer: 'Black Lion Hospital', time: '4 hours ago', type: 'completion' },
    { action: 'Document submitted', customer: 'Pharmaceutical Corp', time: '6 hours ago', type: 'submission' },
    { action: 'Quality check passed', customer: 'Medical Supplies Ltd', time: '8 hours ago', type: 'quality' },
    { action: 'Payment processed', customer: 'Health Research Institute', time: '1 day ago', type: 'payment' }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'registration': return <PersonAdd color="success" />;
      case 'completion': return <Business color="primary" />;
      case 'submission': return <Email color="info" />;
      case 'quality': return <Star color="warning" />;
      case 'payment': return <Phone color="secondary" />;
      default: return <Schedule color="action" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Customer Analytics
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive analysis of customer data, demographics, and engagement metrics
        </Typography>
      </Box>

      {/* Customer Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {customerStats.map((stat, index) => (
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
                      icon={<TrendingUp />}
                      label={stat.change}
                      size="small"
                      color="success"
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
        {/* Customer Distribution by Region */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 500 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <LocationOn color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Customer Distribution by Region
                </Typography>
              </Stack>
              
              <Box sx={{ mt: 2 }}>
                {customerByRegion.map((region, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {region.region}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          {region.customers}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {region.percentage}%
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={region.percentage}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          bgcolor: index === 0 ? '#2196f3' : index === 1 ? '#4caf50' : index === 2 ? '#ff9800' : '#9c27b0'
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Types & Recent Activities */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Customer Types */}
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <Business color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Customer Types
                  </Typography>
                </Stack>
                
                <Grid container spacing={2}>
                  {customerTypes.map((type, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: `${type.color}10`,
                        border: `1px solid ${type.color}30`
                      }}>
                        <Typography variant="h5" fontWeight="bold" color={type.color}>
                          {type.count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {type.type}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Schedule color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Recent Customer Activities
                  </Typography>
                </Stack>
                
                <List dense>
                  {recentActivities.map((activity, index) => (
                    <Box key={index}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getActivityIcon(activity.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="medium">
                              {activity.action}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="primary">
                                {activity.customer}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.time}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CustomerAnalytics;