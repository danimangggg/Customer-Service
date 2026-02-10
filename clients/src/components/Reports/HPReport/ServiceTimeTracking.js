import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Card, CardContent,
  Grid, Chip, Stack, Divider, Alert, Tooltip
} from '@mui/material';
import {
  AccessTime, Person, TrendingUp, Speed
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ServiceTimeTracking = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServiceTimeData();
  }, []);

  const fetchServiceTimeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/service-time-tracking`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching service time data:', err);
      setError('Failed to load service time tracking data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '—';
    return new Date(dateTime).toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!data || !data.serviceTimeData) {
    return (
      <Alert severity="info">
        No service time tracking data available.
      </Alert>
    );
  }

  const { serviceTimeData, summary } = data;

  // Filter only HP records (records with routes)
  const hpRecords = serviceTimeData.filter(record => {
    return record.route && record.route.trim() !== '';
  });

  const renderServiceCell = (duration, officerName, startTime, completedTime, waitingTime) => {
    if (!duration && !officerName) {
      return (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">—</Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Chip 
          label={formatDuration(duration)} 
          size="small" 
          color={duration ? 'success' : 'default'}
          sx={{ mb: 0.5, fontWeight: 'bold' }}
        />
        {officerName && (
          <Tooltip title={`Started: ${formatDateTime(startTime)}\nCompleted: ${formatDateTime(completedTime)}`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {officerName}
              </Typography>
            </Box>
          </Tooltip>
        )}
        {waitingTime !== undefined && waitingTime !== null && (
          <Box sx={{ mt: 0.5 }}>
            <Chip 
              label={`Wait: ${formatDuration(waitingTime)}`}
              size="small"
              sx={{ 
                bgcolor: '#fff3e0', 
                color: '#e65100',
                fontSize: '0.65rem',
                height: 20,
                fontWeight: 600
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        HP Service Time Performance Summary
      </Typography>

      {/* Summary Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Speed sx={{ fontSize: 40, color: '#2196f3' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {hpRecords.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    HP Records
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#f3e5f5', borderLeft: '4px solid #9c27b0' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AccessTime sx={{ fontSize: 40, color: '#9c27b0' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatDuration(summary.averageDurations.total)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Total Time
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TrendingUp sx={{ fontSize: 40, color: '#4caf50' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatDuration(summary.averageDurations.o2c)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg O2C Time
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Person sx={{ fontSize: 40, color: '#ff9800' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatDuration(summary.averageDurations.ewm)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg EWM Time
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Average Duration by Service Unit */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Average Duration by Service Unit
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">O2C Officer</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatDuration(summary.averageDurations.o2c)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">EWM Officer</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatDuration(summary.averageDurations.ewm)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">PI Officer</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatDuration(summary.averageDurations.pi)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">Documentation</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatDuration(summary.averageDurations.documentation)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">Doc Followup</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatDuration(summary.averageDurations.docFollowup)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">Quality</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatDuration(summary.averageDurations.quality)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">Dispatcher</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatDuration(summary.averageDurations.dispatch)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">Dispatch-Doc</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatDuration(summary.averageDurations.dispatchDoc)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Detailed Service Time Table */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Detailed HP Service Time Records
      </Typography>

      {hpRecords.length === 0 ? (
        <Alert severity="info">
          No HP records found.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 150 }}>Facility</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>O2C Officer</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>EWM Officer</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>PI Officer</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>Documentation</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>Doc Followup</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>Quality</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>Dispatcher</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>Dispatch-Doc</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 100 }}>Total Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hpRecords.slice(0, 50).map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {record.facility_name || 'N/A'}
                      </Typography>
                      {record.route && (
                        <Chip 
                          label={record.route} 
                          size="small" 
                          sx={{ mt: 0.5, fontSize: '0.7rem' }}
                        />
                      )}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {record.customer_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {renderServiceCell(
                        record.o2c_duration_minutes,
                        record.o2c_officer_name,
                        record.o2c_started_at,
                        record.o2c_completed_at,
                        record.o2c_waiting_minutes
                      )}
                    </TableCell>
                    <TableCell>
                      {renderServiceCell(
                        record.ewm_duration_minutes,
                        record.ewm_officer_name,
                        record.ewm_started_at,
                        record.ewm_completed_at,
                        record.ewm_waiting_minutes
                      )}
                    </TableCell>
                    <TableCell>
                      {renderServiceCell(
                        record.pi_duration_minutes,
                        record.pi_officer_name,
                        record.pi_started_at,
                        record.pi_completed_at,
                        record.pi_waiting_minutes
                      )}
                    </TableCell>
                    <TableCell>
                      {renderServiceCell(
                        record.doc_duration_minutes,
                        record.doc_officer_name,
                        record.doc_started_at,
                        record.doc_completed_at,
                        record.doc_waiting_minutes
                      )}
                    </TableCell>
                    <TableCell>
                      {renderServiceCell(
                        record.doc_follow_duration_minutes,
                        record.doc_follow_officer_name,
                        record.doc_follow_started_at,
                        record.doc_follow_completed_at,
                        record.doc_follow_waiting_minutes
                      )}
                    </TableCell>
                    <TableCell>
                      {renderServiceCell(
                        record.quality_duration_minutes,
                        record.quality_officer_name,
                        record.quality_started_at,
                        record.quality_completed_at,
                        record.quality_waiting_minutes
                      )}
                    </TableCell>
                    <TableCell>
                      {renderServiceCell(
                        record.dispatch_duration_minutes,
                        record.dispatcher_name,
                        record.dispatch_started_at,
                        record.dispatch_completed_at,
                        record.dispatch_waiting_minutes
                      )}
                    </TableCell>
                    <TableCell>
                      {renderServiceCell(
                        record.dispatch_doc_duration_minutes,
                        record.dispatch_doc_officer_name,
                        record.dispatch_doc_started_at,
                        record.dispatch_doc_completed_at,
                        record.dispatch_doc_waiting_minutes
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={formatDuration(record.total_duration_minutes)} 
                        size="small" 
                        color="primary"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {hpRecords.length > 50 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Showing first 50 records out of {hpRecords.length} total records.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default ServiceTimeTracking;