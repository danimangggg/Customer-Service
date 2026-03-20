import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Card, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, Grid, LinearProgress, Alert,
  Checkbox, FormControl, InputLabel, Select, MenuItem, InputAdornment, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText
} from '@mui/material';
import {
  Assignment as DocumentIcon,
  Description as ODNIcon,
  Business as FacilityIcon,
  CheckCircle as CompletedIcon,
  Search as SearchIcon,
  Route as RouteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';
import api from '../../axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const DocumentFollowup = () => {
  const [facilityData, setFacilityData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [odnUpdates, setOdnUpdates] = useState({});
  const [autoSaving, setAutoSaving] = useState(false);

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isDocumentationOfficer = userJobTitle === 'Documentation Officer - HP';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  const getCurrentEthiopianMonth = () => {
    const ethiopianMonths = ['Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'];
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
      fetchFollowupFacilities();
      fetchStats();
    }
  }, [selectedMonth, selectedYear, searchTerm]);

  const fetchFollowupFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`${api_url}/api/followup-odns`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
          search: searchTerm
        }
      });
      
      const odns = response.data.odns || [];
      
      // Group ODNs by facility
      const facilityMap = {};
      odns.forEach(odn => {
        const key = odn.facility_id;
        if (!facilityMap[key]) {
          facilityMap[key] = {
            facility_id: odn.facility_id,
            facility_name: odn.facility_name,
            region_name: odn.region_name,
            route_name: odn.route_name,
            pod_number: odn.pod_number,
            odns: [],
            total_odns: 0,
            signed_count: 0,
            handover_count: 0
          };
        }
        facilityMap[key].odns.push(odn);
        facilityMap[key].total_odns++;
        if (odn.documents_signed) facilityMap[key].signed_count++;
        if (odn.documents_handover) facilityMap[key].handover_count++;
      });
      
      setFacilityData(Object.values(facilityMap));
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load facilities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`${api_url}/api/followup/stats`, {
        params: { month: selectedMonth, year: selectedYear }
      });
      setStats(response.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const handleEditFacility = (facility) => {
    setSelectedFacility(facility);
    const updates = {};
    facility.odns.forEach(odn => {
      updates[odn.odn_id] = {
        documents_signed: Boolean(odn.documents_signed),
        documents_handover: Boolean(odn.documents_handover)
      };
    });
    setOdnUpdates(updates);
    setOpenEditDialog(true);
  };

  const handleCheckboxChange = (odnId, field, checked) => {
    setOdnUpdates(prev => ({
      ...prev,
      [odnId]: {
        ...prev[odnId],
        [field]: checked
      }
    }));
  };

  const handleSaveFollowup = async () => {
    try {
      setAutoSaving(true);
      
      const updates = Object.keys(odnUpdates).map(odnId => ({
        odn_id: parseInt(odnId),
        documents_signed: odnUpdates[odnId].documents_signed,
        documents_handover: odnUpdates[odnId].documents_handover
      }));

      await axios.put(`${api_url}/api/odns/bulk-followup`, {
        updates,
        completed_by: loggedInUserId
      });

      MySwal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Document follow-up updated successfully',
        timer: 2000,
        showConfirmButton: false
      });

      setOpenEditDialog(false);
      fetchFollowupFacilities();
      fetchStats();
    } catch (err) {
      console.error('Save error:', err);
      MySwal.fire('Error', 'Failed to save document follow-up.', 'error');
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
      {/* Header */}
      <Card sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)', color: 'white', p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
              <DocumentIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold">Document Follow-up</Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Track document signing and handover by facility (POD-based)
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}>
                {ethiopianMonths.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField fullWidth label="Year" type="number" value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={7}>
            <TextField fullWidth placeholder="Search by facility..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
          </Grid>
        </Grid>
      </Card>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)', color: 'white' }}>
            <Typography variant="h4" fontWeight="bold">{stats.totalConfirmed || 0}</Typography>
            <Typography>Total PODs</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)', color: 'white' }}>
            <Typography variant="h4" fontWeight="bold">{stats.documentsSigned || 0}</Typography>
            <Typography>Documents Signed</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', color: 'white' }}>
            <Typography variant="h4" fontWeight="bold">{stats.documentsHandover || 0}</Typography>
            <Typography>Documents Handover</Typography>
          </Card>
        </Grid>
      </Grid>

      {autoSaving && <Alert severity="info" sx={{ mb: 2 }}>Saving...</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Facilities Table */}
      <Card>
        <CardHeader title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <FacilityIcon color="primary" />
            <Typography variant="h6">Facilities - Document Follow-up</Typography>
            <Chip label={`${facilityData.length} facilities`} size="small" color="primary" variant="outlined" />
          </Stack>
        } />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Facility</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>POD Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ODNs</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Progress</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {facilityData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((facility) => {
                const isComplete = facility.signed_count === facility.total_odns && facility.handover_count === facility.total_odns;
                return (
                  <TableRow key={facility.facility_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{facility.facility_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{facility.region_name}</Typography>
                    </TableCell>
                    <TableCell>{facility.route_name}</TableCell>
                    <TableCell>
                      <Chip label={facility.pod_number || 'N/A'} size="small" color="info" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={`${facility.total_odns} ODNs`} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="caption">
                          Signed: {facility.signed_count}/{facility.total_odns}
                        </Typography>
                        <Typography variant="caption">
                          Handover: {facility.handover_count}/{facility.total_odns}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      {isComplete ? (
                        <Chip icon={<CompletedIcon />} label="Completed" color="success" size="small" />
                      ) : (
                        <Button variant="contained" size="small" startIcon={<EditIcon />}
                          onClick={() => handleEditFacility(facility)}>
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination component="div" count={facilityData.length} rowsPerPage={rowsPerPage} page={page}
            onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[5, 10, 25, 50]} />
        </TableContainer>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Edit Document Follow-up</Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedFacility?.facility_name} - POD: {selectedFacility?.pod_number}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedFacility?.odns.map((odn) => (
              <ListItem key={odn.odn_id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                <ListItemText 
                  primary={<Typography fontWeight="bold">{odn.odn_number}</Typography>}
                  secondary={
                    <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                      <Box>
                        <Checkbox 
                          checked={odnUpdates[odn.odn_id]?.documents_signed || false}
                          onChange={(e) => handleCheckboxChange(odn.odn_id, 'documents_signed', e.target.checked)}
                        />
                        <Typography variant="caption">Documents Signed</Typography>
                      </Box>
                      <Box>
                        <Checkbox 
                          checked={odnUpdates[odn.odn_id]?.documents_handover || false}
                          onChange={(e) => handleCheckboxChange(odn.odn_id, 'documents_handover', e.target.checked)}
                        />
                        <Typography variant="caption">Documents Handover</Typography>
                      </Box>
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveFollowup} disabled={autoSaving}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentFollowup;
