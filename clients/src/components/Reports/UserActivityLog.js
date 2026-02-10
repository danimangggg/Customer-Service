import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Card, CardContent,
  Grid, Chip, Stack, Divider, Alert, Tooltip, Container, Avatar,
  TextField, InputAdornment
} from '@mui/material';
import {
  Person, AccessTime, TrendingUp, CheckCircle, Search, History
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const UserActivityLog = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/user-activity-log`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError('Failed to load user activity data');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '—';
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionColor = (action) => {
    if (action.includes('Started')) return 'info';
    if (action.includes('Completed')) return 'success';
    if (action.includes('Finalized')) return 'success';
    if (action.includes('Processed')) return 'warning';
    return 'default';
  };

  const getRoleColor = (role) => {
    const colors = {
      'O2C Officer': '#4caf50',
      'EWM Officer': '#ff9800',
      'PI Officer': '#2196f3',
      'Documentation Officer': '#9c27b0',
      'Documentation Follower': '#673ab7',
      'Quality Evaluator': '#00bcd4',
      'Dispatcher': '#ff5722',
      'Dispatch-Documentation': '#795548',
      'Gate Keeper': '#607d8b'
    };
    return colors[role] || '#757575';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!data || !data.activityLog) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="info">
          No activity data available.
        </Alert>
      </Container>
    );
  }

  const { activityLog, userStats } = data;

  // Filter activities
  const filteredActivities = activityLog.filter(activity => {
    const matchesSearch = 
      activity.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.facilityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.serviceUnit?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || activity.serviceUnit === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Get unique service units for filter
  const uniqueRoles = ['All', ...new Set(activityLog.map(a => a.serviceUnit))];

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <History sx={{ fontSize: 56, color: 'white' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold" color="white">
                User Activity Log
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Track all user actions and system activities
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* User Statistics */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        User Performance Summary
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {userStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              borderLeft: `4px solid ${getRoleColor(stat.service_unit)}`,
              height: '100%'
            }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {stat.service_unit}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" noWrap>
                    {stat.user_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.role}
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Tooltip title="Completed Tasks">
                      <Chip 
                        icon={<CheckCircle />}
                        label={stat.completed_tasks}
                        size="small"
                        color="success"
                      />
                    </Tooltip>
                    <Tooltip title="Pending Tasks">
                      <Chip 
                        icon={<AccessTime />}
                        label={stat.pending_tasks}
                        size="small"
                        color="warning"
                      />
                    </Tooltip>
                  </Stack>
                  {stat.avg_duration > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Avg: {Math.round(stat.avg_duration)} min
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Activity Log */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Recent Activity Log
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by user, facility, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Filter by Service Unit"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 180 }}>
                Timestamp
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 150 }}>
                User
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 150 }}>
                Service Unit
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 200 }}>
                Action
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 100 }}>
                Duration
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 100 }}>
                Process Type
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 200 }}>
                Facility
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 150 }}>
                Notes
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredActivities.slice(0, 100).map((activity, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2">
                        {formatDateTime(activity.timestamp)}
                      </Typography>
                      {activity.endTime && activity.endTime !== activity.timestamp && (
                        <Typography variant="caption" color="text.secondary">
                          to {formatDateTime(activity.endTime)}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: getRoleColor(activity.role) }}>
                      <Person sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {activity.userName || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.role}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={activity.serviceUnit}
                    size="small"
                    sx={{ 
                      bgcolor: getRoleColor(activity.serviceUnit),
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.7rem'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={activity.action}
                    size="small"
                    color={getActionColor(activity.action)}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  {activity.duration > 0 ? (
                    <Chip 
                      label={`${activity.duration} min`}
                      size="small"
                      color="info"
                      icon={<AccessTime />}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={activity.processType}
                    size="small"
                    color={activity.processType === 'HP' ? 'success' : 'primary'}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {activity.facilityName || 'N/A'}
                  </Typography>
                  {activity.route && (
                    <Chip 
                      label={activity.route}
                      size="small"
                      sx={{ mt: 0.5, fontSize: '0.65rem' }}
                    />
                  )}
                  {activity.customerType && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {activity.customerType}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {activity.notes && (
                    <Tooltip title={activity.notes}>
                      <Typography variant="caption" noWrap sx={{ maxWidth: 150, display: 'block' }}>
                        {activity.notes}
                      </Typography>
                    </Tooltip>
                  )}
                  {activity.updatedBy && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Updated by: {activity.updatedBy}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredActivities.length > 100 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Showing first 100 activities out of {filteredActivities.length} total activities.
        </Alert>
      )}

      {filteredActivities.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No activities match your search criteria.
        </Alert>
      )}
    </Container>
  );
};

export default UserActivityLog;
