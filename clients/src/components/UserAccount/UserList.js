import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  IconButton,
  Paper,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as PlusIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/get-employee`);
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/deleteUser/${selectedUser.id}`);
      setUsers(users.filter((user) => user.id !== selectedUser.id));
      setOpenDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteCancel = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleAdd = () => {
    navigate('/add-users');
  };

  const columns = [
    {
      field: 'serial',
      headerName: 'No',
      width: 70,
      valueGetter: (params) =>
        users.findIndex((user) => user.id === params.row.id) + 1,
    },
    { field: 'full_name', headerName: 'Full Name', flex: 1 },
    { field: 'user_name', headerName: 'Username', flex: 1 },
    { field: 'account_type', headerName: 'Account Type', flex: 1 },
    { field: 'department', headerName: 'Department', flex: 1, valueGetter: (params) => params.row.department || '-' },
    { field: 'position', headerName: 'Position', flex: 1, valueGetter: (params) => params.row.position || '-' },
    { field: 'job_title', headerName: 'Job Title', flex: 1, valueGetter: (params) => params.row.job_title || '-' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) =>
        params.row.account_type !== 'Admin' && (
          <IconButton
            style={{ color: 'red' }}
            onClick={() => handleDeleteClick(params.row)}
          >
            <DeleteIcon />
          </IconButton>
        ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 2, position: 'relative' }}>
        <IconButton
          edge="end"
          onClick={handleBack}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>

        <IconButton
          edge="end"
          onClick={handleAdd}
          sx={{ position: 'absolute', top: 8, color: 'green' }}
        >
          <PlusIcon />
        </IconButton>

        <Typography variant="h5" align="center" gutterBottom>
          Employee List
        </Typography>

        <Box sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={users}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            getRowId={(row) => row.id}
          />
        </Box>

        <Dialog open={openDialog} onClose={handleDeleteCancel}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete{' '}
              {selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : ''}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default UserList;
