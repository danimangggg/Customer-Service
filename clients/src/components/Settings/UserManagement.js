import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  TablePagination,
  InputAdornment,
  Fade,
  Stack,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Pause as SuspendedIcon,
  MoreVert as MoreIcon,
  Lock as LockIcon,
  LockReset as ResetIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Visibility,
  VisibilityOff,
  Work as JobIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForPassword, setUserForPassword] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    user_name: '',
    password: '',
    jobTitle: '',
    account_type: 'Standard',
    account_status: 'Active',
    store: ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const accountTypes = ['Admin', 'Manager', 'Standard', 'Coordinator'];
  const statusOptions = ['Active', 'Inactive', 'Suspended'];
  const jobTitles = ['O2C Officer', 'EWM Officer', 'Customer Service Officer', 'Finance Officer', 'O2C Officer - HP', 'EWM Officer - HP', 'PI Officer-HP', 'Documentation Officer', 'Documentation Follower', 'Dispatcher - HP', 'Quality Evaluator', 'WIM Operator', 'Queue Manager', 'Driver', 'Deliverer', 'TM Manager', 'Dispatcher', 'Coordinator', 'Manager', 'TV Operator', 'Dispatch-Documentation', 'EWM-Documentation', 'Gate Keeper'];

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
      fetchStats();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [page, rowsPerPage, searchTerm, filterStatus]);

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stores`);
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users with search term:', searchTerm); // Debug log
      const response = await axios.get(`${API_URL}/api/users-management`, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          account_status: filterStatus
        }
      });
      console.log('API Response:', response.data); // Debug log
      setUsers(response.data.users);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users-management/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validation for roles that require store assignment
      const rolesRequiringStore = ['EWM Officer', 'EWM Officer - HP', 'Dispatcher', 'Dispatch-Documentation', 'EWM-Documentation', 'Gate Keeper'];
      if (rolesRequiringStore.includes(formData.jobTitle) && !formData.store) {
        await MySwal.fire({
          title: 'Store Required!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #ff9800; margin-bottom: 20px;">
                🏪
              </div>
              <p style="font-size: 18px; color: #333;">
                Store selection is mandatory for ${formData.jobTitle}.
              </p>
              <p style="font-size: 14px; color: #666;">
                Please select a store before saving the user.
              </p>
            </div>
          `,
          icon: 'warning',
          confirmButtonColor: '#ff9800',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            confirmButton: 'swal-custom-confirm'
          },
          buttonsStyling: true
        });
        return;
      }
      
      if (editingUser) {
        await axios.put(`${API_URL}/api/users-management/${editingUser.id}`, formData);
        showSnackbar('User updated successfully', 'success');
      } else {
        await axios.post(`${API_URL}/api/users-management`, formData);
        showSnackbar('User created successfully', 'success');
      }
      handleCloseDialog();
      fetchUsers();
      fetchStats();
    } catch (error) {
      const message = error.response?.data?.error || 'Operation failed';
      showSnackbar(message, 'error');
    }
  };

  const handleDelete = async (user) => {
    const result = await MySwal.fire({
      title: 'Delete User?',
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
            👤
          </div>
          <p style="font-size: 18px; color: #333; margin-bottom: 10px;">
            Are you sure you want to delete this user?
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <p style="font-size: 20px; font-weight: bold; color: #1976d2; margin-bottom: 5px;">
              ${user.full_name}
            </p>
            <p style="font-size: 14px; color: #666; margin-bottom: 0;">
              ${user.jobTitle} • ${user.account_type}
            </p>
          </div>
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">
            This action cannot be undone and will remove all user data.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#2196f3',
      confirmButtonText: 'Yes, Delete User!',
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
        await axios.delete(`${API_URL}/api/users-management/${user.id}`);
        
        // Success animation
        await MySwal.fire({
          title: 'Deleted!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #4caf50; margin-bottom: 20px;">
                ✅
              </div>
              <p style="font-size: 18px; color: #333;">
                User <strong>"${user.full_name}"</strong> has been successfully deleted.
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#4caf50',
          confirmButtonText: 'Great!',
          timer: 3000,
          timerProgressBar: true
        });
        
        fetchUsers();
        fetchStats();
      } catch (error) {
        const message = error.response?.data?.error || 'Failed to delete user';
        
        // Error animation
        await MySwal.fire({
          title: 'Error!',
          html: `
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 60px; color: #f44336; margin-bottom: 20px;">
                ❌
              </div>
              <p style="font-size: 18px; color: #333;">
                ${message}
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

  const handlePasswordReset = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showSnackbar('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      await axios.patch(`${API_URL}/api/users-management/${userForPassword.id}/reset-password`, {
        newPassword: passwordData.newPassword
      });
      showSnackbar('Password reset successfully', 'success');
      setOpenPasswordDialog(false);
      setUserForPassword(null);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to reset password';
      showSnackbar(message, 'error');
    }
  };

  const handleStatusToggle = async (user, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/users-management/${user.id}/status`, {
        status: newStatus
      });
      showSnackbar(`User status updated to ${newStatus}`, 'success');
      fetchUsers();
      fetchStats();
      handleMenuClose();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update status';
      showSnackbar(message, 'error');
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        full_name: user.full_name,
        user_name: user.user_name,
        password: '',
        jobTitle: user.jobTitle || '',
        account_type: user.account_type || 'Standard',
        account_status: user.account_status || 'Active',
        store: user.store || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        full_name: '',
        user_name: '',
        password: '',
        jobTitle: '',
        account_type: 'Standard',
        account_status: 'Active',
        store: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleDeleteClick = (user) => {
    handleDelete(user);
  };

  const handlePasswordResetClick = (user) => {
    setUserForPassword(user);
    setOpenPasswordDialog(true);
  };

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <ActiveIcon />;
      case 'inactive': return <InactiveIcon />;
      case 'suspended': return <SuspendedIcon />;
      default: return <PersonIcon />;
    }
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
          .user-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .user-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%);
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
          .stats-card {
            transition: all 0.3s ease;
            border-radius: 16px;
            padding: 20px;
            position: relative;
            overflow: hidden;
            cursor: pointer;
          }
          .stats-card:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          }
          
          /* Custom SweetAlert Styles */
          .swal-custom-popup {
            border-radius: 20px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2) !important;
            border: none !important;
            z-index: 9999 !important;
          }
          .swal2-container {
            z-index: 9999 !important;
          }
          .swal2-backdrop-show {
            z-index: 9998 !important;
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
      
      <Box sx={{ p: 3 }}>
        <Card className="user-card animate-fade-in" elevation={0}>
          {/* Header */}
          <Box className="header-gradient">
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 64, 
                    height: 64,
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}>
                    <GroupIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ 
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      mb: 1
                    }}>
                      User Management
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 300,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      Manage system users, roles, and permissions
                    </Typography>
                  </Box>
                </Stack>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 'bold',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  Add User
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Box sx={{ p: 4, pb: 2 }}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <GroupIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.totalUsers || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Users
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <ActiveIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.activeUsers || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Active
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <InactiveIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.inactiveUsers || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Inactive
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="stats-card" sx={{ 
                  background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
                  color: 'white'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <SuspendedIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.suspendedUsers || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Suspended
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>

            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search by name, username, job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchTerm('')}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText={`Search works by full name, username, and job title${searchTerm ? ` - Found ${totalCount} results` : ''}`}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ 
                  bgcolor: '#1976d2',
                  '& .MuiTableCell-head': {
                    backgroundColor: '#1976d2',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    borderBottom: '2px solid #ffffff'
                  }
                }}>
                  <TableRow>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Job Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {user.full_name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="bold">{user.full_name}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.user_name} 
                          variant="outlined" 
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.jobTitle || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(user.account_status)}
                          label={user.account_status || 'Unknown'}
                          color={getStatusColor(user.account_status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(user)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={(e) => handleMenuClick(e, user)}
                          sx={{ mr: 1 }}
                        >
                          <MoreIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handlePasswordResetClick(selectedUser)}>
            <ListItemIcon>
              <ResetIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reset Password</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleStatusToggle(selectedUser, 'Active')}>
            <ListItemIcon>
              <ActiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Activate</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusToggle(selectedUser, 'Inactive')}>
            <ListItemIcon>
              <InactiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Deactivate</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleStatusToggle(selectedUser, 'Suspended')}>
            <ListItemIcon>
              <SuspendedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Suspend</ListItemText>
          </MenuItem>
        </Menu>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.user_name}
                  onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Job Title</InputLabel>
                  <Select
                    value={formData.jobTitle}
                    label="Job Title"
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  >
                    <MenuItem value="">Select Job Title</MenuItem>
                    {jobTitles.map((title) => (
                      <MenuItem key={title} value={title}>{title}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    value={formData.account_type}
                    label="Account Type"
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                  >
                    {accountTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl 
                  fullWidth 
                  required={['EWM Officer', 'EWM Officer - HP', 'Dispatcher', 'Dispatch-Documentation', 'EWM-Documentation', 'Gate Keeper'].includes(formData.jobTitle)}
                >
                  <InputLabel>
                    Store {['EWM Officer', 'EWM Officer - HP', 'Dispatcher', 'Dispatch-Documentation', 'EWM-Documentation', 'Gate Keeper'].includes(formData.jobTitle) && '*'}
                  </InputLabel>
                  <Select
                    value={formData.store}
                    label={`Store ${['EWM Officer', 'EWM Officer - HP', 'Dispatcher', 'Dispatch-Documentation', 'EWM-Documentation', 'Gate Keeper'].includes(formData.jobTitle) ? '*' : ''}`}
                    onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                    sx={{
                      backgroundColor: ['EWM Officer', 'EWM Officer - HP', 'Dispatcher', 'Dispatch-Documentation', 'EWM-Documentation', 'Gate Keeper'].includes(formData.jobTitle) ? '#fff3e0' : 'inherit'
                    }}
                  >
                    <MenuItem value="">
                      {['EWM Officer', 'EWM Officer - HP', 'Dispatcher', 'Dispatch-Documentation', 'EWM-Documentation', 'Gate Keeper'].includes(formData.jobTitle)
                        ? 'Select Store (Required)' 
                        : 'Select Store'
                      }
                    </MenuItem>
                    {stores.map((store) => (
                      <MenuItem key={store.id} value={store.store_name}>
                        {store.store_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.account_status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, account_status: e.target.value })}
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Reset password for: <strong>{userForPassword?.full_name}</strong>
            </Typography>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handlePasswordReset} variant="contained" color="warning">
              Reset Password
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default UserManagement;