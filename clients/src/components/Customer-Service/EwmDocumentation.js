import React, { useState, useEffect, useCallback } from 'react';
import api from '../../axiosInstance';
import * as XLSX from 'xlsx';
import {
  Box, Typography, TextField, Button, Container, Card, CardContent,
  Chip, CircularProgress, Alert, Tooltip, Tabs, Tab, Paper, Stack,
  FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector, GridToolbarQuickFilter } from '@mui/x-data-grid';
import { Description, Save, Undo, Edit } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Swal from 'sweetalert2';

// Custom toolbar with Excel export — defined outside component to avoid remount
const ExcelToolbar = ({ onExport }) => (
  <GridToolbarContainer sx={{ p: 1, gap: 1, flexWrap: 'wrap' }}>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarDensitySelector />
    <Button size="small" variant="outlined" onClick={onExport} sx={{ ml: 0.5, textTransform: 'none', fontSize: '0.8rem' }}>
      Export Excel
    </Button>
    <Box sx={{ ml: 'auto' }}><GridToolbarQuickFilter debounceMs={300} /></Box>
  </GridToolbarContainer>
);

const EwmDocumentation = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceData, setInvoiceData] = useState({});
  const [saving, setSaving] = useState({});
  const [tab, setTab] = useState(0);
  const [editDialog, setEditDialog] = useState({ open: false, row: null, invoice_number: '', invoice_date: '' });
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyReceived, setHistoryReceived] = useState('');

  // Cross-Docking state
  const [cdRegions, setCdRegions] = useState([]);
  const [cdZones, setCdZones] = useState([]);
  const [cdWoredas, setCdWoredas] = useState([]);
  const [cdFacilities, setCdFacilities] = useState([]);
  const [cdForm, setCdForm] = useState({ region: '', zone: '', woreda: '', facility_id: '', facility_name: '', odn_number: '', invoice_number: '', invoice_date: new Date().toISOString().split('T')[0] });
  const [cdSaving, setCdSaving] = useState(false);
  const [cdHistory, setCdHistory] = useState([]);
  const [cdEditDialog, setCdEditDialog] = useState({ open: false, row: null, odn_number: '', invoice_number: '', invoice_date: '' });

  const userStore = localStorage.getItem('store') || '';
  const userId = localStorage.getItem('EmployeeID');
  const userName = localStorage.getItem('FullName');

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/ewm-completed-customers`, { params: { store: userStore } });
      if (response.data.success) {
        setCustomers(response.data.data);
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
    } catch {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [userStore]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Cross-Docking: fetch regions on mount, fetch CD history when tab=2
  useEffect(() => {
    api.get('/api/regions').then(r => setCdRegions(r.data || [])).catch(() => {});
    fetchCdHistory();
  }, []);

  useEffect(() => {
    if (!cdForm.region) { setCdZones([]); setCdWoredas([]); setCdFacilities([]); return; }
    api.get('/api/zones', { params: { region: cdForm.region } }).then(r => setCdZones(r.data || [])).catch(() => {});
    setCdForm(p => ({ ...p, zone: '', woreda: '', facility_id: '', facility_name: '' }));
    setCdWoredas([]); setCdFacilities([]);
  }, [cdForm.region]);

  useEffect(() => {
    if (!cdForm.zone) { setCdWoredas([]); setCdFacilities([]); return; }
    api.get('/api/woredas', { params: { zone: cdForm.zone } }).then(r => setCdWoredas(r.data || [])).catch(() => {});
    setCdForm(p => ({ ...p, woreda: '', facility_id: '', facility_name: '' }));
    setCdFacilities([]);
  }, [cdForm.zone]);

  useEffect(() => {
    if (!cdForm.woreda) { setCdFacilities([]); return; }
    api.get('/api/filtered-facilities', { params: { woreda: cdForm.woreda } }).then(r => setCdFacilities(r.data || [])).catch(() => {});
    setCdForm(p => ({ ...p, facility_id: '', facility_name: '' }));
  }, [cdForm.woreda]);

  const fetchCdHistory = async () => {
    try {
      const res = await api.get('/api/cross-docking', { params: { store: userStore } });
      setCdHistory(res.data.data || []);
    } catch (_) {}
  };

  const handleCdSave = async () => {
    if (!cdForm.facility_id || !cdForm.odn_number || !cdForm.invoice_number) {
      Swal.fire('Warning', 'Please fill facility, ODN number, and invoice number', 'warning'); return;
    }
    setCdSaving(true);
    try {
      await api.post('/api/cross-docking', {
        ...cdForm, store: userStore, created_by_id: userId, created_by_name: userName
      });
      setCdForm({ region: '', zone: '', woreda: '', facility_id: '', facility_name: '', odn_number: '', invoice_number: '', invoice_date: new Date().toISOString().split('T')[0] });
      fetchCdHistory();
      setTab(1); // switch to History tab
      Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire('Error', 'Failed to save', 'error');
    } finally { setCdSaving(false); }
  };

  const handleCdEditSave = async () => {
    const { row, odn_number, invoice_number, invoice_date } = cdEditDialog;
    try {
      await api.put(`/api/cross-docking/${row.id}/edit`, { odn_number, invoice_number, invoice_date });
      setCdEditDialog({ open: false, row: null, odn_number: '', invoice_number: '', invoice_date: '' });
      fetchCdHistory();
      Swal.fire({ icon: 'success', title: 'Updated', timer: 1200, showConfirmButton: false });
    } catch { Swal.fire('Error', 'Failed to update', 'error'); }
  };

  const handleInvoiceChange = (processId, odnNumber, field, value) => {
    const key = `${processId}-${odnNumber}`;
    setInvoiceData(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSaveInvoice = async (customer) => {
    const key = `${customer.process_id}-${customer.odn_number}`;
    const data = invoiceData[key];
    if (!data?.invoice_number && !customer.invoice_number) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please enter an invoice number' });
      return;
    }
    try {
      setSaving(prev => ({ ...prev, [key]: true }));
      await api.post(`/api/invoices`, {
        process_id: customer.process_id,
        odn_number: customer.odn_number,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date.toISOString().split('T')[0],
        customer_name: customer.customer_name,
        store: customer.store,
        created_by_id: userId,
        created_by_name: userName
      });
      Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false });
      fetchCustomers();
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save invoice' });
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleReturnReceived = async (customer) => {
    const result = await Swal.fire({
      title: 'Return Invoice?',
      text: 'This will unmark the received status so Finance can re-check it.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Yes, Return', confirmButtonColor: '#e65100'
    });
    if (!result.isConfirmed) return;
    try {
      await api.put(`/api/invoices/${customer.invoice_id}/return`, { returned_by: userName });
      Swal.fire({ icon: 'success', title: 'Returned', timer: 1200, showConfirmButton: false });
      fetchCustomers();
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to return' });
    }
  };

  const handleEditSave = async () => {
    const { row, invoice_number, invoice_date } = editDialog;
    if (!invoice_number) {
      Swal.fire({ icon: 'warning', title: 'Invoice number is required' });
      return;
    }
    const key = `${row.process_id}-${row.odn_number}`;
    try {
      setSaving(prev => ({ ...prev, [key]: true }));
      await api.post(`/api/invoices`, {
        process_id: row.process_id,
        odn_number: row.odn_number,
        invoice_number,
        invoice_date,
        customer_name: row.customer_name,
        store: row.store,
        created_by_id: userId,
        created_by_name: userName
      });
      Swal.fire({ icon: 'success', title: 'Updated', timer: 1200, showConfirmButton: false });
      setEditDialog({ open: false, row: null, invoice_number: '', invoice_date: '' });
      fetchCustomers();
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to update' });
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const inProgress = customers.filter(c => !c.invoice_number);
  const history = customers.filter(c => {
    if (!c.invoice_number) return false;
    if (historyReceived === 'yes' && !c.received) return false;
    if (historyReceived === 'no' && c.received) return false;
    if (historyDateFrom && c.invoice_date && new Date(c.invoice_date) < new Date(historyDateFrom)) return false;
    if (historyDateTo && c.invoice_date && new Date(c.invoice_date) > new Date(historyDateTo + 'T23:59:59')) return false;
    return true;
  });

  const exportToExcel = (data, sheetName, fileName) => {
    const rows = data.map((c, i) => ({
      '#': i + 1,
      'Customer': c.customer_name || '',
      'Store': c.store || '',
      'Region': c.region_name || '',
      'Zone': c.zone_name || '',
      'Woreda': c.woreda_name || '',
      'ODN Number': c.odn_number || '',
      'Invoice Number': c.invoice_number || '',
      'Invoice Date': c.invoice_date ? new Date(c.invoice_date).toLocaleDateString() : '',
      'Received': c.received ? 'Yes' : 'No',
      'Received By': c.received_by || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const gridSx = (headerColor) => ({
    border: 0,
    '& .MuiDataGrid-columnHeaders': { backgroundColor: headerColor, color: '#fff', fontWeight: 700 },
    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
    '& .MuiDataGrid-row:hover': { backgroundColor: '#f5f5f5' },
    '& .MuiDataGrid-cell': { alignItems: 'flex-start', py: 1 },
  });

  // In-progress columns — editable invoice entry
  const inProgressColumns = [
    {
      field: 'seq', headerName: '#', width: 55, sortable: false,
      renderCell: (params) => params.api.getRowIndex(params.id) + 1,
    },
    {
      field: 'customer_name', headerName: 'Customer', flex: 1.5, minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'normal', lineHeight: 1.3 }}>{row.customer_name || '—'}</Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.3 }}>
            <Chip label={row.store} size="small" color="primary" />
            {row.customer_type && <Chip label={row.customer_type} size="small" color={row.customer_type === 'SRM' ? 'secondary' : row.customer_type === 'Credit' ? 'warning' : 'success'} variant="outlined" />}
          </Stack>
        </Box>
      ),
    },
    {
      field: 'region_name', headerName: 'Location', flex: 1.2, minWidth: 150,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          {row.region_name && <Typography variant="body2" fontWeight={700}>{row.region_name}</Typography>}
          {row.zone_name && <Typography variant="body2">{row.zone_name}</Typography>}
          {row.woreda_name && <Typography variant="caption" color="text.secondary">{row.woreda_name}</Typography>}
        </Box>
      ),
    },
    {
      field: 'odn_number', headerName: 'ODN Number', width: 150,
      renderCell: ({ value }) => (
        <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{value}</Typography>
      ),
    },
    {
      field: 'invoice_date', headerName: 'Invoice Date', width: 180, sortable: false,
      renderCell: ({ row }) => {
        const key = `${row.process_id}-${row.odn_number}`;
        const data = invoiceData[key] || {};
        return (
          <DatePicker value={data.invoice_date || new Date()}
            onChange={(v) => handleInvoiceChange(row.process_id, row.odn_number, 'invoice_date', v)}
            renderInput={(params) => <TextField {...params} size="small" sx={{ width: 155 }} />} />
        );
      },
    },
    {
      field: 'invoice_number', headerName: 'Invoice Number', width: 200, sortable: false,
      renderCell: ({ row }) => {
        const key = `${row.process_id}-${row.odn_number}`;
        const data = invoiceData[key] || {};
        return (
          <TextField size="small" placeholder="Enter invoice #" multiline minRows={2}
            value={data.invoice_number || ''}
            onChange={(e) => handleInvoiceChange(row.process_id, row.odn_number, 'invoice_number', e.target.value)}
            sx={{ width: 180 }} />
        );
      },
    },
    {
      field: 'actions', headerName: 'Actions', width: 110, sortable: false,
      renderCell: ({ row }) => {
        const key = `${row.process_id}-${row.odn_number}`;
        const data = invoiceData[key] || {};
        const isSaving = saving[key];
        return (
          <Button variant="contained" size="small"
            startIcon={isSaving ? <CircularProgress size={14} /> : <Save />}
            onClick={() => handleSaveInvoice(row)}
            disabled={isSaving || !data.invoice_number}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}>Save</Button>
        );
      },
    },
  ];

  // History columns — read-only with update + return
  const historyColumns = [
    {
      field: 'seq', headerName: '#', width: 55, sortable: false,
      renderCell: (params) => params.api.getRowIndex(params.id) + 1,
    },
    {
      field: 'customer_name', headerName: 'Customer', flex: 1.5, minWidth: 180,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'normal', lineHeight: 1.3 }}>{row.customer_name || '—'}</Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.3 }}>
            <Chip label={row.store} size="small" color="primary" />
            {row.customer_type && <Chip label={row.customer_type} size="small" color={row.customer_type === 'SRM' ? 'secondary' : row.customer_type === 'Credit' ? 'warning' : 'success'} variant="outlined" />}
          </Stack>
        </Box>
      ),
    },
    {
      field: 'region_name', headerName: 'Location', flex: 1.2, minWidth: 150,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.5 }}>
          {row.region_name && <Typography variant="body2" fontWeight={700}>{row.region_name}</Typography>}
          {row.zone_name && <Typography variant="body2">{row.zone_name}</Typography>}
          {row.woreda_name && <Typography variant="caption" color="text.secondary">{row.woreda_name}</Typography>}
        </Box>
      ),
    },
    {
      field: 'odn_number', headerName: 'ODN Number', width: 150,
      renderCell: ({ value }) => (
        <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{value}</Typography>
      ),
    },
    {
      field: 'invoice_number', headerName: 'Invoice Number', width: 170,
      renderCell: ({ value }) => (
        <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{value || '—'}</Typography>
      ),
    },
    {
      field: 'invoice_date', headerName: 'Invoice Date', width: 120,
      renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : '—',
    },
    {
      field: 'received_by', headerName: 'Received By', width: 160,
      renderCell: ({ row }) => !row.received
        ? <Typography variant="caption" color="text.secondary">—</Typography>
        : (
          <Box>
            <Typography variant="body2" fontWeight={600} color="success.main">{row.received_by || '—'}</Typography>
            {row.received_at && <Typography variant="caption" color="text.secondary">{new Date(row.received_at).toLocaleDateString()}</Typography>}
          </Box>
        ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false,
      renderCell: ({ row }) => {
        const key = `${row.process_id}-${row.odn_number}`;
        const isSaving = saving[key];
        return (
          <Stack spacing={0.5}>
            {!!row.received ? (
              <Tooltip title="Undo received — return to Finance">
                <Button variant="outlined" size="small" color="warning" startIcon={<Undo />}
                  onClick={() => handleReturnReceived(row)} sx={{ textTransform: 'none' }}>Return</Button>
              </Tooltip>
            ) : (
              <Button variant="contained" size="small" color="primary"
                startIcon={isSaving ? <CircularProgress size={14} /> : <Save />}
                onClick={() => setEditDialog({ open: true, row, invoice_number: row.invoice_number || '', invoice_date: row.invoice_date ? new Date(row.invoice_date).toISOString().split('T')[0] : '' })}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}>Edit</Button>
            )}
          </Stack>
        );
      },
    },
  ];

  const toRows = (data) => data.map((c, i) => ({ ...c, id: c.invoice_id || `${c.process_id}-${c.odn_number}-${i}` }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Description sx={{ fontSize: 56, color: 'white' }} />
              <Box>
                <Typography variant="h4" fontWeight="bold" color="white">EWM Documentation</Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Invoice Management for Completed EWM Processes — Store: {userStore}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading...</Typography>
          </Box>
        ) : (
          <>
            <Paper sx={{ mb: 2 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label={`In Progress (${inProgress.length})`} />
                <Tab label={`History (${history.length})`} />
                <Tab label="Cross-Docking" />
              </Tabs>
            </Paper>

            {tab === 0 && (
              <Paper sx={{ height: 600 }}>
                <DataGrid
                  rows={toRows(inProgress)}
                  columns={inProgressColumns}
                  getRowHeight={() => 'auto'}
                  disableSelectionOnClick
                  components={{ Toolbar: ExcelToolbar }}
                  componentsProps={{ toolbar: { onExport: () => exportToExcel(inProgress, 'In Progress', `EWM_InProgress_${userStore}`) } }}
                  pageSize={25}
                  rowsPerPageOptions={[10, 25, 50]}
                  sx={gridSx('#1976d2')}
                />
              </Paper>
            )}

            {tab === 1 && (
              <Paper sx={{ height: 650 }}>
                <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Received</InputLabel>
                    <Select value={historyReceived} label="Received" onChange={e => setHistoryReceived(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="yes">Received</MenuItem>
                      <MenuItem value="no">Not Received</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField size="small" label="From" type="date" value={historyDateFrom}
                    onChange={e => setHistoryDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                  <TextField size="small" label="To" type="date" value={historyDateTo}
                    onChange={e => setHistoryDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                  {(historyReceived || historyDateFrom || historyDateTo) && (
                    <Button size="small" onClick={() => { setHistoryReceived(''); setHistoryDateFrom(''); setHistoryDateTo(''); }}>
                      Clear
                    </Button>
                  )}
                </Box>
                <Box sx={{ height: 590 }}>
                  <DataGrid
                    rows={toRows(history)}
                    columns={historyColumns}
                    getRowHeight={() => 'auto'}
                    disableSelectionOnClick
                    components={{ Toolbar: ExcelToolbar }}
                    componentsProps={{ toolbar: { onExport: () => exportToExcel(history, 'History', `EWM_History_${userStore}`) } }}
                    pageSize={25}
                    rowsPerPageOptions={[10, 25, 50]}
                    sx={gridSx('#5c35a0')}
                  />
                </Box>
              </Paper>
            )}

            {tab === 1 && cdHistory.length > 0 && (
              <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} color="#00695c" gutterBottom>Cross-Docking Records</Typography>
                <DataGrid
                  rows={cdHistory.map((r, i) => ({ ...r, id: r.id || i }))}
                  columns={[
                    { field: 'facility_name', headerName: 'Facility', flex: 1.5, minWidth: 180,
                      renderCell: ({ row }) => (
                        <Box sx={{ py: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>{row.facility_name || '—'}</Typography>
                          <Chip label="Cross-Docking" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.65rem', mt: 0.3 }} />
                        </Box>
                      )
                    },
                    { field: 'odn_number', headerName: 'ODN', width: 180 },
                    { field: 'invoice_number', headerName: 'Invoice #', width: 150 },
                    { field: 'invoice_date', headerName: 'Invoice Date', width: 130, renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : '—' },
                    { field: 'created_by_name', headerName: 'Submitted By', width: 160 },
                    { field: 'received', headerName: 'Received', width: 110,
                      renderCell: ({ value }) => value
                        ? <Chip label="Yes" size="small" color="success" />
                        : <Chip label="No" size="small" color="warning" variant="outlined" />
                    },
                    { field: 'received_by', headerName: 'Received By', width: 170,
                      renderCell: ({ row }) => !row.received ? '—' : (
                        <Box sx={{ py: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>{row.received_by || '—'}</Typography>
                          {row.received_at && <Typography variant="caption" color="text.secondary">{new Date(row.received_at).toLocaleDateString()}</Typography>}
                        </Box>
                      )
                    },
                    { field: 'created_at', headerName: 'Date', width: 160, renderCell: ({ value }) => value ? new Date(value).toLocaleString() : '—' },
                    { field: 'actions', headerName: 'Actions', width: 100, sortable: false,
                      renderCell: ({ row }) => !row.received ? (
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => setCdEditDialog({ open: true, row, odn_number: row.odn_number || '', invoice_number: row.invoice_number || '', invoice_date: row.invoice_date ? row.invoice_date.split('T')[0] : '' })}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null
                    },
                  ]}
                  autoHeight
                  disableSelectionOnClick
                  pageSize={10}
                  rowsPerPageOptions={[10, 25]}
                  sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { backgroundColor: '#00695c', color: '#fff', fontWeight: 700 } }}
                />
              </Paper>
            )}
            {tab === 2 && (
              <Box>
                {/* Cross-Docking Form */}
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>New Cross-Docking Entry</Typography>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Region</InputLabel>
                        <Select value={cdForm.region} label="Region" onChange={e => setCdForm(p => ({ ...p, region: e.target.value }))}>
                          {cdRegions.map(r => <MenuItem key={r.region_name} value={r.region_name}>{r.region_name}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small" disabled={!cdForm.region}>
                        <InputLabel>Zone</InputLabel>
                        <Select value={cdForm.zone} label="Zone" onChange={e => setCdForm(p => ({ ...p, zone: e.target.value }))}>
                          {cdZones.map(z => <MenuItem key={z.zone_name} value={z.zone_name}>{z.zone_name}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small" disabled={!cdForm.zone}>
                        <InputLabel>Woreda</InputLabel>
                        <Select value={cdForm.woreda} label="Woreda" onChange={e => setCdForm(p => ({ ...p, woreda: e.target.value }))}>
                          {cdWoredas.map(w => <MenuItem key={w.woreda_name} value={w.woreda_name}>{w.woreda_name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <FormControl fullWidth size="small" disabled={!cdForm.woreda}>
                        <InputLabel>Facility</InputLabel>
                        <Select value={cdForm.facility_id} label="Facility" onChange={e => {
                          const f = cdFacilities.find(x => x.id === e.target.value);
                          setCdForm(p => ({ ...p, facility_id: e.target.value, facility_name: f?.facility_name || '' }));
                        }}>
                          {cdFacilities.map(f => <MenuItem key={f.id} value={f.id}>{f.facility_name}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField fullWidth size="small" label="ODN Number(s)" value={cdForm.odn_number}
                        onChange={e => setCdForm(p => ({ ...p, odn_number: e.target.value }))}
                        placeholder="e.g. ODN001, ODN002" />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField fullWidth size="small" label="Invoice Number" value={cdForm.invoice_number}
                        onChange={e => setCdForm(p => ({ ...p, invoice_number: e.target.value }))} />
                      <TextField fullWidth size="small" label="Invoice Date" type="date" value={cdForm.invoice_date}
                        onChange={e => setCdForm(p => ({ ...p, invoice_date: e.target.value }))}
                        InputLabelProps={{ shrink: true }} />
                    </Stack>
                    <Box>
                      <Button variant="contained" startIcon={<Save />} onClick={handleCdSave} disabled={cdSaving}>
                        {cdSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Edit Invoice Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, row: null, invoice_number: '', invoice_date: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth size="small" label="Invoice Number" value={editDialog.invoice_number}
              onChange={e => setEditDialog(prev => ({ ...prev, invoice_number: e.target.value }))} />
            <TextField fullWidth size="small" label="Invoice Date" type="date" value={editDialog.invoice_date}
              onChange={e => setEditDialog(prev => ({ ...prev, invoice_date: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, row: null, invoice_number: '', invoice_date: '' })}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleEditSave}
            disabled={!editDialog.invoice_number}>Save</Button>
        </DialogActions>
      </Dialog>
      {/* Cross-Docking Edit Dialog */}
      <Dialog open={cdEditDialog.open} onClose={() => setCdEditDialog({ open: false, row: null, odn_number: '', invoice_number: '', invoice_date: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Cross-Docking Record</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth size="small" label="ODN Number(s)" value={cdEditDialog.odn_number}
              onChange={e => setCdEditDialog(p => ({ ...p, odn_number: e.target.value }))} />
            <TextField fullWidth size="small" label="Invoice Number" value={cdEditDialog.invoice_number}
              onChange={e => setCdEditDialog(p => ({ ...p, invoice_number: e.target.value }))} />
            <TextField fullWidth size="small" label="Invoice Date" type="date" value={cdEditDialog.invoice_date}
              onChange={e => setCdEditDialog(p => ({ ...p, invoice_date: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCdEditDialog({ open: false, row: null, odn_number: '', invoice_number: '', invoice_date: '' })}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleCdEditSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EwmDocumentation;
