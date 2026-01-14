import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Card, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, Grid, LinearProgress, Alert,
  Checkbox, FormControl, InputLabel, Select, MenuItem, InputAdornment, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel
} from '@mui/material';
import {
  Assignment as QualityIcon,
  Description as ODNIcon,
  Business as FacilityIcon,
  Pending as PendingIcon,
  Search as SearchIcon,
  Route as RouteIcon,
  Feedback as FeedbackIcon,
  VerifiedUser as VerifiedIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const QualityEvaluation = () => {
  const [odnData, setODNData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingODN, setEditingODN] = useState(null);
  const [editQualityConfirmed, setEditQualityConfirmed] = useState(false);
  const [editFeedback, setEditFeedback] = useState('');

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isQualityEvaluator = userJobTitle === 'Quality Evaluator';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  useEffect(() => {
    // Get current Ethiopian month and year
    const getCurrentEthiopianMonth = () => {
      const ethiopianMonths = [
        'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
      ];
      
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
        year: ethYear
      };
    };

    const currentEthiopian = getCurrentEthiopianMonth();
    setSelectedMonth(currentEthiopian.month);
    setSelectedYear(currentEthiopian.year.toString());
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchQualityEvaluationODNs();
      fetchStats();
    }
  }, [selectedMonth, selectedYear, searchTerm, page, rowsPerPage]);

  const fetchQualityEvaluationODNs = async () => {
    try {
      console.log('=== FETCH ODNs DEBUG ===');
      console.log('selectedMonth:', selectedMonth);
      console.log('selectedYear:', selectedYear);
      console.log('page:', page);
      console.log('rowsPerPage:', rowsPerPage);
      console.log('searchTerm:', searchTerm);
      
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${api_url}/api/quality-evaluation-odns`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        }
      });
      
      console.log('Fetch response:', response.data);
      console.log('ODNs count:', response.data.odns?.length);
      
      setODNData(response.data.odns || []);
    } catch (err) {
      console.error("=== FETCH ERROR ===");
      console.error("Fetch error:", err);
      console.error("Error response:", err.response?.data);
      setError("Failed to load ODNs for quality evaluation. Please try again.");
    } finally {
      setLoading(false);
      console.log('=== FETCH ODNs END ===');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${api_url}/api/quality-evaluation/stats`, {
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

  const handleEditClick = (odn) => {
    console.log('=== EDIT CLICK DEBUG ===');
    console.log('Selected ODN:', odn);
    console.log('Current quality_confirmed:', odn.quality_confirmed);
    console.log('Current quality_feedback:', odn.quality_feedback);
    
    setEditingODN(odn);
    setEditQualityConfirmed(Boolean(Number(odn.quality_confirmed)));
    setEditFeedback(odn.quality_feedback || '');
    setEditDialogOpen(true);
    
    console.log('Dialog state set - editQualityConfirmed:', Boolean(Number(odn.quality_confirmed)));
    console.log('Dialog state set - editFeedback:', odn.quality_feedback || '');
    console.log('=== EDIT CLICK END ===');
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setEditingODN(null);
    setEditQualityConfirmed(false);
    setEditFeedback('');
  };

  const handleSaveEdit = async () => {
    if (!editingODN) {
      console.error('No ODN selected for editing');
      return;
    }

    console.log('=== SAVE EDIT DEBUG ===');
    console.log('editingODN:', editingODN);
    console.log('editQualityConfirmed:', editQualityConfirmed);
    console.log('editFeedback:', editFeedback);
    console.log('loggedInUserId:', loggedInUserId);

    try {
      setAutoSaving(true);
      const update = {
        odn_id: parseInt(editingODN.odn_id),
        quality_confirmed: editQualityConfirmed,
        quality_feedback: editFeedback
      };

      console.log('Sending update payload:', update);
      console.log('API URL:', `${api_url}/api/odns/bulk-quality-evaluation`);

      const response = await axios.put(`${api_url}/api/odns/bulk-quality-evaluation`, {
        updates: [update],
        evaluated_by: parseInt(loggedInUserId)
      });

      console.log('API Response:', response.data);
      console.log('Response status:', response.status);

      // Update ODN data
      console.log('Updating local ODN data...');
      setODNData(prevData => 
        prevData.map(odn => 
          odn.odn_id === editingODN.odn_id 
            ? { 
                ...odn, 
                quality_confirmed: editQualityConfirmed ? 1 : 0,
                quality_feedback: editFeedback,
                quality_evaluated_by: parseInt(loggedInUserId),
                quality_evaluated_at: new Date().toISOString()
              }
            : odn
        )
      );

      // Refresh data from server to ensure consistency
      console.log('Refreshing data from server...');
      await fetchQualityEvaluationODNs();

      // Update stats
      console.log('Updating stats...');
      fetchStats();

      // Show success message
      MySwal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Quality evaluation updated successfully',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      console.log('Save completed successfully');
      handleDialogClose();
      
    } catch (err) {
      console.error('=== SAVE ERROR ===');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error config:', err.config);
      MySwal.fire('Error', 'Failed to save quality evaluation.', 'error');
    } finally {
      setAutoSaving(false);
      console.log('=== SAVE EDIT END ===');
    }
  };

  // Access control
  if (!isQualityEvaluator) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to Quality Evaluator role only.
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
          .quality-card {
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
          }
          .quality-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-left-color: #4caf50;
          }
          .stats-card {
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white;
            border-radius: 16px;
          }
          .stats-card-2 {
            background: linear-gradient(135deg, #2196f3 0%, #64b5f6 100%);
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
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
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
                <QualityIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                  Quality Evaluation Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Evaluate process quality and provide feedback for completed deliveries
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
                    {stats.totalReady || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Ready for Evaluation
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card className="stats-card-2" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <VerifiedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.qualityConfirmed || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Quality Confirmed
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card className="stats-card-3" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <PendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.qualityPending || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Quality Pending
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card className="stats-card-4" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <FeedbackIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.withFeedback || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    With Feedback
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
        <Card className="quality-card">
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <ODNIcon color="primary" />
                <Typography variant="h6">Quality Evaluation Tracking</Typography>
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
                      <VerifiedIcon fontSize="small" />
                      <span>Quality Status</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FeedbackIcon fontSize="small" />
                      <span>Feedback</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <span>Actions</span>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {odnData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((odn) => {
                  // Check if this ODN has passed quality evaluation stage (quality confirmed)
                  const isInactive = Boolean(Number(odn.quality_confirmed));
                  
                  return (
                  <TableRow 
                    key={odn.odn_id}
                    hover 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      bgcolor: isInactive ? 'grey.100' : 'inherit',
                      opacity: isInactive ? 0.6 : 1
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
                    <Box textAlign="center">
                      <Chip 
                        label={Boolean(Number(odn.quality_confirmed)) ? "✓ Confirmed" : "⚠ Pending"}
                        color={Boolean(Number(odn.quality_confirmed)) ? "success" : "warning"}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ 
                      fontStyle: odn.quality_feedback ? 'normal' : 'italic',
                      color: odn.quality_feedback ? 'text.primary' : 'text.secondary'
                    }}>
                      {odn.quality_feedback || 'No feedback provided'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {isInactive ? (
                      <Chip 
                        label="Process Complete" 
                        color="success" 
                        size="small" 
                        variant="outlined"
                      />
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditClick(odn)}
                        sx={{ minWidth: 80 }}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                  </TableRow>
                  );
                })}
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

        {/* Edit Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <EditIcon color="primary" />
              <Box>
                <Typography variant="h6">Edit Quality Evaluation</Typography>
                <Typography variant="body2" color="text.secondary">
                  ODN: {editingODN?.odn_number} - {editingODN?.facility_name}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editQualityConfirmed}
                    onChange={(e) => setEditQualityConfirmed(e.target.checked)}
                    color="success"
                  />
                }
                label="Process Quality Confirmed"
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Quality Feedback"
                placeholder="Enter quality feedback (optional)..."
                value={editFeedback}
                onChange={(e) => setEditFeedback(e.target.value)}
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              variant="contained"
              disabled={autoSaving}
              startIcon={autoSaving ? <LinearProgress size={20} /> : <VerifiedIcon />}
            >
              {autoSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default QualityEvaluation;