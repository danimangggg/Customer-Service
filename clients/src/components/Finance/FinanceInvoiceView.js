import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../../axiosInstance';
import * as XLSX from 'xlsx';
import {
  Box, Typography, TextField, Button, Chip, CircularProgress,
  Alert, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Paper, Stack, Tabs, Tab
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, FileDownload, Receipt } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ethiopianMonths = [
  'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
];

// ─── RDF TAB ────────────────────────────────────────────────────────────────

const RDFTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [receivedFilter, setReceivedFilter] = useState('received');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [officerFilter, setOfficerFilter] = useState('');
  const [stores, setStores] = useState([]);
  const [officers, setOfficers] = useState([]);
  const fullName = localStorage.getItem('FullName') || '';

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (storeFilter) params.store = storeFilter;
      if (search) params.search = search;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const res = await axios.get(`${API_URL}/api/invoices`, { params });
      if (res.data.success) {
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setInvoices(data);
        setStores([...new Set(data.map(r => r.store).filter(Boolean))]);
        setOfficers([...new Set(data.map(r => r.received_by).filter(Boolean).map(s => s.trim()))]);
      }
    } catch { setError('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [storeFilter, search, dateFrom, dateTo]);

  useEffect(() => { const t = setTimeout(fetchInvoices, 300); return () => clearTimeout(t); }, [fetchInvoices]);

  const handleMarkReceived = useCallback(async (inv) => {
    if (inv.received) return;
    await axios.put(`${API_URL}/api/invoices/${inv.id}/received`, { received_by: fullName });
    fetchInvoices();
  }, [fetchInvoices, fullName]);

  const filtered = invoices.filter(inv => {
    if (receivedFilter === 'received' && !inv.received) return false;
    if (receivedFilter === 'not_received' && inv.received) return false;
    if (officerFilter && (inv.received_by || '').trim() !== officerFilter.trim()) return false;
    return true;
  });

  const toExportRows = (data) => data.map((inv, i) => ({
    '#': i + 1, 'Customer': inv.facility_name || inv.customer_name || '',
    'Store': inv.store || '', 'ODN': inv.odn_number || '',
    'Invoice #': inv.invoice_number || '', 'Invoice Date': inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '',
    'Folder #': inv.folder_number || '', 'Received': inv.received ? 'Yes' : 'No',
    'Received By': inv.received_by || '', 'Received At': inv.received_at ? new Date(inv.received_at).toLocaleDateString() : '',
  }));

  const handleExport = (receivedOnly) => {
    const data = receivedOnly ? filtered.filter(i => i.received) : filtered;
    const ws = XLSX.utils.json_to_sheet(toExportRows(data));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RDF Invoices');
    XLSX.writeFile(wb, `RDF_Invoices_${receivedOnly ? 'received' : 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns = React.useMemo(() => [
    { field: 'seq', headerName: '#', width: 55, sortable: false, renderCell: (p) => p.api.getRowIndexRelativeToVisibleRows(p.id) + 1 },
    { field: 'facility_name', headerName: 'Customer', flex: 1.5, minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'normal', lineHeight: 1.3 }}>{row.facility_name || row.customer_name || '-'}</Typography>
          {row.customer_type === 'Credit' && <Chip label="Credit" size="small" color="warning" sx={{ mt: 0.3, height: 18, fontSize: '0.7rem' }} />}
        </Box>
      )
    },
    { field: 'store', headerName: 'Store', width: 85, renderCell: ({ value }) => value ? <Chip label={value} size="small" color="primary" /> : '-' },
    { field: 'odn_number', headerName: 'ODN', width: 130, renderCell: ({ value }) => value ? <Typography fontWeight={700} color="secondary.main" variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{value}</Typography> : '-' },
    { field: 'invoice_number', headerName: 'Invoice #', width: 160,
      renderCell: ({ row }) => !row.invoice_number
        ? <Chip label="Not saved" size="small" color="warning" variant="outlined" />
        : <Typography fontWeight={700} color="primary.main" variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.invoice_number}</Typography>
    },
    { field: 'invoice_date', headerName: 'Invoice Date', width: 120, renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : '-' },
    { field: 'region_name', headerName: 'Location', flex: 1.2, minWidth: 150, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          {row.region_name && <Typography variant="body2" fontWeight={700}>{row.region_name}</Typography>}
          {row.zone_name && <Typography variant="body2" fontWeight={500}>{row.zone_name}</Typography>}
          {row.woreda_name && <Typography variant="caption" color="text.secondary" display="block">{row.woreda_name}</Typography>}
        </Box>
      )
    },
    { field: 'created_by_name', headerName: 'Submitted By', width: 150 },
    { field: 'folder_number', headerName: 'Folder #', width: 130,
      renderCell: ({ value }) => value
        ? <Typography variant="body2" fontWeight={700} color="primary.main">{value}</Typography>
        : <Typography variant="caption" color="text.disabled">—</Typography>
    },
    { field: 'received_by', headerName: 'Finance Officer', width: 180,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" fontWeight={600}>{row.received_by || '—'}</Typography>
          {row.received_at && <Typography variant="caption" color="text.secondary">{new Date(row.received_at).toLocaleDateString()}</Typography>}
        </Box>
      )
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [handleMarkReceived]);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
          <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 220 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 110 }}><InputLabel>Store</InputLabel>
            <Select value={storeFilter} label="Store" onChange={e => setStoreFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>{stores.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}><InputLabel>Received</InputLabel>
            <Select value={receivedFilter} label="Received" onChange={e => setReceivedFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem><MenuItem value="received">Received</MenuItem><MenuItem value="not_received">Not Received</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Finance Officer</InputLabel>
            <Select value={officerFilter} label="Finance Officer" onChange={e => setOfficerFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>{officers.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label="From" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 145 }} />
          <TextField size="small" label="To" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 145 }} />
          <Stack direction="row" gap={1} sx={{ ml: 'auto' }}>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={() => handleExport(false)} disabled={!filtered.length}>Export All</Button>
            <Button variant="contained" startIcon={<FileDownload />} onClick={() => handleExport(true)} disabled={!filtered.some(i => i.received)}>Export Received</Button>
          </Stack>
        </Stack>
      </Paper>
      <Paper sx={{ height: 540 }}>
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box> : (
          <DataGrid rows={filtered.map((inv, i) => ({ ...inv, id: inv.id || i }))} columns={columns}
            pageSize={10} rowsPerPageOptions={[10, 25, 50]} disableSelectionOnClick getRowHeight={() => 'auto'}
            sx={{ '& .MuiDataGrid-columnHeaders': { backgroundColor: '#1565c0', color: '#fff', fontWeight: 700 }, '& .MuiDataGrid-row:hover': { backgroundColor: '#e3f2fd' }, '& .MuiDataGrid-cell': { alignItems: 'flex-start', py: 1 } }}
          />
        )}
      </Paper>
    </Box>
  );
};

// ─── HP TAB ─────────────────────────────────────────────────────────────────

const HPTab = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [receivedFilter, setReceivedFilter] = useState('received');
  const [officerFilter, setOfficerFilter] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [officers, setOfficers] = useState([]);
  const fullName = localStorage.getItem('FullName') || '';

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (month) params.month = month;
      if (year) params.year = year;
      if (receivedFilter) params.received = receivedFilter === 'received' ? 'yes' : 'no';
      const res = await api.get(`${API_URL}/api/hp-finance`, { params });
      if (res.data.success) {
        const data = res.data.data || [];
        setRecords(data);
        setOfficers([...new Set(data.map(r => r.received_by).filter(Boolean).map(s => s.trim()))]);
      }
    } catch { setError('Failed to load HP records'); }
    finally { setLoading(false); }
  }, [search, month, year, receivedFilter]);

  useEffect(() => { const t = setTimeout(fetchRecords, 300); return () => clearTimeout(t); }, [fetchRecords]);

  const handleMarkReceived = useCallback(async (row) => {
    if (row.received) return;
    await api.post(`${API_URL}/api/hp-finance/received`, { process_id: row.process_id, received_by: fullName });
    fetchRecords();
  }, [fetchRecords, fullName]);

  const filtered = records.filter(r => {
    if (officerFilter && (r.received_by || '').trim() !== officerFilter.trim()) return false;
    return true;
  });

  const handleExport = (receivedOnly) => {
    const data = receivedOnly ? filtered.filter(r => r.received) : filtered;
    const rows = data.map((r, i) => ({
      '#': i + 1, 'Facility': r.facility_name || '', 'Route': r.route_name || '',
      'Vehicle': r.vehicle_name || '', 'Driver': r.driver_name || '', 'Deliverer': r.deliverer_name || '',
      'ODN': r.odn_numbers || '', 'POD #': r.pod_numbers || '',
      'Reporting Month': r.reporting_month || '', 'Folder #': r.folder_number || '',
      'Received': r.received ? 'Yes' : 'No', 'Received By': r.received_by || '',
      'Received At': r.received_at ? new Date(r.received_at).toLocaleDateString() : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HP Finance');
    XLSX.writeFile(wb, `HP_Finance_${receivedOnly ? 'received' : 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columns = React.useMemo(() => [
    { field: 'seq', headerName: '#', width: 55, sortable: false, renderCell: (p) => p.api.getRowIndexRelativeToVisibleRows(p.id) + 1 },
    { field: 'facility_name', headerName: 'Facility', flex: 1.5, minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'normal', lineHeight: 1.3 }}>{row.facility_name || '-'}</Typography>
          {row.woreda_name && <Typography variant="caption" color="text.secondary">{row.woreda_name}</Typography>}
        </Box>
      )
    },
    { field: 'route_name', headerName: 'Route', width: 140, renderCell: ({ value }) => value ? <Chip label={value} size="small" color="primary" variant="outlined" /> : '-' },
    { field: 'driver_name', headerName: 'Driver / Deliverer', width: 180,
      renderCell: ({ row }) => (row.driver_name || row.deliverer_name) ? (
        <Box sx={{ py: 0.5 }}>
          {row.vehicle_name && <Typography variant="caption" color="primary.main" fontWeight={700} display="block">{row.vehicle_name}</Typography>}
          {row.driver_name && <Typography variant="body2" fontWeight={600}>{row.driver_name}</Typography>}
          {row.deliverer_name && <Typography variant="caption" color="text.secondary">{row.deliverer_name}</Typography>}
        </Box>
      ) : <Typography variant="caption" color="text.secondary">—</Typography>
    },
    { field: 'odn_numbers', headerName: 'ODN(s)', width: 200, renderCell: ({ value }) => value ? <Typography fontWeight={700} color="secondary.main" variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.6, py: 0.5 }}>{value}</Typography> : '-' },
    { field: 'pod_numbers', headerName: 'POD #(s)', width: 180,
      renderCell: ({ value }) => !value
        ? <Chip label="No POD" size="small" color="warning" variant="outlined" />
        : <Typography fontWeight={700} color="success.main" variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.6, py: 0.5 }}>{value}</Typography>
    },
    { field: 'reporting_month', headerName: 'Month', width: 130 },
    { field: 'folder_number', headerName: 'Folder #', width: 130,
      renderCell: ({ value }) => value
        ? <Typography variant="body2" fontWeight={700} color="primary.main">{value}</Typography>
        : <Typography variant="caption" color="text.disabled">—</Typography>
    },
    { field: 'received_by', headerName: 'Finance Officer', width: 180,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" fontWeight={600}>{row.received_by || '—'}</Typography>
          {row.received_at && <Typography variant="caption" color="text.secondary">{new Date(row.received_at).toLocaleDateString()}</Typography>}
        </Box>
      )
    },
    { field: 'submitted_by', headerName: 'Submitted By', width: 150,
      renderCell: ({ value }) => value ? <Typography variant="body2" fontWeight={600}>{value}</Typography> : <Typography variant="caption" color="text.secondary">—</Typography>
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [handleMarkReceived]);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
          <TextField size="small" placeholder="Search facility, ODN, POD..." value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 220 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 140 }}><InputLabel>Month</InputLabel>
            <Select value={month} label="Month" onChange={e => setMonth(e.target.value)}>
              <MenuItem value="">All</MenuItem>{ethiopianMonths.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label="Year" type="number" value={year} onChange={e => setYear(e.target.value)} sx={{ width: 100 }} />
          <FormControl size="small" sx={{ minWidth: 140 }}><InputLabel>Received</InputLabel>
            <Select value={receivedFilter} label="Received" onChange={e => setReceivedFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem><MenuItem value="received">Received</MenuItem><MenuItem value="not_received">Not Received</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Finance Officer</InputLabel>
            <Select value={officerFilter} label="Finance Officer" onChange={e => setOfficerFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>{officers.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </Select>
          </FormControl>
          <Stack direction="row" gap={1} sx={{ ml: 'auto' }}>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={() => handleExport(false)} disabled={!filtered.length}>Export All</Button>
            <Button variant="contained" startIcon={<FileDownload />} onClick={() => handleExport(true)} disabled={!filtered.some(r => r.received)}>Export Received</Button>
          </Stack>
        </Stack>
      </Paper>
      <Paper sx={{ height: 540 }}>
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box> : (
          <DataGrid rows={filtered.map((r, i) => ({ ...r, id: r.process_id }))} columns={columns}
            pageSize={10} rowsPerPageOptions={[10, 25, 50]} disableSelectionOnClick getRowHeight={() => 'auto'}
            sx={{ '& .MuiDataGrid-columnHeaders': { backgroundColor: '#2e7d32', color: '#fff', fontWeight: 700 }, '& .MuiDataGrid-row:hover': { backgroundColor: '#e8f5e9' }, '& .MuiDataGrid-cell': { alignItems: 'flex-start', py: 1, whiteSpace: 'normal !important', lineHeight: '1.6 !important' } }}
          />
        )}
      </Paper>
    </Box>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
// mode: 'rdf' | 'hp' | undefined (shows both tabs)
const FinanceInvoiceView = ({ mode }) => {
  const [tab, setTab] = useState(0);

  if (mode === 'rdf') return <Box sx={{ p: 2 }}><RDFTab /></Box>;
  if (mode === 'hp') return <Box sx={{ p: 2 }}><HPTab /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: 2, bgcolor: '#e3f2fd' }}>
        <Receipt sx={{ fontSize: 32, color: '#1565c0' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Finance Invoice Records</Typography>
          <Typography variant="body2" color="text.secondary">RDF invoices and HP POD documentation</Typography>
        </Box>
      </Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="RDF" />
          <Tab label="Health Program" />
        </Tabs>
      </Paper>
      {tab === 0 && <RDFTab />}
      {tab === 1 && <HPTab />}
    </Box>
  );
};

export default FinanceInvoiceView;
