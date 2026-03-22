import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Stack, TextField, TablePagination, Grid,
  LinearProgress, MenuItem, CircularProgress, Alert
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import RouteIcon from '@mui/icons-material/Route';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import axios from 'axios';
import api from '../../../axiosInstance';

const ethiopianMonths = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

const getCurrentEthiopianMonth = () => {
  const gDate = new Date();
  const gy = gDate.getFullYear();
  const gm = gDate.getMonth();
  const gd = gDate.getDate();
  const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
  const newYearDay = isLeap ? 12 : 11;
  let ethYear, ethMonthIndex;
  if (gm > 8 || (gm === 8 && gd >= newYearDay)) {
    ethYear = gy - 7;
    const newYearDate = new Date(gy, 8, newYearDay);
    const diffDays = Math.floor((gDate - newYearDate) / (24 * 60 * 60 * 1000));
    ethMonthIndex = diffDays < 360 ? Math.floor(diffDays / 30) : 12;
  } else {
    ethYear = gy - 8;
    const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
    const prevNewYearDay = prevIsLeap ? 12 : 11;
    const prevNewYearDate = new Date(gy - 1, 8, prevNewYearDay);
    const diffDays = Math.floor((gDate - prevNewYearDate) / (24 * 60 * 60 * 1000));
    ethMonthIndex = diffDays < 360 ? Math.floor(diffDays / 30) : 12;
  }
  return { year: ethYear, monthIndex: Math.max(0, Math.min(ethMonthIndex, 12)) };
};

const RouteAnalysis = ({ branchCode = '' }) => {
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const initialEth = getCurrentEthiopianMonth();
  const [selectedMonth, setSelectedMonth] = useState(ethiopianMonths[initialEth.monthIndex]);
  const [selectedYear, setSelectedYear] = useState(initialEth.year);
  const [processType, setProcessType] = useState('regular');
  const [routeStats, setRouteStats] = useState([]);
  const [expectedFacilities, setExpectedFacilities] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchRouteStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { month: selectedMonth, year: selectedYear };
      if (processType) params.process_type = processType;
      if (branchCode) params.branch_code = branchCode;
      const response = await api.get(`${api_url}/api/hp-comprehensive-report`, { params });
      setRouteStats(response.data.routeStats || []);
      setExpectedFacilities(response.data.expectedFacilities || 0);
    } catch (err) {
      console.error('Error fetching route stats:', err);
      setError('Failed to load route data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteStats();
  }, [selectedMonth, selectedYear, processType, branchCode]);

  const filteredData = routeStats.filter(route =>
    (route.route_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const totalFacilities = routeStats.reduce((sum, r) => sum + parseInt(r.total_facilities_on_route || r.facilities_count || 0), 0);
  const totalKilometers = routeStats.reduce((sum, r) => sum + parseFloat(r.total_kilometers || 0), 0);

  const topRoutesByFacilities = [...routeStats]
    .sort((a, b) => parseInt(b.total_facilities_on_route || b.facilities_count) - parseInt(a.total_facilities_on_route || a.facilities_count))
    .slice(0, 10)
    .map(r => ({
      name: r.route_name,
      facilities: parseInt(r.total_facilities_on_route || r.facilities_count || 0),
      odns: parseInt(r.odns_count || 0)
    }));

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', borderLeft: 4, borderColor: color }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>{title}</Typography>
            <Typography variant="h3" fontWeight="bold" color={color}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Box sx={{ bgcolor: `${color}20`, p: 1.5, borderRadius: 2 }}>{icon}</Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // Build year options: current eth year ± 3
  const yearOptions = Array.from({ length: 7 }, (_, i) => initialEth.year - 3 + i);

  return (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              select label="Month" size="small" value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setPage(0); }}
              sx={{ minWidth: 140 }}
            >
              {ethiopianMonths.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
            <TextField
              select label="Year" size="small" value={selectedYear}
              onChange={e => { setSelectedYear(parseInt(e.target.value)); setPage(0); }}
              sx={{ minWidth: 100 }}
            >
              {yearOptions.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </TextField>
            <TextField
              select label="Process Type" size="small" value={processType}
              onChange={e => { setProcessType(e.target.value); setPage(0); }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="regular">HP Regular</MenuItem>
              <MenuItem value="vaccine">Vaccine</MenuItem>
            </TextField>
            <Chip
              label={`${selectedMonth} ${selectedYear}`}
              color="primary" variant="outlined" size="small"
            />
          </Stack>
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Total Facilities" value={totalFacilities} subtitle="Across all routes"
                icon={<AssignmentTurnedInIcon sx={{ fontSize: 40, color: '#4caf50' }} />} color="#4caf50"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Expected Facilities" value={expectedFacilities} subtitle="Should report this month"
                icon={<LocalHospitalIcon sx={{ fontSize: 40, color: '#ff9800' }} />} color="#ff9800"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Total Routes" value={routeStats.length} subtitle="Active routes"
                icon={<RouteIcon sx={{ fontSize: 40, color: '#2196f3' }} />} color="#2196f3"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Total Kilometers" value={totalKilometers.toFixed(1)} subtitle="Distance covered"
                icon={<SpeedIcon sx={{ fontSize: 40, color: '#9c27b0' }} />} color="#9c27b0"
              />
            </Grid>
          </Grid>

          {/* Detailed Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Route Details</Typography>
              <TextField
                placeholder="Search routes..." size="small" fullWidth
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                sx={{ mb: 2 }}
              />
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
                      <TableCell sx={{ fontWeight: 'bold' }}>Driver</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Deliverer</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Vehicle</TableCell>
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
                                <Typography variant="body2" fontWeight="medium">{route.route_name}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={route.total_facilities_on_route || route.facilities_count} size="small" color="primary" />
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={route.odns_count} size="small" color="info" />
                            </TableCell>
                            <TableCell align="center">
                              <Stack spacing={0.5}>
                                <Chip label={route.pod_confirmed_count} size="small" color="success" />
                                <LinearProgress
                                  variant="determinate" value={parseFloat(podPercentage)}
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={<SpeedIcon />}
                                label={`${parseFloat(route.total_kilometers || 0).toFixed(1)} km`}
                                size="small" variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{route.driver_name || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{route.deliverer_name || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{route.vehicle_name || '—'}</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            No routes found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div" count={filteredData.length} page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </CardContent>
          </Card>

          {/* Top 10 Routes by Facilities Chart */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top 10 Routes by Facilities</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topRoutesByFacilities}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="facilities" fill="#4caf50" name="Facilities" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default RouteAnalysis;
