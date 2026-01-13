import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Card, CardContent, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, Grid, LinearProgress, Alert,
  Checkbox, FormControl, InputLabel, Select, MenuItem, InputAdornment, TextField
} from '@mui/material';
import {
  Assignment as DocumentIcon,
  Description as ODNIcon,
  Business as FacilityIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  CalendarToday as CalendarTodayIcon,
  Search as SearchIcon,
  Route as RouteIcon,
  Edit as SignatureIcon,
  Share as HandoverIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const DocumentFollowupCheckbox = ({ odn, field, pendingUpdates, onFollowupChange }) => {
  const getFollowupStatus = () => {
    const pendingUpdate = pendingUpdates[odn.odn_id];
    if (pendingUpdate !== undefined && pendingUpdate[field] !== undefined) {
      return Boolean(pendingUpdate[field]);
    }
    return Boolean(Number(odn[field]));
  };

  const handleChange = (e) => {
    onFollowupChange(odn.odn_id, field, e.target.checked);
  };

  const isChecked = getFollowupStatus();

  return (
    <Box textAlign="center">
      <Checkbox
        checked={isChecked}
        onChange={handleChange}
        color="success"
        size="medium"
        inputProps={{ 'aria-label': `${field} for ODN ${odn.odn_number}` }}
      />
      <Typography variant="caption" display="block" sx={{ 
        mt: 0.5,
        color: isChecked ? 'success.main' : 'warning.main',
        fontWeight: 'bold'
      }}>
        {isChecked ? '✓ Done' : '⚠ Pending'}
      </Typography>
    </Box>
  );
};

const DocumentFollowup = () => {
  const [odnData, setODNData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [pendingUpdates, setPendingUpdates] = useState({});
  const [autoSaving, setAutoSaving] = useState(false);

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isDocumentFollower = userJobTitle === 'Documentation Follower';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  // Ethiopian calendar function
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
      
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12;
      }
    } else {
      ethYear = gy - 8;
      const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
      const prevNewYearDay = prevIsLeap ? 12 : 11;
      const prevNewYearDate = new Date(gy - 1, 8, prevNewYearDay);
      const diffDays = Math.floor((gDate - prevNewYearDate) / (24 * 60 * 60 * 1000));
      
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12;
      }
    }
    
    ethMonthIndex = Math.max(0, Math.min(ethMonthIndex, 12));
    
    return {
      month: ethiopianMonths[ethMonthIndex],
      year: ethYear,
      monthIndex: ethMonthIndex
    };
  };

  const currentEthiopian = getCurrentEthiopianMonth();

  useEffect(() => {
    setSelectedMonth(currentEthiopian.month);
    setSelectedYear(currentEthiopian.year.toString());
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchFollowupODNs();
      fetchStats();
    }
  }, [selectedMonth, selectedYear, searchTerm, page, rowsPerPage]);

  const fetchFollowupODNs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${api_url}/api/followup-odns`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        }
      });
      
      setODNData(response.data.odns || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load ODNs for follow-up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${api_url}/api/followup/stats`, {
        params: {
          month: selectedMonth,
          year: selectedYear
        }
      });
      setStats(response.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const handleFollowupChange = async (odnId, field, checked) => {
    // Update UI immediately
    setPendingUpdates(prev => {
      const newState = {
        ...prev,
        [odnId]: {
          ...prev[odnId],
          [field]: Boolean(checked)
        }
      };
      return newState;
    });

    // Update ODN data for consistent UI
    setODNData(prevData => 
      prevData.map(odn => 
        odn.odn_id === odnId 
          ? { ...odn, [field]: checked ? 1 : 0 }
          : odn
      )
    );

    // Save to database immediately
    try {
      setAutoSaving(true);
      const currentData = odnData.find(odn => odn.odn_id === odnId);
      const update = {
        odn_id: parseInt(odnId),
        documents_signed: field === 'documents_signed' ? checked : Boolean(Number(currentData.documents_signed)),
        documents_handover: field === 'documents_handover' ? checked : Boolean(Number(currentData.documents_handover))
      };

      await axios.put(`${api_url}/api/odns/bulk-followup`, {
        updates: [update],
        completed_by: loggedInUserId
      });

      // Remove from pending updates since it's saved
      setPendingUpdates(prev => {
        const newState = { ...prev };
        if (newState[odnId]) {
          delete newState[odnId][field];
          if (Object.keys(newState[odnId]).length === 0) {
            delete newState[odnId];
          }
        }
        return newState;
      });

      // Update stats
      fetchStats();

      // Show brief success message
      MySwal.fire({
        icon: 'success',
        title: 'Saved!',
        text: `${field === 'documents_signed' ? 'Documents signed' : 'Documents handover'} updated`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
    } catch (err) {
      console.error('Save error:', err);
      // Revert UI changes if save failed
      setODNData(prevData => 
        prevData.map(odn => 
          odn.odn_id === odnId 
            ? { ...odn, [field]: !checked ? 1 : 0 }
            : odn
        )
      );
      setPendingUpdates(prev => {
        const newState = { ...prev };
        if (newState[odnId]) {
          delete newState[odnId][field];
          if (Object.keys(newState[odnId]).length === 0) {
            delete newState[odnId];
          }
        }
        return newState;
      });
      MySwal.fire('Error', 'Failed to save document follow-up status.', 'error');
    } finally {
      setAutoSaving(false);
    }
  };

  // Access control
  if (!isDocumentFollower) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to Documentation Follower role only.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            <strong>Current JobTitle:</strong> "{userJobTitle}"
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <style>
        {`
          .followup-card {
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
          }
          .followup-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-left-color: #2196f3;
          }
          .stats-card {
            background: linear-gradient(135deg, #2196f3 0%, #64b5f6 100%);
            color: white;
            border-radius: 16px;
          }
          .stats-card-2 {
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white;
            border-radius: 16px;
          }
          .stats-card-3 {
            background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
            color: white;
            border-radius: 16px;
          }
          .stats-card-4 {
            background: linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%);
            color: white;
            border-radius: 16px;
          }
          .header-gradient {
            background: linear-gradient(135deg, #2196f3 0%, #64b5f6 100%);
            color: white;
            padding: 24px;
            border-radius: 16px 16px 0 0;
          }
        `}
      </style>
      
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Header Section */}
        <Card sx={{ mb: 3, overflow: 'hidden' }}>
          <Box className="header-gradient">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <DocumentIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                  Document Follow-up Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Track document signing and handover for confirmed POD deliveries
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {/* Filters */}
        <Card sx={{ mb: 3, p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Ethiopian Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Ethiopian Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {ethiopianMonths.map((month) => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                inputProps={{ min: 2010, max: 2030 }}
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                placeholder="Search by ODN number or facility name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Card>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card className="stats-card" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <ODNIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalConfirmed || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Confirmed PODs
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card className="stats-card-2" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <SignatureIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.documentsSigned || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Documents Signed
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card className="stats-card-3" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <HandoverIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.documentsHandover || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Documents Handover
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card className="stats-card-4" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <CompletedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.completedFollowup || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completed Follow-up
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Auto-save indicator */}
        {autoSaving && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LinearProgress sx={{ width: 100 }} />
              <Typography variant="body2">Auto-saving...</Typography>
            </Stack>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* ODNs Table */}
        <Card className="followup-card">
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <ODNIcon color="primary" />
                <Typography variant="h6">Document Follow-up Tracking</Typography>
                <Chip 
                  label={`${odnData.length} ODNs`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Stack>
            }
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ODNIcon fontSize="small" />
                      <span>ODN Number</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FacilityIcon fontSize="small" />
                      <span>Facility</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <RouteIcon fontSize="small" />
                      <span>Route</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                      <SignatureIcon fontSize="small" />
                      <span>Documents Signed</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                      <HandoverIcon fontSize="small" />
                      <span>Documents Handover</span>
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {odnData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((odn, index) => (
                  <TableRow 
                    key={`${odn.odn_id}-${odn.documents_signed}-${odn.documents_handover}-${pendingUpdates[odn.odn_id]?.documents_signed || 'none'}-${pendingUpdates[odn.odn_id]?.documents_handover || 'none'}`}
                    hover 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      bgcolor: pendingUpdates[odn.odn_id] ? 'warning.50' : 'inherit',
                      borderLeft: pendingUpdates[odn.odn_id] ? '3px solid orange' : 'none'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {odn.odn_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {odn.facility_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {odn.region_name} • {odn.zone_name} • {odn.woreda_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {odn.route_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <DocumentFollowupCheckbox 
                        odn={odn}
                        field="documents_signed"
                        pendingUpdates={pendingUpdates}
                        onFollowupChange={handleFollowupChange}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <DocumentFollowupCheckbox 
                        odn={odn}
                        field="documents_handover"
                        pendingUpdates={pendingUpdates}
                        onFollowupChange={handleFollowupChange}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination 
              component="div" 
              count={odnData.length} 
              rowsPerPage={rowsPerPage} 
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </TableContainer>
        </Card>
      </Container>
    </>
  );
};

export default DocumentFollowup;