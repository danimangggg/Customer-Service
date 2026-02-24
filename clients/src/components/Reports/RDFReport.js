import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Card, CardContent,
  Grid, Chip, Stack, Alert, Container,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, TablePagination, TableSortLabel, IconButton,
  InputAdornment, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Fade, Avatar
} from '@mui/material';
import {
  Business, Search, GetApp, Clear, FilterList, Assignment
} from '@mui/icons-material';
import MUIDataTable from 'mui-datatables';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const RDFReport = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [customerServiceDetails, setCustomerServiceDetails] = useState([]);
  
  // Pagination, search, and sort states for customers
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Picklist states
  const [picklists, setPicklists] = useState([]);
  const [picklistsLoading, setPicklistsLoading] = useState(false);
  const [combinedPicklists, setCombinedPicklists] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage, searchTerm, sortBy, sortOrder, statusFilter]);
  
  useEffect(() => {
    if (activeTab === 1) {
      fetchPicklists();
    }
  }, [activeTab]);

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      setError(null);
      console.log('=== CUSTOMER FETCH DEBUG ===');
      console.log('API_URL:', API_URL);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        sortBy: sortBy,
        sortOrder: sortOrder,
        statusFilter: statusFilter
      };
      
      console.log('Fetching customers with params:', params);
      
      const response = await axios.get(`${API_URL}/api/customers-detail-report`, { params });
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      if (response.data.success && response.data.customers) {
        setCustomers(response.data.customers);
        setTotalCount(response.data.pagination?.total || 0);
        console.log('✅ Successfully loaded', response.data.customers.length, 'customers');
      } else {
        console.log('❌ Invalid response format:', response.data);
        setError('Invalid response format from server');
        setCustomers([]);
      }
    } catch (err) {
      console.error('=== CUSTOMER FETCH ERROR ===');
      console.error('Error object:', err);
      
      const errorMessage = err.response?.data?.error || err.response?.statusText || err.message || 'Unknown error';
      setError(`Failed to load customers: ${errorMessage}`);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };
  
  const fetchPicklists = async () => {
    try {
      setPicklistsLoading(true);
      const pickRes = await axios.get(`${API_URL}/api/getPicklists`);
      
      let allPicklists = Array.isArray(pickRes.data) ? pickRes.data : [];
      
      console.log('=== RDF PICKLISTS DEBUG ===');
      console.log('Total picklists fetched:', allPicklists.length);
      console.log('Sample raw picklist:', JSON.stringify(allPicklists[0], null, 2));
      
      // Filter for RDF picklists only (AA1, AA2, AA3 stores)
      const rdfPicklists = allPicklists.filter(
        (p) => ['AA1', 'AA2', 'AA3'].includes(p.store)
      );
      
      console.log('RDF picklists (AA1/AA2/AA3):', rdfPicklists.length);
      console.log('Sample RDF picklist full data:', JSON.stringify(rdfPicklists[0], null, 2));
      
      // Show only uncompleted RDF picklists
      const uncompletedRDF = rdfPicklists.filter(
        (p) => String(p.status || '').toLowerCase() !== 'completed'
      );
      
      console.log('Uncompleted RDF picklists:', uncompletedRDF.length);
      if (uncompletedRDF.length > 0) {
        console.log('Sample uncompleted full data:', JSON.stringify(uncompletedRDF[0], null, 2));
      }
      
      // Map to ensure operator_name is available at top level
      const formatted = uncompletedRDF.map(p => {
        const operatorName = p.operator?.full_name || p.operator?.fullName || p.operator_name || null;
        console.log('Mapping picklist:', {
          id: p.id,
          odn: p.odn,
          operator_obj: p.operator,
          operator_name_extracted: operatorName
        });
        return {
          ...p,
          operator_name: operatorName
        };
      });
      
      setPicklists(formatted);
      setCombinedPicklists(formatted);
    } catch (err) {
      console.error('Error fetching picklists:', err);
      setPicklists([]);
      setCombinedPicklists([]);
    } finally {
      setPicklistsLoading(false);
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
        'Customer ID': customer.id,
        'Facility Name': customer.actual_facility_name || customer.facility_name || 'N/A',
        'Woreda': customer.woreda_name || 'N/A',
        'Total Waiting Time (min)': customer.total_waiting_time || 0,
        'Status': customer.status === 'completed' ? 'Completed' : customer.next_service_point || 'Registered',
        'Created At': new Date(customer.created_at).toLocaleString(),
        'Completed At': customer.completed_at ? new Date(customer.completed_at).toLocaleString() : 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RDF Customer Report');
      
      const fileName = `RDF_Customer_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export data');
    }
  };

  const fetchCustomerServiceDetails = async (customerId) => {
    try {
      const response = await axios.get(`${API_URL}/api/customers/${customerId}/service-details`);
      setCustomerServiceDetails(response.data.serviceDetails || []);
    } catch (err) {
      console.error('Error fetching customer service details:', err);
      setCustomerServiceDetails([]);
    }
  };

  const [customerOdns, setCustomerOdns] = useState([]);

  const fetchCustomerOdns = async (customerId) => {
    try {
      const response = await axios.get(`${API_URL}/api/rdf-odns/${customerId}`);
      setCustomerOdns(response.data.odns || []);
    } catch (err) {
      console.error('Error fetching customer ODNs:', err);
      setCustomerOdns([]);
    }
  };

  const handleCustomerDetailOpen = (customer) => {
    setSelectedCustomer(customer);
    setCustomerDetailOpen(true);
    fetchCustomerServiceDetails(customer.id);
    fetchCustomerOdns(customer.id);
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
                RDF Report
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Regular Distribution Flow - Customer Detail Report
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label="Customer Records" 
            icon={<Business />} 
            iconPosition="start"
          />
          <Tab 
            label="Picklists" 
            icon={<Assignment />} 
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Customer Detail Report */}
      {activeTab === 0 && (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Customer Detail Report
        </Typography>

        {/* Search and Export Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search customers..."
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
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="registration">Registration</MenuItem>
                    <MenuItem value="o2c">O2C</MenuItem>
                    <MenuItem value="ewm">EWM</MenuItem>
                    <MenuItem value="dispatch">Dispatch</MenuItem>
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
                <Typography sx={{ ml: 2 }}>Loading customers...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  Customer Records ({totalCount} total)
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
                            Customer ID
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ 
                          color: 'white', 
                          fontWeight: 'bold', 
                          minWidth: 250,
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
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">
                              {searchTerm ? 'No customers found matching your search.' : 'No customers found. Make sure customers are registered in the system.'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        customers.map((customer) => (
                          <TableRow key={customer.id} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{customer.id}</TableCell>
                            <TableCell sx={{ fontSize: '0.9rem', maxWidth: 200 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {customer.actual_facility_name || customer.facility_name || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.9rem' }}>{customer.woreda_name || 'N/A'}</TableCell>
                            <TableCell sx={{ fontSize: '0.9rem' }}>
                              <Chip 
                                label={`${customer.total_waiting_time || 0} min`}
                                color={customer.total_waiting_time > 60 ? 'error' : customer.total_waiting_time > 30 ? 'warning' : 'success'}
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={customer.status === 'completed' ? 'Completed' : customer.next_service_point || 'Registered'} 
                                color={customer.status === 'completed' ? 'success' : 'primary'}
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
      </Box>
      )}

      {/* Picklists Tab */}
      {activeTab === 1 && (
        <Container maxWidth="xl">
          {picklistsLoading ? (
            <Fade in={picklistsLoading}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                py: 8
              }}>
                <CircularProgress size={60} thickness={4} />
                <Typography variant="h6" color="text.secondary">
                  Loading picklists...
                </Typography>
              </Box>
            </Fade>
          ) : (
            <Card sx={{ borderRadius: 3 }}>
              <Box className="header-gradient" sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 3,
                borderRadius: '20px 20px 0 0'
              }}>
                <Stack direction="row" alignItems="center" spacing={3} justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      width: 56, 
                      height: 56
                    }}>
                      <Assignment fontSize="large" />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="white">
                        RDF Picklists
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        Uncompleted picklist submissions
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/rdf-completed-picklists')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '2px solid rgba(255,255,255,0.3)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                      }
                    }}
                  >
                    Completed Picklists
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ p: 4 }}>
                {combinedPicklists.length === 0 ? (
                  <Fade in={true}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 8,
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                      borderRadius: 3,
                      border: '2px dashed rgba(99, 102, 241, 0.2)'
                    }}>
                      <Assignment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h5" color="text.secondary" gutterBottom>
                        No picklists submitted yet
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Picklists will appear here once they are submitted
                      </Typography>
                    </Box>
                  </Fade>
                ) : (
                  <Grid container spacing={3}>
                    {combinedPicklists.map((p) => (
                      <Grid item xs={12} key={p.id}>
                        <Card sx={{ 
                          transition: 'all 0.3s ease',
                          borderRadius: 3,
                          border: '1px solid rgba(0,0,0,0.08)',
                          '&:hover': {
                            transform: 'translateX(8px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            borderColor: 'rgba(99, 102, 241, 0.3)'
                          }
                        }}>
                          <CardContent>
                            <Grid container spacing={3} alignItems="center">
                              <Grid item xs={12} md={6}>
                                <Stack spacing={2}>
                                  <Chip 
                                    label={`ODN: ${p.odn}`} 
                                    color="primary" 
                                    variant="filled"
                                    sx={{ 
                                      fontSize: '1rem', 
                                      fontWeight: 'bold',
                                      height: 32,
                                      borderRadius: 2,
                                      width: 'fit-content'
                                    }} 
                                  />
                                  
                                  {p.facility && (
                                    <Stack spacing={1}>
                                      <Typography variant="body1" fontWeight="bold">
                                        {p.facility.facility_name}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {p.facility.woreda_name}, {p.facility.zone_name}, {p.facility.region_name}
                                      </Typography>
                                    </Stack>
                                  )}

                                  {p.store && (
                                    <Chip 
                                      label={`Store: ${p.store}`}
                                      color="secondary"
                                      size="small"
                                      sx={{ width: 'fit-content' }}
                                    />
                                  )}
                                  
                                  <Typography variant="body2" color="success.main" fontWeight="bold">
                                    Operator: {p.operator_name || 'N/A'}
                                  </Typography>
                                </Stack>
                              </Grid>

                              <Grid item xs={12} md={6}>
                                <Stack direction="row" spacing={2} justifyContent="flex-end">
                                  <Button
                                    variant="outlined"
                                    onClick={() => window.open(p.url, '_blank')}
                                    startIcon={<GetApp />}
                                    sx={{ minWidth: 120 }}
                                  >
                                    View PDF
                                  </Button>
                                </Stack>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Card>
          )}
        </Container>
      )}

      {/* Customer Detail Dialog */}
      <Dialog 
        open={customerDetailOpen} 
        onClose={() => setCustomerDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Customer Details - {selectedCustomer?.actual_facility_name || selectedCustomer?.facility_name}
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Customer ID</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.id}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Facility Name</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedCustomer.actual_facility_name || selectedCustomer.facility_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Woreda</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.woreda_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Total Waiting Time</Typography>
                <Chip 
                  label={`${selectedCustomer.total_waiting_time || 0} minutes`}
                  color={selectedCustomer.total_waiting_time > 60 ? 'error' : selectedCustomer.total_waiting_time > 30 ? 'warning' : 'success'}
                  sx={{ mb: 2, fontWeight: 'bold', fontSize: '1rem' }}
                />
              </Grid>

              {/* Service Time Details */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 700,
                  color: '#1976d2',
                  borderBottom: '2px solid #1976d2',
                  pb: 1,
                  mb: 2
                }}>
                  Service Time Details
                </Typography>
                {customerServiceDetails.length > 0 ? (
                  <TableContainer component={Paper} sx={{ 
                    mt: 2,
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

              {/* ODN Status by Store */}
              {selectedCustomer && customerOdns.length > 0 && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontWeight: 700,
                    color: '#1976d2',
                    borderBottom: '2px solid #1976d2',
                    pb: 1,
                    mb: 2
                  }}>
                    Store Process Status
                  </Typography>
                  <TableContainer component={Paper} sx={{ 
                    mt: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: 2
                  }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Store</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>ODN</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>EWM</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Dispatch</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Exit Permit</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Security</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {customerOdns.map((odn, index) => (
                          <TableRow key={index} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                            <TableCell sx={{ fontWeight: 600 }}>{odn.store}</TableCell>
                            <TableCell>{odn.odn_number}</TableCell>
                            <TableCell>
                              <Chip 
                                label={odn.ewm_status === 'completed' ? '✓' : '○'} 
                                color={odn.ewm_status === 'completed' ? 'success' : 'default'}
                                size="small"
                                sx={{ minWidth: 40 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={odn.dispatch_status === 'completed' ? '✓' : '○'} 
                                color={odn.dispatch_status === 'completed' ? 'success' : 'default'}
                                size="small"
                                sx={{ minWidth: 40 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={odn.exit_permit_status === 'completed' ? '✓' : '○'} 
                                color={odn.exit_permit_status === 'completed' ? 'success' : 'default'}
                                size="small"
                                sx={{ minWidth: 40 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={odn.gate_status === 'allowed' ? '✓' : '○'} 
                                color={odn.gate_status === 'allowed' ? 'success' : 'default'}
                                size="small"
                                sx={{ minWidth: 40 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Show info about process flow */}
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                    <Typography variant="caption">
                      Each store follows: EWM → Dispatch → Exit Permit (Documentation) → Security
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomerDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RDFReport;