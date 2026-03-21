import { useState, useEffect, useCallback } from 'react';
import api from '../../axiosInstance';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, Stack,
  MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, IconButton, Tooltip, Divider,
  InputAdornment, Alert, Paper
} from '@mui/material';
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector, GridToolbarQuickFilter } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import RefreshIcon from '@mui/icons-material/Refresh';
import SpeedIcon from '@mui/icons-material/Speed';
import ExcelExportButton from './ExcelExportButton';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const empty = {
  vehicle_id: '', vehicle_name: '', plate_number: '', vehicle_km: '',
  fuel_date: '', amount_liters: '', daily_rate: '',
  gas_station_location: '', notes: ''
};

const FuelLogBook = ({ viewOnly = false }) => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const r = await api.get(`${API_URL}/api/fuel-log-books`);
      if (r.data.success) setLogs(r.data.logs);
    } catch (e) { console.error(e); }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const r = await api.get(`${API_URL}/api/vehicles`);
      setVehicles(Array.isArray(r.data) ? r.data : r.data.vehicles || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchLogs(); fetchVehicles(); }, [fetchLogs, fetchVehicles]);

  const handleVehicleChange = (e) => {
    const v = vehicles.find(v => v.id === e.target.value);
    if (v) setForm(f => ({ ...f, vehicle_id: v.id, vehicle_name: v.vehicle_name, plate_number: v.plate_number }));
  };

  const loggedInName = localStorage.getItem('FullName') || '';

  const handleOpen = (log = null) => {
    setError('');
    if (log) {
      setForm({
        vehicle_id: log.vehicle_id || '', vehicle_name: log.vehicle_name, plate_number: log.plate_number,
        vehicle_km: log.vehicle_km || '',
        fuel_date: log.fuel_date?.slice(0, 10) || '',
        amount_liters: log.amount_liters, daily_rate: log.daily_rate,
        gas_station_location: log.gas_station_location, notes: log.notes || ''
      });
      setEditId(log.id);
    } else {
      setForm({ ...empty });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    const required = ['vehicle_id', 'fuel_date', 'amount_liters', 'daily_rate', 'gas_station_location'];
    if (required.some(k => !form[k])) { setError('Please fill all required fields.'); return; }
    try {
      setSaving(true);
      const payload = { ...form, driver_name: loggedInName };
      if (editId) {
        await api.put(`${API_URL}/api/fuel-log-books/${editId}`, payload);
      } else {
        await api.post(`${API_URL}/api/fuel-log-books`, payload);
      }
      setOpen(false);
      fetchLogs();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fuel log entry?')) return;
    await api.delete(`${API_URL}/api/fuel-log-books/${id}`);
    fetchLogs();
  };

  const totalCost = form.amount_liters && form.daily_rate
    ? (parseFloat(form.amount_liters) * parseFloat(form.daily_rate)).toFixed(2)
    : null;

  // Compute km_per_liter for each row: (this_km - prev_km) / this_liters
  // Group by vehicle, sort by vehicle_km ascending, then assign back
  const logsWithKpl = (() => {
    const byVehicle = {};
    logs.forEach(r => {
      if (!byVehicle[r.vehicle_id]) byVehicle[r.vehicle_id] = [];
      byVehicle[r.vehicle_id].push(r);
    });
    Object.values(byVehicle).forEach(arr =>
      arr.sort((a, b) => parseFloat(a.vehicle_km || 0) - parseFloat(b.vehicle_km || 0))
    );
    const kplMap = {};
    Object.values(byVehicle).forEach(arr => {
      arr.forEach((r, i) => {
        if (i > 0 && r.vehicle_km && arr[i - 1].vehicle_km && parseFloat(r.amount_liters) > 0) {
          const kmDiff = parseFloat(r.vehicle_km) - parseFloat(arr[i - 1].vehicle_km);
          kplMap[r.id] = kmDiff > 0 ? (kmDiff / parseFloat(r.amount_liters)) : null;
        } else {
          kplMap[r.id] = null;
        }
      });
    });
    return logs.map(r => ({ ...r, km_per_liter: kplMap[r.id] }));
  })();

  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ px: 2, py: 1, borderBottom: '1px solid #e2e8f0', gap: 1, flexWrap: 'wrap' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <ExcelExportButton columns={columns} rows={logsWithKpl} fileName="fuel-log-book" />
      <Box sx={{ flex: 1 }} />
      <GridToolbarQuickFilter debounceMs={300} />
    </GridToolbarContainer>
  );

  const wrapCell = (value) => (
    <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>{value}</span>
  );

  const columns = [
    { field: 'id', headerName: '#', width: 60, type: 'number' },
    {
      field: 'vehicle_name', headerName: 'Vehicle', flex: 1, minWidth: 120,
      renderCell: ({ value }) => wrapCell(value)
    },
    {
      field: 'plate_number', headerName: 'Plate', width: 120,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" sx={{ fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1' }} />
      )
    },
    { field: 'driver_name', headerName: 'Driver', flex: 1, minWidth: 130,
      renderCell: ({ value }) => wrapCell(value) },
    {
      field: 'fuel_date', headerName: 'Date', width: 120, type: 'date',
      valueGetter: ({ value }) => value ? new Date(value) : null,
      renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : '—'
    },
    {
      field: 'vehicle_km', headerName: 'Vehicle KM', width: 120, type: 'number',
      renderCell: ({ value }) => value
        ? <Chip label={`${parseFloat(value).toLocaleString()} km`} size="small"
            icon={<SpeedIcon sx={{ fontSize: '0.9rem !important' }} />}
            sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 700 }} />
        : '—'
    },
    { field: 'amount_liters', headerName: 'Liters', width: 100, type: 'number',
      renderCell: ({ value }) => `${parseFloat(value).toFixed(2)} L` },
    { field: 'daily_rate', headerName: 'Rate (ETB)', width: 120, type: 'number',
      renderCell: ({ value }) => `${parseFloat(value).toFixed(2)}` },
    {
      field: 'total_cost', headerName: 'Total Cost', width: 130, type: 'number',
      valueGetter: ({ row }) => parseFloat(row.total_cost || 0),
      renderCell: ({ value }) => (
        <Chip label={`${value.toFixed(2)} ETB`} size="small"
          sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
      )
    },
    {
      field: 'gas_station_location', headerName: 'Gas Station', flex: 1.2, minWidth: 150,
      renderCell: ({ value }) => wrapCell(value)
    },
    {
      field: 'km_per_liter', headerName: 'KM / Liter', width: 120, type: 'number',
      valueGetter: ({ row }) => row.km_per_liter ?? null,
      renderCell: ({ value }) => value != null
        ? <Chip label={`${value.toFixed(2)} km/L`} size="small"
            sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 700 }} />
        : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
    },
    ...(!viewOnly ? [{
      field: 'actions', headerName: 'Actions', width: 100, sortable: false, filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpen(row)} sx={{ color: '#2563eb' }}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(row.id)} sx={{ color: '#dc2626' }}><DeleteIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      )
    }] : [])
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)', borderRadius: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <LocalGasStationIcon sx={{ color: '#fff', fontSize: 40 }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="white">Fuel Log Book</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Track vehicle fueling — date, liters, rate, KM & station
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchLogs} sx={{ color: '#fff' }}><RefreshIcon /></IconButton>
              </Tooltip>
              {!viewOnly && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, fontWeight: 700 }}>
                  New Entry
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* DataGrid */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={logsWithKpl}
          columns={columns}
          autoHeight
          getRowHeight={() => 'auto'}
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          components={{ Toolbar: CustomToolbar }}
          componentsProps={{}}
          disableSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#14532d', color: '#fff', fontWeight: 700 },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
            '& .MuiDataGrid-columnSeparator': { color: 'rgba(255,255,255,0.3)' },
            '& .MuiDataGrid-sortIcon': { color: '#fff' },
            '& .MuiDataGrid-menuIconButton': { color: '#fff' },
            '& .MuiDataGrid-row:nth-of-type(odd)': { bgcolor: '#f0fdf4' },
            '& .MuiDataGrid-row:hover': { bgcolor: '#dcfce7' },
            '& .MuiDataGrid-cell': { alignItems: 'flex-start', py: 1 },
            '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e2e8f0' }
          }}
        />
      </Paper>

      {/* Form Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)', color: '#fff', py: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <LocalGasStationIcon />
            <Typography variant="h6" fontWeight={700}>{editId ? 'Edit Fuel Entry' : 'New Fuel Entry'}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>

            {/* Vehicle */}
            <Grid item xs={12} sm={7}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Vehicle *</InputLabel>
                <Select value={form.vehicle_id} label="Vehicle *" onChange={handleVehicleChange} disabled={!!editId}>
                  {vehicles.map(v => (
                    <MenuItem key={v.id} value={v.id}>{v.vehicle_name} — <strong>{v.plate_number}</strong></MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField fullWidth size="small" label="Plate Number" value={form.plate_number} disabled InputProps={{ readOnly: true }} />
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Date & KM */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Fuel Date *" required type="date"
                value={form.fuel_date} onChange={e => setForm(f => ({ ...f, fuel_date: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Vehicle KM at Fueling" type="number"
                value={form.vehicle_km} onChange={e => setForm(f => ({ ...f, vehicle_km: e.target.value }))}
                InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }} />
            </Grid>

            {/* Fuel details */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Amount (Liters) *" required type="number"
                value={form.amount_liters} onChange={e => setForm(f => ({ ...f, amount_liters: e.target.value }))}
                InputProps={{ endAdornment: <InputAdornment position="end">L</InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Daily Rate (ETB/L) *" required type="number"
                value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))}
                InputProps={{ endAdornment: <InputAdornment position="end">ETB</InputAdornment> }} />
            </Grid>

            {totalCost && (
              <Grid item xs={12}>
                <Chip icon={<LocalGasStationIcon />}
                  label={`Total cost: ${totalCost} ETB`}
                  sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
              </Grid>
            )}

            {/* Station */}
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Gas Station Location *" required
                value={form.gas_station_location}
                onChange={e => setForm(f => ({ ...f, gas_station_location: e.target.value }))} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes" multiline rows={2}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: '#14532d', '&:hover': { bgcolor: '#16a34a' } }}>
            {saving ? 'Saving...' : editId ? 'Update' : 'Save Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FuelLogBook;
