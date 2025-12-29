import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Chip, IconButton, Box, TextField, InputAdornment, Card,
  Button, MenuItem, Container, TablePagination, Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import axios from 'axios';

const HpFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtering States
  const [filterPeriod, setFilterPeriod] = useState("All");
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterZone, setFilterZone] = useState("All");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchAssignedFacilities = async () => {
      try {
        const res = await axios.get(`${api_url}/api/facilities`);
        console.log("Raw API Response:", res.data); // DEBUG: See what the API sends
        // Ensure we only show facilities that HAVE a route and period assigned
        // We use .trim() and length check to be safe
        const assigned = (res.data || []).filter(f => 
          f.route && f.route.toString().trim().length > 0 && 
          f.period && f.period.toString().trim().length > 0
        );
        console.log("Filtered Assigned Facilities:", assigned); // DEBUG: See what remains
        setFacilities(assigned);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    const fetchAll = async () => {
      await fetchAssignedFacilities();
      // fetch active processes and mark facilities that already started
      try {
        const p = await axios.get(`${api_url}/api/active-processes`);
        const active = p.data || [];
        setFacilities(prev => prev.map(f => {
          const proc = active.find(a => a.facility_id === f.id);
          if (proc) return { ...f, o2c_officer_name: proc.o2c_officer || proc.o2c_officer_name, started_process_id: proc.id };
          return f;
        }));
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
      const payload = {
        facility_id: facilityId,
        service_point: "o2c",
        status: "o2c_started",
        userId: userId ? parseInt(userId, 10) : undefined,
      };
      const res = await axios.post(`${api_url}/api/start-process`, payload);
      if (res.status === 201 || res.status === 200) {
        const pid = res.data && (res.data.process_id || res.data.id);
        const officer = res.data && (res.data.officerName || (res.data.data && res.data.data.o2c_officer));
        // Update facilities state to reflect officer on the clicked facility row
        setFacilities(prev => prev.map(f => f.id === facilityId ? { ...f, o2c_officer_name: officer, started_process_id: pid } : f));
        alert(`Process Started Successfully! Process ID: ${pid}${officer ? ' — Officer: ' + officer : ''}`);
      }
    } catch (err) {
      console.error('startProcess error response:', err.response ? err.response.data : err.message);
      const serverMsg = err.response && err.response.data && err.response.data.error;
      alert(`Error starting process: ${serverMsg || 'Check backend console.'}`);
    }
  };

  // --- FILTER LOGIC ---
  const filteredData = facilities.filter(f => {
    const nameMatch = (f.facility_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const routeMatch = (f.route || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || routeMatch;

    const matchesPeriod = filterPeriod === "All" || f.period === filterPeriod;
    const matchesRegion = filterRegion === "All" || f.region_name === filterRegion;
    const matchesZone = filterZone === "All" || f.zone_name === filterZone;

    return matchesSearch && matchesPeriod && matchesRegion && matchesZone;
  });

  // Extract unique values for dropdowns
  const regions = ["All", ...new Set(facilities.map(f => f.region_name).filter(Boolean))];
  const zones = ["All", ...new Set(facilities.map(f => f.zone_name).filter(Boolean))];

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
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
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
                    <Typography variant="body2">{f.region_name}, {f.zone_name}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {f.o2c_officer_name ? (
                      <Chip label={f.o2c_officer_name} size="small" sx={{ bgcolor: '#f0f0f0', fontWeight: 400 }} />
                    ) : (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => handleStartProcess(f.id)}
                        disabled={!(f.route && f.period)}
                      >
                        Start
                      </Button>
                    )}
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