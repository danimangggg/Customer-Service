import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Card, CardContent, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, Grid, LinearProgress, Alert,
  Checkbox, TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel,
  useMediaQuery, useTheme, Tabs, Tab, CircularProgress, Tooltip
} from '@mui/material';
import {
  Description as DocumentIcon,
  Business as FacilityIcon,
  CheckCircle as ConfirmedIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Route as RouteIcon,
  Edit as EditIcon,
  Undo as UndoIcon
} from '@mui/icons-material';
import { DataGrid, GridToolbar, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector, GridToolbarQuickFilter } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import axios from 'axios';import api from '../../axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { formatTimestamp } from '../../utils/serviceTimeHelper';

const MySwal = withReactContent(Swal);

const HPExcelToolbar = ({ onExport }) => (
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

const DocumentationHP = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [facilityData, setFacilityData] = useState([]);
  const [filterType, setFilterType] = useState('Regular');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [docTab, setDocTab] = useState(0);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyReceivedBy, setHistoryReceivedBy] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [hpEditDialog, setHpEditDialog] = useState({ open: false, row: null, pod_number: '' });
  const [editFormData, setEditFormData] = useState({
    pod_numbers: '',
    arrival_kilometer: '',
    all_pod_received: false,
    odns: []
  });

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isDocumentationOfficer = userJobTitle === 'Documentation Officer - HP';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  const getCurrentEthiopianMonth = () => {
    const gDate = new Date();
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth();
    const gd = gDate.getDate();
    const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
    const newYearDay = isLeap ? 12 : 11;
    let ethYear, ethMonthIndex;
    if (gm > 8 || (gm === 8 && gd >= newYearDay)) {
      ethYear = gy - 7;
      const newYearDate = new Date(gy, 8, newYearDay);
      const diffDays = Math.floor((gDate - newYearDate) / (24 * 60 * 60 * 1000));
      ethMonthIndex = diffDays < 360 ? Math.floor(diffDays / 30) : 12;
    } else {
      ethYear = gy - 8;
      const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
      const prevNewYearDay = prevIsLeap ? 12 : 11;
      const prevNewYearDate = new Date(gy - 1, 8, prevNewYearDay);
      const diffDays = Math.floor((gDate - prevNewYearDate) / (24 * 60 * 60 * 1000));
      ethMonthIndex = diffDays < 360 ? Math.floor(diffDays / 30) : 12;
    }
    ethMonthIndex = Math.max(0, Math.min(ethMonthIndex, 12));
    return { month: ethiopianMonths[ethMonthIndex], year: ethYear };
  };

  const currentEthiopian = getCurrentEthiopianMonth();

  useEffect(() => {
    setSelectedMonth(currentEthiopian.month);
    setSelectedYear(currentEthiopian.year.toString());
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchDispatchedFacilities();
    }
  }, [selectedMonth, selectedYear, searchTerm, page, rowsPerPage, filterType]);

  // Silent background polling every 5s (only when no dialog is open)
  useEffect(() => {
    if (!selectedMonth || !selectedYear) return;
    const silentFetch = async () => {
      if (openEditDialog) return; // don't refresh while user is editing
      try {
        const res = await api.get(`${api_url}/api/dispatched-odns`, {
          params: { month: selectedMonth, year: selectedYear, page: page + 1, limit: rowsPerPage, search: searchTerm, process_type: filterType.toLowerCase() }
        });
        if (res.data.facilities) setFacilityData(res.data.facilities);
      } catch (_) {}
    };
    const interval = setInterval(silentFetch, 5000);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear, searchTerm, page, rowsPerPage, filterType, openEditDialog]);

  const fetchDispatchedFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!selectedMonth || !selectedYear) {
        setError("Please select both month and year to load facilities.");
        return;
      }
      
      const response = await api.get(`${api_url}/api/dispatched-odns`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          process_type: filterType.toLowerCase()
        }
      });
      
      if (response.data.facilities) {
        setFacilityData(response.data.facilities);
        setError(null); // Always clear error when data is received
      } else {
        setFacilityData([]);
        setError("No facility data received from server.");
      }
      
    } catch (err) {
      console.error("Fetch error:", err);
      let errorMessage = "Failed to load dispatched facilities. ";
      if (err.response) {
        errorMessage += err.response.data?.error || 'Please try again.';
      } else {
        errorMessage += "Network error. Please check your connection.";
      }
      setError(errorMessage);
      setFacilityData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = {};
      if (historyReceivedBy) params.received = historyReceivedBy === 'received' ? 'yes' : 'no';
      if (historyDateFrom) params.startDate = historyDateFrom;
      if (historyDateTo) params.endDate = historyDateTo;
      const res = await api.get(`${api_url}/api/hp-finance`, { params });
      if (res.data.success) setHistoryData(res.data.data || []);
    } catch { setHistoryData([]); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => { if (docTab === 1) fetchHistory(); }, [docTab, historyReceivedBy, historyDateFrom, historyDateTo]);

  const exportHistoryToExcel = () => {
    const rows = historyData.map((r, i) => ({
      '#': i + 1,
      'Facility': r.facility_name || '',
      'Woreda': r.woreda_name || '',
      'Route': r.route_name || '',
      'ODN': r.odn_number || '',
      'POD #': r.pod_number || '',
      'Month': r.reporting_month || '',
      'Submitted Date': r.pod_confirmed_at ? new Date(r.pod_confirmed_at).toLocaleDateString() : '',
      'Received': r.received ? 'Yes' : 'No',
      'Received By': r.received_by || '',
      'Received At': r.received_at ? new Date(r.received_at).toLocaleDateString() : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HP History');
    XLSX.writeFile(wb, `HP_Documentation_History_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleHpEditSave = async () => {
    const { row, pod_number } = hpEditDialog;
    try {
      if (pod_number !== (row.pod_number || '')) {
        await api.put(`${api_url}/api/hp-finance/odn/${row.odn_id}/pod`, { pod_number });
      }
      MySwal.fire({ icon: 'success', title: 'Updated', timer: 1200, showConfirmButton: false });
      setHpEditDialog({ open: false, row: null, pod_number: '' });
      fetchHistory();
    } catch { MySwal.fire({ icon: 'error', title: 'Failed to update' }); }
  };

  const handleEditClick = async (facility) => {
    setSelectedFacility(facility);
    
    try {
      const odnIds = facility.odn_ids ? facility.odn_ids.split(',') : [];
      const odnNumbers = facility.odn_numbers ? facility.odn_numbers.split(',') : [];
      
      const odnDetails = odnIds.map((id, index) => ({
        odn_id: parseInt(id.trim()),
        odn_number: odnNumbers[index] ? odnNumbers[index].trim() : `ODN-${id}`,
        documents_signed: false,
        documents_handover: false
      }));
      
      const allPodReceived = facility.confirmed_pods === facility.total_odns;

      // Pre-fill arrival_kilometer: use facility's own value first,
      // then fall back to any sibling in facilityData, then fetch from server
      let prefillKm = facility.arrival_kilometer || '';

      if (!prefillKm && facility.route_name) {
        // Check in-memory list first (unconfirmed siblings)
        const sibling = facilityData.find(
          f => f.route_name === facility.route_name &&
               f.facility_id !== facility.facility_id &&
               f.arrival_kilometer
        );
        if (sibling) {
          prefillKm = sibling.arrival_kilometer;
        } else {
          // Fetch from server — includes completed facilities not in current list
          try {
            const res = await api.get(`${api_url}/api/documentation/route-km`, {
              params: { route_name: facility.route_name, month: selectedMonth, year: selectedYear }
            });
            if (res.data.arrival_kilometer) prefillKm = res.data.arrival_kilometer;
          } catch (e) { /* non-critical */ }
        }
      }
      
      setEditFormData({
        pod_numbers: facility.pod_numbers || '',
        arrival_kilometer: prefillKm,
        all_pod_received: allPodReceived,
        odns: odnDetails
      });
      
      setOpenEditDialog(true);
    } catch (err) {
      console.error('Error preparing ODN details:', err);
      MySwal.fire('Error', 'Failed to load ODN details', 'error');
    }
  };

  const handlePodReceivedChange = (checked) => {
    // Update all ODNs in the facility - when POD received, mark both signed and handover as true
    setEditFormData(prev => ({
      ...prev,
      all_pod_received: checked,
      odns: prev.odns.map(odn => ({
        ...odn,
        documents_signed: checked,
        documents_handover: checked
      }))
    }));
  };

  const handleSaveEdit = async () => {
    const reportingMonth = `${selectedMonth} ${selectedYear}`;
    
    // Validate inputs
    if (!editFormData.pod_numbers || !editFormData.pod_numbers.trim()) {
      MySwal.fire('Warning', 'Please enter POD number(s)', 'warning');
      return;
    }

    if (editFormData.arrival_kilometer !== '' && editFormData.arrival_kilometer !== null &&
        editFormData.arrival_kilometer !== undefined && parseFloat(editFormData.arrival_kilometer) < 0) {
      MySwal.fire('Warning', 'Destination kilometer cannot be negative', 'warning');
      return;
    }

    try {
      setAutoSaving(true);

      // Update facility POD details using bulk POD confirmation endpoint
      const odnUpdates = editFormData.odns.map(odn => ({
        odn_id: odn.odn_id,
        pod_confirmed: editFormData.all_pod_received,
        pod_number: editFormData.pod_numbers.trim(),
        arrival_kilometer: parseFloat(editFormData.arrival_kilometer),
        route_assignment_id: selectedFacility.route_assignment_id,
        route_id: selectedFacility.route_id
      }));

      await axios.put(`${api_url}/api/odns/bulk-pod-confirmation`, {
        updates: odnUpdates,
        confirmed_by: loggedInUserId
      });

      MySwal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'All changes saved successfully',
        timer: 2000,
        showConfirmButton: false
      });

      setOpenEditDialog(false);
      fetchDispatchedFacilities();

    } catch (err) {
      console.error('Save error:', err);
      MySwal.fire('Error', 'Failed to save changes', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  const handleCompleteAndPassToQE = async () => {
    console.log('🔵 Complete & Pass to QE clicked');
    const reportingMonth = `${selectedMonth} ${selectedYear}`;
    
    console.log('📋 Form data:', editFormData);
    console.log('🏥 Selected facility:', selectedFacility);
    
    // Validate
    if (!editFormData.pod_numbers || !editFormData.pod_numbers.trim()) {
      console.log('❌ Validation failed: POD numbers missing');
      MySwal.fire('Warning', 'Please enter POD number(s) before completing', 'warning');
      return;
    }

    if (!editFormData.arrival_kilometer || parseFloat(editFormData.arrival_kilometer) < 0) {
      console.log('❌ Validation failed: Arrival kilometer invalid');
      MySwal.fire('Warning', 'Please enter destination kilometer before completing', 'warning');
      return;
    }

    console.log('✅ Validation passed, showing confirmation dialog');
    
    const result = await MySwal.fire({
      title: 'Complete and Pass to Finance?',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <strong>Facility:</strong> ${selectedFacility.facility_name}<br>
            <strong>Route:</strong> ${selectedFacility.route_name}<br>
            <strong>Total ODNs:</strong> ${selectedFacility.total_odns}<br>
            <strong>POD Numbers:</strong> ${editFormData.pod_numbers}<br>
            <strong>Destination KM:</strong> ${editFormData.arrival_kilometer}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Complete',
      confirmButtonColor: '#4caf50',
      customClass: {
        container: 'swal-high-zindex'
      },
      didOpen: () => {
        // Ensure SweetAlert appears above Material-UI Dialog
        const swalContainer = document.querySelector('.swal2-container');
        if (swalContainer) {
          swalContainer.style.zIndex = '9999';
        }
      }
    });

    if (!result.isConfirmed) {
      console.log('❌ User cancelled confirmation');
      return;
    }

    console.log('✅ User confirmed, starting save process');

    try {
      setAutoSaving(true);

      console.log('📤 Saving POD confirmation...');
      // For HP workflow, call bulk POD confirmation which updates process status
      const odnUpdates = editFormData.odns.map(odn => ({
        odn_id: odn.odn_id,
        pod_confirmed: editFormData.all_pod_received,
        pod_number: editFormData.pod_numbers.trim(),
        arrival_kilometer: parseFloat(editFormData.arrival_kilometer),
        route_assignment_id: selectedFacility.route_assignment_id,
        route_id: selectedFacility.route_id
      }));

      console.log('ODN updates:', odnUpdates);

      await axios.put(`${api_url}/api/odns/bulk-pod-confirmation`, {
        updates: odnUpdates,
        confirmed_by: loggedInUserId
      });
      console.log('✅ POD confirmation saved and process status updated');

      // Note: Service time recording skipped for now
      // Can be added later when proper endpoint is available

      console.log('✅ All saves complete, showing success message');

      MySwal.fire({
        icon: 'success',
        title: 'Success!',
        html: `
          <div style="text-align: center;">
            <p>POD confirmed for <strong>${selectedFacility.facility_name}</strong></p>
            <p><strong>${selectedFacility.total_odns}</strong> ODNs passed to Finance</p>
          </div>
        `,
        timer: 3000,
        showConfirmButton: false
      });

      setOpenEditDialog(false);
      fetchDispatchedFacilities();

    } catch (err) {
      console.error('❌ Complete error:', err);
      console.error('Error details:', err.response?.data);
      MySwal.fire('Error', err.response?.data?.error || 'Failed to complete and pass to Finance', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  if (!isDocumentationOfficer) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>This page is restricted to Documentation Officer - HP role only.</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <style>
        {`
          .doc-card { transition: all 0.3s ease; }
          .doc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
          .facility-row { transition: all 0.2s ease; }
          .facility-row:hover { background-color: #f5f5f5; }
          .confirmed-row { background-color: #e8f5e9; opacity: 0.8; }
        `}
      </style>
      
      {/* Header */}
      <Card sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', color: 'white', p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
              <DocumentIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold">HP Documentation</Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                POD Confirmation & Document Follow-up
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={filterType} label="Type" onChange={(e) => { setFilterType(e.target.value); setPage(0); }}>
                <MenuItem value="Regular">HP Regular</MenuItem>
                <MenuItem value="Emergency">Emergency</MenuItem>
                <MenuItem value="Breakdown">Breakdown</MenuItem>
                <MenuItem value="Vaccine">Vaccine</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Ethiopian Month</InputLabel>
              <Select value={selectedMonth} label="Ethiopian Month" onChange={(e) => setSelectedMonth(e.target.value)}>
                {ethiopianMonths.map((month) => (
                  <MenuItem key={month} value={month}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField fullWidth label="Year" type="number" value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)} inputProps={{ min: 2010, max: 2030 }} />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField fullWidth placeholder="Search by facility name or route..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
          </Grid>
        </Grid>
      </Card>

      {autoSaving && <Alert severity="info" sx={{ mb: 2 }}>Saving...</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Facilities Table */}
      <Card className="doc-card">
        <CardHeader title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <FacilityIcon color="primary" />
            <Typography variant="h6">Dispatched Facilities</Typography>
            <Chip label={`${facilityData.length} Facilities`} size="small" color="primary" variant="outlined" />
          </Stack>
        } />
        <Divider />
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={docTab} onChange={(_, v) => { setDocTab(v); setPage(0); }}>
            <Tab label={`In Progress (${facilityData.length})`} />
            <Tab label="History" />
          </Tabs>
        </Box>

        {docTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Facility</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ODNs</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>POD Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {facilityData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No facilities in progress.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  facilityData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((facility) => (
                    <TableRow key={facility.facility_id} className="facility-row" hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{facility.facility_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{facility.region_name} • {facility.zone_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <RouteIcon fontSize="small" color="action" />
                          <Typography variant="body2">{facility.route_name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${facility.total_odns} ODNs`} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {facility.pod_numbers ? (
                          <Stack spacing={0.5}>
                            <Chip label={`POD: ${facility.pod_numbers}`} size="small" color="info" />
                            <Typography variant="caption" color="text.secondary">KM: {facility.arrival_kilometer || 'N/A'}</Typography>
                          </Stack>
                        ) : (
                          <Chip label="Pending" size="small" color="warning" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={() => handleEditClick(facility)}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination component="div" count={facilityData.length} rowsPerPage={rowsPerPage} page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]} sx={{ borderTop: 1, borderColor: 'divider' }} />
          </TableContainer>
        )}

        {docTab === 1 && (
          <Box>
            {/* History Filters */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Received</InputLabel>
                  <Select value={historyReceivedBy} label="Received" onChange={e => setHistoryReceivedBy(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="received">Received</MenuItem>
                    <MenuItem value="not_received">Not Received</MenuItem>
                  </Select>
                </FormControl>
                <TextField size="small" label="From" type="date" value={historyDateFrom}
                  onChange={e => setHistoryDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                <TextField size="small" label="To" type="date" value={historyDateTo}
                  onChange={e => setHistoryDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
              </Stack>
            </Box>
            <Box sx={{ height: 580 }}>
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <DataGrid
                  rows={historyData.map((r, i) => ({ ...r, id: r.invoice_id || `${r.process_id}_${r.odn_id || i}` }))}
                  columns={[
                    {
                      field: 'seq', headerName: '#', width: 55, sortable: false,
                      renderCell: (params) => params.api.getRowIndex(params.id) + 1,
                    },
                    {
                      field: 'facility_name', headerName: 'Facility', flex: 1.5, minWidth: 180,
                      renderCell: ({ row }) => (
                        <Box sx={{ py: 0.5 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'normal', lineHeight: 1.3 }}>{row.facility_name || '—'}</Typography>
                          {row.woreda_name && <Typography variant="caption" color="text.secondary">{row.woreda_name}</Typography>}
                        </Box>
                      ),
                    },
                    {
                      field: 'route_name', headerName: 'Route', width: 140,
                      renderCell: ({ value }) => value ? <Chip label={value} size="small" color="primary" variant="outlined" /> : '—',
                    },
                    {
                      field: 'odn_number', headerName: 'ODN', width: 140,
                      renderCell: ({ value }) => <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{value || '—'}</Typography>,
                    },
                    {
                      field: 'pod_number', headerName: 'POD #', width: 180,
                      renderCell: ({ value }) => <Typography variant="body2" fontWeight={700} color="success.main" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{value || '—'}</Typography>,
                    },
                    { field: 'reporting_month', headerName: 'Month', width: 130 },
                    {
                      field: 'pod_confirmed_at', headerName: 'Submitted Date', width: 160,
                      renderCell: ({ value }) => value ? new Date(value).toLocaleDateString() : '—',
                    },
                    {
                      field: 'received', headerName: 'Received', width: 110,
                      renderCell: ({ value }) => value
                        ? <Chip icon={<ConfirmedIcon />} label="Yes" size="small" color="success" />
                        : <Chip label="No" size="small" color="warning" variant="outlined" />,
                    },
                    {
                      field: 'received_by', headerName: 'Received By', width: 170,
                      renderCell: ({ row }) => !row.received ? '—' : (
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{row.received_by || '—'}</Typography>
                          {row.received_at && <Typography variant="caption" color="text.secondary">{new Date(row.received_at).toLocaleDateString()}</Typography>}
                        </Box>
                      ),
                    },
                    {
                      field: 'actions', headerName: 'Actions', width: 130, sortable: false,
                      renderCell: ({ row }) => !!row.received ? (
                        <Tooltip title="Undo received — return to Documentation">
                          <Button variant="outlined" size="small" color="warning" startIcon={<UndoIcon />}
                            onClick={async () => {
                              const res = await MySwal.fire({
                                title: 'Return this record?', icon: 'warning',
                                showCancelButton: true, confirmButtonText: 'Yes, Return', confirmButtonColor: '#e65100'
                              });
                              if (!res.isConfirmed) return;
                              try {
                                await api.put(`${api_url}/api/invoices/${row.invoice_id}/return`, { returned_by: loggedInUserId });
                                MySwal.fire({ icon: 'success', title: 'Returned', timer: 1200, showConfirmButton: false });
                                fetchHistory();
                              } catch { MySwal.fire({ icon: 'error', title: 'Failed' }); }
                            }}
                            sx={{ textTransform: 'none' }}>Return</Button>
                        </Tooltip>
                      ) : (
                        <Button variant="contained" size="small" color="primary"
                          startIcon={<EditIcon />}
                          onClick={() => setHpEditDialog({ open: true, row, pod_number: row.pod_number || '' })}
                          sx={{ textTransform: 'none', fontWeight: 'bold' }}>Edit</Button>
                      ),
                    },
                  ]}
                  getRowHeight={() => 'auto'}
                  disableSelectionOnClick
                  components={{ Toolbar: HPExcelToolbar }}
                  componentsProps={{ toolbar: { onExport: exportHistoryToExcel } }}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  sx={{
                    border: 0,
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: '#7b1fa2', color: '#fff', fontWeight: 700 },
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
                    '& .MuiDataGrid-row:hover': { backgroundColor: '#f3e5f5' },
                    '& .MuiDataGrid-cell': { alignItems: 'flex-start', py: 1 },
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Typography variant="h6">Edit Documentation</Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedFacility?.facility_name} - {selectedFacility?.route_name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* POD Details Section */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>POD Details</Typography>
              <Stack spacing={2}>
                <TextField fullWidth size="small" label="POD Numbers" placeholder="e.g., POD001, POD002"
                  value={editFormData.pod_numbers}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, pod_numbers: e.target.value }))} />
                <TextField fullWidth size="small" type="number" label="Destination Kilometer"
                  value={editFormData.arrival_kilometer}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, arrival_kilometer: e.target.value }))}
                  inputProps={{ step: 0.01, min: 0 }} />
              </Stack>
            </Box>

            {/* POD Received Section */}
            <Box sx={{ p: 3, bgcolor: '#e3f2fd', borderRadius: 1, border: '2px solid #2196f3' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                POD Confirmation - Facility Level
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                This applies to all {editFormData.odns.length} ODNs in this facility
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={editFormData.all_pod_received}
                    onChange={(e) => handlePodReceivedChange(e.target.checked)}
                    color="success"
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 32 } }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      All POD Received
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Confirm that all documents for {editFormData.odns.length} ODNs have been signed and handed over
                    </Typography>
                  </Box>
                }
              />
              
              {/* ODN List - Read Only */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" gutterBottom sx={{ display: 'block' }}>
                  ODNs in this facility:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {editFormData.odns.map((odn) => (
                    <Chip 
                      key={odn.odn_id} 
                      label={odn.odn_number} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
              
              {!editFormData.all_pod_received && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Check "All POD Received" to enable completion and pass to Finance
                </Alert>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveEdit} disabled={autoSaving}>
            Save Progress
          </Button>
          {editFormData.all_pod_received && (
            <Button variant="contained" color="success" startIcon={<ConfirmedIcon />}
              onClick={handleCompleteAndPassToQE} disabled={autoSaving}>
              Complete & Pass to Finance
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* HP History Edit Dialog */}
      <Dialog open={hpEditDialog.open} onClose={() => setHpEditDialog({ open: false, row: null, pod_number: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Edit POD Number</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth size="small" label="POD Number" value={hpEditDialog.pod_number}
              onChange={e => setHpEditDialog(prev => ({ ...prev, pod_number: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHpEditDialog({ open: false, row: null, pod_number: '' })}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleHpEditSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentationHP;
