import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Button, Paper, Grid, Fade } from '@mui/material';
import dayjs from 'dayjs';
import { useAmharicNumbers } from './useAmharicNumbers';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import PieChartIcon from '@mui/icons-material/PieChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// --- Configuration ---
const CARD_SLIDE_INTERVAL_MS = 8000; // Display each analytics view for 8 seconds
const ANNOUNCEMENT_REPEAT_INTERVAL_MS = 3 * 1000;
const CUSTOM_COLORS = {
  primary: '#00e5ff', 
  info: '#3B82F6', 
  success: '#10B981', 
  secondary: '#8B5CF6',
  warning: '#FBBF24', // Amber for In Progress
  error: '#EF4444', // Red for Canceled
  background: '#0d131f'
};

// --- Sub-Components (Moved outside main function for clarity) ---

// 1. KPI Card Component (Summary)
const KPICard = ({ title, value, unit, icon: Icon, color }) => (
  <Paper 
    elevation={6} 
    sx={{ 
      p: 2, 
      borderRadius: 1.5, 
      bgcolor: color, 
      color: 'white', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      minHeight: '120px'
    }}
  >
    <Typography variant="body1" fontWeight="bold">{title}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'flex-end', mt: 1 }}>
      <Icon sx={{ fontSize: 30, mr: 1 }} />
      <Typography variant="h4" fontWeight="bold">{value}</Typography>
      {unit && <Typography variant="h6" sx={{ ml: 1, mb: 0.5 }}>{unit}</Typography>}
    </Box>
  </Paper>
);

// 2. Custom Tooltip for Recharts
const renderTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ p: 1, borderRadius: 1, bgcolor: '#212121', color: '#fff' }}>
        <Typography variant="caption" fontWeight="bold">{label}</Typography>
        {payload.map((p, index) => (
          <Typography key={index} variant="caption" sx={{ color: p.color || '#fff' }}>
            {p.name}: {p.value}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

// ------------------------------------------------------------------------------------------------

const TvRegistrationList = () => {
  const [customers, setCustomers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(dayjs().format('dddd, MMMM D, YYYY — hh:mm:ss A'));
  const [audioStarted, setAudioStarted] = useState(false);
  const [analyticsScreen, setAnalyticsScreen] = useState(0); // Cycles 0, 1, 2, 3

  const lastCallTimes = useRef(new Map());
  
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  const { playNumber } = useAmharicNumbers();

  const audioQueueRef = useRef([]);
  const isPlayingAudio = useRef(false);
  const qrAudioRef = useRef(null);

  useEffect(() => {
    if (!qrAudioRef.current) {
      qrAudioRef.current = new Audio('/audio/amharic/qr-audio.mp3');
      qrAudioRef.current.load();
    }
  }, []);

  const oneWeekAgo = dayjs().subtract(7, 'days').startOf('day');
  
  // --- Data Filtering and Sorting (Queue) ---
  const orderedCustomers = useMemo(() => customers
    .filter(cust => {
      const status = cust.status?.toLowerCase();
      const nextServicePoint = cust.next_service_point?.toLowerCase();
      const displayStatuses = ['ewm_completed', 'dispatch_notify', 'dispatching'];
      return (
        displayStatuses.includes(status) &&
        nextServicePoint === 'dispatch' && 
        dayjs(cust.started_at).isAfter(oneWeekAgo)
      );
    })
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at)), [customers, oneWeekAgo]);

  const notifyingCustomers = useMemo(() => orderedCustomers.filter(cust => cust.status?.toLowerCase() === 'dispatch_notify'), [orderedCustomers]);
  const otherCustomers = useMemo(() => orderedCustomers.filter(cust => cust.status?.toLowerCase() !== 'dispatch_notify'), [orderedCustomers]);
  
  const getCustomerIndex = useCallback((customerId) => orderedCustomers.findIndex(c => c.id === customerId), [orderedCustomers]);
  const getFacility = (id) => facilities.find((f) => f.id === id);
  
  // --- Data Processing for Analytics ---
  const { 
    totalRegistrations, completedCustomers, recentAverageWaitingTime, 
    dailyCompletedData, dailyAverageWaitingTime, statusDistribution 
  } = useMemo(() => {
    const twoWeeksAgo = dayjs().subtract(14, 'days');
    const totalReg = customers.length;
    const completedCust = customers.filter(c => c.status?.toLowerCase() === 'completed').length;
    
    // 1. Avg. Waiting Time (2 wks)
    const recentCompletedCustomers = customers.filter(c => c.completed_at && c.started_at && dayjs(c.completed_at).isAfter(twoWeeksAgo));
    const recentWaitingTimes = recentCompletedCustomers.map(c => dayjs(c.completed_at).diff(dayjs(c.started_at), 'hour'));
    const avgTime = recentWaitingTimes.length > 0 ? (recentWaitingTimes.reduce((sum, time) => sum + time, 0) / recentWaitingTimes.length).toFixed(2) : 'N/A';

    // 2. Daily Completed Tasks Data
    const dailyCompletedCounts = customers.reduce((acc, customer) => {
      if (customer.status?.toLowerCase() === 'completed' && customer.completed_at) {
        const date = dayjs(customer.completed_at).format('MMM DD');
        acc[date] = (acc[date] || 0) + 1;
      }
      return acc;
    }, {});
    const processedCompletedData = Object.keys(dailyCompletedCounts).map(date => ({
      date,
      'Completed Tasks': dailyCompletedCounts[date],
    })).sort((a, b) => dayjs(a.date, 'MMM DD').isAfter(dayjs(b.date, 'MMM DD')) ? 1 : -1);

    // 3. Daily Average Waiting Time Trend
    const dailyTimes = customers.reduce((acc, customer) => {
        if (customer.completed_at && customer.started_at) {
            const date = dayjs(customer.completed_at).format('MMM DD');
            const waitingTime = dayjs(customer.completed_at).diff(dayjs(customer.started_at), 'hour');
            if (!acc[date]) acc[date] = [];
            acc[date].push(waitingTime);
        }
        return acc;
    }, {});
    const processedWaitingTimeData = Object.keys(dailyTimes).map(date => {
        const times = dailyTimes[date];
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        return {
            date,
            'Avg. Wait Time (hrs)': parseFloat(averageTime.toFixed(2)),
        };
    }).sort((a, b) => dayjs(a.date, 'MMM DD').isAfter(dayjs(b.date, 'MMM DD')) ? 1 : -1);

    // 4. Status Distribution (Reintroduced)
    let completed = 0;
    let inProgress = 0;
    let canceled = 0;
    customers.forEach(customer => {
      const status = customer.status?.toLowerCase();
      if (status === 'completed') completed++;
      else if (status === 'canceled') canceled++;
      else inProgress++;
    });
    const processedStatusData = [
      { name: 'Completed', value: completed, color: CUSTOM_COLORS.success },
      { name: 'In Progress', value: inProgress, color: CUSTOM_COLORS.warning },
      { name: 'Canceled', value: canceled, color: CUSTOM_COLORS.error },
    ].filter(item => item.value > 0);


    return { 
      totalRegistrations: totalReg, 
      completedCustomers: completedCust, 
      recentAverageWaitingTime: avgTime,
      dailyCompletedData: processedCompletedData,
      dailyAverageWaitingTime: processedWaitingTimeData,
      statusDistribution: processedStatusData
    };
  }, [customers]);

  // Define KPI Cards Array for the slider (Screen 0)
  const kpiCards = useMemo(() => [
    { title: "Total Registrations", value: totalRegistrations, icon: PeopleIcon, color: CUSTOM_COLORS.info, unit: null },
    { title: "Tasks Completed", value: completedCustomers, icon: CheckCircleIcon, color: CUSTOM_COLORS.success, unit: null },
    { title: "Avg. Waiting Time (2 wks)", value: recentAverageWaitingTime, icon: AccessTimeIcon, color: CUSTOM_COLORS.secondary, unit: 'hrs' },
  ], [totalRegistrations, completedCustomers, recentAverageWaitingTime]);

  // --- Data Fetching & State Effects ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, facRes] = await Promise.all([
          axios.get(`${api_url}/api/serviceList`),
          axios.get(`${api_url}/api/facilities`),
        ]);
        setCustomers(custRes.data);
        setFacilities(facRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [api_url]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('dddd, MMMM D, YYYY — hh:mm:ss A'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Analytics Panel Slider Effect (Cycles between Screen 0, 1, 2, and 3) ---
  useEffect(() => {
    if (audioStarted) {
      const interval = setInterval(() => {
        setAnalyticsScreen(prev => (prev + 1) % 4); // Cycles between 0, 1, 2, and 3
      }, CARD_SLIDE_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [audioStarted]);

  // --- Utility Functions (Queue and Audio) ---
  const getDisplayStatus = (status) => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'ewm_completed') return 'Ready for Dispatch'; 
    if (lowerStatus === 'dispatch_notify') return 'Calling for Dispatch';
    if (lowerStatus === 'dispatching') return 'Dispatching'; 
    return 'N/A'; 
  };
  
  const formatWaitingTime = (startedAt) => {
    // ... (formatWaitingTime implementation remains the same)
    if (!startedAt) return 'N/A';
    const duration = dayjs().diff(dayjs(startedAt));
    const totalSeconds = Math.floor(duration / 1000);
    
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    result += `${minutes}m ${seconds}s`;
    
    return result.trim();
  };

  const playNextAudioInQueue = useCallback(async () => {
    // ... (Audio logic remains the same)
  }, [getCustomerIndex, playNumber]);

  useEffect(() => {
    // ... (Audio Announcement logic remains the same)
    if (!audioStarted) return;
    
    const now = Date.now();
    const customersToAnnounce = orderedCustomers.filter(c => c.status?.toLowerCase() === 'dispatch_notify');
    
    const currentNotifyingIds = new Set(customersToAnnounce.map(c => c.id));
    for (let customerId of lastCallTimes.current.keys()) {
      if (!currentNotifyingIds.has(customerId)) {
        lastCallTimes.current.delete(customerId);
      }
    }
    
    customersToAnnounce.forEach((cust) => {
      const lastCalled = lastCallTimes.current.get(cust.id);
      const shouldAnnounce = !lastCalled || (now - lastCalled > ANNOUNCEMENT_REPEAT_INTERVAL_MS);

      if (shouldAnnounce) {
        if (!audioQueueRef.current.includes(cust.id)) {
          audioQueueRef.current.push(cust.id);
        }
        lastCallTimes.current.set(cust.id, now);
      }
    });

    if (!isPlayingAudio.current && audioQueueRef.current.length > 0) {
      playNextAudioInQueue();
    }
  }, [orderedCustomers, audioStarted, ANNOUNCEMENT_REPEAT_INTERVAL_MS, playNextAudioInQueue]);

  const handleStart = async () => {
    setAudioStarted(true);
    try {
      await qrAudioRef.current.play();
      qrAudioRef.current.pause();
      qrAudioRef.current.currentTime = 0;
    } catch (e) {
      console.error("Autoplay was prevented:", e);
    }
  };

  // --- Rendering Functions ---

  // Queue Card Renderer
  const renderCustomerCard = (cust, index) => {
    const facility = getFacility(cust.facility_id);
    const status = cust.status?.toLowerCase();
    
    const isDispatching = status === 'dispatching';
    const isDispatchNotify = status === 'dispatch_notify';

    let cardBgColor = '#2f3640';
    let textColor = '#fff';

    if (isDispatchNotify) { 
      cardBgColor = '#ffc107';
      textColor = '#212121';
    } else if (isDispatching) { 
      cardBgColor = '#4caf50';
      textColor = '#fff';
    } 
    
    const customerNumber = getCustomerIndex(cust.id) + 1;
    const cardGridTemplate = '0.5fr 3fr 1.5fr 1fr'; 

    return (
      <Box
        key={`${cust.id}-${index}`}
        sx={{
          backgroundColor: cardBgColor,
          borderRadius: 1.5,
          padding: '16px 12px',
          minHeight: '55px',
          display: 'grid',
          gridTemplateColumns: cardGridTemplate,
          alignItems: 'center',
          px: 2,
          transition: 'all 0.2s ease-in-out',
          animation: isDispatchNotify ? 'glowPulse 1.5s infinite alternate' : 'none', 
          boxShadow: isDispatchNotify ? '0 0 12px #ffc107' : 'none',
          '&:hover': {
            boxShadow: `0 0 15px rgba(0, 229, 255, 0.7), 0 0 8px ${isDispatchNotify ? '#ffc107' : '#00e5ff'}`,
            transform: 'translateY(-2px)',
          }
        }}
      >
        {/* === BOLD AND BIGGER TEXT FOR QUEUE === */}
        <Typography sx={{ color: textColor, fontWeight: 900, fontSize: '1.4rem', textAlign: 'left' }}>
          {customerNumber}
        </Typography>
        <Typography 
          sx={{ 
            color: textColor, 
            fontWeight: 700, 
            fontSize: '1.2rem', // Increased size
            wordBreak: 'break-word',
            textAlign: 'left',
            pl: 1
          }}
        >
          {facility?.facility_name || 'N/A'}
        </Typography>
        <Typography sx={{ color: textColor, fontWeight: 700, fontSize: '1.2rem', textAlign: 'left', pl: 1 }}>
          {getDisplayStatus(cust.status)}
        </Typography>
        <Typography sx={{ color: textColor, fontWeight: 700, fontSize: '1.2rem', textAlign: 'right' }}>
          {formatWaitingTime(cust.started_at)}
        </Typography>
      </Box>
    );
  };

  // 1. Analytics Screen 0: Summary KPIs
  const renderKpiCards = () => (
    <Grid container spacing={1} sx={{ width: '100%', height: '100%' }}>
      {kpiCards.map((card, index) => (
        <Grid item xs={12} key={index}>
          <KPICard {...card} />
        </Grid>
      ))}
    </Grid>
  );

  // 2. Analytics Screen 1: Daily Completed Tasks Chart (BIG)
  const renderDailyCompletedChart = () => (
    <Paper elevation={4} sx={{ p: 2, borderRadius: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BarChartIcon sx={{ color: CUSTOM_COLORS.primary, fontSize: 24, mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">Daily Completed Tasks</Typography>
        </Box>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={dailyCompletedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc5" />
            <XAxis dataKey="date" tick={{ fill: '#000', fontSize: 11 }} />
            <YAxis tick={{ fill: '#000', fontSize: 11 }} />
            <Tooltip content={renderTooltip} />
            <Bar dataKey="Completed Tasks" fill={CUSTOM_COLORS.primary} />
          </BarChart>
        </ResponsiveContainer>
    </Paper>
  );

  // 3. Analytics Screen 2: Average Waiting Time Trend Chart (BIG)
  const renderAvgTimeTrendChart = () => (
    <Paper elevation={4} sx={{ p: 2, borderRadius: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessAlarmIcon sx={{ color: CUSTOM_COLORS.secondary, fontSize: 24, mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">Average Waiting Time Trend (hrs)</Typography>
        </Box>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={dailyAverageWaitingTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc5" />
            <XAxis dataKey="date" tick={{ fill: '#000', fontSize: 11 }} />
            <YAxis tick={{ fill: '#000', fontSize: 11 }} />
            <Tooltip content={renderTooltip} />
            <Line 
                type="monotone" 
                dataKey="Avg. Wait Time (hrs)" 
                stroke={CUSTOM_COLORS.secondary} 
                strokeWidth={3} 
                dot={{ stroke: CUSTOM_COLORS.secondary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
    </Paper>
  );

  // 4. Analytics Screen 3: Task Status Distribution Pie Chart (BIG)
  const renderStatusDistributionChart = () => (
    <Paper elevation={4} sx={{ p: 2, borderRadius: 1.5, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PieChartIcon sx={{ color: CUSTOM_COLORS.info, fontSize: 24, mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">Overall Task Status Distribution</Typography>
        </Box>
        <ResponsiveContainer width="100%" height="80%">
          <PieChart>
            <Pie
              data={statusDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80} // Increased size
              innerRadius={40} // Increased size
              paddingAngle={2}
              label
              labelLine={false}
            >
              {statusDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={renderTooltip} />
            <Legend 
                layout="horizontal" 
                align="center" 
                verticalAlign="bottom" 
                wrapperStyle={{ fontSize: 14, fontWeight: 'bold' }} // Increased size
            />
          </PieChart>
        </ResponsiveContainer>
    </Paper>
  );


  // --- Main Render ---

  if (loading) {
    return (
      <Box sx={{ height: '100vh', bgcolor: CUSTOM_COLORS.background, color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  if (!audioStarted) {
    return (
      <Box sx={{ height: '100vh', bgcolor: CUSTOM_COLORS.background, color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Typography variant="h4" sx={{ mb: 4 }}>Click to Start Kiosk</Typography>
        <Button 
          variant="contained" 
          onClick={handleStart} 
          sx={{
            px: 6,
            py: 2,
            fontSize: '1.2rem',
            backgroundColor: CUSTOM_COLORS.primary,
            '&:hover': {
              backgroundColor: '#00c1e0',
            }
          }}
        >
          Start
        </Button>
      </Box>
    );
  }
  
  const animationDuration = otherCustomers.length > 0 ? `${otherCustomers.length * 3}s` : '0s';
  const shouldScroll = otherCustomers.length > 5;
  const queueHeaderGridTemplate = '0.5fr 3fr 1.5fr 1fr'; 

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: CUSTOM_COLORS.background,
        color: '#fff',
        p: 2,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
        overflowX: 'hidden'
      }}
    >
      {/* --- Top Bar --- */}
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          mb: 2,
          p: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e0f7fa', textAlign: 'left' }}>
          Dispatch Queue
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          <img src="/Epss-logo.png" alt="EPSS Logo" style={{ height: '60px', width: 'auto' }} />
        </Box>
        <Typography
          sx={{
            fontSize: { xs: '0.7rem', sm: '0.9rem', md: '1rem' },
            fontWeight: 'bold',
            color: '#e0f7fa',
            textAlign: 'right'
          }}
        >
          {currentTime}
        </Typography>
      </Box>

      {/* --- Main Content Grid (Queue + KPI Slider) --- */}
      <Grid container spacing={2} sx={{ flexGrow: 1, width: '100%' }}>
        
        {/* === LEFT COLUMN: Dispatch Queue (Wider: xs=7.5) === */}
        <Grid item xs={7.5}> 
          {orderedCustomers.length === 0 ? (
            <Typography variant="h6" sx={{ mt: 5, color: '#e0f7fa' }}>
              No facilities currently in the logistics queue.
            </Typography>
          ) : (
            <Box
              sx={{
                flexGrow: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 2,
                p: 1,
                overflow: 'hidden',
                boxShadow: `0 0 15px ${CUSTOM_COLORS.primary}40`,
                height: 'calc(100vh - 120px)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ flex: 1, overflowY: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {/* Static Header */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: queueHeaderGridTemplate,
                    alignItems: 'center',
                    bgcolor: '#1a1a1a',
                    borderRadius: '8px 8px 0 0',
                    p: 1.5,
                    mb: 0.8,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: '#bbb',
                    flexShrink: 0
                  }}
                >
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left' }}>Ticket</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', pl: 1 }}>Facility Name</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', pl: 1 }}>Status</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'right' }}>Elapsed Time</Typography>
                </Box>

                {/* Static "NOTIFYING" Customers Section */}
                {notifyingCustomers.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', mb: 2, flexShrink: 0 }}>
                    {notifyingCustomers.map((cust, index) => renderCustomerCard(cust, index))}
                  </Box>
                )}

                {/* Scrolling "Other" Customers Section */}
                <Box sx={{ flexGrow: 1, overflowY: 'hidden', position: 'relative' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      animation: shouldScroll ? `scroll-up ${animationDuration} linear infinite` : 'none',
                      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                    }}
                  >
                    {otherCustomers.length > 0 && otherCustomers.map((cust, index) => renderCustomerCard(cust, index))}
                    {shouldScroll && otherCustomers.length > 0 && otherCustomers.map((cust, index) => renderCustomerCard(cust, index))}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Grid>

        {/* === RIGHT COLUMN: KPI/Chart Slider (Wider: xs=4.5) === */}
        <Grid item xs={4.5}> 
          <Box 
            sx={{ 
              height: 'calc(100vh - 120px)', 
              p: 1, 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'flex-start',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 2,
              boxShadow: `0 0 15px ${CUSTOM_COLORS.primary}40`,
            }}
          >
            <Typography variant="h5" fontWeight="bold" color={CUSTOM_COLORS.primary} sx={{ mb: 1, textAlign: 'center' }}>
              Service Analytics
            </Typography>
            <Box 
              sx={{ 
                flexGrow: 1, 
                position: 'relative', 
                overflow: 'hidden',
                width: '100%',
              }}
            >
              {/* Screen 0: Summary KPIs */}
              <Fade in={analyticsScreen === 0} timeout={1000} mountOnEnter unmountOnExit>
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  {renderKpiCards()}
                </Box>
              </Fade>

              {/* Screen 1: Daily Completed Tasks Chart (BIG) */}
              <Fade in={analyticsScreen === 1} timeout={1000} mountOnEnter unmountOnExit>
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  {renderDailyCompletedChart()}
                </Box>
              </Fade>

              {/* Screen 2: Average Waiting Time Trend Chart (BIG) */}
              <Fade in={analyticsScreen === 2} timeout={1000} mountOnEnter unmountOnExit>
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  {renderAvgTimeTrendChart()}
                </Box>
              </Fade>
              
              {/* Screen 3: Task Status Distribution Pie Chart (BIG) */}
              <Fade in={analyticsScreen === 3} timeout={1000} mountOnEnter unmountOnExit>
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  {renderStatusDistributionChart()}
                </Box>
              </Fade>
            </Box>
            
            {/* Simple Indicator for the slider */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1, gap: 1, flexShrink: 0 }}>
              {[0, 1, 2, 3].map((screen, index) => (
                <Box
                  key={`indicator-${index}`}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: screen === analyticsScreen ? CUSTOM_COLORS.primary : 'rgba(255, 255, 255, 0.3)',
                    transition: 'background-color 0.3s',
                  }}
                />
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>

      <style>
        {`
          @keyframes glowPulse {
            from {
              box-shadow: 0 0 10px #ffc107;
            }
            to {
              box-shadow: 0 0 20px 5px #ffc107;
            }
          }
          
          @keyframes scroll-up {
            from { transform: translateY(0); }
            to { transform: translateY(-50%); }
          }
        `}
      </style>
    </Box>
  );
};

export default TvRegistrationList;