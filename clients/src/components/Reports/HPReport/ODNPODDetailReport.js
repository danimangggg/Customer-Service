import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Stack, TextField, TablePagination, Grid,
  MenuItem, Button, LinearProgress, InputAdornment, IconButton, FormControl,
  InputLabel, Select
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RouteIcon from '@mui/icons-material/Route';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ethiopianMonths = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

const getCurrentEthiopianMonth = () => {
  const gDate = new Date();
  const gy = gDate.getFullYear(), gm = gDate.getMonth(), gd = gDate.getDate();
  const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
  const newYearDay = isLeap ? 12 : 11;
  let ethYear, ethMonthIndex;
  if (gm > 8 || (gm === 8 && gd >= newYearDay)) {
    ethYear = gy - 7;
    const diffDays = Math.floor((gDate - new Date(gy, 8, newYearDay)) / 86400000);
    ethMonthIndex = diffDays < 360 ? Math.floor(diffDays / 30) : 12;
  } else {
    ethYear = gy - 8;
    const prevIsLeap = ((gy-1)%4===0&&(gy-1)%100!==0)||((gy-1)%400===0);
    const diffDays = Math.floor((gDate - new Date(gy-1, 8, prevIsLeap?12:11)) / 86400000);
    ethMonthIndex = diffDays < 360 ? Math.floor(diffDays / 30) : 12;
  }
  return { year: ethYear, monthIndex: Math.max(0, Math.min(ethMonthIndex, 12)) };
};

const groupByFacility = (odnData) => {
  const map = {};
  odnData.forEach(odn => {
    const key = odn.facility_name;
    if (!map[key]) {
      map[key] = { facility_name: odn.facility_name, route: odn.route || 'N/A', odns: [], pods: [], confirmed_count: 0, total_pods: 0 };
    }
    if (odn.odn_number) map[key].odns.push(odn.odn_number);
    if (odn.pod_number) {
      const podList = odn.pod_number.split(',').map(p => p.trim()).filter(Boolean);
      map[key].pods.push(...podList);
      map[key].total_pods += podList.length;
      if (odn.pod_confirmed == 1) map[key].confirmed_count += podList.length;
    }
  });
  return Object.values(map);
};

const getPODStatus = (confirmed, total) => {
  if (total === 0) return { label: 'Not Confirmed', color: 'error' };
  if (confirmed === total) return { label: 'All Confirmed', color: 'success' };
  if (confirmed === 0) return { label: 'Not Confirmed', color: 'error' };
  return { label: 'Partially Confirmed', color: 'warning' };
};

const ODNPODDetailReport = () => {
  const [loading, setLoading] = useState(false);
  const [odnData, setOdnData] = useState([]);
  const [routes, setRoutes] = useState(['All']);

  const initialEth = getCurrentEthiopianMonth();
  const [selectedMonth, setSelectedMonth] = useState(ethiopianMonths[initialEth.monthIndex]);
  const [selectedYear, setSelectedYear] = useState(initialEth.year.toString());
  const [selectedRoute, setSelectedRoute] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [processType, setProcessType] = useState('regular');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchODNData();
    fetchRoutes();
  }, [selectedMonth, selectedYear, processType]);

  const fetchAllODNData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api_url}/api/hp-odn-pod-details-all`);
      setOdnData(response.data.odnDetails || []);
    } catch (err) {
      console.error('Error fetching all ODN data:', err);
    } finally { setLoading(false); }
  };

  const fetchODNData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api_url}/api/hp-odn-pod-details`, {
        params: { reporting_month: `${selectedMonth} ${selectedYear}`, process_type: processType }
      });
      setOdnData(response.data.odnDetails || []);
    } catch (err) {
      console.error('Error fetching ODN data:', err);
    } finally { setLoading(false); }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${api_url}/api/routes`);
      setRoutes(['All', ...response.data.map(r => r.route_name)]);
    } catch (err) { console.error('Error fetching routes:', err); }
  };

  const facilityRows = groupByFacility(odnData);

  const filteredData = facilityRows.filter(row => {
    const matchesRoute = selectedRoute === 'All' || row.route === selectedRoute;
    const { label } = getPODStatus(row.confirmed_count, row.total_pods);
    const matchesStatus = selectedStatus === 'All' || label === selectedStatus;
    const matchesSearch =
      row.facility_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.odns.some(o => o.toLowerCase().includes(searchTerm.toLowerCase())) ||
      row.pods.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRoute && matchesStatus && matchesSearch;
  });

  const totalODNs = odnData.length;
  const totalPODs = facilityRows.reduce((sum, r) => sum + r.total_pods, 0);
  const allConfirmedCount = facilityRows.filter(r => getPODStatus(r.confirmed_count, r.total_pods).label === 'All Confirmed').length;
  const partiallyConfirmedCount = facilityRows.filter(r => getPODStatus(r.confirmed_count, r.total_pods).label === 'Partially Confirmed').length;
  const notConfirmedCount = facilityRows.filter(r => getPODStatus(r.confirmed_count, r.total_pods).label === 'Not Confirmed').length;

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleExportToExcel = () => {
    const exportData = filteredData.map((row, index) => {
      const { label } = getPODStatus(row.confirmed_count, row.total_pods);
      return { '#': index + 1, 'Facility': row.facility_name, 'Route': row.route, 'ODNs': row.odns.join(', '), 'PODs': row.pods.join(', ') || '-', 'POD Status': label, 'Confirmed PODs': row.confirmed_count, 'Total PODs': row.total_pods };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ODN POD Report');
    XLSX.writeFile(wb, `ODN_POD_Report_${selectedMonth}_${selectedYear}.xlsx`);
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AssignmentTurnedInIcon sx={{ fontSize: 56, color: 'white' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold" color="white">
                ODN & POD Detail Report
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Health Program - ODN Dispatch & POD Confirmation
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total ODNs', value: totalODNs, color: '#2196f3' },
          { label: 'Total PODs', value: totalPODs, color: '#9c27b0' },
          { label: 'All Confirmed', value: allConfirmedCount, color: '#4caf50', sub: 'facilities' },
          { label: 'Partially Confirmed', value: partiallyConfirmedCount, color: '#ff9800', sub: 'facilities' },
          { label: 'Not Confirmed', value: notConfirmedCount, color: '#f44336', sub: 'facilities' },
        ].map(({ label, value, color, sub }) => (
          <Grid item xs={6} sm={4} md key={label}>
            <Card sx={{ borderLeft: 4, borderColor: color }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
                <Typography variant="h4" fontWeight="bold" color={color}>{value}</Typography>
                {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Advanced Table Card */}
      <Card>
        {/* Inline Toolbar */}
        <Box sx={{ px: 2, pt: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={1}>
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Month</InputLabel>
              <Select value={selectedMonth} label="Month" onChange={e => { setSelectedMonth(e.target.value); setPage(0); }}>
                <MenuItem value="All">All</MenuItem>
                {ethiopianMonths.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 85 }}>
              <InputLabel>Year</InputLabel>
              <Select value={selectedYear} label="Year" onChange={e => { setSelectedYear(e.target.value); setPage(0); }}>
                <MenuItem value="All">All</MenuItem>
                {Array.from({ length: 10 }, (_, i) => initialEth.year - 5 + i).map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select value={processType} label="Type" onChange={e => { setProcessType(e.target.value); setPage(0); }}>
                <MenuItem value="regular">HP Regular</MenuItem>
                <MenuItem value="vaccine">Vaccine</MenuItem>
                <MenuItem value="breakdown">Breakdown</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Route</InputLabel>
              <Select value={selectedRoute} label="Route" onChange={e => { setSelectedRoute(e.target.value); setPage(0); }}>
                {routes.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>POD Status</InputLabel>
              <Select value={selectedStatus} label="POD Status" onChange={e => { setSelectedStatus(e.target.value); setPage(0); }}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="All Confirmed">All Confirmed</MenuItem>
                <MenuItem value="Partially Confirmed">Partially Confirmed</MenuItem>
                <MenuItem value="Not Confirmed">Not Confirmed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search facility / ODN / POD..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
              sx={{ minWidth: 220 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearchTerm(''); setPage(0); }}><ClearIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="contained" color="success" startIcon={<DownloadIcon />} onClick={handleExportToExcel} disabled={filteredData.length === 0}>
              Export
            </Button>
          </Stack>
        </Box>

        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ border: 0 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white', width: 50 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white' }}>Facility Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white' }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white' }}>ODNs</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white' }}>PODs</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white' }}>POD Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? paginatedData.map((row, index) => {
                  const { label, color } = getPODStatus(row.confirmed_count, row.total_pods);
                  return (
                    <TableRow key={row.facility_name} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight="bold">{row.facility_name}</Typography></TableCell>
                      <TableCell>
                        <Chip icon={<RouteIcon />} label={row.route} size="small" color="secondary" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {row.odns.length > 0
                            ? row.odns.map(o => <Chip key={o} label={o} size="small" color="info" variant="outlined" />)
                            : <Typography variant="caption" color="text.secondary">—</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {row.pods.length > 0
                            ? row.pods.map(p => <Chip key={p} label={p} size="small" color="success" variant="outlined" />)
                            : <Typography variant="caption" color="text.secondary">—</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={label}
                          size="small"
                          color={color}
                          icon={label === 'All Confirmed' ? <CheckCircleIcon /> : label === 'Not Confirmed' ? <CancelIcon /> : undefined}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          {row.confirmed_count}/{row.total_pods} PODs confirmed
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No records found</Typography>
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
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            showFirstButton
            showLastButton
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default ODNPODDetailReport;
