import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Card, Button, Container,
  TablePagination, Stack, Box, Chip, Avatar, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  LocalShipping as DispatchIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  Info as InfoIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import api from '../../axiosInstance';
import Swal from 'sweetalert2';
import { successToast } from '../../utils/toast';

const DispatchManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailRoute, setDetailRoute] = useState(null);

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isDispatcher = userJobTitle === 'Dispatcher - HP';
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

  const fetchRoutes = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get(`${api_url}/api/dispatch-routes`, {
        params: { month: currentEthiopian.month, year: currentEthiopian.year }
      });
      setRoutes(res.data.routes || []);
    } catch (err) { setError('Failed to load dispatch routes.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRoutes(); }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`${api_url}/api/dispatch-routes`, {
          params: { month: currentEthiopian.month, year: currentEthiopian.year }
        });
        setRoutes(res.data.routes || []);
      } catch (_) {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const isRouteReady = (route) =>
    Number(route.ready_facilities) > 0 &&
    Number(route.ready_facilities) === Number(route.total_facilities);

  const handleCompleteDispatch = async (route) => {
    const confirm = await Swal.fire({
      title: 'Complete Dispatch?',
      text: `Mark all facilities in route "${route.route_name}" as dispatch completed?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4caf50',
      confirmButtonText: 'Yes, Complete'
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.post(`${api_url}/api/complete-dispatch-hp`, {
        route_name: route.route_name,
        reporting_month: `${currentEthiopian.month} ${currentEthiopian.year}`,
        completed_by: loggedInUserId
      });
      successToast('Dispatch completed for all facilities in route');
      fetchRoutes();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Failed to complete dispatch', 'error');
    }
  };

  if (!isDispatcher) return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Alert severity="error">
        <Typography variant="h6">Access Denied</Typography>
        <Typography>This page is restricted to Dispatcher - HP role only.</Typography>
      </Alert>
    </Container>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #e65100 0%, #ff9800 100%)', p: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
                <DispatchIcon sx={{ fontSize: 36 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="white">Dispatch Management</Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  {currentEthiopian.month} {currentEthiopian.year}
                </Typography>
              </Box>
            </Stack>
            <Card sx={{ px: 3, py: 1.5, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DispatchIcon sx={{ color: 'white' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="white">{routes.length}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Routes</Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Box sx={{ background: 'linear-gradient(90deg, #e65100 0%, #ef6c00 100%)', px: 3, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <DispatchIcon sx={{ color: 'white' }} />
            <Typography variant="h6" fontWeight="bold" color="white">Routes Ready for Dispatch</Typography>
            <Chip label={`${routes.length} routes`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
          </Stack>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-head': { bgcolor: '#e65100', color: 'white', fontWeight: 700 } }}>
                <TableCell>Route</TableCell>
                <TableCell align="center">Facilities</TableCell>
                <TableCell align="center">Ready</TableCell>
                <TableCell>Vehicles / Drivers</TableCell>
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
                      <Chip label={route.route_name} size="small" variant="outlined" color="warning" />
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
                    <TableCell>
                      <Stack spacing={0.5}>
                        {(route.vehicles || []).length > 0
                          ? (route.vehicles || []).map(v => (
                              <Stack key={v.vehicle_id} spacing={0.2}>
                                <Chip label={v.vehicle_name} size="small" color="primary" variant="outlined" icon={<CarIcon />} />
                                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                                  {v.driver_name || '—'}{v.deliverer_name ? ` / ${v.deliverer_name}` : ''}
                                </Typography>
                              </Stack>
                            ))
                          : <Typography variant="body2" color="text.secondary">—</Typography>
                        }
                      </Stack>
                    </TableCell>
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
                        startIcon={<CheckIcon />}
                        disabled={!ready}
                        onClick={() => handleCompleteDispatch(route)}
                        sx={{ bgcolor: '#e65100', '&:hover': { filter: 'brightness(0.9)' }, borderRadius: 2 }}
                      >
                        Complete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {routes.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No routes ready for dispatch
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination component="div" count={routes.length} rowsPerPage={rowsPerPage} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[5, 10, 25]} />
        </TableContainer>
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
              const isReady = f.process_status === 'driver_assigned' || f.process_status === 'dispatch_completed';
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
                    label={f.process_status === 'dispatch_completed' ? 'Completed' : isReady ? 'driver_assigned' : (f.process_status === 'no_process' ? 'Not Started' : 'Pending')}
                    size="small"
                    icon={isReady ? <CheckIcon style={{ fontSize: 14 }} /> : <PendingIcon style={{ fontSize: 14 }} />}
                    color={f.process_status === 'dispatch_completed' ? 'info' : isReady ? 'success' : 'warning'}
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
    </Container>
  );
};

export default DispatchManagement;
