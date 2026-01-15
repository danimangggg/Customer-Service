import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, IconButton, Box, Container, Select, MenuItem,
  TablePagination, Avatar, Chip, Tooltip, CircularProgress, FormControl,
  Snackbar, Alert, Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  BusinessCenter,
  AccountCircle
} from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const JOB_TITLES = [
  "EWM Officer - HP", "EWM Officer - RDF", "EWM Officer - Vaccine", 
  "O2C Officer - HP", "O2C Officer - RDF", 
  "O2C Officer - V", "Customer Service Officer", 
  "Warehouse Operator", "Queue Manager", "Finance"
];

const EmployeeManager = () => {
  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [editingId, setEditingId] = useState(null);
  const [tempJobTitle, setTempJobTitle] = useState("");
  const [tempStore, setTempStore] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/get-employee`);
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showSnackbar("Error fetching employee list", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stores`);
      setStores(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  };

  useEffect(() => { 
    fetchEmployees(); 
    fetchStores();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSave = async (id) => {
    try {
      await axios.put(`${API_URL}/api/update-employee/${id}`, {
        jobTitle: tempJobTitle,
        store: tempStore
      });

      showSnackbar("Employee information updated successfully!");
      setEditingId(null);
      fetchEmployees();
    } catch (err) {
      showSnackbar("Update failed", "error");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <BusinessCenter />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="900">Staff Directory</Typography>
          <Typography variant="body2" color="text.secondary">Update employee designations</Typography>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #eee' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#fcfcfc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>USER NAME</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>FULL NAME</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>JOB TITLE</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>STORE</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
            ) : employees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((emp) => (
              <TableRow key={emp.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountCircle sx={{ color: 'divider' }} />
                    <Typography variant="body2">{emp.user_name}</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{emp.full_name}</TableCell>
                <TableCell>
                  {editingId === emp.id ? (
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <Select value={tempJobTitle} onChange={(e) => setTempJobTitle(e.target.value)}>
                        {JOB_TITLES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip label={emp.jobTitle || 'N/A'} color="primary" variant="outlined" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  {editingId === emp.id ? (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select value={tempStore} onChange={(e) => setTempStore(e.target.value)} displayEmpty>
                        <MenuItem value=""><em>None</em></MenuItem>
                        {stores.map((store) => (
                          <MenuItem key={store.id} value={store.store_name}>
                            {store.store_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip 
                      label={emp.store || 'N/A'} 
                      color="secondary" 
                      variant="outlined" 
                      size="small" 
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {editingId === emp.id ? (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton color="success" onClick={() => handleSave(emp.id)}><CheckIcon /></IconButton>
                      <IconButton color="error" onClick={() => setEditingId(null)}><CloseIcon /></IconButton>
                    </Box>
                  ) : (
                    <IconButton onClick={() => { 
                      setEditingId(emp.id); 
                      setTempJobTitle(emp.jobTitle || ""); 
                      setTempStore(emp.store || "");
                    }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={employees.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10]}
        />
      </TableContainer>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default EmployeeManager;