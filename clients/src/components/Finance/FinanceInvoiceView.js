import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Box, Typography, TextField, Button, Chip, CircularProgress,
  Alert, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Paper
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, FileDownload, Receipt } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const FinanceInvoiceView = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [stores, setStores] = useState([]);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (storeFilter) params.store = storeFilter;
      if (search) params.search = search;

      const res = await axios.get(`${API_URL}/api/invoices`, { params });
      if (res.data.success) {
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setInvoices(data);
        const uniqueStores = [...new Set(data.map(r => r.store).filter(Boolean))];
        setStores(uniqueStores);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [storeFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  const handleExport = () => {
    const rows = invoices.map((inv, i) => ({
      '#': i + 1,
      'Customer Name': inv.facility_name || inv.customer_name || '',
      'Type': inv.customer_type || '',
      'Store': inv.store || '',
      'ODN Number': inv.odn_number || '',
      'Invoice Number': inv.invoice_number || '',
      'Invoice Date': inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '',
      'Woreda': inv.woreda_name || '',
      'Zone': inv.zone_name || '',
      'Region': inv.region_name || '',
      'Saved By': inv.created_by_name || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, `EWM_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns = [
    { field: 'seq', headerName: '#', width: 55, sortable: false,
      renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1 },
    { field: 'facility_name', headerName: 'Customer', flex: 1.5, minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'normal', lineHeight: 1.3 }}>
            {row.facility_name || row.customer_name || '-'}
          </Typography>
          {row.customer_type === 'Credit' && (
            <Chip label="Credit" size="small" color="warning" sx={{ mt: 0.3, height: 18, fontSize: '0.7rem' }} />
          )}
        </Box>
      )
    },
    { field: 'store', headerName: 'Store', width: 85,
      renderCell: ({ value }) => value ? <Chip label={value} size="small" color="primary" /> : '-' },
    { field: 'odn_number', headerName: 'ODN Number', width: 145,
      renderCell: ({ value }) => value ? <Chip label={value} size="small" variant="outlined" color="secondary" /> : '-' },
    { field: 'invoice_number', headerName: 'Invoice #', width: 160,
      renderCell: ({ row }) => {
        if (!row.invoice_number) return <Chip label="Not saved" size="small" color="warning" variant="outlined" />;
        return (
          <Box>
            <Typography fontWeight={700} color="primary.main" variant="body2">{row.invoice_number}</Typography>
            {row.customer_type === 'Credit' && (
              <Typography variant="caption" color="warning.main" fontWeight={600}>Credit</Typography>
            )}
          </Box>
        );
      }
    },
    { field: 'invoice_date', headerName: 'Invoice Date', width: 120,
      renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : '-' },
    { field: 'region_name', headerName: 'Location', flex: 1.2, minWidth: 150, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          {row.region_name && <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.4 }}>{row.region_name}</Typography>}
          {row.zone_name   && <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.4 }}>{row.zone_name}</Typography>}
          {row.woreda_name && <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.4 }}>{row.woreda_name}</Typography>}
        </Box>
      )
    },
    { field: 'created_by_name', headerName: 'Saved By', width: 150 },
  ];

  const rows = invoices.map((inv, i) => ({ ...inv, id: inv.id || i }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box className="header-gradient" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: 2 }}>
        <Receipt sx={{ fontSize: 32, color: '#1565c0' }} />
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1a1a1a">
            EWM Invoice Records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View all invoices saved by EWM Documentation officers
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={`${invoices.length} records`}
            color="primary"
            sx={{ fontWeight: 700 }}
          />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search customer, ODN, invoice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Store</InputLabel>
          <Select value={storeFilter} label="Store" onChange={(e) => setStoreFilter(e.target.value)}>
            <MenuItem value="">All Stores</MenuItem>
            {stores.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={handleExport}
          disabled={invoices.length === 0}
          sx={{ ml: 'auto' }}
        >
          Export Excel
        </Button>
      </Paper>

      {/* DataGrid */}
      <Paper sx={{ height: 520 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            getRowHeight={() => 'auto'}
            sx={{
              '& .MuiDataGrid-columnHeaders': { backgroundColor: '#1565c0', color: '#fff', fontWeight: 700 },
              '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
              '& .MuiDataGrid-row:hover': { backgroundColor: '#e3f2fd' },
              '& .MuiDataGrid-cell': { alignItems: 'flex-start', py: 1 },
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default FinanceInvoiceView;
