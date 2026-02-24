import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MUIDataTable from 'mui-datatables';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  createTheme,
  ThemeProvider,
} from '@mui/material';
import {
  Description,
  Save,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Custom theme for MUI DataTable
const getMuiTheme = () =>
  createTheme({
    components: {
      MUIDataTableHeadCell: {
        styleOverrides: {
          root: {
            backgroundColor: '#1976d2',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '0.95rem',
          },
        },
      },
      MUIDataTableBodyCell: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
        },
      },
    },
  });

const EwmDocumentation = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceData, setInvoiceData] = useState({});
  const [saving, setSaving] = useState({});

  const userStore = localStorage.getItem('store') || '';
  const userId = localStorage.getItem('EmployeeID');
  const userName = localStorage.getItem('FullName');

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/ewm-completed-customers`, {
        params: { store: userStore }
      });

      if (response.data.success) {
        setCustomers(response.data.data);
        
        // Initialize invoice data with existing values or defaults
        const initialData = {};
        response.data.data.forEach(item => {
          const key = `${item.process_id}-${item.odn_number}`;
          initialData[key] = {
            invoice_number: item.invoice_number || '',
            invoice_date: item.invoice_date ? new Date(item.invoice_date) : new Date(),
          };
        });
        setInvoiceData(initialData);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [userStore]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleInvoiceChange = (processId, odnNumber, field, value) => {
    const key = `${processId}-${odnNumber}`;
    setInvoiceData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveInvoice = async (customer) => {
    const key = `${customer.process_id}-${customer.odn_number}`;
    const data = invoiceData[key];

    if (!data?.invoice_number) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please enter an invoice number'
      });
      return;
    }

    try {
      setSaving(prev => ({ ...prev, [key]: true }));

      const payload = {
        process_id: customer.process_id,
        odn_number: customer.odn_number,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date.toISOString().split('T')[0],
        customer_name: customer.customer_name,
        store: customer.store,
        created_by_id: userId,
        created_by_name: userName
      };

      await axios.post(`${API_URL}/api/invoices`, payload);

      Swal.fire({
        icon: 'success',
        title: 'Saved',
        text: 'Invoice saved successfully',
        timer: 1500
      });

      fetchCustomers();
    } catch (err) {
      console.error('Error saving invoice:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save invoice'
      });
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  // Define columns for MUI DataTable
  const columns = [
    {
      name: 'customer_name',
      label: 'Customer Name',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const customer = customers[tableMeta.rowIndex];
          return (
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {value}
              </Typography>
              <Chip 
                label={customer.store} 
                size="small" 
                color="primary"
                sx={{ mt: 0.5 }}
              />
            </Box>
          );
        },
      },
    },
    {
      name: 'region_name',
      label: 'Region / Woreda',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const customer = customers[tableMeta.rowIndex];
          return (
            <Box>
              <Typography variant="body2">{value}</Typography>
              <Typography variant="caption" color="text.secondary">
                {customer.woreda_name}
              </Typography>
            </Box>
          );
        },
      },
    },
    {
      name: 'odn_number',
      label: 'ODN Number',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => (
          <Chip 
            label={value} 
            color="secondary"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        ),
      },
    },
    {
      name: 'invoice_date',
      label: 'Invoice Date',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const customer = customers[tableMeta.rowIndex];
          const key = `${customer.process_id}-${customer.odn_number}`;
          const data = invoiceData[key] || {};
          
          return (
            <DatePicker
              value={data.invoice_date || new Date()}
              onChange={(newValue) => 
                handleInvoiceChange(
                  customer.process_id, 
                  customer.odn_number, 
                  'invoice_date', 
                  newValue
                )
              }
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  size="small"
                  sx={{ width: 160 }}
                />
              )}
            />
          );
        },
        print: true,
        download: true,
      },
    },
    {
      name: 'invoice_number',
      label: 'Invoice Number',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const customer = customers[tableMeta.rowIndex];
          const key = `${customer.process_id}-${customer.odn_number}`;
          const data = invoiceData[key] || {};
          
          return (
            <TextField
              size="small"
              placeholder="Enter invoice #"
              value={data.invoice_number || ''}
              onChange={(e) =>
                handleInvoiceChange(
                  customer.process_id,
                  customer.odn_number,
                  'invoice_number',
                  e.target.value
                )
              }
              sx={{ width: 180 }}
            />
          );
        },
      },
    },
    {
      name: 'actions',
      label: 'Actions',
      options: {
        filter: false,
        sort: false,
        print: false,
        download: false,
        customBodyRender: (value, tableMeta) => {
          const customer = customers[tableMeta.rowIndex];
          const key = `${customer.process_id}-${customer.odn_number}`;
          const data = invoiceData[key] || {};
          const isSaving = saving[key];
          const hasInvoice = customer.invoice_number;
          
          return (
            <Button
              variant="contained"
              size="small"
              startIcon={isSaving ? <CircularProgress size={16} /> : <Save />}
              onClick={() => handleSaveInvoice(customer)}
              disabled={isSaving || !data.invoice_number}
              sx={{
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              {hasInvoice ? 'Update' : 'Save'}
            </Button>
          );
        },
      },
    },
  ];

  // MUI DataTable options
  const options = {
    filterType: 'checkbox',
    responsive: 'standard',
    selectableRows: 'none',
    download: true,
    print: true,
    search: true,
    filter: true,
    viewColumns: true,
    pagination: true,
    rowsPerPage: 10,
    rowsPerPageOptions: [10, 25, 50, 100],
    elevation: 3,
    downloadOptions: {
      filename: `EWM_Invoices_${userStore}_${new Date().toISOString().split('T')[0]}.csv`,
      separator: ',',
    },
    textLabels: {
      body: {
        noMatch: 'No customers with completed EWM status found',
        toolTip: 'Sort',
      },
      pagination: {
        next: 'Next Page',
        previous: 'Previous Page',
        rowsPerPage: 'Rows per page:',
        displayRows: 'of',
      },
      toolbar: {
        search: 'Search',
        downloadCsv: 'Download CSV',
        print: 'Print',
        viewColumns: 'View Columns',
        filterTable: 'Filter Table',
      },
      filter: {
        all: 'All',
        title: 'FILTERS',
        reset: 'RESET',
      },
    },
    onDownload: (buildHead, buildBody, columns, data) => {
      // Custom download to include formatted data
      return '\uFEFF' + buildHead(columns) + buildBody(data);
    },
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading customers...
        </Typography>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ThemeProvider theme={getMuiTheme()}>
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Description sx={{ fontSize: 56, color: 'white' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    EWM Documentation
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Invoice Management for Completed EWM Processes - Store: {userStore}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ ml: 2 }}>
                Loading customers...
              </Typography>
            </Box>
          ) : (
            <MUIDataTable
              title={`Customers with Completed EWM (${customers.length})`}
              data={customers}
              columns={columns}
              options={options}
            />
          )}
        </Container>
      </ThemeProvider>
    </LocalizationProvider>
  );
};

export default EwmDocumentation;
