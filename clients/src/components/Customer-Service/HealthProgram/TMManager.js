import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Card, Button, Container,
  TablePagination, Stack, Box, Chip, Avatar, Divider, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Grid
} from '@mui/material';
import {
  LocalShipping as TruckIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
  Speed as SpeedIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import { successToast } from '../../../utils/toast';
import * as XLSX from 'xlsx';

const TMManager = () => {
  const [phase1Processes, setPhase1Processes] = useState([]);
  const [phase2Processes, setPhase2Processes] = useState([]);
  const [page1, setPage1] = useState(0);
  const [page2, setPage2] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('phase1');
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedDeliverer, setSelectedDeliverer] = useState('');
  const [departureKilometer, setDepartureKilometer] = useState('');
  const [processType, setProcessType] = useState('regular');

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

  useEffect(() => {
    fetchPhase1Processes();
    fetchPhase2Processes();
    fetchVehicles();
    fetchDriversAndDeliverers();
  }, [processType]);

  const fetchPhase1Processes = async () => {
    try {
      setLoading(true); setError(null);
      const res = await axios.get(`${api_url}/api/tm-processes`, { params: { month: currentEthiopian.month, year: currentEthiopian.year, process_type: processType } });
      setPhase1Processes(res.data.processes || []);
    } catch (err) { setError("Failed to load Phase 1 processes."); } finally { setLoading(false); }
  };

  const fetchPhase2Processes = async () => {
    try {
      const res = await axios.get(`${api_url}/api/tm-vehicle-assignment-processes`, { params: { month: currentEthiopian.month, year: currentEthiopian.year, process_type: processType } });
      setPhase2Processes(res.data.processes || []);
    } catch (err) { console.error(err); }
  };

  const fetchVehicles = async () => {
    try { const res = await axios.get(`${api_url}/api/vehicles/available`); setVehicles(res.data || []); } catch (err) { console.error(err); }
  };

  const fetchDriversAndDeliverers = async () => {
    try {
      const res = await axios.get(`${api_url}/api/get-employee`);
      const all = Array.isArray(res.data) ? res.data : [];
      const drv = all.filter(e => e.jobTitle?.toLowerCase().includes('driver'));
      const dlv = all.filter(e => e.jobTitle?.toLowerCase().includes('deliverer'));
      setDrivers(drv.length > 0 ? drv : all);
      setDeliverers(dlv.length > 0 ? dlv : all);
    } catch (err) { console.error(err); }
  };

  const handleCreateFreightOrder = (process) => { setSelectedProcess(process); setSelectedVehicle(''); setDialogType('phase1'); setOpenDialog(true); };
  const handleAssignDriver = (process) => { setSelectedProcess(process); setSelectedDriver(''); setSelectedDeliverer(''); setDepartureKilometer(''); setDialogType('phase2'); setOpenDialog(true); };

  const handleSaveFreightOrder = async () => {
    if (!selectedVehicle) { Swal.fire('Error', 'Please select a vehicle', 'error'); return; }
    try {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      await axios.post(`${api_url}/api/tm-create-freight-order`, { process_id: selectedProcess.id, vehicle_id: vehicle.id, vehicle_name: vehicle.vehicle_name, tm_officer_id: loggedInUserId, tm_officer_name: loggedInUserName });
      try { await axios.post(`${api_url}/api/service-time-hp`, { process_id: selectedProcess.id, service_unit: 'TM Manager - HP', end_time: new Date().toISOString(), officer_id: loggedInUserId, officer_name: loggedInUserName, status: 'completed', notes: `Vehicle assigned: ${vehicle.vehicle_name}` }); } catch (e) {}
      successToast('Vehicle assigned successfully');
      setOpenDialog(false); fetchPhase1Processes(); fetchPhase2Processes();
    } catch (err) { Swal.fire('Error', 'Failed to assign vehicle', 'error'); }
  };

  const handleSaveDriverAssignment = async () => {
    if (!selectedDriver || !selectedDeliverer) { Swal.fire('Error', 'Please select both driver and deliverer', 'error'); return; }
    if (!departureKilometer || isNaN(departureKilometer)) { Swal.fire('Error', 'Please enter valid departure kilometer', 'error'); return; }
    try {
      const driver = drivers.find(d => d.id === selectedDriver);
      const deliverer = deliverers.find(d => d.id === selectedDeliverer);
      await axios.post(`${api_url}/api/tm-assign-vehicle`, { process_id: selectedProcess.id, driver_id: driver.id, driver_name: driver.full_name, deliverer_id: deliverer.id, deliverer_name: deliverer.full_name, departure_kilometer: parseFloat(departureKilometer), tm_officer_id: loggedInUserId, tm_officer_name: loggedInUserName });
      try { await axios.post(`${api_url}/api/service-time-hp`, { process_id: selectedProcess.id, service_unit: 'TM Manager - HP', end_time: new Date().toISOString(), officer_id: loggedInUserId, officer_name: loggedInUserName, status: 'completed', notes: 'Driver & deliverer assigned' }); } catch (e) {}
      successToast('Driver and deliverer assigned successfully');
      setOpenDialog(false); fetchPhase1Processes(); fetchPhase2Processes();
    } catch (err) { Swal.fire('Error', 'Failed to assign driver and deliverer', 'error'); }
  };

  const handleExportExcel = () => {
    const rows = phase1Processes.map((p, i) => ({ '#': i+1, 'Facility': p.facility?.facility_name || 'Unknown', 'Route': p.facility?.route || 'N/A', 'Region': p.facility?.region_name || 'N/A', 'Reporting Month': p.reporting_month || 'N/A', 'Process Type': p.process_type || 'N/A', 'Status': p.status || 'N/A' }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EWM Completed');
    XLSX.writeFile(wb, `EWM_Completed_${processType}_${Date.now()}.xlsx`);
  };

  if (!isTMManager) return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Alert severity="error"><Typography variant="h6">Access Denied</Typography><Typography>This page is restricted to TM Manager role only.</Typography></Alert>
    </Container>
  );

  const PhaseTable = ({ processes, page, setPage, color, actionLabel, actionIcon, onAction }) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ '& .MuiTableCell-head': { bgcolor: color, color: 'white', fontWeight: 700, fontSize: '0.95rem' } }}>
            <TableCell>#</TableCell>
            <TableCell>Facility</TableCell>
            <TableCell>Route</TableCell>
            <TableCell>Region</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((process, index) => (
            <TableRow key={process.id} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
              <TableCell>
                <Avatar sx={{ width: 32, height: 32, bgcolor: color, fontSize: '0.8rem' }}>
                  {page * rowsPerPage + index + 1}
                </Avatar>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={700} color="primary.dark">
                  {process.facility?.facility_name || 'Unknown Facility'}
                </Typography>
              </TableCell>
              <TableCell>
                {process.facility?.route
                  ? <Chip label={process.facility.route} size="small" variant="outlined" color="secondary" />
                  : <Typography variant="caption" color="text.disabled">N/A</Typography>}
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">{process.facility?.region_name || 'N/A'}</Typography>
              </TableCell>
              <TableCell align="center">
                <Button variant="contained" size="small" startIcon={actionIcon} onClick={() => onAction(process)} disabled={!process.facility}
                  sx={{ bgcolor: color, '&:hover': { filter: 'brightness(0.9)' }, borderRadius: 2, px: 2 }}>
                  {actionLabel}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {processes.length === 0 && (
            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>No processes found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination component="div" count={processes.length} rowsPerPage={rowsPerPage} page={page}
        onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))} rowsPerPageOptions={[5, 10, 25, 50]} />
    </TableContainer>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', p: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64, border: '2px solid rgba(255,255,255,0.4)' }}>
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
              <Card sx={{ px: 3, py: 1.5, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CarIcon sx={{ color: 'white' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="white">{phase1Processes.length}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Phase 1</Typography>
                  </Box>
                </Stack>
              </Card>
              <Card sx={{ px: 3, py: 1.5, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <GroupsIcon sx={{ color: 'white' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="white">{phase2Processes.length}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Phase 2</Typography>
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Stack>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Type Filter */}
      <Card sx={{ mb: 3, p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
          <SpeedIcon color="primary" />
          <Typography variant="body2" fontWeight={600} color="text.secondary">Process Type:</Typography>
          <TextField select size="small" value={processType} onChange={e => setProcessType(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="regular">HP Regular</MenuItem>
            <MenuItem value="emergency">Emergency</MenuItem>
            <MenuItem value="breakdown">Breakdown</MenuItem>
            <MenuItem value="vaccine">Vaccine</MenuItem>
          </TextField>
        </Stack>
      </Card>

      {/* Phase 1 */}
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Box sx={{ background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)', px: 3, py: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <CarIcon sx={{ color: 'white' }} />
              <Typography variant="h6" fontWeight="bold" color="white">Phase 1 — Vehicle Assignment</Typography>
              <Chip label={`${phase1Processes.length} pending`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
            </Stack>
            <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportExcel}
              disabled={phase1Processes.length === 0}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              Export
            </Button>
          </Stack>
        </Box>
        <PhaseTable processes={phase1Processes} page={page1} setPage={setPage1} color="#1565c0" actionLabel="Assign Vehicle" actionIcon={<CarIcon />} onAction={handleCreateFreightOrder} />
      </Card>

      {/* Phase 2 */}
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Box sx={{ background: 'linear-gradient(90deg, #2e7d32 0%, #43a047 100%)', px: 3, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <GroupsIcon sx={{ color: 'white' }} />
            <Typography variant="h6" fontWeight="bold" color="white">Phase 2 — Driver & Deliverer Assignment</Typography>
            <Chip label={`${phase2Processes.length} pending`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
          </Stack>
        </Box>
        <PhaseTable processes={phase2Processes} page={page2} setPage={setPage2} color="#2e7d32" actionLabel="Assign Driver" actionIcon={<PersonIcon />} onAction={handleAssignDriver} />
      </Card>

      {/* Phase 1 Dialog */}
      <Dialog open={openDialog && dialogType === 'phase1'} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><CarIcon /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="white">Assign Vehicle</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{selectedProcess?.facility?.facility_name}</Typography>
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
          <Button onClick={handleSaveFreightOrder} variant="contained" startIcon={<CarIcon />} sx={{ bgcolor: '#1565c0' }}>Assign Vehicle</Button>
        </DialogActions>
      </Dialog>

      {/* Phase 2 Dialog */}
      <Dialog open={openDialog && dialogType === 'phase2'} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)', p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><GroupsIcon /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="white">Assign Driver & Deliverer</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{selectedProcess?.facility?.facility_name}</Typography>
            </Box>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel>Driver</InputLabel>
              <Select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} label="Driver">
                {drivers.map(d => <MenuItem key={d.id} value={d.id}>{d.full_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Deliverer</InputLabel>
              <Select value={selectedDeliverer} onChange={e => setSelectedDeliverer(e.target.value)} label="Deliverer">
                {deliverers.map(d => <MenuItem key={d.id} value={d.id}>{d.full_name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="Departure Kilometer" type="number" value={departureKilometer} onChange={e => setDepartureKilometer(e.target.value)} inputProps={{ step: '0.01', min: '0' }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleSaveDriverAssignment} variant="contained" color="success" startIcon={<PersonIcon />}>Assign Driver & Deliverer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TMManager;
