import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Stack, TextField, TablePagination, Grid, Avatar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SpeedIcon from '@mui/icons-material/Speed';
import RouteIcon from '@mui/icons-material/Route';

const PODTracking = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!data || !data.podDetails) return null;

  const { podDetails, summary } = data;

  const filteredData = podDetails.filter(pod =>
    (pod.odn_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pod.facility_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pod.route || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pod.pod_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calculate statistics
  const totalKilometers = podDetails.reduce((sum, pod) => sum + parseFloat(pod.arrival_kilometer || 0), 0);
  const avgKilometers = podDetails.length > 0 ? (totalKilometers / podDetails.length).toFixed(1) : 0;
  const podPercentage = summary.totalODNs > 0
    ? ((summary.podConfirmed / summary.totalODNs) * 100).toFixed(1)
    : 0;

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', borderLeft: 4, borderColor: color }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ bgcolor: `${color}20`, p: 1.5, borderRadius: 2 }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total ODNs"
            value={summary.totalODNs}
            subtitle="Generated this period"
            icon={<AssignmentTurnedInIcon sx={{ fontSize: 40, color: '#2196f3' }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Dispatched"
            value={summary.dispatchedODNs}
            subtitle={`${((summary.dispatchedODNs / summary.totalODNs) * 100).toFixed(1)}% of total`}
            icon={<LocalShippingIcon sx={{ fontSize: 40, color: '#ff9800' }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="POD Confirmed"
            value={summary.podConfirmed}
            subtitle={`${podPercentage}% completion rate`}
            icon={<CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Distance"
            value={`${totalKilometers.toFixed(1)} km`}
            subtitle={`Avg: ${avgKilometers} km/delivery`}
            icon={<SpeedIcon sx={{ fontSize: 40, color: '#9c27b0' }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* POD Details Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>POD Confirmation Details</Typography>
          
          {/* Search */}
          <TextField
            placeholder="Search ODN, facility, route, or POD number..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ODN Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Facility Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>POD Number</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Kilometers</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Dispatch Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Confirmed At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((pod, index) => (
                    <TableRow key={pod.odn_id} hover>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <Chip
                          label={pod.odn_number}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {pod.facility_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<RouteIcon />}
                          label={pod.route || 'N/A'}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pod.pod_number || 'N/A'}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<SpeedIcon />}
                          label={`${parseFloat(pod.arrival_kilometer || 0).toFixed(1)} km`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pod.dispatch_status || 'N/A'}
                          size="small"
                          color={
                            pod.dispatch_status === 'completed' ? 'success' :
                            pod.dispatch_status === 'in_progress' ? 'warning' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {pod.pod_confirmed_at
                            ? new Date(pod.pod_confirmed_at).toLocaleString()
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No POD confirmations found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* Summary by Route */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>POD Summary by Route</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>POD Count</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total Kilometers</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Avg Kilometers</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(
                  podDetails.reduce((acc, pod) => {
                    const route = pod.route || 'Unknown';
                    if (!acc[route]) {
                      acc[route] = { count: 0, totalKm: 0 };
                    }
                    acc[route].count += 1;
                    acc[route].totalKm += parseFloat(pod.arrival_kilometer || 0);
                    return acc;
                  }, {})
                ).map(([route, stats]) => (
                  <TableRow key={route} hover>
                    <TableCell>
                      <Chip
                        icon={<RouteIcon />}
                        label={route}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={stats.count} size="small" color="success" />
                    </TableCell>
                    <TableCell align="center">
                      {stats.totalKm.toFixed(1)} km
                    </TableCell>
                    <TableCell align="center">
                      {(stats.totalKm / stats.count).toFixed(1)} km
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PODTracking;
