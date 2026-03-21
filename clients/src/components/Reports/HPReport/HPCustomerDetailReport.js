import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../../../axiosInstance';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Card, CardContent,
  Grid, Chip, Alert, Stack, Container,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, TablePagination, TableSortLabel, IconButton,
  InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Search, GetApp, Clear, Business
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const formatDuration = (mins) => {
  if (mins == null || mins === 0) return '—';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) { const h = Math.floor(mins/60), m = mins%60; return m > 0 ? `${h}h ${m}m` : `${h}h`; }
  const d = Math.floor(mins/1440), rem = mins%1440, h = Math.floor(rem/60);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
};

const ethiopianMonths = [
  'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit',
  'Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
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

const HPCustomerDetailReport = () => {
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [customerServiceDetails, setCustomerServiceDetails] = useState([]);
  
  // Pagination, search, and sort states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [statusFilter, setStatusFilter] = useState('');
  const [processType, setProcessType] = useState('regular');

  // Ethiopian month/year filter — default to current
  const _eth = getCurrentEthiopianMonth();
  const [selectedMonth, setSelectedMonth] = useState(ethiopianMonths[_eth.monthIndex]);
  const [selectedYear, setSelectedYear] = useState(_eth.year);
  const ethYears = Array.from({ length: 6 }, (_, i) => _eth.year - 2 + i);

  const fetchHPCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      setError(null);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        sortBy,
        sortOrder,
        statusFilter,
        process_type: processType,
        month: selectedMonth,
        year: selectedYear
      };
      const response = await api.get(`${API_URL}/api/hp-customers-detail-report`, { params });
      if (response.data.success && response.data.customers) {
        setCustomers(response.data.customers);
        setTotalCount(response.data.pagination?.total || 0);
      } else {
        setError('Invalid response format from server');
        setCustomers([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.statusText || err.message || 'Unknown error';
      setError(`Failed to load HP customers: ${errorMessage}`);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, sortBy, sortOrder, statusFilter, processType, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchHPCustomers();
  }, [fetchHPCustomers]);

  const handleSort = (column) => {
    const isAsc = sortBy === column && sortOrder === 'ASC';
    setSortOrder(isAsc ? 'DESC' : 'ASC');
    setSortBy(column);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPage(0);
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToExcel = () => {
    try {
      const exportData = customers.map(customer => ({
        'Process ID': customer.id,
        'Facility Name': customer.facility_name || 'N/A',
        'Region': customer.region_name || 'N/A',
        'Zone': customer.zone_name || 'N/A',
        'Woreda': customer.woreda_name || 'N/A',
        'Status': customer.process_status || customer.status || 'Unknown',
        'Service Point': customer.service_point || 'N/A',
        'Reporting Month': customer.reporting_month || 'N/A',
        'Registration Status': customer.registration_status || 'Not Started',
        'O2C Status': customer.o2c_status || 'Not Started',
        'EWM Status': customer.ewm_status || 'Not Started',
        'Dispatch Status': customer.dispatch_status || 'Not Started',
        'Created At': new Date(customer.created_at).toLocaleString()
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'HP Customer Report');
      
      const fileName = `HP_Customer_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export data');
    }
  };

  const fetchCustomerServiceDetails = async (customerId) => {
    try {
      const response = await api.get(`${API_URL}/api/hp-customers/${customerId}/service-details`);
      const serviceDetails = response.data.serviceDetails || [];
      setCustomerServiceDetails(serviceDetails);
      
      // Calculate total time (sum of all waiting_minutes)
      const totalMinutes = serviceDetails.reduce((sum, service) => sum + (service.waiting_minutes || 0), 0);
      setSelectedCustomer(prev => ({
        ...prev,
        total_time_minutes: totalMinutes
      }));
    } catch (err) {
      console.error('Error fetching HP customer service details:', err);
      setCustomerServiceDetails([]);
    }
  };

  const handleCustomerDetailOpen = (customer) => {
    setSelectedCustomer(customer);
    setCustomerDetailOpen(true);
    fetchCustomerServiceDetails(customer.id);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Business sx={{ fontSize: 56, color: 'white' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold" color="white">
                HP Customer Detail Report
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Health Program - Customer Detail Report
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        {/* Inline Table Toolbar */}
        <Box sx={{ px: 2, pt: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={1}>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Month</InputLabel>
              <Select value={selectedMonth} label="Month" onChange={e => { setSelectedMonth(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {ethiopianMonths.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <InputLabel>Year</InputLabel>
              <Select value={selectedYear} label="Year" onChange={e => { setSelectedYear(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {ethYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Type</InputLabel>
              <Select value={processType} label="Type" onChange={e => { setProcessType(e.target.value); setPage(0); }}>
                <MenuItem value="regular">HP Regular</MenuItem>
                <MenuItem value="vaccine">Vaccine</MenuItem>
                <MenuItem value="breakdown">Breakdown</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={handleStatusFilterChange}>
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="in_progress">At O2C</MenuItem>
                <MenuItem value="o2c_completed">At EWM</MenuItem>
                <MenuItem value="ewm_completed">At TM Manager</MenuItem>
                <MenuItem value="tm_confirmed">At EWM Goods Issue</MenuItem>
                <MenuItem value="ewm_goods_issued">At Biller</MenuItem>
                <MenuItem value="biller_completed">At PI Officer</MenuItem>
                <MenuItem value="vehicle_requested">At Dispatch (Requested)</MenuItem>
                <MenuItem value="vehicle_assigned">At Dispatch (Assigned)</MenuItem>
                <MenuItem value="dispatched">At Documentation</MenuItem>
                <MenuItem value="dispatch_completed">Dispatch Completed</MenuItem>
                <MenuItem value="documentation_completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ minWidth: 180 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} size="small"><Clear fontSize="small" /></IconButton>
                  </InputAdornment>
                )
              }}
            />
            {(searchTerm || statusFilter) && (
              <IconButton size="small" onClick={handleClearFilters} title="Clear filters">
                <Clear fontSize="small" />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="outlined" startIcon={<GetApp />} onClick={exportToExcel} disabled={customers.length === 0}>
              Export
            </Button>
          </Stack>
        </Box>
        <CardContent>
          {customersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading HP customers...</Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#1976d2' }}>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        minWidth: 80,
                        fontSize: '0.9rem',
                        bgcolor: '#1976d2 !important'
                      }}>
                        S.No
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        minWidth: 180,
                        fontSize: '0.9rem',
                        bgcolor: '#1976d2 !important'
                      }}>
                        <TableSortLabel
                          active={sortBy === 'facility_name'}
                          direction={sortBy === 'facility_name' ? sortOrder.toLowerCase() : 'asc'}
                          onClick={() => handleSort('facility_name')}
                          sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                        >
                          Facility Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        minWidth: 120,
                        fontSize: '0.9rem',
                        bgcolor: '#1976d2 !important'
                      }}>
                        <TableSortLabel
                          active={sortBy === 'woreda_name'}
                          direction={sortBy === 'woreda_name' ? sortOrder.toLowerCase() : 'asc'}
                          onClick={() => handleSort('woreda_name')}
                          sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                        >
                          Woreda
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        minWidth: 150,
                        maxWidth: 150,
                        fontSize: '0.9rem',
                        bgcolor: '#1976d2 !important'
                      }}>
                        <TableSortLabel
                          active={sortBy === 'status'}
                          direction={sortBy === 'status' ? sortOrder.toLowerCase() : 'asc'}
                          onClick={() => handleSort('status')}
                          sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        minWidth: 120,
                        fontSize: '0.9rem',
                        bgcolor: '#1976d2 !important'
                      }}>
                        Total Waiting Time
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        minWidth: 120,
                        fontSize: '0.9rem',
                        bgcolor: '#1976d2 !important'
                      }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            {searchTerm ? 'No HP customers found matching your search.' : 'No HP customers found. Make sure HP customers are registered in the system.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer, index) => (
                        <TableRow key={customer.id} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
                            {page * rowsPerPage + index + 1}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.9rem', maxWidth: 180 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {customer.facility_name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>{customer.woreda_name || 'N/A'}</TableCell>
                          <TableCell sx={{ 
                            fontSize: '0.85rem',
                            maxWidth: 150,
                            wordWrap: 'break-word',
                            whiteSpace: 'normal',
                            lineHeight: 1.3
                          }}>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {customer.process_status || customer.status || 'Unknown'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>
                            {customer.total_waiting_time ? (
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                sx={{
                                  color: customer.total_waiting_time < 1440 ? '#2e7d32' : // Green: < 1 day (1440 min)
                                         customer.total_waiting_time < 2880 ? '#ed6c02' : // Yellow: 1-2 days (2880 min)
                                         '#d32f2f', // Red: > 2 days
                                  bgcolor: customer.total_waiting_time < 1440 ? '#e8f5e9' : // Light green
                                           customer.total_waiting_time < 2880 ? '#fff3e0' : // Light yellow
                                           '#ffebee', // Light red
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  display: 'inline-block'
                                }}
                              >
                              {formatDuration(customer.total_waiting_time)}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleCustomerDetailOpen(customer)}
                              sx={{ fontSize: '0.75rem' }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100]}
                showFirstButton
                showLastButton
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog 
        open={customerDetailOpen} 
        onClose={() => setCustomerDetailOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 3
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Business sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                HP Process Details
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {selectedCustomer?.facility_name}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {selectedCustomer && (
            <Grid container spacing={3}>
              {/* Process Information Card */}
              <Grid item xs={12}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  borderRadius: 2
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ 
                      fontWeight: 700,
                      color: '#667eea',
                      mb: 2
                    }}>
                      Process Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Process ID
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {selectedCustomer.id}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Facility Name
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {selectedCustomer.facility_name}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Route
                            </Typography>
                            <Chip 
                              label={selectedCustomer.route || 'N/A'} 
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Reporting Month
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {selectedCustomer.reporting_month || 'N/A'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Process Status
                            </Typography>
                            <Chip 
                              label={selectedCustomer.process_status || selectedCustomer.status || 'Unknown'} 
                              color={
                                selectedCustomer.process_status === 'Completed' ? 'success' :
                                selectedCustomer.process_status === 'In Progress' ? 'warning' :
                                'default'
                              }
                              sx={{ mt: 0.5, fontWeight: 'bold' }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Current Service Point
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {selectedCustomer.status === 'o2c_started' ? 'O2C' :
                               selectedCustomer.status === 'o2c_completed' ? 'EWM' :
                               selectedCustomer.status === 'ewm_completed' ? 'TM Manager' :
                               selectedCustomer.status === 'tm_confirmed' ? 'EWM Goods Issue' :
                               selectedCustomer.status === 'ewm_goods_issued' ? 'Biller' :
                               selectedCustomer.status === 'biller_completed' ? 'PI Officer' :
                               selectedCustomer.status === 'vehicle_requested' ? 'Dispatch' :
                               selectedCustomer.status === 'vehicle_assigned' ? 'Dispatch' :
                               selectedCustomer.status === 'dispatched' ? 'Documentation' :
                               selectedCustomer.status === 'completed' ? 'Completed' :
                               selectedCustomer.service_point?.toUpperCase() || 'N/A'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Total Waiting Time
                          </Typography>
                          <Chip 
                            label={formatDuration(selectedCustomer.total_time_minutes) || 'Not Available'}
                            color={
                              selectedCustomer.total_time_minutes >= 1440 ? 'error' :
                              selectedCustomer.total_time_minutes >= 480 ? 'warning' :
                              'success'
                            }
                            sx={{ mt: 0.5, fontWeight: 'bold', fontSize: '1rem' }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Location Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 700,
                  color: '#667eea',
                  borderBottom: '2px solid #667eea',
                  pb: 1,
                  mb: 2
                }}>
                  Location Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Region
                    </Typography>
                    <Typography variant="body1">{selectedCustomer.region_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Zone
                    </Typography>
                    <Typography variant="body1">{selectedCustomer.zone_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Woreda
                    </Typography>
                    <Typography variant="body1">{selectedCustomer.woreda_name || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              {/* Service Time Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 700,
                  color: '#667eea',
                  borderBottom: '2px solid #667eea',
                  pb: 1,
                  mb: 2
                }}>
                  Service Time Tracking
                </Typography>
                {customerServiceDetails.length > 0 ? (
                  <TableContainer component={Paper} sx={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: 2
                  }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Service Unit</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Officer</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Start Time</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>End Time</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {customerServiceDetails.map((service, index) => (
                          <TableRow key={index} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {service.service_unit}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {service.officer_name || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {service.start_time ? new Date(service.start_time).toLocaleString() : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {service.end_time ? new Date(service.end_time).toLocaleString() : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={formatDuration(service.waiting_minutes)}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={service.status || 'N/A'} 
                                color={service.status === 'completed' ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No service time records found for this process. Service times are recorded when officers complete their tasks.
                  </Alert>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <Button 
            onClick={() => setCustomerDetailOpen(false)}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HPCustomerDetailReport;