import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Card, CardContent,
  Grid, Chip, Alert, Stack,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, TablePagination, TableSortLabel, IconButton,
  InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Search, GetApp, Clear, FilterList
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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

  useEffect(() => {
    fetchHPCustomers();
  }, [page, rowsPerPage, searchTerm, sortBy, sortOrder, statusFilter]);

  const fetchHPCustomers = async () => {
    try {
      setCustomersLoading(true);
      setError(null);
      console.log('=== HP CUSTOMER FETCH DEBUG ===');
      console.log('API_URL:', API_URL);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        sortBy: sortBy,
        sortOrder: sortOrder,
        statusFilter: statusFilter
      };
      
      console.log('Fetching HP customers with params:', params);
      
      const response = await axios.get(`${API_URL}/api/hp-customers-detail-report`, { params });
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      if (response.data.success && response.data.customers) {
        setCustomers(response.data.customers);
        setTotalCount(response.data.pagination?.total || 0);
        console.log('✅ Successfully loaded', response.data.customers.length, 'HP customers');
      } else {
        console.log('❌ Invalid response format:', response.data);
        setError('Invalid response format from server');
        setCustomers([]);
      }
    } catch (err) {
      console.error('=== HP CUSTOMER FETCH ERROR ===');
      console.error('Error object:', err);
      
      const errorMessage = err.response?.data?.error || err.response?.statusText || err.message || 'Unknown error';
      setError(`Failed to load HP customers: ${errorMessage}`);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

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
      const response = await axios.get(`${API_URL}/api/hp-customers/${customerId}/service-details`);
      setCustomerServiceDetails(response.data.serviceDetails || []);
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
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        HP Customer Detail Report
      </Typography>

      {/* Search and Export Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search HP customers..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClearSearch} size="small">
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  label="Filter by Status"
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterList />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Vehicle Requested">Vehicle Requested</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                {(searchTerm || statusFilter) && (
                  <Button
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={handleClearFilters}
                    disabled={customersLoading}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={exportToExcel}
                  disabled={customers.length === 0}
                >
                  Export Excel
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
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
              <Typography variant="h6" gutterBottom>
                HP Customer Records ({totalCount} total)
              </Typography>
              <TableContainer component={Paper}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#1976d2' }}>
                      <TableCell sx={{ 
                        color: 'white', 
                        fontWeight: 'bold', 
                        minWidth: 100,
                        fontSize: '0.9rem',
                        bgcolor: '#1976d2 !important'
                      }}>
                        <TableSortLabel
                          active={sortBy === 'id'}
                          direction={sortBy === 'id' ? sortOrder.toLowerCase() : 'asc'}
                          onClick={() => handleSort('id')}
                          sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                        >
                          Process ID
                        </TableSortLabel>
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
                          active={sortBy === 'region_name'}
                          direction={sortBy === 'region_name' ? sortOrder.toLowerCase() : 'asc'}
                          onClick={() => handleSort('region_name')}
                          sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                        >
                          Region
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
                          active={sortBy === 'zone_name'}
                          direction={sortBy === 'zone_name' ? sortOrder.toLowerCase() : 'asc'}
                          onClick={() => handleSort('zone_name')}
                          sx={{ color: 'white !important', '& .MuiTableSortLabel-icon': { color: 'white !important' } }}
                        >
                          Zone
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
                        minWidth: 120,
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
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            {searchTerm ? 'No HP customers found matching your search.' : 'No HP customers found. Make sure HP customers are registered in the system.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow key={customer.id} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{customer.id}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem', maxWidth: 180 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {customer.facility_name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>{customer.region_name || 'N/A'}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>{customer.zone_name || 'N/A'}</TableCell>
                          <TableCell sx={{ fontSize: '0.9rem' }}>{customer.woreda_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={customer.process_status || customer.status || 'Unknown'} 
                              color={customer.process_status === 'Completed' ? 'success' : 'primary'}
                              size="small"
                              sx={{ fontSize: '0.75rem' }}
                            />
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          HP Process Details - {selectedCustomer?.facility_name}
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Process ID</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.id}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Facility Name</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedCustomer.facility_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Region</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.region_name}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Zone</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.zone_name}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">Woreda</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.woreda_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Route</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.route}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Reporting Month</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.reporting_month || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Current Service Point</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.service_point || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Process Status</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.process_status || selectedCustomer.status}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Service Unit Status</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Registration Status</Typography>
                <Chip 
                  label={selectedCustomer.registration_status || 'Not Started'} 
                  color={selectedCustomer.registration_status === 'completed' ? 'success' : 'default'}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">O2C Status</Typography>
                <Chip 
                  label={selectedCustomer.o2c_status || 'Not Started'} 
                  color={selectedCustomer.o2c_status === 'completed' ? 'success' : 'default'}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">EWM Status</Typography>
                <Chip 
                  label={selectedCustomer.ewm_status || 'Not Started'} 
                  color={selectedCustomer.ewm_status === 'completed' ? 'success' : 'default'}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Dispatch Status</Typography>
                <Chip 
                  label={selectedCustomer.dispatch_status || 'Not Started'} 
                  color={selectedCustomer.dispatch_status === 'completed' ? 'success' : 'default'}
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Service Time Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Service Time Details</Typography>
                {customerServiceDetails.length > 0 ? (
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Service Unit</TableCell>
                          <TableCell>Officer</TableCell>
                          <TableCell>Start Time</TableCell>
                          <TableCell>End Time</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {customerServiceDetails.map((service, index) => (
                          <TableRow key={index}>
                            <TableCell>{service.service_unit}</TableCell>
                            <TableCell>{service.officer_name}</TableCell>
                            <TableCell>{new Date(service.start_time).toLocaleString()}</TableCell>
                            <TableCell>{new Date(service.end_time).toLocaleString()}</TableCell>
                            <TableCell>{service.waiting_minutes} min</TableCell>
                            <TableCell>
                              <Chip 
                                label={service.status} 
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
                  <Typography color="text.secondary">No service time records found.</Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomerDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HPCustomerDetailReport;