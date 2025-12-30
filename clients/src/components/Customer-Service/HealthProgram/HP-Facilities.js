import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Chip, IconButton, Box, TextField, InputAdornment, Card,
  Button, MenuItem, Container, TablePagination, Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UndoIcon from '@mui/icons-material/Undo';
import axios from 'axios';
import Swal from 'sweetalert2';

const HpFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Ethiopian months helper
  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];

  const getCurrentEthiopianMonth = (gDate = new Date()) => {
    const gy = gDate.getFullYear();
    const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
    const newYear = new Date(gy, 8, isLeap ? 12 : 11); // Sep 12 on Gregorian leap years, else Sep 11
    let ethYear;
    let diffDays;
    if (gDate >= newYear) {
      ethYear = gy - 7;
      diffDays = Math.floor((gDate - newYear) / (24 * 60 * 60 * 1000));
    } else {
      const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
      const prevNewYear = new Date(gy - 1, 8, prevIsLeap ? 12 : 11);
      ethYear = gy - 8;
      diffDays = Math.floor((gDate - prevNewYear) / (24 * 60 * 60 * 1000));
    }
    const monthIndex = Math.floor(diffDays / 30); // 0..12
    const monthIdxBounded = Math.max(0, Math.min(monthIndex, ethiopianMonths.length - 1));
    const monthName = ethiopianMonths[monthIdxBounded];
    return { year: ethYear, monthIndex: monthIdxBounded, monthName };
  };

  // Filtering States
  const initialEth = getCurrentEthiopianMonth();
  const [filterPeriod, setFilterPeriod] = useState("All");
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterZone, setFilterZone] = useState("All");

  // Selected reporting month/year (separate dropdowns)
  const [selectedYear, setSelectedYear] = useState(initialEth.year);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(initialEth.monthIndex);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeProcesses, setActiveProcesses] = useState([]);

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchAssignedFacilities = async () => {
      try {
        const res = await axios.get(`${api_url}/api/facilities`);
        console.log("Raw API Response:", res.data); // DEBUG: See what the API sends
        // Ensure we only show facilities that HAVE a route assigned
        // We use .trim() and length check to be safe
        const assigned = (res.data || []).filter(f => 
          f.route && f.route.toString().trim().length > 0
        );
        console.log("Filtered Assigned Facilities:", assigned); // DEBUG: See what remains
        setFacilities(assigned);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    const fetchAll = async () => {
      await fetchAssignedFacilities();
      // fetch active processes and keep in state for month-aware display
      try {
        const p = await axios.get(`${api_url}/api/active-processes`);
        const active = p.data || [];
        setActiveProcesses(active);
      } catch (err) {
        console.error('fetch active processes error:', err);
      }
    };
    fetchAll();
  }, [api_url]);

  // --- START PROCESS LOGIC ---
  const handleStartProcess = async (facilityId) => {
    try {
      const userId = localStorage.getItem('UserId');
      const reportingMonthStr = `${ethiopianMonths[selectedMonthIndex]} ${selectedYear}`;
      const payload = {
        facility_id: facilityId,
        service_point: "o2c",
        status: "o2c_started",
        userId: userId ? parseInt(userId, 10) : undefined,
        reporting_month: reportingMonthStr,
      };
      const res = await axios.post(`${api_url}/api/start-process`, payload);
      if (res.status === 201 || res.status === 200) {
        const pid = res.data && (res.data.process_id || res.data.id);
        const officer = res.data && (res.data.officerName || (res.data.data && res.data.data.o2c_officer_name || res.data.data && res.data.data.o2c_officer));
        // Update facilities state to reflect officer on the clicked facility row
        setFacilities(prev => prev.map(f => f.id === facilityId ? { ...f, o2c_officer_name: officer, started_process_id: pid, reporting_month: reportingMonthStr } : f));
        // add to activeProcesses so UI shows officer for this reporting month
        setActiveProcesses(prev => ([...prev, { id: pid, facility_id: facilityId, o2c_officer_name: officer, reporting_month: reportingMonthStr }]));
        Swal.fire({
          icon: 'success',
          title: 'Process Started',
          text: `Process ID: ${pid}${officer ? ' — Officer: ' + officer : ''}`,
        });
      }
    } catch (err) {
      console.error('startProcess error response:', err.response ? err.response.data : err.message);
      const serverMsg = err.response && err.response.data && err.response.data.error;
      Swal.fire({
        icon: 'error',
        title: 'Error starting process',
        text: serverMsg || 'Check backend console.',
      });
    }
  };

  // Remove a process from activeProcesses (client-side). If you have
  // a backend endpoint to revert/delete a process, call it here.
  const handleRevertProcess = async (processId) => {
    // ask confirmation
    const result = await Swal.fire({
      title: 'Revert process?',
      text: 'This will remove the process from the active list.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, revert',
    });
    if (!result.isConfirmed) return;

    // Call backend to delete process
    try {
      await axios.delete(`${api_url}/api/process/${processId}`);
      setActiveProcesses(prev => prev.filter(p => p.id !== processId));
      Swal.fire({ icon: 'success', title: 'Reverted' });
    } catch (err) {
      console.error('revert API error:', err.response ? err.response.data : err.message);
      Swal.fire({ icon: 'error', title: 'Could not revert', text: err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Server error' });
    }
  };

  // --- FILTER LOGIC ---
  const filteredData = facilities.filter(f => {
    const nameMatch = (f.facility_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const routeMatch = (f.route || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || routeMatch;
    // Always show all facilities (do not filter out by reporting month)
    const matchesMonth = true;
    const matchesRegion = filterRegion === "All" || f.region_name === filterRegion;
    const matchesZone = filterZone === "All" || f.zone_name === filterZone;

    return matchesSearch && matchesMonth && matchesRegion && matchesZone;
  });

  // Extract unique values for dropdowns
  const regions = ["All", ...new Set(facilities.map(f => f.region_name).filter(Boolean))];
  const zones = ["All", ...new Set(facilities.map(f => f.zone_name).filter(Boolean))];
  // years for selector: previous two years and current year
  const years = [initialEth.year, initialEth.year - 1, initialEth.year - 2];
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Operational Facilities (Hp-Facilities)</Typography>
      
      {/* Search & Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField 
            placeholder="Search Facility/Route..." 
            size="small" 
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} color="disabled" /> }}
          />
          <TextField select label="Region" size="small" sx={{ minWidth: 150 }} value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
            {regions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <TextField select label="Zone" size="small" sx={{ minWidth: 150 }} value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
            {zones.map(z => <MenuItem key={z} value={z}>{z}</MenuItem>)}
          </TextField>
          <TextField select label="Period" size="small" sx={{ minWidth: 150 }} value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
            <MenuItem value="All">All Periods</MenuItem>
            <MenuItem value="Odd">Odd</MenuItem>
            <MenuItem value="Even">Even</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
          </TextField>
          <TextField select label="Year" size="small" sx={{ minWidth: 140 }} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}>
            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </TextField>
          <TextField select label="Month" size="small" sx={{ minWidth: 180 }} value={selectedMonthIndex} onChange={(e) => setSelectedMonthIndex(parseInt(e.target.value, 10))}>
            {ethiopianMonths.map((m, idx) => {
              // disable future months relative to current Ethiopian year/month
              const isFuture = (selectedYear > initialEth.year) || (selectedYear === initialEth.year && idx > initialEth.monthIndex);
              return <MenuItem key={m} value={idx} disabled={isFuture}>{m}</MenuItem>;
            })}
          </TextField>
        </Stack>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Facility Name</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((f, index) => (
                <TableRow key={f.id} hover>
                  <TableCell>{(page * rowsPerPage) + index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" sx={{ fontWeight: 400, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {f.facility_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {f.route && f.route.toString().length > 0 ? (
                      <Typography>{f.route}</Typography>
                    ) : (
                      <Typography color="error">Unassigned</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {f.period && f.period.toString().length > 0 ? (
                      <Chip label={f.period} size="small" color="primary" variant="outlined" />
                    ) : (
                      <Chip label="Unassigned" size="small" color="error" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{f.region_name}{f.region_name && f.zone_name ? ', ' : ''}{f.zone_name}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      const selReporting = `${ethiopianMonths[selectedMonthIndex]} ${selectedYear}`;
                      const proc = activeProcesses.find(a => a.facility_id === f.id && a.reporting_month === selReporting);
                      if (proc && proc.o2c_officer_name) {
                        const name = proc.o2c_officer_name;
                        return (
                          <Stack spacing={1} alignItems="center">
                            <Typography variant="body2">{name}</Typography>
                            <IconButton size="small" color="warning" onClick={() => handleRevertProcess(proc.id)}>
                              <UndoIcon />
                            </IconButton>
                          </Stack>
                        );
                      }
                      return (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleStartProcess(f.id)}
                          disabled={!f.route}
                        >
                          Start
                        </Button>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                   <Typography color="textSecondary">No assigned facilities found. Ensure Route and Period are set in the Manager.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination 
          rowsPerPageOptions={[10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
        />
      </TableContainer>
    </Container>
  );
};

export default HpFacilities;