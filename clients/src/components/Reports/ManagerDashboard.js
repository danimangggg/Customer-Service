import { useState, useEffect, useCallback } from 'react';
import api from '../../axiosInstance';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Avatar,
  CircularProgress, LinearProgress, Divider, Tooltip, IconButton, Fade,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as RTooltip
} from 'recharts';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedIcon from '@mui/icons-material/Verified';
import RefreshIcon from '@mui/icons-material/Refresh';
import SpeedIcon from '@mui/icons-material/Speed';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import BranchSelect from '../Settings/BranchSelect';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ethiopianMonths = [
  'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit',
  'Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume',
];

const formatDuration = (mins) => {
  if (mins == null || mins === 0) return '—';
  mins = Math.round(mins);
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) { const h = Math.floor(mins/60), m = mins%60; return m > 0 ? `${h}h ${m}m` : `${h}h`; }
  const d = Math.floor(mins/1440), rem = mins%1440, h = Math.floor(rem/60);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
};

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

// Professional light theme
const C = {
  bg:        '#f1f5f9',
  surface:   '#ffffff',
  surfaceAlt:'#f8fafc',
  border:    '#e2e8f0',
  borderHov: '#cbd5e1',
  text:      '#0f172a',
  textMuted: '#64748b',
  textDim:   '#94a3b8',
  indigo:    '#6366f1',
  indigoSoft:'rgba(99,102,241,0.1)',
  teal:      '#0d9488',
  tealSoft:  'rgba(13,148,136,0.1)',
  emerald:   '#059669',
  emeraldSoft:'rgba(5,150,105,0.1)',
  amber:     '#d97706',
  amberSoft: 'rgba(217,119,6,0.1)',
  rose:      '#e11d48',
  roseSoft:  'rgba(225,29,72,0.1)',
  sky:       '#0284c7',
  skySoft:   'rgba(2,132,199,0.1)',
  violet:    '#7c3aed',
  violetSoft:'rgba(124,58,237,0.1)',
  slate:     '#475569',
};

const G = {
  hp:    `linear-gradient(135deg,${C.indigo} 0%,${C.violet} 100%)`,
  rdf:   `linear-gradient(135deg,${C.rose} 0%,${C.violet} 100%)`,
  green: `linear-gradient(135deg,${C.emerald} 0%,${C.teal} 100%)`,
  blue:  `linear-gradient(135deg,${C.sky} 0%,${C.indigo} 100%)`,
  amber: `linear-gradient(135deg,${C.amber} 0%,#ea580c 100%)`,
  red:   `linear-gradient(135deg,${C.rose} 0%,#f43f5e 100%)`,
  card:  C.surface,
};
const tooltipStyle = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' };

const KpiCard = ({ title, value, subtitle, icon, gradient, loading }) => (
  <Card sx={{
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 2,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:hover': { borderColor: C.borderHov, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }
  }}>
    <Box sx={{ height: 3, background: gradient }} />
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.75rem', fontWeight: 600 }}>
            {title}
          </Typography>
          {loading
            ? <CircularProgress size={24} sx={{ mt: 1, color: C.indigo }} />
            : <Typography variant="h4" fontWeight={700} sx={{ color: C.text, lineHeight: 1.15, mt: 0.5, letterSpacing: -0.5 }}>{value ?? '—'}</Typography>
          }
          {subtitle && <Typography variant="caption" sx={{ color: C.textDim, mt: 0.4, display: 'block', fontSize: '0.78rem' }}>{subtitle}</Typography>}
        </Box>
        <Box sx={{ background: gradient, borderRadius: 1.5, p: 1, opacity: 0.9, ml: 1.5, flexShrink: 0 }}>{icon}</Box>
      </Stack>
    </CardContent>
  </Card>
);

const SectionLabel = ({ label, gradient }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
    <Box sx={{ width: 3, height: 20, background: gradient, borderRadius: 2 }} />
    <Typography variant="overline" fontWeight={700} sx={{ color: C.textMuted, letterSpacing: 1.5, fontSize: '0.92rem', lineHeight: 1 }}>
      {label}
    </Typography>
  </Stack>
);

const ChartCard = ({ title, children, height = 260 }) => (
  <Card sx={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Typography variant="overline" fontWeight={700} sx={{ color: C.textMuted, letterSpacing: 1, fontSize: '0.78rem', display: 'block', mb: 1.5 }}>
        {title}
      </Typography>
      <Box sx={{ height }}>{children}</Box>
    </CardContent>
  </Card>
);

const ManagerDashboard = () => {
  const eth = getCurrentEthiopianMonth();
  const [month, setMonth] = useState(ethiopianMonths[eth.monthIndex]);
  const [year, setYear] = useState(eth.year);
  const [processType, setProcessType] = useState('regular');
  const [hpData, setHpData] = useState(null);
  const [rdfStats, setRdfStats] = useState(null);
  const [bestOf, setBestOf] = useState(null);
  const [bestOfHP, setBestOfHP] = useState(null);
  const [hpLoading, setHpLoading] = useState(true);
  const [rdfLoading, setRdfLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const currentAccountType = localStorage.getItem('AccountType') || '';
  const currentJobTitle = localStorage.getItem('JobTitle') || '';
  const isSuperAdmin = currentAccountType === 'Super Admin';
  const isReportsRole = currentJobTitle === 'Reports';
  const canSelectBranch = isSuperAdmin || isReportsRole;
  const defaultBranch = canSelectBranch ? '' : (localStorage.getItem('branch_code') || '');
  const [selectedBranch, setSelectedBranch] = useState(defaultBranch);

  const fetchHP = useCallback(async () => {
    try {
      setHpLoading(true);
      const params = { month, year, process_type: processType };
      if (selectedBranch) params.branch_code = selectedBranch;
      const r = await api.get(`${API_URL}/api/hp-comprehensive-report`, { params });
      setHpData(r.data);
    } catch (e) { console.error(e); }
    finally { setHpLoading(false); }
  }, [month, year, processType, selectedBranch]);

  const fetchRDF = useCallback(async () => {
    try {
      setRdfLoading(true);
      const branchParam = selectedBranch ? { branch_code: selectedBranch } : {};
      const [statsRes, bestRes] = await Promise.all([
        api.get(`${API_URL}/api/rdf-dashboard-stats`, { params: branchParam }),
        api.get(`${API_URL}/api/best-of-week`, { params: branchParam }),
      ]);
      if (statsRes.data.success) setRdfStats(statsRes.data.stats);
      if (bestRes.data.success) setBestOf(bestRes.data.data);
    } catch (e) { console.error('[RDF] fetch error:', e?.response?.data || e?.message || e); }
    finally { setRdfLoading(false); }
  }, [selectedBranch]);

  const fetchBestOfHP = useCallback(async () => {
    try {
      const params = {};
      if (selectedBranch) params.branch_code = selectedBranch;
      const r = await api.get(`${API_URL}/api/best-of-hp`, { params });
      if (r.data.success) setBestOfHP(r.data.data);
    } catch (e) { console.error(e); }
  }, [selectedBranch]);

  useEffect(() => { fetchHP(); fetchBestOfHP(); }, [fetchHP, fetchBestOfHP]);
  useEffect(() => { fetchRDF(); }, [fetchRDF]);

  const handleRefresh = () => { fetchHP(); fetchRDF(); fetchBestOfHP(); setLastRefresh(new Date()); };

  // ── derived HP ──
  const hp = hpData?.summary || {};
  const wp = hpData?.workflowProgress || {};
  const isVaccine = processType === 'vaccine';
  const rrfLabel = isVaccine ? 'VRF' : 'RRF';
  const hpRrfPct  = hp.expectedFacilities > 0 ? ((hp.rrfSent / hp.expectedFacilities) * 100).toFixed(1) : 0;
  const hpPodPct  = hp.expectedFacilities > 0 ? (((wp.documentation_stage||0) / hp.expectedFacilities) * 100).toFixed(1) : 0;
  const hpQualPct = hp.expectedFacilities > 0 ? (((wp.quality_stage||0) / hp.expectedFacilities) * 100).toFixed(1) : 0;

  // ── derived RDF ──
  const rdfTotal   = rdfStats?.totalRegistrations || 0;
  const rdfCompPct = rdfTotal > 0 ? ((rdfStats?.completedCount / rdfTotal) * 100).toFixed(1) : 0;

  // ── chart data ──
  const rrfPie = [
    { name:`${rrfLabel} Sent`,  value: hp.rrfSent || 0,    color: C.emerald },
    { name:'Not Sent',          value: hp.rrfNotSent || 0,  color: C.rose },
  ];

  const rdfPie = [
    { name:'Completed',     value: rdfStats?.completedCount || 0,                                          color: C.emerald },
    { name:'In Progress',   value: rdfStats?.inProgressCount || 0,                                         color: C.amber },
    { name:'Cancelled',     value: (rdfStats?.cancelledCount || 0) + (rdfStats?.autoCancelledCount || 0),  color: C.rose },
  ].filter(d => d.value > 0);

  const years = Array.from({ length: 8 }, (_, i) => eth.year - 4 + i);

  return (
    <Box sx={{ minHeight: '100vh', background: C.bg, p: 3 }}>

      {/* ── BRANCH FILTER ── */}
      {canSelectBranch && (
        <Box sx={{ mb: 2, maxWidth: 300 }}>
          <BranchSelect
            value={selectedBranch}
            onChange={setSelectedBranch}
            label="Filter by Branch"
            size="small"
            helperText="Leave empty to see all branches"
          />
        </Box>
      )}

      {/* ── HEADER ── */}
      <Box sx={{ background: C.surface, borderRadius: 2, p: 2.5, mb: 3, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

        <Stack direction={{ xs:'column', md:'row' }} justifyContent="space-between" alignItems={{ xs:'flex-start', md:'center' }} spacing={2} flexWrap="wrap">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ background: G.hp, borderRadius: 2, p: 1.2 }}>
              <SpeedIcon sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: C.text, letterSpacing: -0.3 }}>Operations Dashboard</Typography>
              <Typography variant="caption" sx={{ color: C.textMuted }}>
                Unified HP & RDF overview · Updated {lastRefresh.toLocaleTimeString()}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth:130 }}>
              <InputLabel sx={{ color: C.textMuted, '&.Mui-focused':{ color: C.indigo } }}>Month</InputLabel>
              <Select value={month} label="Month" onChange={e => setMonth(e.target.value)}
                sx={{ color: C.text, '.MuiOutlinedInput-notchedOutline':{ borderColor: C.border }, '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor: C.borderHov }, '.MuiSvgIcon-root':{ color: C.textMuted } }}>
                {ethiopianMonths.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth:90 }}>
              <InputLabel sx={{ color: C.textMuted, '&.Mui-focused':{ color: C.indigo } }}>Year</InputLabel>
              <Select value={year} label="Year" onChange={e => setYear(e.target.value)}
                sx={{ color: C.text, '.MuiOutlinedInput-notchedOutline':{ borderColor: C.border }, '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor: C.borderHov }, '.MuiSvgIcon-root':{ color: C.textMuted } }}>
                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth:120 }}>
              <InputLabel sx={{ color: C.textMuted, '&.Mui-focused':{ color: C.indigo } }}>Type</InputLabel>
              <Select value={processType} label="Type" onChange={e => setProcessType(e.target.value)}
                sx={{ color: C.text, '.MuiOutlinedInput-notchedOutline':{ borderColor: C.border }, '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor: C.borderHov }, '.MuiSvgIcon-root':{ color: C.textMuted } }}>
                <MenuItem value="regular">HP Regular</MenuItem>
                <MenuItem value="vaccine">Vaccine</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} sx={{ background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}`, '&:hover':{ background: C.indigoSoft, color: C.indigo, borderColor: C.indigo } }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      <Fade in>
        <Box>

          {/* ══ SECTION 1: HP KPIs ══ */}
          <SectionLabel label={`Health Program — ${month} ${year} · ${processType === 'vaccine' ? 'Vaccine' : 'HP Regular'}`} gradient={G.hp} />
          <Grid container spacing={2} sx={{ mb:3 }}>
            {[
              { title:'Total Facilities',      value:hp.totalFacilities,                                                                                                                                                    subtitle:'All HP facilities',         icon:<LocalHospitalIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.blue,  loading:hpLoading },
              { title:'Expected This Month',  value:hp.expectedFacilities,                                                                                                                                                   subtitle:'This period',               icon:<LocalHospitalIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.hp,    loading:hpLoading },
              { title:'Completed Facilities', value:(hp.rrfSent||0)+(hp.rrfNotSent||0), subtitle:`${hp.expectedFacilities > 0 ? (((hp.rrfSent||0)+(hp.rrfNotSent||0))/hp.expectedFacilities*100).toFixed(1) : 0}% of expected`, icon:<CheckCircleIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.green, loading:hpLoading },
              { title:`${rrfLabel} Sent`,     value:hp.rrfSent,                                                                                                                                                              subtitle:`${hpRrfPct}% of expected`,  icon:<AssignmentIcon sx={{color:'#fff',fontSize:26}}/>,    gradient:G.green, loading:hpLoading },
              { title:`${rrfLabel} Not Sent`, value:hp.rrfNotSent,                                                                                                                                                           subtitle:'No stock to send',          icon:<CancelIcon sx={{color:'#fff',fontSize:26}}/>,        gradient:G.amber, loading:hpLoading },
              { title:'POD Confirmed',        value:wp.documentation_stage,                                                                                                                                                  subtitle:`${hpPodPct}% of expected`,  icon:<VerifiedIcon sx={{color:'#fff',fontSize:26}}/>,      gradient:G.blue,  loading:hpLoading },
              { title:'Completion Rate',      value:`${hpRrfPct}%`,                                                                                                                                                          subtitle:'Facility coverage',         icon:<TrendingUpIcon sx={{color:'#fff',fontSize:26}}/>,    gradient:G.hp,    loading:hpLoading },
              { title:'Avg Process Time',     value:formatDuration(hp.avgProcessDays),                                                                                                                                       subtitle:'O2C to quality eval',       icon:<AccessTimeIcon sx={{color:'#fff',fontSize:26}}/>,    gradient:G.amber, loading:hpLoading },
            ].map((k, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}><KpiCard {...k} /></Grid>
            ))}
          </Grid>

          {/* ══ HP WORKFLOW PROGRESS ══ */}
          <Grid container spacing={2} sx={{ mb:3 }}>
            <Grid item xs={12} md={7}>
              <Card sx={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" fontWeight={700} sx={{ color: C.textMuted, letterSpacing: 1, fontSize: '0.67rem', display: 'block', mb: 2 }}>
                    HP Workflow Stage Progress
                  </Typography>
                  <Grid container spacing={1.5}>
                    {[
                      { label:'O2C',           val:wp.o2c_stage,             color: C.indigo },
                      { label:'EWM',           val:wp.ewm_phase1_facilities, color: C.emerald },
                      { label:'PI',            val:wp.pi_facilities,         color: C.sky },
                      { label:'TM',            val:wp.tm_phase1_facilities,  color: C.amber },
                      { label:'Documentation', val:wp.documentation_stage,   color: C.violet },
                      { label:'Quality',       val:wp.quality_stage,         color: C.teal },
                    ].map(({ label, val, color }) => {
                      const pct = hp.expectedFacilities > 0 ? Math.round(((val||0) / hp.expectedFacilities) * 100) : 0;
                      return (
                        <Grid item xs={12} sm={6} key={label}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: C.textMuted, fontWeight: 600, fontSize: '0.92rem' }}>{label}</Typography>
                            <Typography variant="caption" sx={{ color, fontWeight: 700, fontSize: '0.92rem' }}>
                              {val ?? 0} <span style={{ color: C.textDim }}>/ {hp.expectedFacilities ?? 0}</span> ({pct}%)
                            </Typography>
                          </Stack>
                          <LinearProgress variant="determinate" value={pct}
                            sx={{ height: 5, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar':{ background: color, borderRadius: 4 } }} />
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={5}>
              <ChartCard title={`HP ${rrfLabel} Status`} height={220}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rrfPie} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {rrfPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: C.text, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>

          {/* ══ HP BEST OF LAST WEEK ══ */}
          <Box sx={{ mb:3 }}>
            <Card sx={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p:3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb:2 }}>
                  <EmojiEventsIcon sx={{ color: C.amber, fontSize:18 }} />
                  <Typography variant="overline" fontWeight={700} sx={{ color: C.textMuted, letterSpacing: 1, fontSize: '0.67rem' }}>
                    All-Time Best — HP
                  </Typography>
                </Stack>
                {hpLoading
                  ? <CircularProgress size={24} sx={{ color: C.indigo }} />
                  : bestOfHP?.employees && Object.values(bestOfHP.employees).some(Boolean)
                    ? (
                      <Grid container spacing={1.5}>
                        {[
                          { role:'O2C',           person: bestOfHP.employees.o2c },
                          { role:'EWM',           person: bestOfHP.employees.ewm },
                          { role:'Biller',        person: bestOfHP.employees.biller },
                          { role:'TM',            person: bestOfHP.employees.tm },
                          { role:'PI',            person: bestOfHP.employees.pi },
                          { role:'Documentation', person: bestOfHP.employees.documentation },
                          { role:'Quality',       person: bestOfHP.employees.quality },
                        ].filter(({ person }) => person).map(({ role, person }) => (
                          <Grid item xs={12} sm={6} md={3} key={role}>
                            <Box sx={{ background: C.surfaceAlt, borderRadius: 1.5, p: 1.5, border: `1px solid ${C.border}` }}>
                              <Typography variant="caption" sx={{ color: C.textDim, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.72rem', fontWeight: 600 }}>{role}</Typography>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                                <Avatar sx={{ width: 28, height: 28, background: G.hp, fontSize: '0.75rem', fontWeight: 700 }}>
                                  {(person.full_name || '?')[0]}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600} sx={{ color: C.text, lineHeight: 1.2, fontSize: '0.92rem' }}>{person.full_name}</Typography>
                                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.3, flexWrap: 'wrap', gap: 0.3 }}>
                                    <Chip label={`${person.process_count} tasks`} size="small"
                                      sx={{ height: 16, fontSize: '0.72rem', background: C.indigoSoft, color: C.indigo, fontWeight: 600 }} />
                                    {!selectedBranch && person.branch_name && (
                                      <Chip label={person.branch_name} size="small"
                                        sx={{ height: 16, fontSize: '0.72rem', background: C.amberSoft, color: C.amber, fontWeight: 600 }} />
                                    )}
                                  </Stack>
                                </Box>
                              </Stack>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    )
                    : <Typography variant="body2" sx={{ color: C.textDim }}>No data for last week.</Typography>
                }
              </CardContent>
            </Card>
          </Box>

          <Divider sx={{ borderColor: C.border, my: 3 }} />

          {/* ══ SECTION 2: RDF KPIs ══ */}
          <SectionLabel label="RDF Customer Service — All Time" gradient={G.rdf} />
          <Grid container spacing={2} sx={{ mb:3 }}>
            {[
              { title:'Total Registrations', value:rdfStats?.totalRegistrations,  subtitle:'All time',              icon:<PeopleIcon sx={{color:'#fff',fontSize:26}}/>,      gradient:G.rdf,   loading:rdfLoading },
              { title:'Completed',           value:rdfStats?.completedCount,       subtitle:`${rdfCompPct}% rate`,   icon:<CheckCircleIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.green, loading:rdfLoading },
              { title:'In Progress',         value:rdfStats?.inProgressCount,      subtitle:'Active customers',      icon:<TrendingUpIcon sx={{color:'#fff',fontSize:26}}/>,  gradient:G.blue,  loading:rdfLoading },
              { title:'Cancelled',           value:rdfStats?.cancelledCount,       subtitle:'Manual cancellations',  icon:<CancelIcon sx={{color:'#fff',fontSize:26}}/>,      gradient:G.red,   loading:rdfLoading },
              { title:'Auto-Cancelled',      value:rdfStats?.autoCancelledCount,   subtitle:'System cancellations',  icon:<CancelIcon sx={{color:'#fff',fontSize:26}}/>,      gradient:G.amber, loading:rdfLoading },
              { title:'Avg Wait Time',       value:formatDuration(rdfStats?.averageWaitingTime != null ? Math.round(rdfStats.averageWaitingTime) : null), subtitle:'Service time', icon:<AccessTimeIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.hp, loading:rdfLoading },
              { title:'Completion Rate',     value:`${rdfCompPct}%`,               subtitle:'Overall',               icon:<SpeedIcon sx={{color:'#fff',fontSize:26}}/>,       gradient:G.green, loading:rdfLoading },
              { title:'Cancel Rate',         value: rdfTotal > 0 ? `${(((rdfStats?.cancelledCount||0)+(rdfStats?.autoCancelledCount||0))/rdfTotal*100).toFixed(1)}%` : '—', subtitle:'Combined', icon:<TrendingUpIcon sx={{color:'#fff',fontSize:26}}/>, gradient:G.red, loading:rdfLoading },
            ].map((k, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}><KpiCard {...k} /></Grid>
            ))}
          </Grid>

          {/* ══ RDF CHARTS + BEST OF WEEK ══ */}
          <Grid container spacing={2} sx={{ mb:3 }}>
            {/* Status pie */}
            <Grid item xs={12} md={6}>
              <ChartCard title="RDF Customer Status" height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rdfPie} cx="50%" cy="45%" innerRadius={65} outerRadius={100} paddingAngle={4} dataKey="value">
                      {rdfPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: C.text, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>

            {/* Completion bars */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" fontWeight={700} sx={{ color: C.textMuted, letterSpacing: 1, fontSize: '0.67rem', display: 'block', mb: 2 }}>
                    Service Completion Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 220 }}>
                    {[
                      { label: 'Completed',      val: rdfStats?.completedCount||0,     color: C.emerald },
                      { label: 'In Progress',    val: rdfStats?.inProgressCount||0,    color: C.amber },
                      { label: 'Cancelled',      val: rdfStats?.cancelledCount||0,     color: C.rose },
                      { label: 'Auto-Cancelled', val: rdfStats?.autoCancelledCount||0, color: C.slate },
                    ].map(({ label, val, color }) => {
                      const pct = rdfTotal > 0 ? Math.round((val / rdfTotal) * 100) : 0;
                      return (
                        <Box key={label} sx={{ mb: 2 }}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: C.textMuted, fontWeight: 600, fontSize: '0.92rem' }}>{label}</Typography>
                            <Typography variant="caption" sx={{ color, fontWeight: 700, fontSize: '0.92rem' }}>{val.toLocaleString()} ({pct}%)</Typography>
                          </Stack>
                          <LinearProgress variant="determinate" value={pct}
                            sx={{ height: 5, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { background: color, borderRadius: 4 } }} />
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ══ RDF ALL-TIME BEST ══ */}
          <Box sx={{ mb: 3 }}>
            <Card sx={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <EmojiEventsIcon sx={{ color: C.amber, fontSize: 18 }} />
                  <Typography variant="overline" fontWeight={700} sx={{ color: C.textMuted, letterSpacing: 1, fontSize: '0.67rem' }}>
                    All-Time Best — RDF
                  </Typography>
                </Stack>
                {rdfLoading
                  ? <CircularProgress size={24} sx={{ color: C.indigo }} />
                  : bestOf?.employees && Object.values(bestOf.employees).some(Boolean)
                    ? (
                      <Grid container spacing={1.5}>
                        {Object.entries(bestOf.employees).map(([role, person]) => person && (
                          <Grid item xs={12} sm={6} md={3} key={role}>
                            <Box sx={{ background: C.surfaceAlt, borderRadius: 1.5, p: 1.5, border: `1px solid ${C.border}` }}>
                              <Typography variant="caption" sx={{ color: C.textDim, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.72rem', fontWeight: 600 }}>{role}</Typography>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                                <Avatar sx={{ width: 28, height: 28, background: G.rdf, fontSize: '0.75rem', fontWeight: 700 }}>
                                  {(person.full_name||'?')[0]}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600} sx={{ color: C.text, lineHeight: 1.2, fontSize: '0.92rem' }}>{person.full_name}</Typography>
                                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.3, flexWrap: 'wrap', gap: 0.3 }}>
                                    <Chip label={`${person.process_count} tasks`} size="small"
                                      sx={{ height: 16, fontSize: '0.72rem', background: C.violetSoft, color: C.violet, fontWeight: 600 }} />
                                    {!selectedBranch && person.branch_name && (
                                      <Chip label={person.branch_name} size="small"
                                        sx={{ height: 16, fontSize: '0.72rem', background: C.amberSoft, color: C.amber, fontWeight: 600 }} />
                                    )}
                                  </Stack>
                                </Box>
                              </Stack>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    )
                    : <Typography variant="body2" sx={{ color: C.textDim }}>No data available.</Typography>
                }
              </CardContent>
            </Card>
          </Box>

        </Box>
      </Fade>
    </Box>
  );
};

export default ManagerDashboard;
