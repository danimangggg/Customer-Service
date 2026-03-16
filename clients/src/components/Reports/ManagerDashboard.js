import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Avatar,
  CircularProgress, LinearProgress, Tabs, Tab, Divider, Tooltip,
  TextField, MenuItem, Button, IconButton, Fade
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import RouteIcon from '@mui/icons-material/Route';
import VerifiedIcon from '@mui/icons-material/Verified';
import RefreshIcon from '@mui/icons-material/Refresh';
import InventoryIcon from '@mui/icons-material/Inventory';
import SpeedIcon from '@mui/icons-material/Speed';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ethiopianMonths = [
  'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit',
  'Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
];

const getCurrentEthiopianMonth = () => {
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
    const prevIsLeap = ((gy-1)%4===0&&(gy-1)%100!==0)||((gy-1)%400===0);
    const diffDays = Math.floor((gDate - new Date(gy-1, 8, prevIsLeap?12:11)) / 86400000);
    ethMonthIndex = diffDays < 360 ? Math.floor(diffDays / 30) : 12;
  }
  return { year: ethYear, monthIndex: Math.max(0, Math.min(ethMonthIndex, 12)) };
};

// ─── Gradient palette ────────────────────────────────────────────────────────
const G = {
  hp:    'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
  rdf:   'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
  green: 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',
  blue:  'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
  amber: 'linear-gradient(135deg,#f6d365 0%,#fda085 100%)',
  red:   'linear-gradient(135deg,#f5576c 0%,#f093fb 100%)',
  dark:  'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',
  card:  'linear-gradient(145deg,#1e1e3a 0%,#252550 100%)',
};

const CHART_COLORS = ['#667eea','#43e97b','#f6d365','#f5576c','#4facfe','#f093fb','#38f9d7','#fda085'];

// ─── Reusable KPI card ────────────────────────────────────────────────────────
const KpiCard = ({ title, value, subtitle, icon, gradient, loading }) => (
  <Card sx={{
    background: G.card, border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 3, overflow: 'hidden', position: 'relative',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s,box-shadow 0.2s',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }
  }}>
    {/* top accent bar */}
    <Box sx={{ height: 4, background: gradient }} />
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
            {title}
          </Typography>
          {loading
            ? <CircularProgress size={28} sx={{ mt: 1, color: '#667eea' }} />
            : <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.1, mt: 0.5 }}>
                {value ?? '—'}
              </Typography>
          }
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ background: gradient, borderRadius: 2, p: 1.2, opacity: 0.9 }}>
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, gradient }) => (
  <Box sx={{ mb: 2.5 }}>
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box sx={{ width: 4, height: 28, background: gradient, borderRadius: 2 }} />
      <Box>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', lineHeight: 1 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>{subtitle}</Typography>}
      </Box>
    </Stack>
  </Box>
);

// ─── Chart wrapper card ───────────────────────────────────────────────────────
const ChartCard = ({ title, children, height = 260 }) => (
  <Card sx={{
    background: G.card, border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden'
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.72rem' }}>
        {title}
      </Typography>
      <Box sx={{ height }}>{children}</Box>
    </CardContent>
  </Card>
);

// ─── Main component ───────────────────────────────────────────────────────────
const ManagerDashboard = () => {
  const eth = getCurrentEthiopianMonth();
  const [tab, setTab] = useState(0);
  const [month, setMonth] = useState(ethiopianMonths[eth.monthIndex]);
  const [year, setYear] = useState(eth.year);
  const [hpData, setHpData] = useState(null);
  const [rdfStats, setRdfStats] = useState(null);
  const [bestOf, setBestOf] = useState(null);
  const [timeTrend, setTimeTrend] = useState([]);
  const [hpLoading, setHpLoading] = useState(true);
  const [rdfLoading, setRdfLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchHP = useCallback(async () => {
    try {
      setHpLoading(true);
      const r = await axios.get(`${API_URL}/api/hp-comprehensive-report`, { params: { month, year } });
      setHpData(r.data);
    } catch (e) { console.error(e); }
    finally { setHpLoading(false); }
  }, [month, year]);

  const fetchRDF = useCallback(async () => {
    try {
      setRdfLoading(true);
      const [statsRes, bestRes] = await Promise.all([
        axios.get(`${API_URL}/api/rdf-dashboard-stats`),
        axios.get(`${API_URL}/api/best-of-week`)
      ]);
      if (statsRes.data.success) setRdfStats(statsRes.data.stats);
      if (bestRes.data.success) setBestOf(bestRes.data.data);
    } catch (e) { console.error(e); }
    finally { setRdfLoading(false); }
  }, []);

  const fetchTrend = useCallback(async () => {
    try {
      const r = await axios.get(`${API_URL}/api/hp-report/time-trend`);
      if (r.data?.trend) setTimeTrend(r.data.trend.slice(-8));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchHP(); fetchTrend(); }, [fetchHP, fetchTrend]);
  useEffect(() => { fetchRDF(); }, [fetchRDF]);

  const handleRefresh = () => {
    fetchHP(); fetchRDF(); fetchTrend();
    setLastRefresh(new Date());
  };

  // ── derived HP values ──
  const hp = hpData?.summary || {};
  const hpRrfPct = hp.expectedFacilities > 0 ? ((hp.rrfSent / hp.expectedFacilities) * 100).toFixed(1) : 0;
  const hpPodPct = hp.totalODNs > 0 ? ((hp.podConfirmed / hp.totalODNs) * 100).toFixed(1) : 0;
  const hpQualPct = hp.totalODNs > 0 ? ((hp.qualityEvaluated / hp.totalODNs) * 100).toFixed(1) : 0;

  // ── derived RDF values ──
  const rdfTotal = rdfStats?.totalRegistrations || 0;
  const rdfCompPct = rdfTotal > 0 ? ((rdfStats?.completedCount / rdfTotal) * 100).toFixed(1) : 0;

  // ── HP workflow funnel data ──
  const wp = hpData?.workflowProgress || {};
  const funnelData = [
    { stage: 'O2C', count: wp.o2cCompleted || 0 },
    { stage: 'EWM', count: wp.ewmCompleted || 0 },
    { stage: 'PI', count: wp.piCompleted || 0 },
    { stage: 'TM', count: wp.tmCompleted || 0 },
    { stage: 'Dispatch', count: wp.dispatched || 0 },
    { stage: 'Doc', count: wp.documentationCompleted || 0 },
    { stage: 'Quality', count: wp.qualityEvaluated || 0 },
  ].filter(d => d.count > 0);

  // ── HP RRF pie ──
  const rrfPie = [
    { name: 'RRF Sent', value: hp.rrfSent || 0, color: '#43e97b' },
    { name: 'Not Sent', value: hp.rrfNotSent || 0, color: '#f5576c' },
  ];

  // ── RDF status pie ──
  const rdfPie = [
    { name: 'Completed', value: rdfStats?.completedCount || 0, color: '#43e97b' },
    { name: 'In Progress', value: rdfStats?.inProgressCount || 0, color: '#f6d365' },
    { name: 'Cancelled', value: (rdfStats?.cancelledCount || 0) + (rdfStats?.autoCancelledCount || 0), color: '#f5576c' },
  ].filter(d => d.value > 0);

  // ── Top routes ──
  const topRoutes = (hpData?.routeStats || [])
    .sort((a, b) => parseInt(b.facilities_count) - parseInt(a.facilities_count))
    .slice(0, 8)
    .map(r => ({ name: r.route_name, facilities: parseInt(r.facilities_count || 0), odns: parseInt(r.odns_count || 0) }));

  const years = Array.from({ length: 10 }, (_, i) => eth.year - 5 + i);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0d0d1a 0%,#0f0f2e 50%,#0a0a1f 100%)', p: 3 }}>

      {/* ── HERO HEADER ── */}
      <Box sx={{
        background: G.dark, borderRadius: 4, p: 3, mb: 3,
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* decorative blobs */}
        <Box sx={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(102,126,234,0.15)', filter:'blur(40px)' }} />
        <Box sx={{ position:'absolute', bottom:-40, left:100, width:150, height:150, borderRadius:'50%', background:'rgba(240,147,251,0.1)', filter:'blur(30px)' }} />

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs:'flex-start', md:'center' }} spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ background: G.hp, borderRadius: 3, p: 1.5 }}>
              <SpeedIcon sx={{ color: '#fff', fontSize: 36 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#fff', letterSpacing: -0.5 }}>
                Operations Dashboard
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.3 }}>
                Unified HP & RDF performance overview · Last updated {lastRefresh.toLocaleTimeString()}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Tooltip title="Refresh data">
              <IconButton onClick={handleRefresh} sx={{ background:'rgba(255,255,255,0.07)', color:'#fff', '&:hover':{background:'rgba(102,126,234,0.3)'} }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Tab switcher */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2.5,
          '& .MuiTab-root': { color:'rgba(255,255,255,0.45)', fontWeight:600, textTransform:'none', fontSize:'0.9rem', minHeight:40 },
          '& .Mui-selected': { color:'#fff' },
          '& .MuiTabs-indicator': { background: G.hp, height:3, borderRadius:2 }
        }}>
          <Tab label="Overview" />
          <Tab label="HP Program" />
          <Tab label="RDF Program" />
        </Tabs>
      </Box>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 0 — OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <Fade in>
          <Box>
            {/* Combined KPI row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { title:'HP Facilities', value: hp.expectedFacilities, subtitle:'Expected this month', icon:<LocalHospitalIcon sx={{color:'#fff',fontSize:28}}/>, gradient:G.hp, loading:hpLoading },
                { title:'RRF Sent', value: hp.rrfSent, subtitle:`${hpRrfPct}% of expected`, icon:<AssignmentIcon sx={{color:'#fff',fontSize:28}}/>, gradient:G.green, loading:hpLoading },
                { title:'ODNs Dispatched', value: hp.dispatched, subtitle:`of ${hp.totalODNs} total ODNs`, icon:<LocalShippingIcon sx={{color:'#fff',fontSize:28}}/>, gradient:G.blue, loading:hpLoading },
                { title:'POD Confirmed', value: hp.podConfirmed, subtitle:`${hpPodPct}% confirmation rate`, icon:<VerifiedIcon sx={{color:'#fff',fontSize:28}}/>, gradient:G.amber, loading:hpLoading },
                { title:'RDF Registrations', value: rdfStats?.totalRegistrations, subtitle:'All time', icon:<PeopleIcon sx={{color:'#fff',fontSize:28}}/>, gradient:G.rdf, loading:rdfLoading },
                { title:'RDF Completed', value: rdfStats?.completedCount, subtitle:`${rdfCompPct}% completion rate`, icon:<CheckCircleIcon sx={{color:'#fff',fontSize:28}}/>, gradient:G.green, loading:rdfLoading },
                { title:'Avg Wait Time', value: rdfStats?.averageWaitingTime ? `${Math.round(rdfStats.averageWaitingTime)}m` : '—', subtitle:'RDF service time', icon:<AccessTimeIcon sx={{color:'#fff',fontSize:28}}/>, gradient:G.amber, loading:rdfLoading },
                { title:'Quality Evaluated', value: hp.qualityEvaluated, subtitle:`${hpQualPct}% of ODNs`, icon:<StarIcon sx={{color:'#fff',fontSize:28}}/>, gradient:G.red, loading:hpLoading },
              ].map((k, i) => (
                <Grid item xs={6} sm={4} md={3} key={i}>
                  <KpiCard {...k} />
                </Grid>
              ))}
            </Grid>

            {/* Charts row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* HP Trend */}
              <Grid item xs={12} md={8}>
                <ChartCard title="HP Monthly Trend — RRF Sent vs ODNs" height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeTrend} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                      <defs>
                        <linearGradient id="gRRF" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gODN" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#43e97b" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#43e97b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} tickLine={false} />
                      <RTooltip contentStyle={{ background:'#1e1e3a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff' }} />
                      <Legend wrapperStyle={{ color:'rgba(255,255,255,0.5)', fontSize:12 }} />
                      <Area type="monotone" dataKey="rrf_sent" name="RRF Sent" stroke="#667eea" fill="url(#gRRF)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="total_odns" name="Total ODNs" stroke="#43e97b" fill="url(#gODN)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>

              {/* RDF Status Pie */}
              <Grid item xs={12} md={4}>
                <ChartCard title="RDF Status Distribution" height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rdfPie} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                        {rdfPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <RTooltip contentStyle={{ background:'#1e1e3a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff' }} />
                      <Legend wrapperStyle={{ color:'rgba(255,255,255,0.5)', fontSize:12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
            </Grid>

            {/* HP Workflow funnel + RRF pie */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <ChartCard title="HP Workflow Stage Completion" height={240}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="stage" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} tickLine={false} />
                      <RTooltip contentStyle={{ background:'#1e1e3a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff' }} />
                      <Bar dataKey="count" name="Completed" radius={[6,6,0,0]}>
                        {funnelData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartCard title="HP RRF Status" height={240}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rrfPie} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                        {rrfPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <RTooltip contentStyle={{ background:'#1e1e3a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff' }} />
                      <Legend wrapperStyle={{ color:'rgba(255,255,255,0.5)', fontSize:12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — HP PROGRAM
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Fade in>
          <Box>
            <SectionHeader title="Health Program Analytics" subtitle={`${month} ${year}`} gradient={G.hp} />

            {/* HP KPIs */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { title:'Expected Facilities', value:hp.expectedFacilities, icon:<LocalHospitalIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.hp },
                { title:'RRF Sent', value:hp.rrfSent, icon:<AssignmentIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.green },
                { title:'RRF Not Sent', value:hp.rrfNotSent, icon:<CancelIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.red },
                { title:'Total ODNs', value:hp.totalODNs, icon:<InventoryIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.blue },
                { title:'Dispatched', value:hp.dispatched, icon:<LocalShippingIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.amber },
                { title:'POD Confirmed', value:hp.podConfirmed, icon:<VerifiedIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.green },
                { title:'Quality Evaluated', value:hp.qualityEvaluated, icon:<StarIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.rdf },
                { title:'RRF Rate', value:`${hpRrfPct}%`, icon:<TrendingUpIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.hp },
              ].map((k, i) => (
                <Grid item xs={6} sm={4} md={3} key={i}>
                  <KpiCard {...k} loading={hpLoading} />
                </Grid>
              ))}
            </Grid>

            {/* Workflow progress bars */}
            <Card sx={{ background:G.card, border:'1px solid rgba(255,255,255,0.08)', borderRadius:3, mb:3, boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
              <CardContent sx={{ p:3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color:'rgba(255,255,255,0.6)', mb:2.5, textTransform:'uppercase', letterSpacing:0.8, fontSize:'0.72rem' }}>
                  Workflow Stage Progress
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label:'O2C', val:wp.o2cCompleted, total:hp.totalODNs, color:'#667eea' },
                    { label:'EWM', val:wp.ewmCompleted, total:hp.totalODNs, color:'#43e97b' },
                    { label:'PI', val:wp.piCompleted, total:hp.totalODNs, color:'#4facfe' },
                    { label:'TM', val:wp.tmCompleted, total:hp.totalODNs, color:'#f6d365' },
                    { label:'Dispatch', val:wp.dispatched, total:hp.totalODNs, color:'#fda085' },
                    { label:'Documentation', val:wp.documentationCompleted, total:hp.totalODNs, color:'#f093fb' },
                    { label:'Quality', val:wp.qualityEvaluated, total:hp.totalODNs, color:'#38f9d7' },
                  ].map(({ label, val, total, color }) => {
                    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                    return (
                      <Grid item xs={12} sm={6} key={label}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb:0.5 }}>
                          <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.6)', fontWeight:600 }}>{label}</Typography>
                          <Typography variant="caption" sx={{ color, fontWeight:700 }}>{val ?? 0} <span style={{color:'rgba(255,255,255,0.3)'}}>/ {total ?? 0}</span> ({pct}%)</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={pct}
                          sx={{ height:8, borderRadius:4, bgcolor:'rgba(255,255,255,0.07)', '& .MuiLinearProgress-bar':{ background:color, borderRadius:4 } }} />
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>

            {/* Top routes chart */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <ChartCard title="Top Routes by Facilities & ODNs" height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topRoutes} margin={{ top:5, right:10, left:-20, bottom:40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:10 }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} tickLine={false} />
                      <RTooltip contentStyle={{ background:'#1e1e3a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff' }} />
                      <Legend wrapperStyle={{ color:'rgba(255,255,255,0.5)', fontSize:12 }} />
                      <Bar dataKey="facilities" name="Facilities" fill="#667eea" radius={[4,4,0,0]} />
                      <Bar dataKey="odns" name="ODNs" fill="#43e97b" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <ChartCard title="HP Monthly Trend" height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeTrend} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} tickLine={false} />
                      <RTooltip contentStyle={{ background:'#1e1e3a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff' }} />
                      <Line type="monotone" dataKey="rrf_sent" name="RRF Sent" stroke="#667eea" strokeWidth={2} dot={{ fill:'#667eea', r:3 }} />
                      <Line type="monotone" dataKey="pod_confirmed" name="POD" stroke="#43e97b" strokeWidth={2} dot={{ fill:'#43e97b', r:3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — RDF PROGRAM
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <Fade in>
          <Box>
            <SectionHeader title="RDF Program Analytics" subtitle="All-time customer service metrics" gradient={G.rdf} />

            {/* RDF KPIs */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { title:'Total Registrations', value:rdfStats?.totalRegistrations, icon:<PeopleIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.rdf },
                { title:'Completed', value:rdfStats?.completedCount, icon:<CheckCircleIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.green },
                { title:'In Progress', value:rdfStats?.inProgressCount, icon:<TrendingUpIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.blue },
                { title:'Cancelled', value:rdfStats?.cancelledCount, icon:<CancelIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.red },
                { title:'Auto-Cancelled', value:rdfStats?.autoCancelledCount, icon:<CancelIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.amber },
                { title:'Avg Wait Time', value:rdfStats?.averageWaitingTime ? `${Math.round(rdfStats.averageWaitingTime)}m` : '—', icon:<AccessTimeIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.hp },
                { title:'Completion Rate', value:`${rdfCompPct}%`, icon:<SpeedIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.green },
                { title:'Cancellation Rate', value: rdfTotal > 0 ? `${(((rdfStats?.cancelledCount||0)+(rdfStats?.autoCancelledCount||0))/rdfTotal*100).toFixed(1)}%` : '—', icon:<TrendingUpIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.red },
              ].map((k, i) => (
                <Grid item xs={6} sm={4} md={3} key={i}>
                  <KpiCard {...k} loading={rdfLoading} />
                </Grid>
              ))}
            </Grid>

            {/* RDF charts */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={5}>
                <ChartCard title="Customer Status Breakdown" height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rdfPie} cx="50%" cy="45%" innerRadius={70} outerRadius={105} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {rdfPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <RTooltip contentStyle={{ background:'#1e1e3a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={7}>
                {/* Best of Week */}
                <Card sx={{ background:G.card, border:'1px solid rgba(255,255,255,0.08)', borderRadius:3, height:'100%', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
                  <CardContent sx={{ p:3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb:2.5 }}>
                      <EmojiEventsIcon sx={{ color:'#f6d365', fontSize:22 }} />
                      <Typography variant="subtitle2" fontWeight={600} sx={{ color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:0.8, fontSize:'0.72rem' }}>
                        Best of Last Week
                      </Typography>
                    </Stack>
                    {rdfLoading
                      ? <CircularProgress size={24} sx={{ color:'#667eea' }} />
                      : bestOf && Object.keys(bestOf).length > 0
                        ? (
                          <Grid container spacing={1.5}>
                            {Object.entries(bestOf).map(([role, person]) => person && (
                              <Grid item xs={12} sm={6} key={role}>
                                <Box sx={{ background:'rgba(255,255,255,0.04)', borderRadius:2, p:1.5, border:'1px solid rgba(255,255,255,0.06)' }}>
                                  <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:0.5, fontSize:'0.65rem' }}>{role}</Typography>
                                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt:0.5 }}>
                                    <Avatar sx={{ width:28, height:28, background:G.hp, fontSize:'0.75rem' }}>
                                      {(person.full_name||'?')[0]}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" fontWeight={700} sx={{ color:'#fff', lineHeight:1.2 }}>{person.full_name}</Typography>
                                      <Chip label={`${person.process_count} tasks`} size="small"
                                        sx={{ height:18, fontSize:'0.65rem', background:'rgba(102,126,234,0.25)', color:'#667eea', mt:0.3 }} />
                                    </Box>
                                  </Stack>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        )
                        : <Typography variant="body2" sx={{ color:'rgba(255,255,255,0.3)' }}>No data available for last week.</Typography>
                    }
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Completion rate visual */}
            <Card sx={{ background:G.card, border:'1px solid rgba(255,255,255,0.08)', borderRadius:3, boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
              <CardContent sx={{ p:3 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color:'rgba(255,255,255,0.6)', mb:2, textTransform:'uppercase', letterSpacing:0.8, fontSize:'0.72rem' }}>
                  Service Completion Overview
                </Typography>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign:'center' }}>
                      <Box sx={{ position:'relative', display:'inline-flex' }}>
                        <CircularProgress variant="determinate" value={parseFloat(rdfCompPct)} size={120} thickness={6}
                          sx={{ color:'#43e97b', '& .MuiCircularProgress-circle':{ strokeLinecap:'round' } }} />
                        <Box sx={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Typography variant="h5" fontWeight={800} sx={{ color:'#fff' }}>{rdfCompPct}%</Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.4)', display:'block', mt:1 }}>Completion Rate</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    {[
                      { label:'Completed', val:rdfStats?.completedCount||0, color:'#43e97b' },
                      { label:'In Progress', val:rdfStats?.inProgressCount||0, color:'#f6d365' },
                      { label:'Cancelled', val:rdfStats?.cancelledCount||0, color:'#f5576c' },
                      { label:'Auto-Cancelled', val:rdfStats?.autoCancelledCount||0, color:'#fda085' },
                    ].map(({ label, val, color }) => {
                      const pct = rdfTotal > 0 ? Math.round((val / rdfTotal) * 100) : 0;
                      return (
                        <Box key={label} sx={{ mb:1.5 }}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb:0.4 }}>
                            <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.6)', fontWeight:600 }}>{label}</Typography>
                            <Typography variant="caption" sx={{ color, fontWeight:700 }}>{val.toLocaleString()} ({pct}%)</Typography>
                          </Stack>
                          <LinearProgress variant="determinate" value={pct}
                            sx={{ height:7, borderRadius:4, bgcolor:'rgba(255,255,255,0.07)', '& .MuiLinearProgress-bar':{ background:color, borderRadius:4 } }} />
                        </Box>
                      );
                    })}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Fade>
      )}

    </Box>
  );
};

export default ManagerDashboard;
