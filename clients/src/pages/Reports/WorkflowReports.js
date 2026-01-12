import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Stack,
  Avatar,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  LocalShipping,
  Description,
  Assignment,
  VerifiedUser,
  TrendingUp,
  CheckCircle,
  Pending,
  Route as RouteIcon,
  Business,
  Timeline
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const WorkflowReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  // Ethiopian calendar helper functions (copied from HP-Facilities)
  const getCurrentEthiopianMonth = (gDate = new Date()) => {
    // Ethiopian New Year starts on September 11 (or 12 in leap years)
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth(); // 0-based (0 = January, 8 = September)
    const gd = gDate.getDate();
    
    // Determine if current Gregorian year is a leap year
    const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
    
    // Ethiopian New Year date for current Gregorian year
    const newYearDay = isLeap ? 12 : 11; // September 12 in leap years, September 11 otherwise
    
    let ethYear, ethMonthIndex;
    
    // Check if we're before or after Ethiopian New Year
    if (gm > 8 || (gm === 8 && gd >= newYearDay)) {
      // After Ethiopian New Year - we're in the new Ethiopian year
      ethYear = gy - 7; // Ethiopian year is 7 years behind after New Year
      
      // Calculate days since Ethiopian New Year
      const newYearDate = new Date(gy, 8, newYearDay); // September 11/12
      const diffDays = Math.floor((gDate - newYearDate) / (24 * 60 * 60 * 1000));
      
      // Each Ethiopian month has 30 days (except Pagume which has 5/6 days)
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12; // Pagume (13th month)
      }
    } else {
      // Before Ethiopian New Year - we're still in the previous Ethiopian year
      ethYear = gy - 8; // Ethiopian year is 8 years behind before New Year
      
      // Calculate from previous year's Ethiopian New Year
      const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
      const prevNewYearDay = prevIsLeap ? 12 : 11;
      const prevNewYearDate = new Date(gy - 1, 8, prevNewYearDay);
      const diffDays = Math.floor((gDate - prevNewYearDate) / (24 * 60 * 60 * 1000));
      
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12; // Pagume
      }
    }
    
    // Ensure month index is within valid range
    ethMonthIndex = Math.max(0, Math.min(ethMonthIndex, 12));
    
    const result = { year: ethYear, monthIndex: ethMonthIndex };
    
    return result;
  };

  const initialEth = getCurrentEthiopianMonth();
  const currentEthiopianMonth = ethiopianMonths[initialEth.monthIndex];
  const currentEthiopianYear = initialEth.year;

  const [filters, setFilters] = useState({
    month: currentEthiopianMonth,
    year: currentEthiopianYear.toString()
  });

  // Data states
  const [dispatchData, setDispatchData] = useState({});
  const [documentationData, setDocumentationData] = useState({});
  const [followupData, setFollowupData] = useState({});
  const [qualityData, setQualityData] = useState({});
  const [workflowData, setWorkflowData] = useState({});

  const colors = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'];

  useEffect(() => {
    fetchAllData();
  }, [filters]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dispatchRes, docRes, followupRes, qualityRes, workflowRes] = await Promise.all([
        axios.get(`${API_URL}/api/reports/dispatch`, { params: filters }),
        axios.get(`${API_URL}/api/reports/documentation`, { params: filters }),
        axios.get(`${API_URL}/api/reports/followup`, { params: filters }),
        axios.get(`${API_URL}/api/reports/quality`, { params: filters }),
        axios.get(`${API_URL}/api/reports/workflow`, { params: filters })
      ]);
      
      setDispatchData(dispatchRes.data);
      setDocumentationData(docRes.data);
      setFollowupData(followupRes.data);
      setQualityData(qualityRes.data);
      setWorkflowData(workflowRes.data);
    } catch (err) {
      console.error('Error fetching workflow data:', err);
      setError('Failed to load workflow reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Workflow Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive analysis of dispatch, documentation, follow-up, and quality evaluation processes
        </Typography>
      </Box>

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Ethiopian Month</InputLabel>
            <Select
              value={filters.month}
              label="Ethiopian Month"
              onChange={(e) => handleFilterChange('month', e.target.value)}
            >
              <MenuItem value="">All Months</MenuItem>
              {ethiopianMonths.map((month) => (
                <MenuItem key={month} value={month}>{month}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Ethiopian Year</InputLabel>
            <Select
              value={filters.year}
              label="Ethiopian Year"
              onChange={(e) => handleFilterChange('year', e.target.value)}
            >
              <MenuItem value="">All Years</MenuItem>
              {Array.from({ length: 11 }, (_, i) => {
                const year = currentEthiopianYear - 5 + i;
                return (
                  <MenuItem key={year} value={year.toString()}>
                    {year}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Workflow Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
            color: 'white',
            '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <LocalShipping />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {dispatchData.stats?.completed_dispatches || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Dispatches
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
            color: 'white',
            '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <Description />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {documentationData.stats?.pod_confirmed || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    POD Confirmed
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
            color: 'white',
            '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {followupData.stats?.completed_followup || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Follow-up Done
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
            color: 'white',
            '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <VerifiedUser />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {qualityData.stats?.quality_confirmed || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Quality Confirmed
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
            color: 'white',
            '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s ease' }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {workflowData.stats?.fully_completed || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Fully Completed
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workflow Funnel */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Timeline color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Workflow Funnel Analysis
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workflowData.funnel || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2196f3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Reports Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Dispatch Reports" icon={<LocalShipping />} />
            <Tab label="Documentation Reports" icon={<Description />} />
            <Tab label="Follow-up Reports" icon={<Assignment />} />
            <Tab label="Quality Reports" icon={<VerifiedUser />} />
          </Tabs>
        </Box>

        {/* Dispatch Reports Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Dispatch Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary" fontWeight="bold">
                          {dispatchData.stats?.total_assignments || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Assignments
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {dispatchData.stats?.completion_rate || 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completion Rate
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Route Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dispatchData.routePerformance?.slice(0, 5) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="route_name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completion_rate" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Documentation Reports Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Documentation Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary" fontWeight="bold">
                          {documentationData.stats?.total_odns || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total ODNs
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {documentationData.stats?.confirmation_rate || 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Confirmation Rate
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Regional Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={documentationData.regionPerformance?.slice(0, 5) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region_name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="confirmation_rate" fill="#9c27b0" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Follow-up Reports Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Follow-up Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary" fontWeight="bold">
                          {followupData.stats?.total_confirmed_pods || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Confirmed PODs
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {followupData.stats?.followup_completion_rate || 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Follow-up Rate
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Regional Follow-up Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={followupData.regionPerformance?.slice(0, 5) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region_name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completion_rate" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Quality Reports Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Quality Evaluation Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary" fontWeight="bold">
                          {qualityData.stats?.total_ready_for_quality || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ready for Quality
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {qualityData.stats?.quality_confirmation_rate || 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Quality Rate
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Regional Quality Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={qualityData.regionPerformance?.slice(0, 5) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region_name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="confirmation_rate" fill="#4caf50" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Container>
  );
};

export default WorkflowReports;