import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Stack, TextField, TablePagination, Grid,
  LinearProgress, Avatar
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import RouteIcon from '@mui/icons-material/Route';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SpeedIcon from '@mui/icons-material/Speed';

const RouteAnalysis = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!data || !data.routeStats) return null;

  const { routeStats } = data;

  const filteredData = routeStats.filter(route =>
    (route.route_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Calculate totals
  const totalFacilities = routeStats.reduce((sum, r) => sum + parseInt(r.facilities_count || 0), 0);
  const totalODNs = routeStats.reduce((sum, r) => sum + parseInt(r.odns_count || 0), 0);
  const totalPOD = routeStats.reduce((sum, r) => sum + parseInt(r.pod_confirmed_count || 0), 0);
  const totalKilometers = routeStats.reduce((sum, r) => sum + parseFloat(r.total_kilometers || 0), 0);

  // Chart data - Top 10 routes by facilities
  const topRoutesByFacilities = [...routeStats]
    .sort((a, b) => parseInt(b.facilities_count) - parseInt(a.facilities_count))
    .slice(0, 10)
    .map(r => ({
      name: r.route_name,
      facilities: parseInt(r.facilities_count || 0),
      odns: parseInt(r.odns_count || 0)
    }));

  // Chart data - Top 10 routes by kilometers
  const topRoutesByKm = [...routeStats]
    .filter(r => r.total_kilometers > 0)
    .sort((a, b) => parseFloat(b.total_kilometers) - parseFloat(a.total_kilometers))
    .slice(0, 10)
    .map(r => ({
      name: r.route_name,
      kilometers: parseFloat(r.total_kilometers || 0)
    }));

  // Dispatch status distribution - removed since we're removing dispatch status
  const dispatchStatusData = [];

  const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0'];

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
            title="Total Routes"
            value={routeStats.length}
            subtitle="Active routes"
            icon={<RouteIcon sx={{ fontSize: 40, color: '#2196f3' }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Facilities"
            value={totalFacilities}
            subtitle="Across all routes"
            icon={<AssignmentTurnedInIcon sx={{ fontSize: 40, color: '#4caf50' }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total ODNs"
            value={totalODNs}
            subtitle={`${totalPOD} POD confirmed`}
            icon={<LocalShippingIcon sx={{ fontSize: 40, color: '#ff9800' }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Kilometers"
            value={totalKilometers.toFixed(1)}
            subtitle="Distance covered"
            icon={<SpeedIcon sx={{ fontSize: 40, color: '#9c27b0' }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top Routes by Facilities */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top 10 Routes by Facilities & ODNs</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topRoutesByFacilities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="facilities" fill="#4caf50" name="Facilities" />
                  <Bar dataKey="odns" fill="#2196f3" name="ODNs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Assignment Status Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Route Assignment Status</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                <Typography variant="body2" color="text.secondary">
                  Assignment tracking available in route details table
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Routes by Kilometers */}
        {topRoutesByKm.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top 10 Routes by Distance (Kilometers)</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topRoutesByKm} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="kilometers" fill="#9c27b0" name="Kilometers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Detailed Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Route Details</Typography>
          
          {/* Search */}
          <TextField
            placeholder="Search routes..."
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Route Name</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Facilities</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>ODNs</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>POD Confirmed</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Kilometers</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Assigned By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((route, index) => {
                    const podPercentage = route.odns_count > 0
                      ? ((route.pod_confirmed_count / route.odns_count) * 100).toFixed(0)
                      : 0;
                    
                    return (
                      <TableRow key={route.route_id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <RouteIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight="medium">
                              {route.route_name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={route.facilities_count} size="small" color="primary" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={route.odns_count} size="small" color="info" />
                        </TableCell>
                        <TableCell align="center">
                          <Stack spacing={0.5}>
                            <Chip label={route.pod_confirmed_count} size="small" color="success" />
                            <LinearProgress
                              variant="determinate"
                              value={parseFloat(podPercentage)}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={<SpeedIcon />}
                            label={`${parseFloat(route.total_kilometers || 0).toFixed(1)} km`}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {route.assigned_by_name || 'Not Assigned'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No routes found
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
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default RouteAnalysis;
