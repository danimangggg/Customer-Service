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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  LocalHospital,
  TrendingUp,
  TrendingDown,
  People,
  Assignment,
  CheckCircle,
  Schedule,
  LocationOn,
  MedicalServices,
  Healing,
  HealthAndSafety
} from '@mui/icons-material';

const HealthProgramReports = () => {
  // Sample health program data
  const healthMetrics = [
    {
      title: 'Active Programs',
      value: '127',
      change: '+8.3%',
      trend: 'up',
      icon: <LocalHospital />,
      color: '#f44336'
    },
    {
      title: 'Enrolled Patients',
      value: '3,456',
      change: '+15.7%',
      trend: 'up',
      icon: <People />,
      color: '#2196f3'
    },
    {
      title: 'Completed Treatments',
      value: '892',
      change: '+12.4%',
      trend: 'up',
      icon: <CheckCircle />,
      color: '#4caf50'
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: <HealthAndSafety />,
      color: '#9c27b0'
    }
  ];

  const programTypes = [
    { type: 'Maternal Health', patients: 1245, percentage: 36.0, color: '#e91e63' },
    { type: 'Child Immunization', patients: 892, percentage: 25.8, color: '#2196f3' },
    { type: 'Chronic Disease Management', patients: 567, percentage: 16.4, color: '#4caf50' },
    { type: 'Mental Health Support', patients: 423, percentage: 12.2, color: '#ff9800' },
    { type: 'Nutrition Programs', patients: 329, percentage: 9.6, color: '#9c27b0' }
  ];

  const facilityPerformance = [
    { facility: 'Black Lion Hospital', programs: 23, patients: 567, completion: 96.2, rating: 'Excellent' },
    { facility: 'Bethel Medical Center', programs: 18, patients: 423, completion: 94.1, rating: 'Very Good' },
    { facility: 'St. Paul Hospital', programs: 21, patients: 512, completion: 92.8, rating: 'Very Good' },
    { facility: 'Tikur Anbessa Hospital', programs: 19, patients: 445, completion: 91.5, rating: 'Good' },
    { facility: 'Yekatit 12 Hospital', programs: 16, patients: 389, completion: 89.7, rating: 'Good' }
  ];

  const monthlyProgress = [
    { month: 'Jan', enrolled: 234, completed: 189, success: 80.8 },
    { month: 'Feb', enrolled: 267, completed: 223, success: 83.5 },
    { month: 'Mar', enrolled: 298, completed: 245, success: 82.2 },
    { month: 'Apr', enrolled: 312, completed: 267, success: 85.6 },
    { month: 'May', enrolled: 289, completed: 234, success: 81.0 },
    { month: 'Jun', enrolled: 345, completed: 298, success: 86.4 }
  ];

  const recentActivities = [
    { activity: 'New maternal health program launched', facility: 'Black Lion Hospital', time: '2 hours ago', type: 'program' },
    { activity: 'Immunization campaign completed', facility: 'Bethel Medical Center', time: '4 hours ago', type: 'completion' },
    { activity: 'Mental health screening started', facility: 'St. Paul Hospital', time: '6 hours ago', type: 'screening' },
    { activity: 'Nutrition program enrollment opened', facility: 'Tikur Anbessa Hospital', time: '8 hours ago', type: 'enrollment' },
    { activity: 'Chronic disease follow-up scheduled', facility: 'Yekatit 12 Hospital', time: '1 day ago', type: 'followup' }
  ];

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'Excellent': return 'success';
      case 'Very Good': return 'info';
      case 'Good': return 'warning';
      default: return 'default';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'program': return <LocalHospital color="error" />;
      case 'completion': return <CheckCircle color="success" />;
      case 'screening': return <MedicalServices color="info" />;
      case 'enrollment': return <People color="primary" />;
      case 'followup': return <Schedule color="warning" />;
      default: return <Assignment color="action" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Health Program Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive analysis of health programs, patient outcomes, and facility performance
        </Typography>
      </Box>

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
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {metric.title}
                    </Typography>
                    <Chip
                      icon={metric.trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                      label={metric.change}
                      size="small"
                      color={metric.trend === 'up' ? 'success' : 'error'}
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
        {/* Program Types Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 500 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Healing color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Program Types Distribution
                </Typography>
              </Stack>
              
              <Box sx={{ mt: 2 }}>
                {programTypes.map((program, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {program.type}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          {program.patients}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {program.percentage}%
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={program.percentage}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          bgcolor: program.color
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Progress & Recent Activities */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Monthly Progress */}
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <Assignment color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Monthly Progress
                  </Typography>
                </Stack>
                
                <Box sx={{ mt: 2 }}>
                  {monthlyProgress.slice(-3).map((month, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {month.month}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {month.success}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={month.success}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: '#4caf50'
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {month.completed}/{month.enrolled} completed
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Schedule color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Recent Activities
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
                              {activity.activity}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="primary">
                                {activity.facility}
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

        {/* Facility Performance Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <LocationOn color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Health Facility Performance
                </Typography>
              </Stack>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)' }}>
                      <TableCell fontWeight="bold">Facility Name</TableCell>
                      <TableCell align="center" fontWeight="bold">Active Programs</TableCell>
                      <TableCell align="center" fontWeight="bold">Enrolled Patients</TableCell>
                      <TableCell align="center" fontWeight="bold">Completion Rate</TableCell>
                      <TableCell align="center" fontWeight="bold">Performance Rating</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facilityPerformance.map((facility, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <LocalHospital color="action" />
                            <Typography variant="body2" fontWeight="medium">
                              {facility.facility}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={facility.programs} 
                            color="primary" 
                            variant="outlined" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="bold">
                            {facility.patients}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={facility.completion}
                              sx={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(76, 175, 80, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  bgcolor: facility.completion > 95 ? '#4caf50' : facility.completion > 90 ? '#ff9800' : '#f44336'
                                }
                              }}
                            />
                            <Typography variant="body2" fontWeight="bold">
                              {facility.completion}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={facility.rating} 
                            color={getRatingColor(facility.rating)} 
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