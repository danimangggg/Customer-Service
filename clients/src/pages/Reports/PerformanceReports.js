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
  Paper
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Timer,
  CheckCircle,
  Assignment,
  Person,
  Group
} from '@mui/icons-material';

const PerformanceReports = () => {
  // Sample performance data
  const performanceMetrics = [
    {
      title: 'Task Completion Rate',
      value: '94.2%',
      change: '+3.1%',
      trend: 'up',
      icon: <CheckCircle />,
      color: '#4caf50'
    },
    {
      title: 'Average Response Time',
      value: '2.4h',
      change: '-12%',
      trend: 'up',
      icon: <Timer />,
      color: '#2196f3'
    },
    {
      title: 'Process Efficiency',
      value: '87.5%',
      change: '+5.8%',
      trend: 'up',
      icon: <Speed />,
      color: '#ff9800'
    },
    {
      title: 'Team Productivity',
      value: '91.3%',
      change: '+2.4%',
      trend: 'up',
      icon: <Group />,
      color: '#9c27b0'
    }
  ];

  const teamPerformance = [
    { name: 'Customer Service Team', completed: 156, pending: 12, efficiency: 92.8 },
    { name: 'Health Program Team', completed: 89, pending: 8, efficiency: 91.7 },
    { name: 'Finance Team', completed: 67, pending: 5, efficiency: 93.1 },
    { name: 'Inventory Team', completed: 134, pending: 15, efficiency: 89.9 },
    { name: 'Quality Assurance', completed: 78, pending: 3, efficiency: 96.3 }
  ];

  const weeklyProgress = [
    { week: 'Week 1', target: 100, achieved: 95 },
    { week: 'Week 2', target: 100, achieved: 102 },
    { week: 'Week 3', target: 100, achieved: 98 },
    { week: 'Week 4', target: 100, achieved: 105 }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Performance Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track team performance, efficiency metrics, and productivity trends
        </Typography>
      </Box>

      {/* Performance Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {performanceMetrics.map((metric, index) => (
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
                      icon={<TrendingUp />}
                      label={metric.change}
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
        {/* Team Performance Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Assignment color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Team Performance Overview
                </Typography>
              </Stack>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)' }}>
                      <TableCell fontWeight="bold">Team</TableCell>
                      <TableCell align="center" fontWeight="bold">Completed</TableCell>
                      <TableCell align="center" fontWeight="bold">Pending</TableCell>
                      <TableCell align="center" fontWeight="bold">Efficiency</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamPerformance.map((team, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Person color="action" />
                            <Typography variant="body2" fontWeight="medium">
                              {team.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={team.completed} 
                            color="success" 
                            variant="outlined" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={team.pending} 
                            color="warning" 
                            variant="outlined" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={team.efficiency}
                              sx={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(25, 118, 210, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  bgcolor: team.efficiency > 90 ? '#4caf50' : '#ff9800'
                                }
                              }}
                            />
                            <Typography variant="body2" fontWeight="bold">
                              {team.efficiency}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Progress */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Speed color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Weekly Progress
                </Typography>
              </Stack>
              
              <Box sx={{ mt: 2 }}>
                {weeklyProgress.map((week, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {week.week}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {week.achieved}/{week.target}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(week.achieved / week.target) * 100}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          bgcolor: week.achieved >= week.target ? '#4caf50' : '#2196f3'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {((week.achieved / week.target) * 100).toFixed(1)}% of target
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PerformanceReports;