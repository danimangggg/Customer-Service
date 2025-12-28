import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Chip, IconButton, Box, TextField, InputAdornment, Card,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, 
  Container, TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import axios from 'axios';

const FacilityManager = () => {
  // --- STATE MANAGEMENT ---
  const [facilities, setFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  useEffect(() => {
    fetchFacilities();
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
      // Using your specific API endpoint
      const res = await axios.put(`${api_url}/api/update-facilities/${selectedFacility.id}`, {
        route: selectedFacility.route, // Supports symbols, numbers, and letters
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

  // --- DELETE LOGIC ---
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this facility?")) {
      try {
        await axios.delete(`${api_url}/api/facilities/${id}`);
        fetchFacilities();
      } catch (err) { console.error("Delete error:", err); }
    }
  };

  // --- SEARCH FILTER ---
  const filtered = facilities.filter(f => 
    f.facility_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.route?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
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
                <TableCell>{f.route || "---"}</TableCell>

                <TableCell>
                  <Chip 
                    label={f.period || 'N/A'} 
                    color={f.period === 'Odd' ? 'primary' : f.period === 'Even' ? 'secondary' : 'success'} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </TableCell>

                <TableCell align="center">
                  <Box display="flex" justifyContent="center" gap={1}>
                    <IconButton onClick={() => handleEditOpen(f)} color="primary" size="small" sx={{ border: '1px solid #e0e0e0' }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton onClick={() => handleDelete(f.id)} color="error" size="small" sx={{ border: '1px solid #e0e0e0' }}><DeleteIcon fontSize="small" /></IconButton>
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
            label="Route (Symbols, Letters, Numbers)" 
            fullWidth 
            value={selectedFacility.route}
            onChange={(e) => setSelectedFacility({...selectedFacility, route: e.target.value})}
            placeholder="e.g. R-123/North#9"
          />

          <TextField
            select
            label="Period"
            fullWidth
            value={selectedFacility.period}
            onChange={(e) => setSelectedFacility({...selectedFacility, period: e.target.value})}
          >
            <MenuItem value="Odd">Odd</MenuItem>
            <MenuItem value="Even">Even</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setOpenEdit(false)} color="inherit">Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FacilityManager;