import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Avatar, Stack, Chip, Fade,
  Divider, CircularProgress, Alert, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, TablePagination, TextField, InputAdornment, Paper,
} from '@mui/material';
import {
  Business, Info, Public, Map, LocationCity, Domain, LocationOn,
  Search as SearchIcon,
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL;

const OrganizationProfileView = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [facilitiesPage, setFacilitiesPage] = useState(0);
  const [facilitiesRowsPerPage, setFacilitiesRowsPerPage] = useState(10);
  const [woredasPage, setWoredasPage] = useState(0);
  const [woredasRowsPerPage, setWoredasRowsPerPage] = useState(10);
  const [facilitiesSearch, setFacilitiesSearch] = useState('');
  const [woredasSearch, setWoredasSearch] = useState('');

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [facilitiesRes, employeesRes] = await Promise.all([
        axios.get(`${API_URL}/api/facilities`),
        axios.get(`${API_URL}/api/get-employee`),
      ]);
      const facs = facilitiesRes.data;
      setFacilities(facs);
      setEmployees(employeesRes.data);
      const uniqueRegions = [...new Set(facs.map(f => f.region_name).filter(Boolean))]
        .map((name, i) => ({ id: i + 1, name, code: name.substring(0, 2).toUpperCase() }));
      const uniqueZones = [...new Set(facs.map(f => f.zone_name).filter(Boolean))]
        .map((name, i) => ({
          id: i + 1, name,
          regionId: uniqueRegions.find(r => facs.find(f => f.zone_name === name && f.region_name === r.name))?.id || 1
        }));
      const uniqueWoredas = [...new Set(facs.map(f => f.woreda_name).filter(Boolean))]
        .map((name, i) => ({
          id: i + 1, name,
          zoneId: uniqueZones.find(z => facs.find(f => f.woreda_name === name && f.zone_name === z.name))?.id || 1
        }));
      setRegions(uniqueRegions);
      setZones(uniqueZones);
      setWoredas(uniqueWoredas);
    } catch (err) {
      setError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const getRegionName = (id) => regions.find(r => r.id === id)?.name || 'N/A';
  const getZoneName = (id) => zones.find(z => z.id === id)?.name || 'N/A';

  const getJobTitleStats = () => {
    const counts = {};
    employees.forEach(e => {
      const t = e.jobTitle || 'Unassigned';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).sort(([a], [b]) => {
      const aNA = ['N/A', 'Unassigned', ''].includes(a);
      const bNA = ['N/A', 'Unassigned', ''].includes(b);
      if (aNA && !bNA) return 1;
      if (!aNA && bNA) return -1;
      return a.localeCompare(b);
    });
  };

  const jobTitleStats = getJobTitleStats();

  const filteredFacilities = facilities.filter(f =>
    [f.facility_name, f.facility_type, f.woreda_name, f.zone_name, f.region_name]
      .some(v => v?.toLowerCase().includes(facilitiesSearch.toLowerCase()))
  );
  const paginatedFacilities = filteredFacilities.slice(
    facilitiesPage * facilitiesRowsPerPage,
    facilitiesPage * facilitiesRowsPerPage + facilitiesRowsPerPage
  );
  const filteredWoredas = woredas.filter(w =>
    w.name?.toLowerCase().includes(woredasSearch.toLowerCase()) ||
    getZoneName(w.zoneId)?.toLowerCase().includes(woredasSearch.toLowerCase())
  );
  const paginatedWoredas = filteredWoredas.slice(
    woredasPage * woredasRowsPerPage,
    woredasPage * woredasRowsPerPage + woredasRowsPerPage
  );

  if (loading) return (
    <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)' }}>
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">Loading organization data...</Typography>
      </Stack>
    </Box>
  );

  if (error) return (
    <Box sx={{ minHeight:'100vh', background:'linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)', p:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Alert severity="error" sx={{ maxWidth:600 }}>
        {error}
        <Button onClick={fetchAllData} sx={{ ml:2 }}>Retry</Button>
      </Alert>
    </Box>
  );

  const palettes = [
    { bg:'#e3f2fd', accent:'#1565c0' }, { bg:'#fce4ec', accent:'#c62828' },
    { bg:'#fff3e0', accent:'#e65100' }, { bg:'#f3e5f5', accent:'#6a1b9a' },
    { bg:'#e0f7fa', accent:'#00695c' }, { bg:'#fff8e1', accent:'#f57f17' },
    { bg:'#fbe9e7', accent:'#bf360c' }, { bg:'#e8eaf6', accent:'#283593' },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .animate-fade-in { animation: fadeInUp 0.6s ease-out; }
        .org-profile-card { background:rgba(255,255,255,0.95); border-radius:20px; border:1px solid rgba(25,118,210,0.1); }
        .header-gradient { background:#f5f5f5; color:#333; border-bottom:1px solid #e0e0e0; padding:32px; border-radius:20px 20px 0 0; }
        .info-card { background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%); border-radius:16px; padding:24px; border:1px solid rgba(0,0,0,0.05); }
      `}</style>
      <Box sx={{ minHeight:'100vh', background:'linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)', p:2 }}>
        <Box className="org-profile-card animate-fade-in" sx={{ mx:'auto', maxWidth:1200 }}>
          <Box className="header-gradient">
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar sx={{ bgcolor:'#e0e0e0', width:80, height:80 }}>
                <Business sx={{ fontSize:40, color:'#555' }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color:'#333' }}>Organization Profile</Typography>
                <Typography variant="body1" sx={{ color:'#666' }}>View organization information and statistics</Typography>
              </Box>
            </Stack>
          </Box>
          <Box sx={{ p:4 }}>
            <Box sx={{ borderBottom:1, borderColor:'divider', mb:4 }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab icon={<Info />} label="Overview" sx={{ textTransform:'none', fontWeight:600 }} />
                <Tab icon={<Public />} label="Regions" sx={{ textTransform:'none', fontWeight:600 }} />
                <Tab icon={<Map />} label="Zones" sx={{ textTransform:'none', fontWeight:600 }} />
                <Tab icon={<LocationCity />} label="Woredas" sx={{ textTransform:'none', fontWeight:600 }} />
                <Tab icon={<Domain />} label="Facilities" sx={{ textTransform:'none', fontWeight:600 }} />
              </Tabs>
            </Box>
            {activeTab === 0 && (
              <Box>
                <Fade in timeout={600}>
                  <Box sx={{ mb:4 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb:2.5 }}>
                      <Avatar sx={{ bgcolor:'#e8f5e9', width:40, height:40 }}>
                        <Info sx={{ color:'#2e7d32', fontSize:22 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={700} color="#1a1a2e">Employee Information</Typography>
                        <Typography variant="caption" color="text.secondary">Breakdown by role across the organization</Typography>
                      </Box>
                      <Chip label={`${employees.length} Total`} size="small" sx={{ ml:'auto', bgcolor:'#e8f5e9', color:'#2e7d32', fontWeight:700 }} />
                    </Stack>
                    <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
                      <Box sx={{ minWidth:150, flex:'0 0 auto', borderRadius:3, p:2.5, background:'linear-gradient(135deg,#2e7d32 0%,#43a047 100%)', boxShadow:'0 6px 20px rgba(46,125,50,0.3)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', transition:'transform 0.2s', '&:hover':{ transform:'translateY(-4px)' } }}>
                        <Typography variant="h3" fontWeight={800} color="#fff">{employees.length}</Typography>
                        <Typography variant="body2" sx={{ color:'rgba(255,255,255,0.85)', fontWeight:600, mt:0.5 }}>Total Employees</Typography>
                      </Box>
                      {jobTitleStats.map(([jobTitle, count], index) => {
                        const p = palettes[index % palettes.length];
                        return (
                          <Box key={jobTitle} sx={{ minWidth:140, flex:'0 0 auto', borderRadius:3, p:2, bgcolor:p.bg, border:`1.5px solid ${p.accent}22`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'transform 0.2s,box-shadow 0.2s', '&:hover':{ transform:'translateY(-4px)', boxShadow:`0 8px 24px ${p.accent}33` } }}>
                            <Typography variant="h4" fontWeight={800} sx={{ color:p.accent }}>{count}</Typography>
                            <Typography variant="caption" sx={{ color:p.accent, fontWeight:600, textAlign:'center', lineHeight:1.3, mt:0.5, opacity:0.85 }}>{jobTitle}</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Fade>
                <Divider sx={{ my:3, borderColor:'rgba(0,0,0,0.06)' }} />
                <Fade in timeout={800}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb:2.5 }}>
                      <Avatar sx={{ bgcolor:'#e3f2fd', width:40, height:40 }}>
                        <LocationOn sx={{ color:'#1565c0', fontSize:22 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={700} color="#1a1a2e">Customer Information</Typography>
                        <Typography variant="caption" color="text.secondary">Administrative coverage and facility network</Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
                      {[
                        { label:'Regions',    value:regions.length,    bg:'#fce4ec', accent:'#c62828', icon:<Public sx={{ fontSize:28, color:'#c62828' }} /> },
                        { label:'Zones',      value:zones.length,      bg:'#fff3e0', accent:'#e65100', icon:<Map sx={{ fontSize:28, color:'#e65100' }} /> },
                        { label:'Woredas',    value:woredas.length,    bg:'#f3e5f5', accent:'#6a1b9a', icon:<LocationCity sx={{ fontSize:28, color:'#6a1b9a' }} /> },
                        { label:'Facilities', value:facilities.length, bg:'#e0f7fa', accent:'#00695c', icon:<Domain sx={{ fontSize:28, color:'#00695c' }} /> },
                      ].map(({ label, value, bg, accent, icon }) => (
                        <Box key={label} sx={{ minWidth:160, flex:'1 1 160px', maxWidth:220, borderRadius:3, p:2.5, bgcolor:bg, border:`1.5px solid ${accent}22`, display:'flex', alignItems:'center', gap:2, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'transform 0.2s,box-shadow 0.2s', '&:hover':{ transform:'translateY(-4px)', boxShadow:`0 8px 24px ${accent}33` } }}>
                          <Avatar sx={{ bgcolor:'#fff', width:48, height:48, boxShadow:`0 2px 8px ${accent}33` }}>{icon}</Avatar>
                          <Box>
                            <Typography variant="h4" fontWeight={800} sx={{ color:accent, lineHeight:1 }}>{value}</Typography>
                            <Typography variant="body2" sx={{ color:accent, fontWeight:600, opacity:0.8, mt:0.3 }}>{label}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Fade>
              </Box>
            )}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb:3 }}>Regions</Typography>
                <TableContainer component={Paper} className="info-card">
                  <Table>
                    <TableHead><TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Code</strong></TableCell>
                      <TableCell><strong>Zones</strong></TableCell>
                      <TableCell><strong>Facilities</strong></TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {regions.map(r => (
                        <TableRow key={r.id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.code}</TableCell>
                          <TableCell><Chip label={zones.filter(z => z.regionId === r.id).length} color="primary" size="small" /></TableCell>
                          <TableCell><Chip label={facilities.filter(f => f.region_name === r.name).length} color="secondary" size="small" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb:3 }}>Zones</Typography>
                <TableContainer component={Paper} className="info-card">
                  <Table>
                    <TableHead><TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Region</strong></TableCell>
                      <TableCell><strong>Woredas</strong></TableCell>
                      <TableCell><strong>Facilities</strong></TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {zones.map(z => (
                        <TableRow key={z.id}>
                          <TableCell>{z.name}</TableCell>
                          <TableCell>{getRegionName(z.regionId)}</TableCell>
                          <TableCell><Chip label={woredas.filter(w => w.zoneId === z.id).length} color="primary" size="small" /></TableCell>
                          <TableCell><Chip label={facilities.filter(f => f.zone_name === z.name).length} color="secondary" size="small" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            {activeTab === 3 && (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb:2 }}>
                  <Typography variant="h5" fontWeight="bold">Woredas</Typography>
                  <TextField size="small" placeholder="Search woredas..." value={woredasSearch}
                    onChange={e => { setWoredasSearch(e.target.value); setWoredasPage(0); }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                </Stack>
                <TableContainer component={Paper} className="info-card">
                  <Table>
                    <TableHead><TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Zone</strong></TableCell>
                      <TableCell><strong>Facilities</strong></TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {paginatedWoredas.map(w => (
                        <TableRow key={w.id}>
                          <TableCell>{w.name}</TableCell>
                          <TableCell>{getZoneName(w.zoneId)}</TableCell>
                          <TableCell><Chip label={facilities.filter(f => f.woreda_name === w.name).length} color="secondary" size="small" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination component="div" count={filteredWoredas.length} page={woredasPage}
                    onPageChange={(_, p) => setWoredasPage(p)} rowsPerPage={woredasRowsPerPage}
                    onRowsPerPageChange={e => { setWoredasRowsPerPage(parseInt(e.target.value,10)); setWoredasPage(0); }}
                    rowsPerPageOptions={[5,10,25,50]} />
                </TableContainer>
              </Box>
            )}
            {activeTab === 4 && (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb:2 }}>
                  <Typography variant="h5" fontWeight="bold">Facilities</Typography>
                  <TextField size="small" placeholder="Search facilities..." value={facilitiesSearch}
                    onChange={e => { setFacilitiesSearch(e.target.value); setFacilitiesPage(0); }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                </Stack>
                <TableContainer component={Paper} className="info-card">
                  <Table>
                    <TableHead><TableRow>
                      <TableCell><strong>Facility Name</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Woreda</strong></TableCell>
                      <TableCell><strong>Zone</strong></TableCell>
                      <TableCell><strong>Region</strong></TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {paginatedFacilities.map(f => (
                        <TableRow key={f.id}>
                          <TableCell>{f.facility_name}</TableCell>
                          <TableCell><Chip label={f.facility_type||'N/A'} size="small" color={f.facility_type==='Hospital'?'primary':'secondary'} /></TableCell>
                          <TableCell>{f.woreda_name||'N/A'}</TableCell>
                          <TableCell>{f.zone_name||'N/A'}</TableCell>
                          <TableCell>{f.region_name||'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination component="div" count={filteredFacilities.length} page={facilitiesPage}
                    onPageChange={(_, p) => setFacilitiesPage(p)} rowsPerPage={facilitiesRowsPerPage}
                    onRowsPerPageChange={e => { setFacilitiesRowsPerPage(parseInt(e.target.value,10)); setFacilitiesPage(0); }}
                    rowsPerPageOptions={[5,10,25,50]} />
                </TableContainer>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default OrganizationProfileView;
