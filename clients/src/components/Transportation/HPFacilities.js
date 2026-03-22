import React, { useState, useEffect, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Chip, IconButton, Box, TextField, InputAdornment, Card,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, 
  Container, TablePagination, FormControl, InputLabel, Select, Stack,
  Avatar, FormControlLabel, Checkbox, CircularProgress
} from '@mui/material';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FilterListIcon from '@mui/icons-material/FilterList';
import RouteIcon from '@mui/icons-material/Route';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import * as XLSX from 'xlsx';
import axios from 'axios';
import api from '../../axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const HPFacilities = () => {
  // --- STATE MANAGEMENT ---
  const [facilities, setFacilities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHP, setFilterHP] = useState(""); // Filter for HP facilities
  const [filterRoute, setFilterRoute] = useState(""); // Filter by route
  const [filterPeriod, setFilterPeriod] = useState(""); // Filter by period
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openEdit, setOpenEdit] = useState(false);
  const [importing, setImporting] = useState(false);
  const importRef = useRef();
  
  // Value Taker State
  const [selectedFacility, setSelectedFacility] = useState({ 
    id: '', 
    facility_name: '', 
    route: '', 
    period: '',
    is_vaccine_site: false,
    is_hp_site: false,
    branch_code: localStorage.getItem('branch_code') || ''
  });

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // --- DATA FETCHING ---
  const fetchFacilities = async () => {
    try {
      const res = await api.get(`${api_url}/api/facilities`);
      setFacilities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const fetchRoutes = async () => {
    try {
      console.log('Fetching routes from:', `${api_url}/api/routes`);
      const res = await api.get(`${api_url}/api/routes`);
      console.log('Routes response:', res.data);
      setRoutes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Routes fetch error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      // Show user-friendly error message
      let errorMessage = '';
      if (err.response?.status === 500) {
        errorMessage = "Failed to load route data. Please check if the database is running and try again.";
      } else if (err.response?.status === 404) {
        errorMessage = "Route API endpoint not found. Please contact system administrator.";
      } else {
        errorMessage = `Failed to load route data: ${err.message}`;
      }
      
      await MySwal.fire({
        title: 'Error Loading Routes',
        html: `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
              🛣️
            </div>
            <p style="font-size: 18px; color: #333;">
              ${errorMessage}
            </p>
          </div>
        `,
        icon: 'error',
        confirmButtonColor: '#f44336',
        confirmButtonText: 'OK'
      });
    }
  };

  useEffect(() => {
    fetchFacilities();
    fetchRoutes();
  }, []);

  // --- EDIT LOGIC ---
  const handleEditOpen = (f) => {
    const isHp = !!f.is_hp_site;
    const isVaccine = !!f.is_vaccine_site;
    // Default period to Monthly if only vaccine (no HP) and no period set
    const period = f.period || (!isHp && isVaccine ? 'Monthly' : '');
    setSelectedFacility({
      id: f.id,
      facility_name: f.facility_name,
      route: f.route || '',
      period,
      is_vaccine_site: isVaccine,
      is_hp_site: isHp,
      branch_code: f.branch_code || ''
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    // Validate: HP site requires a period
    if (selectedFacility.is_hp_site && !selectedFacility.period) {
      await MySwal.fire({
        title: 'Period Required',
        text: 'Please select a period (Odd, Even, or Monthly) for HP Site facilities.',
        icon: 'warning',
        confirmButtonColor: '#4caf50',
      });
      return;
    }
    try {
      const isHpOrVaccine = selectedFacility.is_hp_site || selectedFacility.is_vaccine_site;
      const res = await axios.put(`${api_url}/api/update-facilities/${selectedFacility.id}`, {
        route: selectedFacility.route,
        period: isHpOrVaccine ? selectedFacility.period : null,
        is_vaccine_site: selectedFacility.is_vaccine_site ? 1 : 0,
        is_hp_site: selectedFacility.is_hp_site ? 1 : 0,
        branch_code: selectedFacility.branch_code || null
      });
      
      if (res.status === 200) {
        setOpenEdit(false);
        fetchFacilities(); // Refresh table
        
        // Success message
        await MySwal.fire({
          title: 'Updated!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #4caf50; margin-bottom: 20px;">
                🏥
              </div>
              <p style="font-size: 18px; color: #333;">
                Facility <strong>"${selectedFacility.facility_name}"</strong> has been successfully updated.
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#4caf50',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
      }
    } catch (err) {
      console.error("Save failed:", err.response?.data || err.message);
      
      // Error message
      await MySwal.fire({
        title: 'Error!',
        html: `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
              ❌
            </div>
            <p style="font-size: 18px; color: #333;">
              Error saving data. Please check console for details.
            </p>
          </div>
        `,
        icon: 'error',
        confirmButtonColor: '#f44336',
        confirmButtonText: 'OK'
      });
    }
  };

  // --- EXCEL TEMPLATE DOWNLOAD ---
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        customer_id: 'HC001',
        facility_name: 'Example Health Center',
        facility_type: 'Health Center',
        region_name: 'Addis Ababa',
        zone_name: 'Zone 1',
        woreda_name: 'Woreda 1',
        route: 'Route A',
        period: 'Odd',
        is_hp_site: 1,
        is_vaccine_site: 0
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Facilities');
    XLSX.writeFile(wb, 'facilities_template.xlsx');
  };

  // --- EXCEL IMPORT ---
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      if (rows.length === 0) {
        MySwal.fire('Empty File', 'No rows found in the Excel file.', 'warning');
        return;
      }
      const res = await api.post(`${api_url}/api/facilities/bulk-import`, rows);
      const { created, updated, skipped = [], errors } = res.data;
      await MySwal.fire({
        title: 'Import Complete',
        html: `
          <div style="text-align:center;padding:10px">
            <p>✅ Created: <strong>${created}</strong></p>
            <p>🔄 Updated: <strong>${updated}</strong></p>
            ${skipped.length > 0 ? `<p>⏭️ Skipped (already exist): <strong>${skipped.length}</strong></p>
              <div style="max-height:120px;overflow-y:auto;text-align:left;font-size:11px;background:#f9f9f9;padding:6px;border-radius:4px">
                ${skipped.map(s => `<div>${s.customer_id} — ${s.facility_name}</div>`).join('')}
              </div>` : ''}
            ${errors.length > 0 ? `<p>❌ Errors: <strong>${errors.length}</strong></p><p style="font-size:12px;color:red">${errors[0]?.message || ''}</p>` : ''}
          </div>
        `,
        icon: errors.length > 0 ? 'warning' : 'success',
        confirmButtonColor: '#4caf50',
      });
      fetchFacilities();
    } catch (err) {
      MySwal.fire('Error', err.response?.data?.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  // --- SEARCH AND FILTER ---
  const filtered = facilities.filter(f => {
    const matchesSearch = f.facility_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.route?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterHP === "" || 
                         (filterHP === "HP" && f.is_hp_site) ||
                         (filterHP === "Vaccine" && f.is_vaccine_site) ||
                         (filterHP === "None" && !f.is_hp_site && !f.is_vaccine_site);
    
    const matchesRoute = filterRoute === "" || f.route === filterRoute;
    const matchesPeriod = filterPeriod === "" || f.period === filterPeriod;
    
    return matchesSearch && matchesFilter && matchesRoute && matchesPeriod;
  });

  return (
    <>
      <style>
        {`
          .swal2-container {
            z-index: 99999 !important;
          }
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
            background: #f5f5f5;
            color: #333;
            border-bottom: 1px solid #e0e0e0;
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
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                  sx={{ borderRadius: 2 }}
                >
                  Template
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="success"
                  startIcon={importing ? <CircularProgress size={16} /> : <UploadIcon />}
                  onClick={() => importRef.current.click()}
                  disabled={importing}
                  sx={{ borderRadius: 2 }}
                >
                  Import Excel
                </Button>
                <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportExcel} />
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
                  <MenuItem value="HP">HP Sites Only</MenuItem>
                  <MenuItem value="Vaccine">Vaccine Sites Only</MenuItem>
                  <MenuItem value="None">Unassigned</MenuItem>
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

              {/* Period Filter */}
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={filterPeriod}
                  label="Period"
                  onChange={(e) => {setFilterPeriod(e.target.value); setPage(0);}}
                >
                  <MenuItem value="">All Periods</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="Odd">Odd</MenuItem>
                  <MenuItem value="Even">Even</MenuItem>
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
                          <LocalHospitalIcon fontSize="small" color={f.is_hp_site ? "success" : f.is_vaccine_site ? "secondary" : "disabled"} />
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
                            <Typography variant="body2" fontWeight="bold">{f.route}</Typography>
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

                      {/* Status */}
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {f.is_hp_site ? (
                            <Chip
                              icon={<LocalHospitalIcon fontSize="small" />}
                              label="HP Site"
                              color="success"
                              size="small"
                            />
                          ) : null}
                          {f.is_vaccine_site ? (
                            <Chip
                              icon={<VaccinesIcon fontSize="small" />}
                              label="Vaccine"
                              color="secondary"
                              size="small"
                            />
                          ) : null}
                          {!f.is_hp_site && !f.is_vaccine_site ? (
                            <Chip label="Unassigned" color="default" size="small" variant="outlined" />
                          ) : null}
                        </Stack>
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

            {/* Checkboxes on top */}
            <Stack direction="row" spacing={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFacility.is_hp_site}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedFacility(prev => ({
                        ...prev,
                        is_hp_site: checked,
                        // if only vaccine remains, force Monthly
                        period: !checked && prev.is_vaccine_site ? 'Monthly' : prev.period
                      }));
                    }}
                    color="success"
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <LocalHospitalIcon fontSize="small" color="success" />
                    <Typography variant="body2" fontWeight="bold">HP Site</Typography>
                  </Stack>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFacility.is_vaccine_site}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedFacility(prev => ({
                        ...prev,
                        is_vaccine_site: checked,
                        // if only vaccine selected (no HP), default period to Monthly
                        period: checked && !prev.is_hp_site ? 'Monthly' : prev.period
                      }));
                    }}
                    color="secondary"
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <VaccinesIcon fontSize="small" color="secondary" />
                    <Typography variant="body2" fontWeight="bold">Vaccine Site</Typography>
                  </Stack>
                }
              />
            </Stack>

            <TextField
              select
              label="Route"
              fullWidth
              value={selectedFacility.route}
              onChange={(e) => setSelectedFacility({...selectedFacility, route: e.target.value})}
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

            {/* Period — required when HP is checked, locked to Monthly when only Vaccine */}
            <TextField
              select
              label="Period"
              fullWidth
              required={selectedFacility.is_hp_site}
              disabled={!selectedFacility.is_hp_site && selectedFacility.is_vaccine_site}
              value={selectedFacility.period}
              onChange={(e) => setSelectedFacility({...selectedFacility, period: e.target.value})}
              helperText={
                selectedFacility.is_hp_site
                  ? 'Required for HP Site'
                  : selectedFacility.is_vaccine_site
                  ? 'Vaccine sites are always Monthly'
                  : 'Select period'
              }
            >
              <MenuItem value="Odd">Odd</MenuItem>
              <MenuItem value="Even">Even</MenuItem>
              <MenuItem value="Monthly">Monthly</MenuItem>
            </TextField>

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