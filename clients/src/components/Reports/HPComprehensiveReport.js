import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Card, CardContent, CardHeader, Grid, Typography, Box,
  Tabs, Tab, Button, TextField, MenuItem, Stack, Chip, Avatar,
  Alert, CircularProgress, Divider
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RouteIcon from '@mui/icons-material/Route';
import TableChartIcon from '@mui/icons-material/TableChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import axios from 'axios';

// Import sub-pages
import ODNPODDetailReport from './HPReport/ODNPODDetailReport';
import ReportOverview from './HPReport/ReportOverview';
import ServiceUnitsDetail from './HPReport/FacilitiesDetail';
import RouteAnalysis from './HPReport/RouteAnalysis';
import ServiceTimeTracking from './HPReport/ServiceTimeTracking';
import AllPicklists from '../Customer-Service/AllPicklists';
import OrganizationProfileView from './OrganizationProfileView';
import UserActivityLog from './UserActivityLog';

const HPComprehensiveReport = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const ethiopianMonths = [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
    'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
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
    return { year: ethYear, monthIndex: ethMonthIndex };
  };

  const initialEth = getCurrentEthiopianMonth();
  const [selectedMonth, setSelectedMonth] = useState(ethiopianMonths[initialEth.monthIndex]);
  const [selectedYear, setSelectedYear] = useState(initialEth.year);

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${api_url}/api/hp-comprehensive-report`, {
        params: {
          month: selectedMonth,
          year: selectedYear
        }
      });
      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExportReport = () => {
    // TODO: Implement PDF/Excel export
    console.log('Exporting report...');
  };

  const tabs = [
    { label: 'ODN/POD Details', icon: <AssignmentIcon /> },
    { label: 'ODN/RRF', icon: <AssessmentIcon /> },
    { label: 'Service Units Detail', icon: <TableChartIcon /> },
    { label: 'Route Analysis', icon: <RouteIcon /> },
    { label: 'Service Time Tracking', icon: <AccessTimeIcon /> },
    { label: 'User Activity Log', icon: <HistoryIcon /> },
    { label: 'All Picklists', icon: <TrendingUpIcon /> },
    { label: 'Organization Profile', icon: <TimelineIcon /> }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <AssessmentIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="white">
                  HP Comprehensive Report
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Health Program Performance Analytics
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Ethiopian Month"
                size="small"
                fullWidth
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {ethiopianMonths.map(month => (
                  <MenuItem key={month} value={month}>{month}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Ethiopian Year"
                size="small"
                fullWidth
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {[selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Chip
                label={`Reporting Period: ${selectedMonth} ${selectedYear}`}
                color="primary"
                sx={{ fontWeight: 'bold' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Tabs */}
      {!loading && reportData && (
        <Card>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
            ))}
          </Tabs>
          <Divider />
          <CardContent sx={{ p: 3 }}>
            {activeTab === 0 && <ODNPODDetailReport />}
            {activeTab === 1 && <ReportOverview data={reportData} />}
            {activeTab === 2 && <ServiceUnitsDetail data={reportData} />}
            {activeTab === 3 && <RouteAnalysis data={reportData} />}
            {activeTab === 4 && <ServiceTimeTracking />}
            {activeTab === 5 && <UserActivityLog />}
            {activeTab === 6 && <AllPicklists />}
            {activeTab === 7 && <OrganizationProfileView />}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default HPComprehensiveReport;
