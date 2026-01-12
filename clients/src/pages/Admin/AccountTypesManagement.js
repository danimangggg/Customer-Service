import { useState, useEffect } from 'react';
import {
  Container, Typography, Card, CardContent, Grid, Box, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Stack, Divider, Alert, LinearProgress
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Assignment as TaskIcon,
  Security as SecurityIcon,
  Group as GroupIcon
} from '@mui/icons-material';

const AccountTypesManagement = () => {
  const [loading, setLoading] = useState(true);
  const [accountTypes, setAccountTypes] = useState([]);

  // Define all account types and their roles
  const accountTypesData = [
    {
      jobTitle: "Admin",
      accountType: "Admin",
      description: "System administrator with full access",
      permissions: [
        "Full system access",
        "User management",
        "Settings configuration",
        "Organization profile management",
        "All reports access"
      ],
      color: "#f44336",
      icon: <AdminIcon />
    },
    {
      jobTitle: "O2C Officer - HP",
      accountType: "Officer",
      description: "Order-to-Cash officer for Health Program facilities",
      permissions: [
        "Outstanding Process (HP)",
        "Picklists management",
        "Dashboard access",
        "Reports access"
      ],
      color: "#4caf50",
      icon: <PersonIcon />
    },
    {
      jobTitle: "EWM Officer - HP",
      accountType: "Officer", 
      description: "Extended Warehouse Management officer for HP facilities",
      permissions: [
        "Outstanding Process (HP)",
        "Picklists management",
        "Dashboard access",
        "Reports access"
      ],
      color: "#4caf50",
      icon: <PersonIcon />
    },
    {
      jobTitle: "O2C Officer",
      accountType: "Officer",
      description: "Order-to-Cash officer for regular facilities",
      permissions: [
        "Outstanding Process",
        "Picklists management",
        "Dashboard access",
        "Reports access"
      ],
      color: "#ff9800",
      icon: <PersonIcon />
    },
    {
      jobTitle: "EWM Officer",
      accountType: "Officer",
      description: "Extended Warehouse Management officer for regular facilities",
      permissions: [
        "Outstanding Process",
        "Picklists management", 
        "Dashboard access",
        "Reports access"
      ],
      color: "#ff9800",
      icon: <PersonIcon />
    },
    {
      jobTitle: "PI Officer-HP",
      accountType: "Officer",
      description: "Physical Inventory officer for Health Program",
      permissions: [
        "Outstanding Process (PI Vehicle Requests)",
        "Vehicle request management"
      ],
      color: "#9c27b0",
      icon: <TaskIcon />
    },
    {
      jobTitle: "Dispatcher - HP",
      accountType: "Dispatcher",
      description: "Dispatch management for Health Program",
      permissions: [
        "Dispatch Management",
        "Route assignments",
        "Vehicle coordination"
      ],
      color: "#2196f3",
      icon: <TaskIcon />
    },
    {
      jobTitle: "Dispatcher",
      accountType: "Dispatcher", 
      description: "General dispatch management",
      permissions: [
        "Outstanding Process (Dispatch)",
        "Route assignments",
        "Vehicle coordination"
      ],
      color: "#2196f3",
      icon: <TaskIcon />
    },
    {
      jobTitle: "Documentation Officer",
      accountType: "Documentation",
      description: "Manages proof of delivery documentation",
      permissions: [
        "Documentation Management",
        "POD confirmation",
        "Document tracking"
      ],
      color: "#9c27b0",
      icon: <TaskIcon />
    },
    {
      jobTitle: "Documentation Follower",
      accountType: "Documentation",
      description: "Follows up on document completion",
      permissions: [
        "Document Follow-up",
        "Document signing tracking",
        "Handover management"
      ],
      color: "#2196f3",
      icon: <TaskIcon />
    },
    {
      jobTitle: "Quality Evaluator",
      accountType: "Quality",
      description: "Evaluates process quality and provides feedback",
      permissions: [
        "Quality Evaluation",
        "Process quality confirmation",
        "Feedback management"
      ],
      color: "#4caf50",
      icon: <SecurityIcon />
    },
    {
      jobTitle: "WIM Operator",
      accountType: "Operator",
      description: "Warehouse Information Management operator",
      permissions: [
        "Picklists management",
        "Inventory operations"
      ],
      color: "#607d8b",
      icon: <PersonIcon />
    },
    {
      jobTitle: "TV Operator",
      accountType: "Operator",
      description: "Television/Display management operator",
      permissions: [
        "TV Main Menu access",
        "Display management"
      ],
      color: "#795548",
      icon: <PersonIcon />
    },
    {
      jobTitle: "Customer Service Officer",
      accountType: "Service",
      description: "Customer service and registration",
      permissions: [
        "Customer Registration",
        "Dashboard access",
        "Reports access"
      ],
      color: "#00bcd4",
      icon: <PersonIcon />
    },
    {
      jobTitle: "TM Manager",
      accountType: "Manager",
      description: "Transportation Management manager",
      permissions: [
        "Transportation management",
        "Route management",
        "Vehicle management",
        "HP Facilities management",
        "Transportation reports"
      ],
      color: "#3f51b5",
      icon: <AdminIcon />
    },
    {
      jobTitle: "Finance",
      accountType: "Finance",
      description: "Financial operations and reporting",
      permissions: [
        "Dashboard access",
        "Financial reports",
        "Reports access"
      ],
      color: "#e91e63",
      icon: <PersonIcon />
    },
    {
      jobTitle: "Credit Manager",
      accountType: "Credit Manager",
      description: "Credit management and employee oversight",
      permissions: [
        "All Employees access",
        "Credit management"
      ],
      color: "#673ab7",
      icon: <GroupIcon />
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setAccountTypes(accountTypesData);
      setLoading(false);
    }, 1000);
  }, []);

  // Access control
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const accountType = localStorage.getItem('AccountType') || '';
  const isAdmin = accountType === 'Admin';

  if (!isAdmin) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to Admin users only.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            <strong>Current Account Type:</strong> "{accountType}"
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <style>
        {`
          .account-card {
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
          }
          .account-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }
          .header-gradient {
            background: linear-gradient(135deg, #f44336 0%, #e57373 100%);
            color: white;
            padding: 24px;
            border-radius: 16px 16px 0 0;
          }
        `}
      </style>
      
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Header Section */}
        <Card sx={{ mb: 3, overflow: 'hidden' }}>
          <Box className="header-gradient">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <AdminIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                  Account Types & Roles Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Overview of all job titles, account types, and their system permissions
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3, bgcolor: '#f44336', color: 'white' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <AdminIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {accountTypes.filter(a => a.accountType === 'Admin').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Admin Accounts
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3, bgcolor: '#4caf50', color: 'white' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {accountTypes.filter(a => a.accountType === 'Officer').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Officer Roles
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3, bgcolor: '#2196f3', color: 'white' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <TaskIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {accountTypes.filter(a => ['Dispatcher', 'Documentation', 'Quality'].includes(a.accountType)).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Specialized Roles
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 3, bgcolor: '#9c27b0', color: 'white' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <GroupIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {accountTypes.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Job Titles
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Account Types Table */}
        <Card className="account-card">
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SecurityIcon color="primary" />
                <span>Account Types & Permissions</span>
              </Stack>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Job Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Account Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 250 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 300 }}>Permissions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accountTypes.map((account, index) => (
                    <TableRow 
                      key={index}
                      hover 
                      sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: account.color, width: 32, height: 32 }}>
                            {account.icon}
                          </Avatar>
                          <Typography variant="body2" fontWeight="bold">
                            {account.jobTitle}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={account.accountType}
                          sx={{ 
                            bgcolor: account.color,
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {account.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="column" spacing={0.5}>
                          {account.permissions.map((permission, idx) => (
                            <Chip
                              key={idx}
                              label={permission}
                              variant="outlined"
                              size="small"
                              sx={{ 
                                fontSize: '0.75rem',
                                height: 24,
                                alignSelf: 'flex-start'
                              }}
                            />
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default AccountTypesManagement;