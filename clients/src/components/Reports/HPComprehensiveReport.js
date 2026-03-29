import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../axiosInstance';
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
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FinanceInvoiceView from '../Finance/FinanceInvoiceView';

// Import sub-pages
import ODNPODDetailReport from './HPReport/ODNPODDetailReport';
import ReportOverview from './HPReport/ReportOverview';
import ServiceUnitsDetail from './HPReport/FacilitiesDetail';
import RouteAnalysis from './HPReport/RouteAnalysis';
import HPCustomerDetailReport from './HPReport/HPCustomerDetailReport';
import HPPicklistReport from './HPReport/HPPicklistReport';
import OrganizationProfileView from './OrganizationProfileView';
import HPDashboard from '../../pages/Customer-Service/HealthProgram/HPDashboard';
import BranchSelect from '../Settings/BranchSelect';

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
  const [processType, setProcessType] = useState('regular');

  // Branch filter — Super Admin and Reports job title can pick a branch; others use their own
  const currentAccountType = localStorage.getItem('AccountType') || '';
  const currentJobTitle = localStorage.getItem('JobTitle') || '';
  const isSuperAdmin = currentAccountType === 'Super Admin';
  const isReportsRole = currentJobTitle === 'Reports';
  const canSelectBranch = isSuperAdmin || isReportsRole;
  const defaultBranch = canSelectBranch ? '' : (localStorage.getItem('branch_code') || '');
  const [selectedBranch, setSelectedBranch] = useState(defaultBranch);

  // Best Of state — default to This Year so data shows immediately
  const getThisYearRange = () => {
    const y = new Date().getFullYear();
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  };
  const getLastWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const mon = new Date(today); mon.setDate(today.getDate() - diff - 7);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0] };
  };
  const [bestOfRange, setBestOfRange] = useState(getThisYearRange);
  const [bestOfData, setBestOfData] = useState(null);
  const [bestOfLoading, setBestOfLoading] = useState(false);

  const fetchBestOfHP = async (range) => {
    const { from, to } = range || bestOfRange;
    try {
      setBestOfLoading(true);
      const params = { startDate: from, endDate: to };
      if (selectedBranch) params.branch_code = selectedBranch;
      const response = await api.get(`${api_url}/api/best-of-hp`, { params });
      if (response.data.success) setBestOfData(response.data.data);
    } catch (err) {
      console.error('Error fetching HP best of:', err);
      setBestOfData(null);
    } finally {
      setBestOfLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear, processType, selectedBranch]);

  useEffect(() => {
    if (activeTab === 8) fetchBestOfHP(bestOfRange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { month: selectedMonth, year: selectedYear };
      if (processType) params.process_type = processType;
      if (selectedBranch) params.branch_code = selectedBranch;
      const response = await api.get(`${api_url}/api/hp-comprehensive-report`, { params });
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
    if (newValue === 8) fetchBestOfHP(bestOfRange);
  };

  const handleExportReport = () => {
    // TODO: Implement PDF/Excel export
    console.log('Exporting report...');
  };

  const tabs = [
    { label: 'Dashboard',         icon: <AssessmentIcon /> },
    { label: 'Customer Detail',   icon: <PeopleIcon /> },
    { label: 'POD Detail',                icon: <AssignmentIcon /> },
    { label: 'RRF/VRF',                   icon: <AssessmentIcon /> },
    { label: 'Service Units Detail',      icon: <TableChartIcon /> },
    { label: 'Route Analysis',            icon: <RouteIcon /> },
    { label: 'All Picklists',             icon: <TrendingUpIcon /> },
    { label: 'Finance',                    icon: <ReceiptIcon /> },
    { label: 'Best Of',                    icon: <EmojiEventsIcon /> }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>

      {/* Branch filter — Super Admin and Reports role */}
      {canSelectBranch && (
        <Box sx={{ mb: 2, maxWidth: 300 }}>
          <BranchSelect
            value={selectedBranch}
            onChange={setSelectedBranch}
            label="Filter by Branch"
            helperText="Leave empty to see all branches"
          />
        </Box>
      )}

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

          {/* Process Type filter — only for Service Units Detail tab */}
          {[4].includes(activeTab) && (
            <Box sx={{ px: 3, pt: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" color="text.secondary">Process Type:</Typography>
                <TextField
                  select size="small" value={processType}
                  onChange={e => setProcessType(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="regular">HP Regular</MenuItem>
                  <MenuItem value="vaccine">Vaccine</MenuItem>
                </TextField>
              </Stack>
            </Box>
          )}

          <CardContent sx={{ p: 3 }}>
            {activeTab === 0 && <HPDashboard branchCode={selectedBranch} />}
            {activeTab === 1 && <HPCustomerDetailReport branchCode={selectedBranch} />}
            {activeTab === 2 && <ODNPODDetailReport branchCode={selectedBranch} />}
            {activeTab === 3 && <ReportOverview branchCode={selectedBranch} />}
            {activeTab === 4 && <ServiceUnitsDetail data={reportData} />}
            {activeTab === 5 && <RouteAnalysis branchCode={selectedBranch} />}
            {activeTab === 6 && <HPPicklistReport branchCode={selectedBranch} />}
            {activeTab === 7 && <FinanceInvoiceView mode="hp" />}
            {activeTab === 8 && (
              <Box>
                {/* Date Range Controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <TextField
                    label="From" type="date" size="small"
                    value={bestOfRange.from}
                    onChange={e => setBestOfRange(r => ({ ...r, from: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="To" type="date" size="small"
                    value={bestOfRange.to}
                    onChange={e => setBestOfRange(r => ({ ...r, to: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button variant="contained" size="small" onClick={() => fetchBestOfHP(bestOfRange)}>
                    Apply
                  </Button>
                  {[
                    { label: 'This Week', fn: () => {
                      const today = new Date(); const day = today.getDay(); const diff = day === 0 ? 6 : day - 1;
                      const mon = new Date(today); mon.setDate(today.getDate() - diff);
                      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                      return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0] };
                    }},
                    { label: 'Last Week', fn: getLastWeekRange },
                    { label: 'This Month', fn: () => {
                      const today = new Date();
                      return { from: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0], to: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0] };
                    }},
                    { label: 'This Year', fn: () => { const y = new Date().getFullYear(); return { from: `${y}-01-01`, to: `${y}-12-31` }; }},
                  ].map(({ label, fn }) => (
                    <Button key={label} variant="outlined" size="small" onClick={() => { const r = fn(); setBestOfRange(r); fetchBestOfHP(r); }}>
                      {label}
                    </Button>
                  ))}
                </Box>

                {bestOfLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={60} />
                  </Box>
                ) : bestOfData ? (
                  <Box>
                    {/* Header */}
                    <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h3" fontWeight="bold" gutterBottom>🏆 Best Performers 🏆</Typography>
                        {bestOfData.dateRange?.start && (
                          <Typography variant="h6" sx={{ opacity: 0.9 }}>
                            {new Date(bestOfData.dateRange.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            {' — '}
                            {new Date(bestOfData.dateRange.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>

                    <Grid container spacing={4}>
                      {[
                        { key: 'o2c',           label: 'O2C Officer - HP',        bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',  countLabel: 'Processes Completed' },
                        { key: 'ewm',           label: 'EWM Officer - HP',        bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',  countLabel: 'Goods Issued' },
                        { key: 'biller',        label: 'Biller',                  bg: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',  countLabel: 'Billings Completed' },
                        { key: 'tm',            label: 'TM Manager',              bg: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',  countLabel: 'Vehicles Assigned' },
                        { key: 'pi',            label: 'PI Officer',              bg: 'linear-gradient(135deg, #0f3460 0%, #533483 100%)',  countLabel: 'Vehicle Requests' },
                        { key: 'dispatcher',    label: 'Dispatcher - HP',         bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',  countLabel: 'Dispatches Completed' },
                        { key: 'documentation', label: 'Documentation Officer',   bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',  countLabel: 'Documents Processed' },
                        { key: 'quality',       label: 'Quality Evaluator',       bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',  countLabel: 'Evaluations Done' },
                      ].map(({ key, label, bg, countLabel }) => bestOfData.employees[key] && (
                        <Grid item xs={12} md={6} key={key}>
                          <Card sx={{ height: '100%', background: bg, color: 'white', transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' } }}>
                            <CardContent sx={{ p: 4 }}>
                              <Stack spacing={3} alignItems="center">
                                <Avatar sx={{ width: 100, height: 100, bgcolor: 'rgba(255,255,255,0.3)', fontSize: '3rem' }}>👤</Avatar>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="overline" sx={{ opacity: 0.9, fontSize: '0.9rem', color: 'white' }}>{label}</Typography>
                                  <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>{bestOfData.employees[key].full_name}</Typography>
                                  <Chip
                                    label={`${bestOfData.employees[key].process_count} ${countLabel}`}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold', fontSize: '1rem', px: 2, py: 3 }}
                                  />
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    {!bestOfData.employees.o2c && !bestOfData.employees.ewm && !bestOfData.employees.biller &&
                     !bestOfData.employees.tm && !bestOfData.employees.pi && !bestOfData.employees.dispatcher &&
                     !bestOfData.employees.documentation && !bestOfData.employees.quality && (
                      <Alert severity="info" sx={{ mt: 4 }}>No employee performance data available for this period.</Alert>
                    )}
                  </Box>
                ) : (
                  <Alert severity="info">Select a date range and click Apply to load data.</Alert>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default HPComprehensiveReport;
