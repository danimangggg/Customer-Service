import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Stack, LinearProgress, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Button,
  TablePagination, TableSortLabel, IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import axios from 'axios';
import api from '../../../axiosInstance';

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

const ReportOverview = ({ branchCode = '' }) => {
  const initialEth = getCurrentEthiopianMonth();
  const ethYears = Array.from({ length: 6 }, (_, i) => initialEth.year - 2 + i);

  const [selectedMonth, setSelectedMonth] = useState(ethiopianMonths[initialEth.monthIndex]);
  const [selectedYear, setSelectedYear] = useState(initialEth.year);
  const [processType, setProcessType] = useState('regular');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Table state
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [facilitySearch, setFacilitySearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('facility_name');
  const [sortOrder, setSortOrder] = useState('ASC');

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const fetchData = useCallback(async () => {    try {
      setLoading(true);
      const response = await api.get(`${api_url}/api/hp-comprehensive-report`, {
        params: { month: selectedMonth, year: selectedYear, process_type: processType, ...(branchCode ? { branch_code: branchCode } : {}) }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching RRF overview:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, processType, branchCode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!data) return loading ? <LinearProgress /> : null;

  const { summary, rrfSentFacilities, rrfNotSentFacilities, notProcessedFacilities } = data;

  const allFacilities = [
    ...(rrfSentFacilities || []).map(f => ({ ...f, rrfStatus: 'sent' })),
    ...(rrfNotSentFacilities || []).map(f => ({ ...f, rrfStatus: 'not_sent' })),
    ...(notProcessedFacilities || []).map(f => ({ ...f, rrfStatus: 'not_processed' }))
  ];

  const filteredFacilities = allFacilities
    .filter(f => {
      const matchesSearch =
        f.facility_name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
        (f.route || '').toLowerCase().includes(facilitySearch.toLowerCase()) ||
        (f.region_name || '').toLowerCase().includes(facilitySearch.toLowerCase());
      const matchesFilter = facilityFilter === 'all' ||
        (facilityFilter === 'sent' && f.rrfStatus === 'sent') ||
        (facilityFilter === 'not_sent' && f.rrfStatus === 'not_sent') ||
        (facilityFilter === 'not_processed' && f.rrfStatus === 'not_processed');
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aVal = (a[sortBy] || '').toString().toLowerCase();
      const bVal = (b[sortBy] || '').toString().toLowerCase();
      return sortOrder === 'ASC' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const paginatedFacilities = filteredFacilities.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (col) => {
    const isAsc = sortBy === col && sortOrder === 'ASC';
    setSortOrder(isAsc ? 'DESC' : 'ASC');
    setSortBy(col);
  };

  const handleExportToExcel = () => {
    const exportData = filteredFacilities.map((f, i) => ({
      '#': i + 1,
      'Facility Name': f.facility_name,
      'Route': f.route,
      'Region': f.region_name,
      'Zone': f.zone_name,
      'Woreda': f.woreda_name,
      'Status': f.rrfStatus === 'sent' ? 'Sent' : f.rrfStatus === 'not_sent' ? 'RRF Not Sent' : 'Not Processed'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RRF Facilities Status');
    XLSX.writeFile(wb, `RRF_Facilities_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const rrfPercentage = summary.expectedFacilities > 0
    ? ((summary.rrfSent / summary.expectedFacilities) * 100).toFixed(1) : 0;

  return (
    <Box>
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Expected Facilities', value: summary.expectedFacilities, color: '#2196f3', sub: `${selectedMonth} ${selectedYear}` },
          { title: `${processType === 'vaccine' ? 'VRF' : 'RRF'} Sent`, value: summary.rrfSent, color: '#4caf50', sub: `${rrfPercentage}% of expected` },
          { title: `${processType === 'vaccine' ? 'VRF' : 'RRF'} Not Sent`, value: summary.rrfNotSent, color: '#f44336', sub: `Processed, ${processType === 'vaccine' ? 'VRF' : 'RRF'} not sent` },
          { title: 'Not Processed', value: summary.notProcessed, color: '#ff9800', sub: 'No process started' },
        ].map(({ title, value, color, sub }) => (
          <Grid item xs={6} md={3} key={title}>
            <Card sx={{ borderLeft: 4, borderColor: color }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
                <Typography variant="h4" fontWeight="bold" color={color}>{value}</Typography>
                <Typography variant="caption" color="text.secondary">{sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Submission Progress</Typography>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2">{summary.rrfSent} of {summary.expectedFacilities} facilities submitted</Typography>
            <Typography variant="body2" fontWeight="bold">{rrfPercentage}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={parseFloat(rrfPercentage)} sx={{ height: 10, borderRadius: 5 }} />
        </CardContent>
      </Card>

      {/* Advanced Table Card */}
      <Card>
        {/* Single toolbar: Month, Year, RRF Status, Search, Export */}
        <Box sx={{ px: 2, pt: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Month</InputLabel>
              <Select value={selectedMonth} label="Month" onChange={e => { setSelectedMonth(e.target.value); setPage(0); }}>
                {ethiopianMonths.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <InputLabel>Year</InputLabel>
              <Select value={selectedYear} label="Year" onChange={e => { setSelectedYear(e.target.value); setPage(0); }}>
                {ethYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Type</InputLabel>
              <Select value={processType} label="Type" onChange={e => { setProcessType(e.target.value); setPage(0); }}>
                <MenuItem value="regular">HP Regular</MenuItem>
                <MenuItem value="vaccine">Vaccine</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select value={facilityFilter} label="Status" onChange={e => { setFacilityFilter(e.target.value); setPage(0); }}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="not_sent">RRF Not Sent</MenuItem>
                <MenuItem value="not_processed">Not Processed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search facilities..."
              value={facilitySearch}
              onChange={e => { setFacilitySearch(e.target.value); setPage(0); }}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                endAdornment: facilitySearch && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setFacilitySearch(''); setPage(0); }}><ClearIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="contained" color="success" startIcon={<DownloadIcon />} onClick={handleExportToExcel} disabled={filteredFacilities.length === 0}>
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
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white' }}>
                    <TableSortLabel active={sortBy === 'facility_name'} direction={sortBy === 'facility_name' ? sortOrder.toLowerCase() : 'asc'}
                      onClick={() => handleSort('facility_name')}
                      sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>
                      Facility Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white' }}>
                    <TableSortLabel active={sortBy === 'route'} direction={sortBy === 'route' ? sortOrder.toLowerCase() : 'asc'}
                      onClick={() => handleSort('route')}
                      sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}>
                      Route
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white' }}>Region</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white' }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1976d2 !important', color: 'white' }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedFacilities.length > 0 ? paginatedFacilities.map((f, index) => (
                  <TableRow key={`${f.id}-${index}`} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{f.facility_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{f.zone_name} • {f.woreda_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={f.route || 'N/A'} size="small" variant="outlined" color="primary" />
                    </TableCell>
                    <TableCell>{f.region_name}</TableCell>
                    <TableCell>{f.branch_name || f.branch_code || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={f.rrfStatus === 'sent' ? 'Sent' : f.rrfStatus === 'not_sent' ? 'RRF Not Sent' : 'Not Processed'}
                        size="small"
                        color={f.rrfStatus === 'sent' ? 'success' : f.rrfStatus === 'not_sent' ? 'error' : 'warning'}
                        icon={f.rrfStatus === 'sent' ? <CheckCircleIcon /> : <CancelIcon />}
                      />
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No facilities found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredFacilities.length}
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

export default ReportOverview;
