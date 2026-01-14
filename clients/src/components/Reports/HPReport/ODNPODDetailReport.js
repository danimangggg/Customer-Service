import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Stack, TextField, TablePagination, Grid,
  MenuItem, Button, LinearProgress, Avatar, Divider, Alert
} from '@mui/material';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import RouteIcon from '@mui/icons-material/Route';
import BusinessIcon from '@mui/icons-material/Business';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ODNPODDetailReport = () => {
  const [loading, setLoading] = useState(false);
  const [odnData, setOdnData] = useState([]);
  const [routes, setRoutes] = useState(['All']);
  const [facilities, setFacilities] = useState([]);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('All');
  const [selectedFacility, setSelectedFacility] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
    
    ethMonthIndex = Math.max(0, Math.min(ethMonthIndex, 12));
    return { year: ethYear, monthIndex: ethMonthIndex };
  };

  const initialEth = getCurrentEthiopianMonth();

  useEffect(() => {
    setSelectedMonth(ethiopianMonths[initialEth.monthIndex]);
    setSelectedYear(initialEth.year.toString());
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear && selectedMonth !== 'All' && selectedYear !== 'All') {
      fetchODNData();
      fetchRoutes();
    } else if (selectedMonth === 'All' || selectedYear === 'All') {
      // Fetch all data without month/year filter
      fetchAllODNData();
      fetchRoutes();
    }
  }, [selectedMonth, selectedYear]);

  const fetchAllODNData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api_url}/api/hp-odn-pod-details-all`);
      setOdnData(response.data.odnDetails || []);
      
      // Extract unique facilities
      const uniqueFacilities = ['All', ...new Set(response.data.odnDetails.map(odn => odn.facility_name))];
      setFacilities(uniqueFacilities);
    } catch (err) {
      console.error('Error fetching all ODN data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchODNData = async () => {
    try {
      setLoading(true);
      const reportingMonth = `${selectedMonth} ${selectedYear}`;
      const response = await axios.get(`${api_url}/api/hp-odn-pod-details`, {
        params: { reporting_month: reportingMonth }
      });
      setOdnData(response.data.odnDetails || []);
      
      // Extract unique facilities
      const uniqueFacilities = ['All', ...new Set(response.data.odnDetails.map(odn => odn.facility_name))];
      setFacilities(uniqueFacilities);
    } catch (err) {
      console.error('Error fetching ODN data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${api_url}/api/routes`);
      const routeNames = ['All', ...response.data.map(r => r.route_name)];
      setRoutes(routeNames);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  // Filter data
  const filteredData = odnData.filter(odn => {
    const matchesRoute = selectedRoute === 'All' || odn.route === selectedRoute;
    const matchesFacility = selectedFacility === 'All' || odn.facility_name === selectedFacility;
    
    const matchesStatus = selectedStatus === 'All' || 
      (selectedStatus === 'POD Confirmed' && odn.pod_confirmed === 1) ||
      (selectedStatus === 'POD Pending' && odn.pod_confirmed !== 1);
    
    const matchesSearch = 
      (odn.odn_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (odn.pod_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (odn.facility_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRoute && matchesFacility && matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalODNs = odnData.length;
  const podConfirmedODNs = odnData.filter(odn => odn.pod_confirmed === 1).length;
  
  const overallPodRate = totalODNs > 0 ? ((podConfirmedODNs / totalODNs) * 100).toFixed(1) : 0;

  const StatCard = ({ title, value, subtitle, icon, color, progress }) => (
    <Card sx={{ height: '100%', borderLeft: 4, borderColor: color }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
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
            {progress !== undefined && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(progress)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>
          <Box sx={{ bgcolor: `${color}20`, p: 1.5, borderRadius: 2 }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Export to Excel function
  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredData.map((odn, index) => ({
      '#': index + 1,
      'ODN Number': odn.odn_number,
      'Facility': odn.facility_name,
      'Route': odn.route || 'N/A',
      'POD Number': odn.pod_number || '-',
      'POD Status': odn.pod_confirmed === 1 ? 'Confirmed' : 'Pending',
      'Region': odn.region_name || 'N/A',
      'Zone': odn.zone_name || 'N/A',
      'Woreda': odn.woreda_name || 'N/A'
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ODN POD Report');
    
    // Generate filename with date
    const filename = `ODN_POD_Report_${selectedMonth}_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            ODN & POD Detailed Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track ODN dispatch and POD confirmation status
          </Typography>
        </Box>
      </Stack>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total ODNs Printed"
            value={totalODNs}
            subtitle="All ODNs generated"
            icon={<AssignmentTurnedInIcon sx={{ fontSize: 40, color: '#2196f3' }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="POD Received"
            value={podConfirmedODNs}
            subtitle={`${overallPodRate}% of total ODNs`}
            icon={<CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />}
            color="#4caf50"
            progress={overallPodRate}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="POD Pending"
            value={totalODNs - podConfirmedODNs}
            subtitle={`${(100 - parseFloat(overallPodRate)).toFixed(1)}% pending`}
            icon={<CancelIcon sx={{ fontSize: 40, color: '#f44336' }} />}
            color="#f44336"
          />
        </Grid>
      </Grid>

      {/* Conversion Funnel Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold">
          POD Receipt Rate: {podConfirmedODNs} POD Received out of {totalODNs} ODNs Printed ({overallPodRate}% completion)
        </Typography>
      </Alert>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <FilterListIcon color="primary" />
            <Typography variant="h6">Filters</Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="Month"
                size="small"
                fullWidth
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <MenuItem value="All">All Months</MenuItem>
                {ethiopianMonths.map(month => (
                  <MenuItem key={month} value={month}>{month}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="Year"
                size="small"
                fullWidth
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value="All">All Years</MenuItem>
                {Array.from({ length: 10 }, (_, i) => initialEth.year - 5 + i).map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="Route"
                size="small"
                fullWidth
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
              >
                {routes.map(route => (
                  <MenuItem key={route} value={route}>{route}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="Facility"
                size="small"
                fullWidth
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
              >
                {facilities.map(facility => (
                  <MenuItem key={facility} value={facility}>{facility}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="Status"
                size="small"
                fullWidth
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="POD Confirmed">POD Confirmed</MenuItem>
                <MenuItem value="POD Pending">POD Pending</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                placeholder="Search ODN/POD..."
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* ODN/POD Table */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              ODN & POD Details ({filteredData.length} records)
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleExportToExcel}
            >
              Export to Excel
            </Button>
          </Stack>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ODN Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Facility</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>POD Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>POD Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((odn, index) => (
                    <TableRow key={odn.id} hover>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <Chip label={odn.odn_number} size="small" color="info" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <BusinessIcon fontSize="small" color="action" />
                          <Typography variant="body2">{odn.facility_name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<RouteIcon />}
                          label={odn.route || 'N/A'}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {odn.pod_number ? (
                          <Chip label={odn.pod_number} size="small" color="success" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={odn.pod_confirmed === 1 ? 'Confirmed' : 'Pending'}
                          size="small"
                          color={odn.pod_confirmed === 1 ? 'success' : 'default'}
                          icon={odn.pod_confirmed === 1 ? <CheckCircleIcon /> : <CancelIcon />}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No ODN records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default ODNPODDetailReport;
