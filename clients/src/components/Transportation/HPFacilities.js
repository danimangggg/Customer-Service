import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Chip, IconButton, Box, TextField, InputAdornment, Card,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, 
  Container, TablePagination, FormControl, InputLabel, Select, Stack,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FilterListIcon from '@mui/icons-material/FilterList';
import RouteIcon from '@mui/icons-material/Route';
import axios from 'axios';

const HPFacilities = () => {
  // --- STATE MANAGEMENT ---
  const [facilities, setFacilities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHP, setFilterHP] = useState(""); // Filter for HP facilities
  const [filterRoute, setFilterRoute] = useState(""); // Filter by route
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openEdit, setOpenEdit] = useState(false);
  
  // Value Taker State
  const [selectedFacility, setSelectedFacility] = useState({ 
    id: '', 
    facility_name: '', 
    route: '', 
    period: '' 
  });

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // --- DATA FETCHING ---
  const fetchFacilities = async () => {
    try {
      const res = await axios.get(`${api_url}/api/facilities`);
      setFacilities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await axios.get(`${api_url}/api/routes`);
      setRoutes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Routes fetch error:", err);
    }
  };

  useEffect(() => {
    fetchFacilities();
    fetchRoutes();
  }, []);

  // --- EDIT LOGIC ---
  const handleEditOpen = (f) => {
    setSelectedFacility({
      id: f.id,
      facility_name: f.facility_name,
      route: f.route || '', 
      period: f.period || ''
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    try {
      // Find the selected route name for display
      const selectedRoute = routes.find(r => r.route_name === selectedFacility.route);
      
      const res = await axios.put(`${api_url}/api/update-facilities/${selectedFacility.id}`, {
        route: selectedFacility.route,
        period: selectedFacility.period
      });
      
      if (res.status === 200) {
        setOpenEdit(false);
        fetchFacilities(); // Refresh table
      }
    } catch (err) {
      console.error("Save failed:", err.response?.data || err.message);
      alert("Error saving data. Check console for details.");
    }
  };

  // --- SEARCH AND FILTER ---
  const filtered = facilities.filter(f => {
    const matchesSearch = f.facility_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.route?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterHP === "" || 
                         (filterHP === "HP" && f.route && f.period) ||
                         (filterHP === "Non-HP" && (!f.route || !f.period));
    
    const matchesRoute = filterRoute === "" || f.route === filterRoute;
    
    return matchesSearch && matchesFilter && matchesRoute;
  });

  // Check if facility is HP (has both route and period)
  const isHPFacility = (facility) => {
    return facility.route && facility.period;
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeInUp 0.6s ease-out;
          }
          .hp-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .hp-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white;
            padding: 32px;
            border-radius: 16px 16px 0 0;
            position: relative;
            overflow: hidden;
          }
          .header-gradient::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            pointer-events: none;
          }
        `}
      </style>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Card className="hp-card animate-fade-in" elevation={0}>
          {/* Header */}
          <Box className="header-gradient">
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={3}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  width: 64, 
                  height: 64,
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  <LocalHospitalIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h3" fontWeight="bold" sx={{ 
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    mb: 1
                  }}>
                    Set Health Program Facilities
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    opacity: 0.9, 
                    fontWeight: 300,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    Manage HP facility routes and periods
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          {/* Filters and Search */}
          <Box sx={{ p: 4, pb: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
              {/* HP Filter */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter HP Facilities</InputLabel>
                <Select
                  value={filterHP}
                  label="Filter HP Facilities"
                  onChange={(e) => {setFilterHP(e.target.value); setPage(0);}}
                  startAdornment={<FilterListIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="">All Facilities</MenuItem>
                  <MenuItem value="HP">HP Facilities Only</MenuItem>
                  <MenuItem value="Non-HP">Non-HP Facilities</MenuItem>
                </Select>
              </FormControl>

              {/* Route Filter */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Route</InputLabel>
                <Select
                  value={filterRoute}
                  label="Filter by Route"
                  onChange={(e) => {setFilterRoute(e.target.value); setPage(0);}}
                  startAdornment={<RouteIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="">All Routes</MenuItem>
                  {routes.map(route => (
                    <MenuItem key={route.id} value={route.route_name}>
                      {route.route_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Search */}
              <TextField 
                size="medium" 
                placeholder="Search facility name or route..." 
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setPage(0);}}
                sx={{ flexGrow: 1, maxWidth: 400 }}
                InputProps={{ 
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Stack>

            {/* Professional Table Section */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table stickyHeader>
                <TableHead sx={{ 
                  bgcolor: '#4caf50',
                  '& .MuiTableCell-head': {
                    backgroundColor: '#4caf50',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    borderBottom: '2px solid #ffffff'
                  }
                }}>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Facility Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((f, index) => (
                    <TableRow key={f.id} hover>
                      {/* Row Number */}
                      <TableCell>{(page * rowsPerPage) + index + 1}</TableCell>
                      
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocalHospitalIcon fontSize="small" color={isHPFacility(f) ? "success" : "disabled"} />
                          <Typography fontWeight="600">{f.facility_name}</Typography>
                        </Stack>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">{f.region_name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {f.zone_name} • {f.woreda_name}
                        </Typography>
                      </TableCell>

                      {/* Route Column */}
                      <TableCell>
                        {f.route ? (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <RouteIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight="bold">
                              {f.route}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">---</Typography>
                        )}
                      </TableCell>

                      {/* Period Column */}
                      <TableCell>
                        {f.period ? (
                          <Chip 
                            label={f.period} 
                            color={f.period === 'Odd' ? 'primary' : f.period === 'Even' ? 'secondary' : 'success'} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">---</Typography>
                        )}
                      </TableCell>

                      {/* HP Status */}
                      <TableCell>
                        <Chip
                          label={isHPFacility(f) ? "HP" : "Regular"}
                          color={isHPFacility(f) ? "success" : "default"}
                          size="small"
                          variant={isHPFacility(f) ? "filled" : "outlined"}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <IconButton 
                          onClick={() => handleEditOpen(f)} 
                          color="primary" 
                          size="small" 
                          title="Edit Facility"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <TablePagination 
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filtered.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              />
            </TableContainer>
          </Box>
        </Card>

        {/* --- EDIT MODAL --- */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <LocalHospitalIcon color="success" />
              <Typography variant="h6">Update HP Facility</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Editing: <strong>{selectedFacility.facility_name}</strong>
            </Typography>
            
            <TextField
              select
              label="Route"
              fullWidth
              value={selectedFacility.route}
              onChange={(e) => setSelectedFacility({...selectedFacility, route: e.target.value})}
              helperText="Select route to mark as HP facility"
            >
              <MenuItem value="">
                <Typography color="text.secondary">No route selected</Typography>
              </MenuItem>
              {routes.map((route) => (
                <MenuItem key={route.id} value={route.route_name}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <RouteIcon fontSize="small" color="primary" />
                    <Typography>{route.route_name}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Period"
              fullWidth
              value={selectedFacility.period}
              onChange={(e) => setSelectedFacility({...selectedFacility, period: e.target.value})}
              helperText="Select period to complete HP facility setup"
            >
              <MenuItem value="Odd">Odd</MenuItem>
              <MenuItem value="Even">Even</MenuItem>
              <MenuItem value="Monthly">Monthly</MenuItem>
            </TextField>

            {selectedFacility.route && selectedFacility.period && (
              <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="body2" color="success.dark">
                  ✓ This facility will be marked as HP (Health Program) facility
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
            <Button onClick={() => setOpenEdit(false)} color="inherit">Cancel</Button>
            <Button onClick={handleUpdate} variant="contained" color="success">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default HPFacilities;