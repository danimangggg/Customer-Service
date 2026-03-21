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
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import RefreshIcon from '@mui/icons-material/Refresh';
import SpeedIcon from '@mui/icons-material/Speed';
import ExcelExportButton from './ExcelExportButton';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const empty = {
  vehicle_id: '', vehicle_name: '', plate_number: '',
  departure_place: '', arrival_place: '',
  departure_km: '', arrival_km: '', departure_time: '', arrival_time: '',
  reason_of_travel: '', notes: ''
};

const VehicleLogSheet = ({ viewOnly = false }) => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const r = await api.get(`${API_URL}/api/vehicle-log-sheets`);
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
        vehicle_id: log.vehicle_id, vehicle_name: log.vehicle_name, plate_number: log.plate_number,
        departure_place: log.departure_place, arrival_place: log.arrival_place,
        departure_km: log.departure_km, arrival_km: log.arrival_km,
        departure_time: log.departure_time?.slice(0, 16) || '',
        arrival_time: log.arrival_time?.slice(0, 16) || '',
        reason_of_travel: log.reason_of_travel, notes: log.notes || ''
      });
      setEditId(log.id);
    } else {
      setForm({ ...empty });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    const required = ['vehicle_id', 'departure_place', 'arrival_place', 'departure_km', 'arrival_km', 'departure_time', 'reason_of_travel'];
    if (required.some(k => !form[k])) { setError('Please fill all required fields.'); return; }
    if (parseFloat(form.arrival_km) < parseFloat(form.departure_km)) {
      setError('Arrival KM must be ≥ departure KM.'); return;
    }
    try {
      setSaving(true);
      const payload = { ...form, driver_name: loggedInName };
      if (editId) {
        await api.put(`${API_URL}/api/vehicle-log-sheets/${editId}`, payload);
      } else {
        await api.post(`${API_URL}/api/vehicle-log-sheets`, payload);
      }
      setOpen(false);
      fetchLogs();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this log entry?')) return;
    await api.delete(`${API_URL}/api/vehicle-log-sheets/${id}`);
    fetchLogs();
  };

  const fmtDT = (dt) => dt ? new Date(dt).toLocaleString() : '—';

  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ px: 2, py: 1, borderBottom: '1px solid #e2e8f0', gap: 1, flexWrap: 'wrap' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <ExcelExportButton columns={columns} rows={logs} fileName="vehicle-log-sheet" />
      <Box sx={{ flex: 1 }} />
      <GridToolbarQuickFilter debounceMs={300} />
    </GridToolbarContainer>
  );

  const columns = [
    { field: 'id', headerName: '#', width: 60, type: 'number' },
    { field: 'vehicle_name', headerName: 'Vehicle', flex: 1, minWidth: 120,
      renderCell: ({ value }) => <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>{value}</span> },
    {
      field: 'plate_number', headerName: 'Plate', width: 120,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" sx={{ fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1' }} />
      )
    },
    { field: 'driver_name', headerName: 'Driver', flex: 1, minWidth: 130,
      renderCell: ({ value }) => <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>{value}</span> },
    { field: 'departure_place', headerName: 'From', flex: 1, minWidth: 120,
      renderCell: ({ value }) => <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>{value}</span> },
    { field: 'arrival_place', headerName: 'To', flex: 1, minWidth: 120,
      renderCell: ({ value }) => <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>{value}</span> },
    {
      field: 'departure_time', headerName: 'Dep. Time', width: 160, type: 'dateTime',
      valueGetter: ({ value }) => value ? new Date(value) : null,
      renderCell: ({ value }) => fmtDT(value)
    },
    {
      field: 'arrival_time', headerName: 'Arr. Time', width: 160, type: 'dateTime',
      valueGetter: ({ value }) => value ? new Date(value) : null,
      renderCell: ({ value }) => fmtDT(value)
    },
    { field: 'departure_km', headerName: 'Dep. KM', width: 100, type: 'number' },
    { field: 'arrival_km', headerName: 'Arr. KM', width: 100, type: 'number' },
    {
      field: 'total_km', headerName: 'Total KM', width: 110, type: 'number',
      valueGetter: ({ row }) => parseFloat(row.total_km || 0),
      renderCell: ({ value }) => (
        <Chip label={`${value.toFixed(1)} km`} size="small"
          icon={<SpeedIcon sx={{ fontSize: '0.9rem !important' }} />}
          sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
      )
    },
    {
      field: 'reason_of_travel', headerName: 'Reason', flex: 1.5, minWidth: 150,
      renderCell: ({ value }) => (
        <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4, padding: '6px 0' }}>{value}</span>
      )
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
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)', borderRadius: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <DirectionsCarIcon sx={{ color: '#fff', fontSize: 40 }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="white">Vehicle Log Sheet</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Record vehicle trips — departure, arrival, KM & purpose
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
          rows={logs}
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
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#1e3a5f', color: '#fff', fontWeight: 700 },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
            '& .MuiDataGrid-columnSeparator': { color: 'rgba(255,255,255,0.3)' },
            '& .MuiDataGrid-sortIcon': { color: '#fff' },
            '& .MuiDataGrid-menuIconButton': { color: '#fff' },
            '& .MuiDataGrid-filterIcon': { color: '#fff' },
            '& .MuiDataGrid-row:nth-of-type(odd)': { bgcolor: '#f8fafc' },
            '& .MuiDataGrid-row:hover': { bgcolor: '#e0f2fe' },
            '& .MuiDataGrid-cell': { alignItems: 'flex-start', py: 1 },
            '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e2e8f0' }
          }}
        />
      </Paper>

      {/* Form Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)', color: '#fff', py: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <DirectionsCarIcon />
            <Typography variant="h6" fontWeight={700}>{editId ? 'Edit Log Entry' : 'New Vehicle Log Entry'}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Vehicle *</InputLabel>
                <Select value={form.vehicle_id} label="Vehicle *" onChange={handleVehicleChange} disabled={!!editId}>
                  {vehicles.map(v => (
                    <MenuItem key={v.id} value={v.id}>{v.vehicle_name} — <strong>{v.plate_number}</strong></MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Plate Number" value={form.plate_number} disabled InputProps={{ readOnly: true }} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Reason of Travel *" required value={form.reason_of_travel}
                onChange={e => setForm(f => ({ ...f, reason_of_travel: e.target.value }))} />
            </Grid>

            <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption" color="text.secondary">Departure</Typography></Divider></Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Departure Place *" required value={form.departure_place}
                onChange={e => setForm(f => ({ ...f, departure_place: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Departure KM *" required type="number" value={form.departure_km}
                onChange={e => setForm(f => ({ ...f, departure_km: e.target.value }))}
                InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Departure Time *" required type="datetime-local"
                value={form.departure_time} onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12}><Divider textAlign="left"><Typography variant="caption" color="text.secondary">Arrival</Typography></Divider></Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Arrival Place *" required value={form.arrival_place}
                onChange={e => setForm(f => ({ ...f, arrival_place: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Arrival KM" type="number" value={form.arrival_km}
                onChange={e => setForm(f => ({ ...f, arrival_km: e.target.value }))}
                InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Arrival Time" type="datetime-local"
                value={form.arrival_time} onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>

            {form.departure_km && form.arrival_km && parseFloat(form.arrival_km) >= parseFloat(form.departure_km) && (
              <Grid item xs={12}>
                <Chip icon={<SpeedIcon />}
                  label={`Total distance: ${(parseFloat(form.arrival_km) - parseFloat(form.departure_km)).toFixed(1)} km`}
                  sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes" multiline rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#2d6a9f' } }}>
            {saving ? 'Saving...' : editId ? 'Update' : 'Save Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleLogSheet;
