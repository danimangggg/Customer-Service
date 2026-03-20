import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Chip, Stack,
  Avatar, Card, Snackbar, Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, AccountTree as BranchIcon } from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ branch_name: '', branch_code: '', status: 'Active' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/branches`);
      setBranches(res.data);
    } catch (err) {
      showSnackbar('Failed to load branches', 'error');
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const handleOpen = (branch = null) => {
    setEditing(branch);
    setForm(branch ? { branch_name: branch.branch_name, branch_code: branch.branch_code, status: branch.status } : { branch_name: '', branch_code: '', status: 'Active' });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.branch_name || !form.branch_code) {
      showSnackbar('Branch name and code are required', 'error');
      return;
    }
    try {
      if (editing) {
        await axios.put(`${API_URL}/api/branches/${editing.id}`, form);
        showSnackbar('Branch updated');
      } else {
        await axios.post(`${API_URL}/api/branches`, form);
        showSnackbar('Branch created');
      }
      setOpenDialog(false);
      fetchBranches();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (branch) => {
    const result = await Swal.fire({
      title: 'Delete Branch?',
      text: `"${branch.branch_name}" (${branch.branch_code}) will be removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#2196f3',
      confirmButtonText: 'Delete',
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/branches/${branch.id}`);
        showSnackbar('Branch deleted');
        fetchBranches();
      } catch (err) {
        showSnackbar('Failed to delete', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #eee' }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}><BranchIcon /></Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">EPSS Branches</Typography>
              <Typography variant="body2" color="text.secondary">Manage branch codes for data isolation</Typography>
            </Box>
          </Stack>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Add Branch
          </Button>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Branch Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Branch Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((b, i) => (
                <TableRow key={b.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell><Typography fontWeight={600}>{b.branch_name}</Typography></TableCell>
                  <TableCell>
                    <Chip label={b.branch_code} color="primary" variant="outlined" size="small" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={b.status} color={b.status === 'Active' ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" onClick={() => handleOpen(b)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(b)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {branches.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No branches yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Branch Name"
            fullWidth
            value={form.branch_name}
            onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
            placeholder="e.g. Addis Ababa Branch"
          />
          <TextField
            label="Branch Code"
            fullWidth
            value={form.branch_code}
            onChange={(e) => setForm({ ...form, branch_code: e.target.value.toUpperCase() })}
            placeholder="e.g. AAB"
            helperText="Short unique code, auto-uppercased"
            inputProps={{ maxLength: 20 }}
          />
          <TextField
            select
            label="Status"
            fullWidth
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default BranchManagement;
