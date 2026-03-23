import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Card, Button, Container,
  TablePagination, Stack, Box, Chip, Avatar, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  LocalShipping as TruckIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  Info as InfoIcon,
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

  // Action dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('phase1');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedDeliverer, setSelectedDeliverer] = useState('');
  const [departureKilometer, setDepartureKilometer] = useState('');

  // Details dialog
  const [detailRoute, setDetailRoute] = useState(null);

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

  const handleAssignVehicle = (route) => {
    setSelectedRoute(route); setSelectedVehicle(''); setDialogType('phase1'); setOpenDialog(true);
  };
  const handleAssignDriver = (route) => {
    setSelectedRoute(route); setSelectedDriver(''); setSelectedDeliverer(''); setDepartureKilometer(''); setDialogType('phase2'); setOpenDialog(true);
  };

  const handleSaveVehicle = async () => {
    if (!selectedVehicle) { Swal.fire('Error', 'Please select a vehicle', 'error'); return; }
    try {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      await api.post(`${api_url}/api/tm-create-freight-order`, {
        route_name: selectedRoute.route_name,
        reporting_month: `${currentEthiopian.month} ${currentEthiopian.year}`,
        vehicle_id: vehicle.id, vehicle_name: vehicle.vehicle_name,
        tm_officer_id: loggedInUserId, tm_officer_name: loggedInUserName
      });
      successToast('Vehicle assigned to all route facilities');
      setOpenDialog(false); fetchAll();
    } catch (err) { Swal.fire('Error', 'Failed to assign vehicle', 'error'); }
  };

  const handleSaveDriver = async () => {
    if (!selectedDriver) { Swal.fire('Error', 'Please select a driver', 'error'); return; }
    if (!departureKilometer || isNaN(departureKilometer)) { Swal.fire('Error', 'Please enter valid departure kilometer', 'error'); return; }
    try {
      const driver = drivers.find(d => d.id === selectedDriver);
      const deliverer = selectedDeliverer ? deliverers.find(d => d.id === selectedDeliverer) : null;
      await api.post(`${api_url}/api/tm-assign-vehicle`, {
        route_name: selectedRoute.route_name,
        reporting_month: `${currentEthiopian.month} ${currentEthiopian.year}`,
        driver_id: driver.id, driver_name: driver.full_name,
        deliverer_id: deliverer?.id || null, deliverer_name: deliverer?.full_name || null,
        departure_kilometer: parseFloat(departureKilometer),
        tm_officer_id: loggedInUserId, tm_officer_name: loggedInUserName
      });
      successToast('Driver assigned to all route facilities');
      setOpenDialog(false); fetchAll();
    } catch (err) { Swal.fire('Error', 'Failed to assign driver', 'error'); }
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
            {phase === 2 && <TableCell>Vehicle</TableCell>}
            <TableCell align="center">Details</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {routes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((route) => {
            const ready = isRouteReady(route);
            return (
              <TableRow key={route.route_name} hover>
                <TableCell>
                  <Chip label={route.route_name} size="small" variant="outlined" color="secondary" />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={600}>{route.total_facilities}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${route.ready_facilities || 0} / ${route.total_facilities}`}
                    size="small"
                    color={ready ? 'success' : 'warning'}
                  />
                </TableCell>
                {phase === 2 && (
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{route.vehicle_name || '—'}</Typography>
                  </TableCell>
                )}
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<InfoIcon />}
                    onClick={() => setDetailRoute(route)}
                    sx={{ borderRadius: 2 }}
                  >
                    Details
                  </Button>
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={actionIcon}
                    disabled={!ready}
                    onClick={() => onAction(route)}
                    sx={{ bgcolor: color, '&:hover': { filter: 'brightness(0.9)' }, borderRadius: 2 }}
                  >
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

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', p: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
                <TruckIcon sx={{ fontSize: 36 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="white">TM Manager</Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Transportation Management — {currentEthiopian.month} {currentEthiopian.year}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Card sx={{ px: 3, py: 1.5, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CarIcon sx={{ color: 'white' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="white">{phase1Routes.length}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Phase 1 Routes</Typography>
                  </Box>
                </Stack>
              </Card>
              <Card sx={{ px: 3, py: 1.5, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <GroupsIcon sx={{ color: 'white' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="white">{phase2Routes.length}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Phase 2 Routes</Typography>
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Stack>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Phase 1 */}
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Box sx={{ background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)', px: 3, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CarIcon sx={{ color: 'white' }} />
            <Typography variant="h6" fontWeight="bold" color="white">Phase 1 — Vehicle Assignment</Typography>
            <Chip label={`${phase1Routes.length} routes`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
          </Stack>
        </Box>
        <RouteTable routes={phase1Routes} page={page1} setPage={setPage1} color="#1565c0" phase={1}
          onAction={handleAssignVehicle} actionLabel="Assign Vehicle" actionIcon={<CarIcon />} />
      </Card>

      {/* Phase 2 */}
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Box sx={{ background: 'linear-gradient(90deg, #2e7d32 0%, #43a047 100%)', px: 3, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <GroupsIcon sx={{ color: 'white' }} />
            <Typography variant="h6" fontWeight="bold" color="white">Phase 2 — Driver & Deliverer Assignment</Typography>
            <Chip label={`${phase2Routes.length} routes`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
          </Stack>
        </Box>
        <RouteTable routes={phase2Routes} page={page2} setPage={setPage2} color="#2e7d32" phase={2}
          onAction={handleAssignDriver} actionLabel="Assign Driver" actionIcon={<PersonIcon />} />
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!detailRoute} onClose={() => setDetailRoute(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Route: {detailRoute?.route_name}
          <Typography variant="body2" color="text.secondary">
            {detailRoute?.ready_facilities || 0} / {detailRoute?.total_facilities} facilities ready
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            {(detailRoute?.facilities || []).map((f, i) => {
              const isReady = READY_STATUSES.includes(f.process_status) || f.rrf_not_sent === 1 || f.quality_confirmed === 1;
              return (
                <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2">{f.facility_name}</Typography>
                    {f.process_type && (
                      <Chip
                        label={f.process_type === 'vaccine' ? 'Vaccine' : 'HP'}
                        size="small"
                        color={f.process_type === 'vaccine' ? 'secondary' : 'primary'}
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    )}
                  </Stack>
                  <Chip
                    label={isReady ? (f.rrf_not_sent ? 'Not Sent ✓' : f.process_status) : (f.process_status === 'no_process' ? 'Not Started' : 'Pending')}
                    size="small"
                    icon={isReady ? <CheckIcon style={{ fontSize: 14 }} /> : <PendingIcon style={{ fontSize: 14 }} />}
                    color={isReady ? 'success' : 'warning'}
                    variant={isReady ? 'filled' : 'outlined'}
                  />
                </Stack>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailRoute(null)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Phase 1 — Assign Vehicle Dialog */}
      <Dialog open={openDialog && dialogType === 'phase1'} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><CarIcon /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="white">Assign Vehicle</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Route: {selectedRoute?.route_name}</Typography>
            </Box>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Vehicle</InputLabel>
            <Select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} label="Vehicle">
              {vehicles.map(v => <MenuItem key={v.id} value={v.id}>{v.vehicle_name} — {v.plate_number}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleSaveVehicle} variant="contained" startIcon={<CarIcon />} sx={{ bgcolor: '#1565c0' }}>Assign Vehicle</Button>
        </DialogActions>
      </Dialog>

      {/* Phase 2 — Assign Driver Dialog */}
      <Dialog open={openDialog && dialogType === 'phase2'} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)', p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><GroupsIcon /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="white">Assign Driver & Deliverer</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Route: {selectedRoute?.route_name}</Typography>
            </Box>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel>Driver *</InputLabel>
              <Select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} label="Driver *">
                {drivers.map(d => <MenuItem key={d.id} value={d.id}>{d.full_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Deliverer (Optional)</InputLabel>
              <Select value={selectedDeliverer} onChange={e => setSelectedDeliverer(e.target.value)} label="Deliverer (Optional)">
                <MenuItem value=""><em>None</em></MenuItem>
                {deliverers.map(d => <MenuItem key={d.id} value={d.id}>{d.full_name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="Departure Kilometer" type="number" value={departureKilometer}
              onChange={e => setDepartureKilometer(e.target.value)} inputProps={{ step: '0.01', min: '0' }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleSaveDriver} variant="contained" color="success" startIcon={<PersonIcon />}>Assign Driver & Deliverer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TMManager;
