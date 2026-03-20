import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Card, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, Grid, LinearProgress, Alert,
  Checkbox, TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel
} from '@mui/material';
import {
  Assignment as QualityIcon,
  Business as FacilityIcon,
  VerifiedUser as VerifiedIcon,
  Search as SearchIcon,
  Route as RouteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const QualityEvaluationHP = () => {
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
  const [editFormData, setEditFormData] = useState({
    quality_confirmed: false,
    quality_feedback: '',
    odns: []
  });

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isQualityEvaluator = userJobTitle === 'Quality Evaluator';
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
      fetchQualityFacilities();
    }
  }, [selectedMonth, selectedYear, searchTerm, page, rowsPerPage, filterType]);

  // Silent background polling every 5s (only when no dialog is open)
  useEffect(() => {
    if (!selectedMonth || !selectedYear) return;
    const silentFetch = async () => {
      if (openEditDialog) return;
      try {
        const res = await axios.get(`${api_url}/api/quality-evaluation-odns`, {
          params: { month: selectedMonth, year: selectedYear, search: searchTerm, process_type: filterType.toLowerCase() }
        });
        const odns = res.data.odns || [];
        const facilityMap = {};
        odns.forEach(odn => {
          const dispatchDate = odn.dispatch_completed_at ? new Date(odn.dispatch_completed_at).toISOString().split('T')[0] : 'unknown';
          const key = `${odn.facility_name}_${dispatchDate}`;
          if (!facilityMap[key]) {
            facilityMap[key] = { facility_name: odn.facility_name, region_name: odn.region_name, route_name: odn.route_name, dispatch_completed_at: odn.dispatch_completed_at, odns: [], total_odns: 0, quality_confirmed_count: 0 };
          }
          facilityMap[key].odns.push({ odn_id: odn.odn_id, odn_number: odn.odn_number, pod_number: odn.pod_number, quality_confirmed: odn.quality_confirmed, quality_feedback: odn.quality_feedback });
          facilityMap[key].total_odns++;
          if (odn.quality_confirmed) facilityMap[key].quality_confirmed_count++;
        });
        setFacilityData(Object.values(facilityMap));
      } catch (_) {}
    };
    const interval = setInterval(silentFetch, 5000);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear, searchTerm, filterType, openEditDialog]);

  const fetchQualityFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${api_url}/api/quality-evaluation-odns`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
          search: searchTerm,
          process_type: filterType.toLowerCase()
        }
      });
      
      const odns = response.data.odns || [];
      
      // Group ODNs by facility + dispatch completion time (to separate different delivery batches)
      const facilityMap = {};
      odns.forEach(odn => {
        const dispatchDate = odn.dispatch_completed_at ? new Date(odn.dispatch_completed_at).toISOString().split('T')[0] : 'unknown';
        const key = `${odn.facility_name}_${dispatchDate}`; // Unique key per facility-dispatch batch
        
        console.log('Processing ODN:', {
          odn_number: odn.odn_number,
          facility: odn.facility_name,
          dispatch_completed_at: odn.dispatch_completed_at,
          dispatchDate,
          key
        });
        
        if (!facilityMap[key]) {
          facilityMap[key] = {
            facility_name: odn.facility_name,
            region_name: odn.region_name,
            route_name: odn.route_name,
            dispatch_completed_at: odn.dispatch_completed_at,
            odns: [],
            total_odns: 0,
            quality_confirmed_count: 0
          };
        }
        facilityMap[key].odns.push({
          odn_id: odn.odn_id,
          odn_number: odn.odn_number,
          pod_number: odn.pod_number,
          quality_confirmed: odn.quality_confirmed,
          quality_feedback: odn.quality_feedback
        });
        facilityMap[key].total_odns++;
        if (odn.quality_confirmed) facilityMap[key].quality_confirmed_count++;
      });
      
      console.log('Facility groups:', Object.keys(facilityMap));
      console.log('Facility map:', facilityMap);
      
      setFacilityData(Object.values(facilityMap));
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load facilities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (facility) => {
    setSelectedFacility(facility);
    
    // Check if all ODNs are quality confirmed
    const allConfirmed = facility.odns.every(odn => odn.quality_confirmed);
    
    // Get common feedback (if all have same feedback)
    const feedbacks = facility.odns.map(odn => odn.quality_feedback || '');
    const commonFeedback = feedbacks.every(f => f === feedbacks[0]) ? feedbacks[0] : '';
    
    setEditFormData({
      quality_confirmed: allConfirmed,
      quality_feedback: commonFeedback,
      odns: facility.odns.map(odn => ({
        odn_id: odn.odn_id,
        odn_number: odn.odn_number,
        pod_number: odn.pod_number || 'N/A'
      }))
    });
    
    setOpenEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      setAutoSaving(true);

      // Update all ODNs in the facility
      const odnUpdates = selectedFacility.odns.map(odn => ({
        odn_id: odn.odn_id,
        quality_confirmed: editFormData.quality_confirmed,
        quality_feedback: editFormData.quality_feedback
      }));

      await axios.put(`${api_url}/api/odns/bulk-quality-evaluation`, {
        updates: odnUpdates,
        evaluated_by: loggedInUserId
      });

      MySwal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Quality evaluation updated successfully',
        timer: 2000,
        showConfirmButton: false
      });

      setOpenEditDialog(false);
      fetchQualityFacilities();

    } catch (err) {
      console.error('Save error:', err);
      MySwal.fire('Error', 'Failed to save quality evaluation', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  if (!isQualityEvaluator) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>This page is restricted to Quality Evaluator role only.</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <style>
        {`
          .quality-card { transition: all 0.3s ease; }
          .quality-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
          .facility-row { transition: all 0.2s ease; }
          .facility-row:hover { background-color: #f5f5f5; }
          .completed-row { background-color: #e8f5e9; opacity: 0.8; }
        `}
      </style>
      
      {/* Header */}
      <Card sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)', color: 'white', p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
              <QualityIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold">HP Quality Evaluation</Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Evaluate delivery quality and provide feedback
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
      <Card className="quality-card">
        <CardHeader title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <FacilityIcon color="primary" />
            <Typography variant="h6">Facilities for Quality Evaluation</Typography>
            <Chip label={`${facilityData.length} Facilities`} size="small" color="primary" variant="outlined" />
          </Stack>
        } />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Facility</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ODNs</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>POD</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {facilityData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No facilities found for the selected period.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                facilityData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((facility, index) => {
                  const isFullyEvaluated = facility.quality_confirmed_count === facility.total_odns;
                  
                  return (
                    <TableRow key={index} className={`facility-row ${isFullyEvaluated ? 'completed-row' : ''}`} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{facility.facility_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{facility.region_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <RouteIcon fontSize="small" color="action" />
                          <Typography variant="body2">{facility.route_name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {facility.odns.map((odn) => (
                            <Chip 
                              key={odn.odn_id} 
                              label={odn.odn_number} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                              sx={{ height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', wordBreak: 'break-all' } }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {[...new Set(facility.odns.map(odn => odn.pod_number).filter(Boolean))].map((podNum, idx) => (
                            <Chip 
                              key={idx} 
                              label={podNum} 
                              size="small" 
                              variant="outlined"
                              color="info"
                              sx={{ height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', wordBreak: 'break-all' } }}
                            />
                          ))}
                          {facility.odns.every(odn => !odn.pod_number) && (
                            <Typography variant="caption" color="text.secondary">N/A</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {isFullyEvaluated ? (
                          <Chip icon={<VerifiedIcon />} label="Evaluated" color="success" size="small" />
                        ) : (
                          <Button variant="contained" size="small" startIcon={<EditIcon />}
                            onClick={() => handleEditClick(facility)}>
                            Evaluate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination component="div" count={facilityData.length} rowsPerPage={rowsPerPage} page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]} sx={{ borderTop: 1, borderColor: 'divider' }} />
        </TableContainer>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Quality Evaluation</Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedFacility?.facility_name} - {selectedFacility?.route_name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* POD Information - Read Only */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>POD Information</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {editFormData.odns.map((odn) => (
                  <Chip 
                    key={odn.odn_id} 
                    label={`${odn.odn_number} (POD: ${odn.pod_number})`} 
                    size="small" 
                    variant="outlined"
                    color="info"
                  />
                ))}
              </Box>
            </Box>

            {/* Quality Evaluation Section */}
            <Box sx={{ p: 3, bgcolor: '#e8f5e9', borderRadius: 1, border: '2px solid #4caf50' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="success.main">
                Quality Evaluation - Facility Level
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                This applies to all {editFormData.odns.length} ODNs in this facility
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={editFormData.quality_confirmed}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, quality_confirmed: e.target.checked }))}
                    color="success"
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 32 } }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      Quality Confirmed
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Confirm quality for all {editFormData.odns.length} ODNs
                    </Typography>
                  </Box>
                }
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Quality Feedback"
                placeholder="Enter feedback for this facility (optional)..."
                value={editFormData.quality_feedback}
                onChange={(e) => setEditFormData(prev => ({ ...prev, quality_feedback: e.target.value }))}
                sx={{ mt: 2 }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" startIcon={<SaveIcon />}
            onClick={handleSaveEdit} disabled={autoSaving}>
            Save Evaluation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QualityEvaluationHP;
