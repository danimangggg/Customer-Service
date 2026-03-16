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
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Business, Search, GetApp, Clear, FilterList, Assignment, Description,
  LocalShipping, Receipt, ConfirmationNumber, Scale, Person, Storefront, Assessment
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
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalRegistrations: 0,
    averageWaitingTime: 0,
    completedCount: 0,
    inProgressCount: 0,
    cancelledCount: 0,
    autoCancelledCount: 0,
    loading: true
  });
  
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
  const [picklistPage, setPicklistPage] = useState(0);
  const [picklistRowsPerPage, setPicklistRowsPerPage] = useState(25);
  const [picklistTotalCount, setPicklistTotalCount] = useState(0);
  
  // Documentation states
  const [documentationRecords, setDocumentationRecords] = useState([]);
  const [documentationLoading, setDocumentationLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);
  
  // Best Of states
  const [bestOfData, setBestOfData] = useState(null);
  const [bestOfLoading, setBestOfLoading] = useState(false);

  // Default: last week
  const getLastWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - diffToMonday - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    return {
      from: lastMonday.toISOString().split('T')[0],
      to: lastSunday.toISOString().split('T')[0],
    };
  };
  const [bestOfRange, setBestOfRange] = useState(getLastWeekRange);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 0) {
      fetchDashboardStats();
    } else if (activeTab === 1) {
      fetchCustomers();
    } else if (activeTab === 2) {
      fetchDocumentation();
    } else if (activeTab === 3) {
      fetchPicklists();
    } else if (activeTab === 4) {
      fetchBestOfWeek();
    }
  }, [activeTab, page, rowsPerPage, searchTerm, sortBy, sortOrder, statusFilter, picklistPage, picklistRowsPerPage]);

  const fetchDashboardStats = async () => {
    try {
      setDashboardStats(prev => ({ ...prev, loading: true }));
      const response = await axios.get(`${API_URL}/api/rdf-dashboard-stats`);
      
      if (response.data.success) {
        setDashboardStats({
          ...response.data.stats,
          loading: false
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setDashboardStats(prev => ({ ...prev, loading: false }));
    }
  };

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
      // Fetch with pagination
      const pickRes = await axios.get(`${API_URL}/api/getPicklists`, {
        params: { 
          page: picklistPage + 1, 
          limit: picklistRowsPerPage 
        }
      });
      
      // Handle both old format (array) and new format (object with data property)
      let allPicklists = [];
      let total = 0;
      
      if (Array.isArray(pickRes.data)) {
        allPicklists = pickRes.data;
        total = pickRes.data.length;
      } else if (pickRes.data.data && Array.isArray(pickRes.data.data)) {
        allPicklists = pickRes.data.data;
        total = pickRes.data.pagination?.total || 0;
      }
      
      setPicklists(allPicklists);
      setPicklistTotalCount(total);
      
      const combined = allPicklists.map((p) => ({ ...p }));
      setCombinedPicklists(combined);
    } catch (err) {
      console.error('Error fetching picklists:', err);
      setPicklists([]);
      setCombinedPicklists([]);
      setPicklistTotalCount(0);
    } finally {
      setPicklistsLoading(false);
    }
  };

  const handlePicklistChangePage = (event, newPage) => {
    setPicklistPage(newPage);
  };

  const handlePicklistChangeRowsPerPage = (event) => {
    setPicklistRowsPerPage(parseInt(event.target.value, 10));
    setPicklistPage(0);
  };

  const fetchDocumentation = async () => {
    try {
      setDocumentationLoading(true);
      
      // Fetch completed customers with includeCompleted parameter
      const [customersRes, facilitiesRes] = await Promise.all([
        axios.get(`${API_URL}/api/tv-display-customers`, {
          params: { includeCompleted: 'true' }
        }),
        axios.get(`${API_URL}/api/facilities`)
      ]);
      
      console.log('Completed customers fetched:', customersRes.data.length);
      
      const completedRecords = customersRes.data;
      
      // Sort by most recent first (already sorted DESC in backend)
      setDocumentationRecords(completedRecords);
      setFacilities(facilitiesRes.data || []);
    } catch (err) {
      console.error('Error fetching documentation:', err);
      setDocumentationRecords([]);
    } finally {
      setDocumentationLoading(false);
    }
  };

  const fetchBestOfWeek = async (range) => {
    const { from, to } = range || bestOfRange;
    try {
      setBestOfLoading(true);
      const response = await axios.get(`${API_URL}/api/best-of-week`, {
        params: { startDate: from, endDate: to }
      });
      if (response.data.success) {
        setBestOfData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching best of week:', err);
      setBestOfData(null);
    } finally {
      setBestOfLoading(false);
    }
  };

  // DataGrid columns for documentation
  const documentationColumns = [
    {
      field: 'serial',
      headerName: '#',
      width: 70,
      filterable: false,
      sortable: false,
      renderCell: (params) => {
        const index = documentationRecords.findIndex(row => row.id === params.row.id);
        return (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {index + 1}
          </Typography>
        );
      }
    },
    {
      field: 'exit_number',
      headerName: 'Exit #',
      width: 80,
      filterable: true,
      type: 'number',
      renderCell: (params) => (
        <Chip 
          label={`#${params.value || 1}`} 
          size="small" 
          color="info"
          sx={{ fontWeight: 700 }}
        />
      )
    },
    {
      field: 'exit_type',
      headerName: 'Type',
      width: 110,
      filterable: true,
      renderCell: (params) => {
        const isPartial = params.value?.toLowerCase() === 'partial';
        const exitNumber = params.row.exit_number || 1;
        
        // If it's a full exit but not the first exit, show "Final" instead of "Full"
        const isFinalCompletion = !isPartial && exitNumber > 1;
        
        let label, color, variant;
        if (isPartial) {
          label = 'Partial';
          color = 'warning';
          variant = 'outlined';
        } else if (isFinalCompletion) {
          label = 'Final';
          color = 'success';
          variant = 'filled';
        } else {
          label = 'Full';
          color = 'success';
          variant = 'filled';
        }
        
        return (
          <Chip 
            label={label} 
            size="small" 
            color={color}
            variant={variant}
            sx={{ fontWeight: 600 }}
          />
        );
      }
    },
    {
      field: 'facility_name',
      headerName: 'Facility',
      width: 250,
      filterable: true,
      valueGetter: (params) => {
        const row = params.row;
        return row.actual_facility_name || 
               row.facility_name || 
               facilities.find(f => f.id === row.facility_id)?.facility_name || 
               '—';
      },
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Storefront sx={{ fontSize: 16, color: '#7986cb', flexShrink: 0 }} />
          <Typography 
            variant="body2" 
            sx={{ 
              whiteSpace: 'normal', 
              wordWrap: 'break-word',
              lineHeight: 1.4
            }}
          >
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'store_name',
      headerName: 'Store/Gate',
      width: 120,
      filterable: true,
      renderCell: (params) => (
        <Chip 
          label={params.value || '—'} 
          size="small" 
          color="secondary"
          sx={{ fontWeight: 600 }}
        />
      )
    },
    {
      field: 'odn_number',
      headerName: 'ODN',
      width: 150,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2">{params.value || '—'}</Typography>
      )
    },
    {
      field: 'vehicle_plate',
      headerName: 'Vehicle Plate',
      width: 150,
      filterable: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping sx={{ fontSize: 16, color: '#2196f3' }} />
          <Typography variant="body2">{params.value || '—'}</Typography>
        </Box>
      )
    },
    {
      field: 'total_amount',
      headerName: 'Amount',
      width: 120,
      filterable: true,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {params.value || '—'} {params.row.measurement_unit || ''}
        </Typography>
      )
    },
    {
      field: 'receipt_number',
      headerName: 'Receipt #',
      width: 180,
      filterable: true,
      renderCell: (params) => {
        const isCredit = params.row.customer_type?.toLowerCase() === 'credit';
        
        if (isCredit) {
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Credit
            </Typography>
          );
        }
        
        return params.value ? (
          <Typography variant="body2">{params.value}</Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">—</Typography>
        );
      }
    },
    {
      field: 'assigned_gate_keeper_name',
      headerName: 'Security Officer',
      width: 180,
      filterable: true,
      valueGetter: (params) => {
        return params.row.all_gate_keepers || params.row.assigned_gate_keeper_name || 'Security';
      },
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person sx={{ fontSize: 16, color: '#4caf50' }} />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      )
    }
  ];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const exportToExcel = () => {
    try {
      const exportData = customers.map(customer => ({
        'Customer ID': customer.id,
        'Facility Name': customer.actual_facility_name || customer.facility_name || 'N/A',
        'Woreda': customer.woreda_name || 'N/A',
        'Total Waiting Time (min)': customer.total_waiting_time || 0,
        'Status': customer.status === 'completed' ? 'Completed' : 
                  customer.status === 'Canceled' ? 'Cancelled' :
                  customer.next_service_point || 'Registered',
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
            label="Dashboard" 
            icon={<Assessment />} 
            iconPosition="start"
          />
          <Tab 
            label="Customer Records" 
            icon={<Business />} 
            iconPosition="start"
          />
          <Tab 
            label="Documentation" 
            icon={<Description />} 
            iconPosition="start"
          />
          <Tab 
            label="Picklists" 
            icon={<Assignment />} 
            iconPosition="start"
          />
          <Tab 
            label="Best Of" 
            icon={<Person />} 
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Dashboard Tab */}
      {activeTab === 0 && (
        <Fade in={true}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              RDF Dashboard Overview
            </Typography>

            {dashboardStats.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {/* Total Registrations */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                          <Business fontSize="large" />
                        </Avatar>
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {dashboardStats.totalRegistrations}
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            Total Registrations
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Completed */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    color: 'white',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                          <ConfirmationNumber fontSize="large" />
                        </Avatar>
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {dashboardStats.completedCount}
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            Completed
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* In Progress */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                          <LocalShipping fontSize="large" />
                        </Avatar>
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {dashboardStats.inProgressCount}
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            In Progress
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Average Waiting Time */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                          <Scale fontSize="large" />
                        </Avatar>
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {(dashboardStats.averageWaitingTime / 60).toFixed(1)}
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            Avg. Waiting Time (hrs)
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Cancelled */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: 'white',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                          <Clear fontSize="large" />
                        </Avatar>
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {dashboardStats.cancelledCount}
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            Canceled
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Auto-Cancelled */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                    color: 'white',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                          <Clear fontSize="large" />
                        </Avatar>
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {dashboardStats.autoCancelledCount || 0}
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            Auto-Canceled
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Completion Rate */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    color: '#333',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'rgba(0,0,0,0.1)', width: 56, height: 56 }}>
                          <Receipt fontSize="large" />
                        </Avatar>
                        <Box>
                          <Typography variant="h3" fontWeight="bold">
                            {dashboardStats.totalRegistrations > 0 
                              ? Math.round((dashboardStats.completedCount / dashboardStats.totalRegistrations) * 100)
                              : 0}%
                          </Typography>
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            Completion Rate
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Fade>
      )}

      {/* Customer Detail Report */}
      {activeTab === 1 && (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Customer Detail Report
        </Typography>

        {customersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={{ height: 700, width: '100%' }}>
            <DataGrid
              rows={customers}
              columns={[
                {
                  field: 'facility_name',
                  headerName: 'Facility Name',
                  width: 300,
                  flex: 1,
                  headerClassName: 'super-app-theme--header',
                  valueGetter: (params) => params.row.actual_facility_name || params.row.facility_name || 'N/A',
                  renderCell: (params) => (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'normal', 
                        wordWrap: 'break-word',
                        lineHeight: 1.4,
                        py: 1
                      }}
                    >
                      {params.value}
                    </Typography>
                  ),
                },
                {
                  field: 'customer_type',
                  headerName: 'Payment Type',
                  width: 130,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => {
                    const isCash = params.value?.toLowerCase() === 'cash';
                    return (
                      <Chip 
                        label={isCash ? 'Cash' : 'Credit'} 
                        size="small" 
                        color={isCash ? 'success' : 'primary'}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    );
                  },
                },
                {
                  field: 'total_waiting_time',
                  headerName: 'Total Waiting Time',
                  width: 180,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Chip 
                      label={`${params.value || 0} min`}
                      color={
                        params.value >= 1440 ? 'error' : 
                        params.value >= 180 ? 'warning' : 
                        'success'
                      }
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ),
                },
                {
                  field: 'status',
                  headerName: 'Status',
                  width: 180,
                  headerClassName: 'super-app-theme--header',
                  renderCell: (params) => (
                    <Chip 
                      label={
                        params.row.status === 'completed' ? 'Completed' : 
                        params.row.status === 'Canceled' ? 'Cancelled' :
                        params.row.next_service_point || 'Registered'
                      } 
                      color={
                        params.row.status === 'completed' ? 'success' : 
                        params.row.status === 'Canceled' ? 'error' :
                        'primary'
                      }
                      size="small"
                      sx={{ 
                        fontWeight: params.row.status === 'Canceled' ? 'bold' : 'normal'
                      }}
                    />
                  ),
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 150,
                  headerClassName: 'super-app-theme--header',
                  sortable: false,
                  filterable: false,
                  renderCell: (params) => (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleCustomerDetailOpen(params.row)}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      View Details
                    </Button>
                  ),
                },
              ]}
              pageSize={rowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              checkboxSelection={false}
              disableSelectionOnClick
              getRowHeight={() => 'auto'}
              components={{
                Toolbar: GridToolbar,
              }}
              componentsProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                  csvOptions: { 
                    fileName: `RDF_Customer_Report_${new Date().toISOString().split('T')[0]}`,
                    utf8WithBom: true,
                  },
                  printOptions: { disableToolbarButton: false },
                },
              }}
              sx={{
                bgcolor: 'white',
                borderRadius: 3,
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                  whiteSpace: 'normal !important',
                  wordWrap: 'break-word',
                },
                '& .super-app-theme--header': {
                  bgcolor: '#1976d2',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                },
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: '2px solid #1976d2',
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: '#f5f7ff',
                },
                '& .MuiDataGrid-toolbarContainer': {
                  padding: 2,
                  gap: 2,
                  bgcolor: '#f8f9fa',
                  borderBottom: '1px solid #e0e0e0',
                },
                '& .MuiButton-root': {
                  color: '#1976d2',
                },
              }}
            />
          </Box>
        )}
      </Box>
      )}

      {/* Documentation Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            Completed Process Documentation
          </Typography>

          {documentationLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <Box sx={{ height: 700, width: '100%' }}>
              <DataGrid
                rows={documentationRecords}
                columns={documentationColumns}
                pageSize={25}
                rowsPerPageOptions={[10, 25, 50, 100]}
                checkboxSelection={false}
                disableSelectionOnClick
                loading={documentationLoading}
                getRowHeight={() => 'auto'}
                components={{
                  Toolbar: GridToolbar,
                }}
                componentsProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: { debounceMs: 500 },
                  },
                }}
                sx={{
                  bgcolor: 'white',
                  borderRadius: 3,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f0f0f0',
                    whiteSpace: 'normal !important',
                    wordWrap: 'break-word',
                    lineHeight: '1.5 !important',
                    display: 'flex',
                    alignItems: 'center',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                  },
                  '& .MuiDataGrid-row': {
                    minHeight: '52px !important',
                    maxHeight: 'none !important',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: '#f8f9fa',
                    color: '#5c6bc0',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    borderBottom: '2px solid #e0e0e0',
                  },
                  '& .MuiDataGrid-row:hover': {
                    bgcolor: '#f5f7ff',
                  },
                  '& .MuiDataGrid-toolbarContainer': {
                    padding: 2,
                    gap: 2,
                  },
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Picklists Tab */}
      {activeTab === 3 && (
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
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                      Picklists ({picklistTotalCount} total)
                    </Typography>
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
                    
                    {/* Pagination */}
                    <TablePagination
                      component="div"
                      count={picklistTotalCount}
                      page={picklistPage}
                      onPageChange={handlePicklistChangePage}
                      rowsPerPage={picklistRowsPerPage}
                      onRowsPerPageChange={handlePicklistChangeRowsPerPage}
                      rowsPerPageOptions={[10, 25, 50, 100]}
                      showFirstButton
                      showLastButton
                      sx={{ mt: 3 }}
                    />
                  </>
                )}
              </Box>
            </Card>
          )}
        </Container>
      )}

      {/* Best Of Tab */}
      {activeTab === 4 && (
        <Container maxWidth="xl">
          {/* Date Range Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              label="From"
              type="date"
              size="small"
              value={bestOfRange.from}
              onChange={e => setBestOfRange(r => ({ ...r, from: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={bestOfRange.to}
              onChange={e => setBestOfRange(r => ({ ...r, to: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" size="small" onClick={() => fetchBestOfWeek(bestOfRange)}>
              Apply
            </Button>
            {/* Quick presets */}
            {[
              { label: 'This Week', fn: () => {
                const today = new Date();
                const day = today.getDay();
                const diff = day === 0 ? 6 : day - 1;
                const mon = new Date(today); mon.setDate(today.getDate() - diff);
                const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0] };
              }},
              { label: 'Last Week', fn: getLastWeekRange },
              { label: 'This Month', fn: () => {
                const today = new Date();
                const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                const to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                return { from, to };
              }},
              { label: 'This Year', fn: () => {
                const y = new Date().getFullYear();
                return { from: `${y}-01-01`, to: `${y}-12-31` };
              }},
            ].map(({ label, fn }) => (
              <Button key={label} variant="outlined" size="small" onClick={() => {
                const range = fn();
                setBestOfRange(range);
                fetchBestOfWeek(range);
              }}>
                {label}
              </Button>
            ))}
          </Box>

          {bestOfLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : bestOfData ? (
            <Box>
              {/* Header with Date Range */}
              <Card sx={{ 
                mb: 4, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    🏆 Best Performers 🏆
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    {new Date(bestOfData.dateRange.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {' — '}
                    {new Date(bestOfData.dateRange.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Typography>
                </CardContent>
              </Card>

              {/* Employee Cards Grid */}
              <Grid container spacing={4}>
                {/* O2C Officer */}
                {bestOfData.employees.o2c && (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      height: '100%',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3} alignItems="center">
                          <Avatar sx={{ 
                            width: 100, 
                            height: 100, 
                            bgcolor: 'rgba(255,255,255,0.3)',
                            fontSize: '3rem'
                          }}>
                            👤
                          </Avatar>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                              O2C Officer
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                              {bestOfData.employees.o2c.full_name}
                            </Typography>
                            <Chip 
                              label={`${bestOfData.employees.o2c.process_count} Processes Completed`}
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.3)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                px: 2,
                                py: 3
                              }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* EWM Officer */}
                {bestOfData.employees.ewm && (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      height: '100%',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3} alignItems="center">
                          <Avatar sx={{ 
                            width: 100, 
                            height: 100, 
                            bgcolor: 'rgba(255,255,255,0.3)',
                            fontSize: '3rem'
                          }}>
                            👤
                          </Avatar>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                              EWM Officer
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                              {bestOfData.employees.ewm.full_name}
                            </Typography>
                            <Chip 
                              label={`${bestOfData.employees.ewm.process_count} Processes Completed`}
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.3)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                px: 2,
                                py: 3
                              }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* WIM Operator */}
                {bestOfData.employees.wim && (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      height: '100%',
                      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      color: '#333',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3} alignItems="center">
                          <Avatar sx={{ 
                            width: 100, 
                            height: 100, 
                            bgcolor: 'rgba(0,0,0,0.1)',
                            fontSize: '3rem'
                          }}>
                            👤
                          </Avatar>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ opacity: 0.7, fontSize: '0.9rem' }}>
                              WIM Operator
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                              {bestOfData.employees.wim.full_name}
                            </Typography>
                            <Chip 
                              label={`${bestOfData.employees.wim.process_count} Picklists Created`}
                              sx={{ 
                                bgcolor: 'rgba(0,0,0,0.1)',
                                color: '#333',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                px: 2,
                                py: 3
                              }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Dispatcher */}
                {bestOfData.employees.dispatch && (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      height: '100%',
                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                      color: 'white',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3} alignItems="center">
                          <Avatar sx={{ 
                            width: 100, 
                            height: 100, 
                            bgcolor: 'rgba(255,255,255,0.3)',
                            fontSize: '3rem'
                          }}>
                            👤
                          </Avatar>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                              Dispatcher
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                              {bestOfData.employees.dispatch.full_name}
                            </Typography>
                            <Chip 
                              label={`${bestOfData.employees.dispatch.process_count} Dispatches Completed`}
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.3)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                px: 2,
                                py: 3
                              }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Documentation Officer */}
                {bestOfData.employees.documentation && (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      height: '100%',
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      color: 'white',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3} alignItems="center">
                          <Avatar sx={{ 
                            width: 100, 
                            height: 100, 
                            bgcolor: 'rgba(255,255,255,0.3)',
                            fontSize: '3rem'
                          }}>
                            👤
                          </Avatar>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                              Documentation Officer
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                              {bestOfData.employees.documentation.full_name}
                            </Typography>
                            <Chip 
                              label={`${bestOfData.employees.documentation.process_count} Documents Processed`}
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.3)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                px: 2,
                                py: 3
                              }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Security Officer */}
                {bestOfData.employees.security && (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      height: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': { 
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                      }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3} alignItems="center">
                          <Avatar sx={{ 
                            width: 100, 
                            height: 100, 
                            bgcolor: 'rgba(255,255,255,0.3)',
                            fontSize: '3rem'
                          }}>
                            👤
                          </Avatar>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                              Security Officer
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                              {bestOfData.employees.security.full_name}
                            </Typography>
                            <Chip 
                              label={`${bestOfData.employees.security.process_count} Vehicles Cleared`}
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.3)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                px: 2,
                                py: 3
                              }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>

              {/* No data message */}
              {!bestOfData.employees.o2c && !bestOfData.employees.ewm && !bestOfData.employees.wim && 
               !bestOfData.employees.dispatch && !bestOfData.employees.documentation && !bestOfData.employees.security && (
                <Alert severity="info" sx={{ mt: 4 }}>
                  No employee performance data available for last week.
                </Alert>
              )}
            </Box>
          ) : (
            <Alert severity="warning">
              Unable to load Best of Week data. Please try again later.
            </Alert>
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
              {/* Top Section - Basic Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Customer ID</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>{selectedCustomer.id}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Facility Name</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                  {selectedCustomer.actual_facility_name || selectedCustomer.facility_name}
                </Typography>
              </Grid>
              
              {/* Delegate Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Delegate Name</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedCustomer.delegate || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Delegate Phone</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedCustomer.delegate_phone || 'N/A'}
                </Typography>
              </Grid>
              
              {/* Letter Number */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Letter Number</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedCustomer.letter_number || 'N/A'}
                </Typography>
              </Grid>
              
              {/* Location Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Region</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedCustomer.region_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Zone</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedCustomer.zone_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Woreda</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>{selectedCustomer.woreda_name || 'N/A'}</Typography>
              </Grid>
              
              {/* Waiting Time */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Total Waiting Time</Typography>
                <Chip 
                  label={`${selectedCustomer.total_waiting_time || 0} minutes`}
                  color={
                    selectedCustomer.total_waiting_time >= 1440 ? 'error' : // 24 hours = 1440 minutes - RED
                    selectedCustomer.total_waiting_time >= 180 ? 'warning' : // 3 hours = 180 minutes - YELLOW
                    'success' // GREEN
                  }
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

          {/* Cancellation Information - Show if status is Canceled */}
          {selectedCustomer && selectedCustomer.status === 'Canceled' && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#ffebee', borderRadius: 2, border: '2px solid #f44336' }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 700,
                color: '#c62828',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Clear /> Cancellation Information
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Cancelled By</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                    {selectedCustomer.cancelled_by_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Cancelled At</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                    {selectedCustomer.cancelled_at 
                      ? new Date(selectedCustomer.cancelled_at).toLocaleString() 
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Cancellation Reason</Typography>
                  <Paper sx={{ p: 2, mt: 1, bgcolor: 'white', border: '1px solid #ef5350' }}>
                    <Typography variant="body1" sx={{ color: '#c62828' }}>
                      {selectedCustomer.cancellation_reason || 'No reason provided'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
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
