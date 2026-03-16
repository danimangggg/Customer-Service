import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Chip, IconButton, Box, TextField, InputAdornment, Card,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, 
  Container, TablePagination, FormControlLabel, Checkbox
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const FacilityManager = () => {
  // --- STATE MANAGEMENT ---
  const [facilities, setFacilities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openEdit, setOpenEdit] = useState(false);
  
  // Value Taker State
  const [selectedFacility, setSelectedFacility] = useState({ 
    id: '', 
    facility_name: '', 
    route: '', 
    route2: '',
    period: '',
    is_vaccine_site: false
  });

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // --- DATA FETCHING ---
  const fetchFacilities = async () => {
    try {
      const [facRes, routesRes] = await Promise.all([
        axios.get(`${api_url}/api/facilities`),
        axios.get(`${api_url}/api/routes`)
      ]);
      setFacilities(Array.isArray(facRes.data) ? facRes.data : []);
      setRoutes(routesRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  // --- EDIT LOGIC ---
  const handleEditOpen = (f) => {
    setSelectedFacility({
      id: f.id,
      facility_name: f.facility_name,
      route: f.route || '', 
      route2: f.route2 || '',
      period: f.period || '',
      is_vaccine_site: !!f.is_vaccine_site
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        route: selectedFacility.route,
        route2: selectedFacility.period === 'Monthly' ? (selectedFacility.route2 || null) : null,
        period: selectedFacility.period,
        is_vaccine_site: selectedFacility.is_vaccine_site ? 1 : 0
      };
      const res = await axios.put(`${api_url}/api/update-facilities/${selectedFacility.id}`, payload);
      
      if (res.status === 200) {
        setOpenEdit(false);
        fetchFacilities(); // Refresh table
        
        // Success message
        await MySwal.fire({
          title: 'Updated!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #4caf50; margin-bottom: 20px;">
                ✅
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

  // --- DELETE LOGIC ---
  const handleDelete = async (facility) => {
    const result = await MySwal.fire({
      title: 'Delete Facility?',
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
            🏥
          </div>
          <p style="font-size: 18px; color: #333; margin-bottom: 10px;">
            Are you sure you want to delete this facility?
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <p style="font-size: 20px; font-weight: bold; color: #1976d2; margin-bottom: 5px;">
              ${facility.facility_name}
            </p>
            <p style="font-size: 14px; color: #666; margin-bottom: 0;">
              ${facility.facility_type || 'N/A'} • ${facility.region_name || 'N/A'}
            </p>
          </div>
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">
            This action cannot be undone and will remove all facility data.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#2196f3',
      confirmButtonText: 'Yes, Delete Facility!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        confirmButton: 'swal-custom-confirm',
        cancelButton: 'swal-custom-cancel'
      },
      buttonsStyling: true,
      focusConfirm: false,
      focusCancel: true
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${api_url}/api/facilities/${facility.id}`);
        
        // Success animation
        await MySwal.fire({
          title: 'Deleted!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #4caf50; margin-bottom: 20px;">
                ✅
              </div>
              <p style="font-size: 18px; color: #333;">
                Facility <strong>"${facility.facility_name}"</strong> has been successfully deleted.
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#4caf50',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
        
        fetchFacilities();
      } catch (err) {
        console.error("Delete error:", err);
        
        // Error animation
        await MySwal.fire({
          title: 'Error!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
                ❌
              </div>
              <p style="font-size: 18px; color: #333;">
                Failed to delete facility. Please try again.
              </p>
            </div>
          `,
          icon: 'error',
          confirmButtonColor: '#f44336',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  // --- SEARCH FILTER ---
  const filtered = facilities.filter(f => 
    f.facility_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.route?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>
        {`
          /* Custom SweetAlert Styles */
          .swal-custom-popup {
            border-radius: 20px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2) !important;
            border: none !important;
          }
          .swal-custom-title {
            font-size: 28px !important;
            font-weight: bold !important;
            color: #333 !important;
            margin-bottom: 20px !important;
          }
          .swal-custom-confirm {
            border-radius: 25px !important;
            padding: 12px 30px !important;
            font-weight: bold !important;
            font-size: 16px !important;
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3) !important;
            transition: all 0.3s ease !important;
          }
          .swal-custom-confirm:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4) !important;
          }
          .swal-custom-cancel {
            border-radius: 25px !important;
            padding: 12px 30px !important;
            font-weight: bold !important;
            font-size: 16px !important;
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3) !important;
            transition: all 0.3s ease !important;
          }
          .swal-custom-cancel:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4) !important;
          }
        `}
      </style>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Search & Header Section */}
      <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <BusinessIcon color="primary" sx={{ fontSize: 35 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">Facility Directory</Typography>
              <Typography variant="body2" color="text.secondary">Management Dashboard</Typography>
            </Box>
          </Box>
          <TextField 
            size="small" 
            placeholder="Search name or route..." 
            value={searchTerm}
            onChange={(e) => {setSearchTerm(e.target.value); setPage(0);}}
            sx={{ width: 320, bgcolor: 'white' }}
            InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
          />
        </Box>
      </Card>

      {/* Professional Table Section */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: '#fafafa' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Facility Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Period</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((f, index) => (
              <TableRow key={f.id} hover>
                {/* 1. Row Number Logic */}
                <TableCell>{(page * rowsPerPage) + index + 1}</TableCell>
                
                <TableCell><Typography fontWeight="600">{f.facility_name}</Typography></TableCell>
                
                <TableCell>
                  <Typography variant="body2">{f.region_name}</Typography>
                  <Typography variant="caption" color="textSecondary">{f.zone_name} • {f.woreda_name}</Typography>
                </TableCell>

                {/* 2. Route Column (Displays symbols/numbers) */}
                <TableCell>
                  {f.route || "---"}
                  {f.route2 && <><br/><span style={{ color: '#666', fontSize: '0.8em' }}>{f.route2}</span></>}
                </TableCell>

                <TableCell>
                  <Chip 
                    label={f.period || 'N/A'} 
                    color={f.period === 'Odd' ? 'primary' : f.period === 'Even' ? 'secondary' : 'success'} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                  {!!f.is_vaccine_site && (
                    <Chip
                      icon={<VaccinesIcon />}
                      label="Vaccine"
                      size="small"
                      color="success"
                      sx={{ ml: 0.5, fontWeight: 'bold' }}
                    />
                  )}
                </TableCell>

                <TableCell align="center">
                  <Box display="flex" justifyContent="center" gap={1}>
                    <IconButton onClick={() => handleEditOpen(f)} color="primary" size="small" sx={{ border: '1px solid #e0e0e0' }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton onClick={() => handleDelete(f)} color="error" size="small" sx={{ border: '1px solid #e0e0e0' }}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* 3. Pagination */}
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

      {/* --- EDIT MODAL (VALUE TAKER) --- */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Update Facility</DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="caption" color="text.secondary">Editing: <strong>{selectedFacility.facility_name}</strong></Typography>
          
          <TextField
            select
            label="Period"
            fullWidth
            value={selectedFacility.period}
            onChange={(e) => setSelectedFacility({...selectedFacility, period: e.target.value, route2: ''})}
          >
            <MenuItem value="Odd">Odd</MenuItem>
            <MenuItem value="Even">Even</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
          </TextField>

          <TextField
            select
            label={selectedFacility.period === 'Monthly' ? 'Route 1' : 'Route'}
            fullWidth
            value={selectedFacility.route}
            onChange={(e) => setSelectedFacility({...selectedFacility, route: e.target.value})}
          >
            <MenuItem value="">-- None --</MenuItem>
            {routes.map(r => (
              <MenuItem key={r.id} value={r.route_name}>{r.route_name}</MenuItem>
            ))}
          </TextField>

          {selectedFacility.period === 'Monthly' && (
            <TextField
              select
              label="Route 2 (optional)"
              fullWidth
              value={selectedFacility.route2}
              onChange={(e) => setSelectedFacility({...selectedFacility, route2: e.target.value})}
            >
              <MenuItem value="">-- None --</MenuItem>
              {routes.map(r => (
                <MenuItem key={r.id} value={r.route_name}>{r.route_name}</MenuItem>
              ))}
            </TextField>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={!!selectedFacility.is_vaccine_site}
                onChange={(e) => setSelectedFacility({...selectedFacility, is_vaccine_site: e.target.checked})}
                color="success"
                icon={<VaccinesIcon />}
                checkedIcon={<VaccinesIcon />}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight="bold">Vaccine Site</Typography>
                <Typography variant="caption" color="text.secondary">Register this facility as a vaccine distribution site</Typography>
              </Box>
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setOpenEdit(false)} color="inherit">Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
};

export default FacilityManager;