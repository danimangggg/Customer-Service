import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Card, Button, Container,
  TablePagination, Stack, Box, Chip, Avatar, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Divider, IconButton
} from '@mui/material';
import {
  LocalShipping as TruckIcon, DirectionsCar as CarIcon,
  Person as PersonIcon, Groups as GroupsIcon,
  CheckCircle as CheckIcon, HourglassEmpty as PendingIcon,
  Info as InfoIcon, Add as AddIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../../axiosInstance';
import Swal from 'sweetalert2';
import { successToast } from '../../../utils/toast';

const READY_STATUSES = [
  'biller_completed','ewm_completed','tm_notified','tm_confirmed',
  'freight_order_sent_to_ewm','ewm_goods_issued','driver_assigned','dispatched','vehicle_requested'
];

const TMManager = () => {
  const [phase1Routes, setPhase1Routes] = useState([]);
  const [phase2Routes, setPhase2Routes] = useState([]);
  const [page1, setPage1] = useState(0);
  const [page2, setPage2] = useState(0);
  const [rowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('phase1');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [detailRoute, setDetailRoute] = useState(null);

  // Phase 1: list of { vehicle_id, vehicle_name, facility_ids[] }
  const [vehicleAssignments, setVehicleAssignments] = useState([]);

  // Phase 2: list of { vehicle_id, vehicle_name, driver_id, driver_name, deliverer_id, deliverer_name, departure_kilometer, facility_ids[] }
  const [driverAssignments, setDriverAssignments] = useState([]);

  const loggedInUserId = localStorage.getItem('UserId');
  const loggedInUserName = localStorage.getItem('FullName');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isTMManager = userJobTitle === 'TM Manager';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const getCurrentEthiopianMonth = () => {
    const ethiopianMonths = ['Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'];
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
      const prevIsLeap = ((gy-1) % 4 === 0 && (gy-1) % 100 !== 0) || ((gy-1) % 400 === 0);
      const diffDays = Math.floor((gDate - new Date(gy-1, 8, prevIsLeap ? 12 : 11)) / 86400000);
      ethMonthIndex = diffDays < 360 ? Math.floor(diffDays / 30) : 12;
    }
    return { month: ethiopianMonths[Math.max(0, Math.min(ethMonthIndex, 12))], year: ethYear };
  };

  const currentEthiopian = getCurrentEthiopianMonth();

  const fetchAll = async () => {
    try {
      setLoading(true); setError(null);
      const params = { month: currentEthiopian.month, year: currentEthiopian.year };
      const [r1, r2] = await Promise.all([
        api.get(`${api_url}/api/tm-routes`, { params }),
        api.get(`${api_url}/api/tm-phase2-routes`, { params })
      ]);
      setPhase1Routes(r1.data.routes || []);
      setPhase2Routes(r2.data.routes || []);
    } catch (err) { setError('Failed to load TM data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); fetchVehicles(); fetchDriversAndDeliverers(); }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const params = { month: currentEthiopian.month, year: currentEthiopian.year };
        const [r1, r2] = await Promise.all([
          api.get(`${api_url}/api/tm-routes`, { params }),
          api.get(`${api_url}/api/tm-phase2-routes`, { params })
        ]);
        setPhase1Routes(r1.data.routes || []);
        setPhase2Routes(r2.data.routes || []);
      } catch (_) {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchVehicles = async () => {
    try { const res = await api.get(`${api_url}/api/vehicles/available`); setVehicles(res.data || []); } catch (e) {}
  };
  const fetchDriversAndDeliverers = async () => {
    try {
      const [d, dl] = await Promise.all([api.get(`${api_url}/api/drivers/available`), api.get(`${api_url}/api/deliverers/available`)]);
      setDrivers(d.data || []); setDeliverers(dl.data || []);
    } catch (e) {}
  };

  const isFacilityReady = (f) =>
    READY_STATUSES.includes(f.process_status) || f.rrf_not_sent === 1 || f.quality_confirmed === 1;

  const isRouteReady = (route) =>
    route.total_facilities > 0 && Number(route.total_facilities) === Number(route.ready_facilities);

  // ── Phase 1 helpers ──────────────────────────────────────────────────────
  const openPhase1Dialog = (route) => {
    setSelectedRoute(route);
    const allFacilityIds = (route.facilities || []).filter(isFacilityReady).map(f => f.id);
    // Single vehicle: pre-assign all facilities, no need to show facility checkboxes
    setVehicleAssignments([{ vehicle_id: '', vehicle_name: '', facility_ids: allFacilityIds }]);
    setDialogType('phase1');
    setOpenDialog(true);
  };

  const addVehicleRow = () => {
    setVehicleAssignments(prev => {
      // When adding a second vehicle, clear all facility assignments so user distributes manually
      const updated = prev.length === 1
        ? [{ ...prev[0], facility_ids: [] }]
        : [...prev];
      return [...updated, { vehicle_id: '', vehicle_name: '', facility_ids: [] }];
    });
  };

  const removeVehicleRow = (idx) => {
    setVehicleAssignments(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      // If back to single vehicle, re-assign all facilities to it
      if (updated.length === 1) {
        const allFacilityIds = (selectedRoute?.facilities || []).filter(isFacilityReady).map(f => f.id);
        return [{ ...updated[0], facility_ids: allFacilityIds }];
      }
      return updated;
    });
  };

  const updateVehicleRow = (idx, field, value) => {
    setVehicleAssignments(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      if (field === 'vehicle_id') {
        const v = vehicles.find(v => v.id === value);
        return { ...row, vehicle_id: value, vehicle_name: v?.vehicle_name || '' };
      }
      return { ...row, [field]: value };
    }));
  };

  const toggleFacilityForVehicle = (vehicleIdx, facilityId) => {
    setVehicleAssignments(prev => prev.map((row, i) => {
      if (i !== vehicleIdx) return row;
      const has = row.facility_ids.includes(facilityId);
      return { ...row, facility_ids: has ? row.facility_ids.filter(id => id !== facilityId) : [...row.facility_ids, facilityId] };
    }));
  };

  const handleSaveVehicles = async () => {
    for (const row of vehicleAssignments) {
      if (!row.vehicle_id) { Swal.fire('Error', 'Please select a vehicle for each row', 'error'); return; }
      if (row.facility_ids.length === 0) { Swal.fire('Error', 'Each vehicle must have at least one facility selected', 'error'); return; }
    }
    try {
      await api.post(`${api_url}/api/tm-create-freight-order`, {
        route_name: selectedRoute.route_name,
        reporting_month: `${currentEthiopian.month} ${currentEthiopian.year}`,
        vehicle_assignments: vehicleAssignments,
        tm_officer_id: loggedInUserId, tm_officer_name: loggedInUserName
      });
      successToast('Vehicles assigned to route facilities');
      setOpenDialog(false); fetchAll();
    } catch (err) { Swal.fire('Error', 'Failed to assign vehicles', 'error'); }
  };

  // ── Phase 2 helpers ──────────────────────────────────────────────────────
  const openPhase2Dialog = (route) => {
    setSelectedRoute(route);
    // Group facilities by their assigned vehicle_id
    const vehicleMap = {};
    (route.facilities || []).forEach(f => {
      if (f.vehicle_id) {
        if (!vehicleMap[f.vehicle_id]) {
          vehicleMap[f.vehicle_id] = { vehicle_id: f.vehicle_id, vehicle_name: f.vehicle_name || '', driver_id: '', driver_name: '', deliverer_id: '', deliverer_name: '', departure_kilometer: '', facility_ids: [] };
        }
        vehicleMap[f.vehicle_id].facility_ids.push(f.id);
      }
    });
    const rows = Object.values(vehicleMap);
    setDriverAssignments(rows.length > 0 ? rows : [{ vehicle_id: '', vehicle_name: '', driver_id: '', driver_name: '', deliverer_id: '', deliverer_name: '', departure_kilometer: '', facility_ids: [] }]);
    setDialogType('phase2');
    setOpenDialog(true);
  };

  const updateDriverRow = (idx, field, value) => {
    setDriverAssignments(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      if (field === 'driver_id') {
        const d = drivers.find(d => d.id === value);
        return { ...row, driver_id: value, driver_name: d?.full_name || '' };
      }
      if (field === 'deliverer_id') {
        const d = deliverers.find(d => d.id === value);
        return { ...row, deliverer_id: value, deliverer_name: d?.full_name || '' };
      }
      return { ...row, [field]: value };
    }));
  };

  const handleSaveDrivers = async () => {
    for (const row of driverAssignments) {
      if (!row.driver_id) { Swal.fire('Error', 'Please select a driver for each vehicle', 'error'); return; }
      if (!row.departure_kilometer || isNaN(row.departure_kilometer)) { Swal.fire('Error', 'Please enter departure kilometer for each vehicle', 'error'); return; }
    }
    try {
      await api.post(`${api_url}/api/tm-assign-vehicle`, {
        route_name: selectedRoute.route_name,
        reporting_month: `${currentEthiopian.month} ${currentEthiopian.year}`,
        driver_assignments: driverAssignments,
        tm_officer_id: loggedInUserId, tm_officer_name: loggedInUserName
      });
      successToast('Drivers assigned to route vehicles');
      setOpenDialog(false); fetchAll();
    } catch (err) { Swal.fire('Error', 'Failed to assign drivers', 'error'); }
  };

  if (!isTMManager) return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Alert severity="error"><Typography variant="h6">Access Denied</Typography><Typography>This page is restricted to TM Manager role only.</Typography></Alert>
    </Container>
  );

  const RouteTable = ({ routes, page, setPage, color, phase, onAction, actionLabel, actionIcon }) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ '& .MuiTableCell-head': { bgcolor: color, color: 'white', fontWeight: 700 } }}>
            <TableCell>Route</TableCell>
            <TableCell align="center">Facilities</TableCell>
            <TableCell align="center">Ready</TableCell>
            {phase === 2 && <TableCell>Vehicles</TableCell>}
            <TableCell align="center">Details</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {routes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((route) => {
            const ready = isRouteReady(route);
            return (
              <TableRow key={route.route_name} hover>
                <TableCell><Chip label={route.route_name} size="small" variant="outlined" color="secondary" /></TableCell>
                <TableCell align="center"><Typography variant="body2" fontWeight={600}>{route.total_facilities}</Typography></TableCell>
                <TableCell align="center">
                  <Chip label={`${route.ready_facilities || 0} / ${route.total_facilities}`} size="small" color={ready ? 'success' : 'warning'} />
                </TableCell>
                {phase === 2 && (
                  <TableCell>
                    <Stack spacing={0.5}>
                      {[...new Set((route.facilities || []).filter(f => f.vehicle_name).map(f => f.vehicle_name))].map(v => (
                        <Chip key={v} label={v} size="small" color="primary" variant="outlined" icon={<CarIcon />} />
                      ))}
                      {![...(route.facilities || [])].some(f => f.vehicle_name) && <Typography variant="body2" color="text.secondary">—</Typography>}
                    </Stack>
                  </TableCell>
                )}
                <TableCell align="center">
                  <Button variant="outlined" size="small" startIcon={<InfoIcon />} onClick={() => setDetailRoute(route)} sx={{ borderRadius: 2 }}>Details</Button>
                </TableCell>
                <TableCell align="center">
                  <Button variant="contained" size="small" startIcon={actionIcon} disabled={!ready}
                    onClick={() => onAction(route)} sx={{ bgcolor: color, '&:hover': { filter: 'brightness(0.9)' }, borderRadius: 2 }}>
                    {actionLabel}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {routes.length === 0 && (
            <TableRow><TableCell colSpan={phase === 2 ? 6 : 5} align="center" sx={{ py: 6, color: 'text.secondary' }}>No routes found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination component="div" count={routes.length} rowsPerPage={rowsPerPage} page={page}
        onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[5, 10, 25]} />
    </TableContainer>
  );

  const readyFacilities = (selectedRoute?.facilities || []).filter(isFacilityReady);

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', p: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}><TruckIcon sx={{ fontSize: 36 }} /></Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="white">TM Manager</Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.85)' }}>Transportation Management — {currentEthiopian.month} {currentEthiopian.year}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Card sx={{ px: 3, py: 1.5, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CarIcon sx={{ color: 'white' }} />
                  <Box><Typography variant="h5" fontWeight="bold" color="white">{phase1Routes.length}</Typography><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Phase 1 Routes</Typography></Box>
                </Stack>
              </Card>
              <Card sx={{ px: 3, py: 1.5, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <GroupsIcon sx={{ color: 'white' }} />
                  <Box><Typography variant="h5" fontWeight="bold" color="white">{phase2Routes.length}</Typography><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Phase 2 Routes</Typography></Box>
                </Stack>
              </Card>
            </Stack>
          </Stack>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Box sx={{ background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)', px: 3, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CarIcon sx={{ color: 'white' }} />
            <Typography variant="h6" fontWeight="bold" color="white">Phase 1 — Vehicle Assignment</Typography>
            <Chip label={`${phase1Routes.length} routes`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
          </Stack>
        </Box>
        <RouteTable routes={phase1Routes} page={page1} setPage={setPage1} color="#1565c0" phase={1}
          onAction={openPhase1Dialog} actionLabel="Assign Vehicles" actionIcon={<CarIcon />} />
      </Card>

      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Box sx={{ background: 'linear-gradient(90deg, #2e7d32 0%, #43a047 100%)', px: 3, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <GroupsIcon sx={{ color: 'white' }} />
            <Typography variant="h6" fontWeight="bold" color="white">Phase 2 — Driver & Deliverer Assignment</Typography>
            <Chip label={`${phase2Routes.length} routes`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
          </Stack>
        </Box>
        <RouteTable routes={phase2Routes} page={page2} setPage={setPage2} color="#2e7d32" phase={2}
          onAction={openPhase2Dialog} actionLabel="Assign Drivers" actionIcon={<PersonIcon />} />
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!detailRoute} onClose={() => setDetailRoute(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Route: {detailRoute?.route_name}
          <Typography variant="body2" color="text.secondary">{detailRoute?.ready_facilities || 0} / {detailRoute?.total_facilities} facilities ready</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            {(detailRoute?.facilities || []).map((f, i) => {
              const isReady = READY_STATUSES.includes(f.process_status) || f.rrf_not_sent === 1 || f.quality_confirmed === 1;
              return (
                <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2">{f.facility_name}</Typography>
                    {f.process_type && <Chip label={f.process_type === 'vaccine' ? 'Vaccine' : 'HP'} size="small" color={f.process_type === 'vaccine' ? 'secondary' : 'primary'} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />}
                    {f.vehicle_name && <Chip label={f.vehicle_name} size="small" color="info" variant="outlined" icon={<CarIcon />} sx={{ height: 18, fontSize: '0.65rem' }} />}
                  </Stack>
                  <Chip label={isReady ? (f.rrf_not_sent ? 'Not Sent ✓' : f.process_status) : (f.process_status === 'no_process' ? 'Not Started' : 'Pending')}
                    size="small" icon={isReady ? <CheckIcon style={{ fontSize: 14 }} /> : <PendingIcon style={{ fontSize: 14 }} />}
                    color={isReady ? 'success' : 'warning'} variant={isReady ? 'filled' : 'outlined'} />
                </Stack>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailRoute(null)} variant="outlined">Close</Button></DialogActions>
      </Dialog>

      {/* Phase 1 — Multi-Vehicle Assignment Dialog */}
      <Dialog open={openDialog && dialogType === 'phase1'} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><CarIcon /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="white">Assign Vehicles</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Route: {selectedRoute?.route_name} — {readyFacilities.length} ready facilities</Typography>
            </Box>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {vehicleAssignments.map((row, idx) => (
              <Box key={idx} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary">Vehicle {idx + 1}</Typography>
                  {vehicleAssignments.length > 1 && (
                    <IconButton size="small" color="error" onClick={() => removeVehicleRow(idx)}><DeleteIcon fontSize="small" /></IconButton>
                  )}
                </Stack>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Vehicle *</InputLabel>
                  <Select value={row.vehicle_id} onChange={e => updateVehicleRow(idx, 'vehicle_id', e.target.value)} label="Vehicle *">
                    {vehicles.map(v => <MenuItem key={v.id} value={v.id}>{v.vehicle_name} — {v.plate_number}</MenuItem>)}
                  </Select>
                </FormControl>
                {vehicleAssignments.length === 1 ? (
                  <Typography variant="caption" color="text.secondary">
                    All {readyFacilities.length} facilities will be assigned to this vehicle.
                  </Typography>
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Select facilities for this vehicle:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {readyFacilities.map(f => (
                        <FormControlLabel key={f.id} control={
                          <Checkbox size="small" checked={row.facility_ids.includes(f.id)} onChange={() => toggleFacilityForVehicle(idx, f.id)} />
                        } label={<Typography variant="body2">{f.facility_name}</Typography>} />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            ))}
            <Button startIcon={<AddIcon />} variant="outlined" onClick={addVehicleRow} sx={{ alignSelf: 'flex-start' }}>
              Add Another Vehicle
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleSaveVehicles} variant="contained" startIcon={<CarIcon />} sx={{ bgcolor: '#1565c0' }}>Assign Vehicles</Button>
        </DialogActions>
      </Dialog>

      {/* Phase 2 — Multi-Driver Assignment Dialog */}
      <Dialog open={openDialog && dialogType === 'phase2'} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)', p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><GroupsIcon /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="white">Assign Drivers & Deliverers</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Route: {selectedRoute?.route_name}</Typography>
            </Box>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {driverAssignments.map((row, idx) => (
              <Box key={idx} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} color="success.main" sx={{ mb: 1.5 }}>
                  {row.vehicle_name ? `Vehicle: ${row.vehicle_name}` : `Vehicle ${idx + 1}`}
                  {row.facility_ids.length > 0 && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({row.facility_ids.length} facilities)
                    </Typography>
                  )}
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Driver *</InputLabel>
                    <Select value={row.driver_id} onChange={e => updateDriverRow(idx, 'driver_id', e.target.value)} label="Driver *">
                      {drivers.map(d => <MenuItem key={d.id} value={d.id}>{d.full_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Deliverer (Optional)</InputLabel>
                    <Select value={row.deliverer_id} onChange={e => updateDriverRow(idx, 'deliverer_id', e.target.value)} label="Deliverer (Optional)">
                      <MenuItem value=""><em>None</em></MenuItem>
                      {deliverers.map(d => <MenuItem key={d.id} value={d.id}>{d.full_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField fullWidth label="Arrival Kilometer *" type="number" value={row.departure_kilometer}
                    onChange={e => updateDriverRow(idx, 'departure_kilometer', e.target.value)} inputProps={{ step: '0.01', min: '0' }} />
                </Stack>
                {idx < driverAssignments.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleSaveDrivers} variant="contained" color="success" startIcon={<PersonIcon />}>Assign Drivers</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TMManager;
