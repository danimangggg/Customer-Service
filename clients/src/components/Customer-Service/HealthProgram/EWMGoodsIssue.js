import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Card, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, LinearProgress, Alert
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as TruckIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';

const EWMGoodsIssue = () => {
  const [processes, setProcesses] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loggedInUserId = localStorage.getItem('UserId');
  const loggedInUserName = localStorage.getItem('FullName');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isEWMOfficer = userJobTitle === 'EWM Officer - HP';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Ethiopian calendar
  const getCurrentEthiopianMonth = () => {
    const ethiopianMonths = [
      'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
    ];
    
    const gDate = new Date();
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth();
    const gd = gDate.getDate();
    
    const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
    const newYearDay = isLeap ? 12 : 11;
    
    let ethYear, ethMonthIndex;
    
    if (gm > 8 || (gm === 8 && gd >= newYearDay)) {
      ethYear = gy - 7;
      const newYearDate = new Date(gy, 8, newYearDay);
      const diffDays = Math.floor((gDate - newYearDate) / (24 * 60 * 60 * 1000));
      
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12;
      }
    } else {
      ethYear = gy - 8;
      const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
      const prevNewYearDay = prevIsLeap ? 12 : 11;
      const prevNewYearDate = new Date(gy - 1, 8, prevNewYearDay);
      const diffDays = Math.floor((gDate - prevNewYearDate) / (24 * 60 * 60 * 1000));
      
      if (diffDays < 360) {
        ethMonthIndex = Math.floor(diffDays / 30);
      } else {
        ethMonthIndex = 12;
      }
    }
    
    ethMonthIndex = Math.max(0, Math.min(ethMonthIndex, 12));
    
    return {
      month: ethiopianMonths[ethMonthIndex],
      year: ethYear
    };
  };

  const currentEthiopian = getCurrentEthiopianMonth();

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${api_url}/api/ewm-goods-issue-processes`, {
        params: {
          month: currentEthiopian.month,
          year: currentEthiopian.year
        }
      });
      
      // Filter out processes without facility data
      const validProcesses = (response.data.processes || []).filter(p => p.facility);
      setProcesses(validProcesses);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load processes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleIssueGoods = async (process) => {
    const result = await Swal.fire({
      title: 'Issue Goods?',
      html: `
        <p>Issue goods for <strong>${process.facility?.facility_name}</strong></p>
        <p>Freight Order: <strong>${process.freight_order_number}</strong></p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Issue Goods',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4caf50'
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`${api_url}/api/ewm-issue-goods`, {
          process_id: process.id,
          ewm_officer_id: loggedInUserId,
          ewm_officer_name: loggedInUserName
        });

        Swal.fire('Success!', 'Goods issued successfully and sent to Biller', 'success');
        fetchProcesses();
      } catch (err) {
        console.error('Issue goods error:', err);
        Swal.fire('Error', 'Failed to issue goods', 'error');
      }
    }
  };

  if (!isEWMOfficer) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to EWM Officer - HP role only.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Header */}
        <Card sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)', color: 'white', p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <InventoryIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  EWM - Goods Issue
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Issue goods after receiving freight order from TM
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Processes Table */}
        <Card>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <AssignmentIcon color="primary" />
                <Typography variant="h6">Freight Orders Ready for Goods Issue</Typography>
                <Chip 
                  label={`${processes.length} processes`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Stack>
            }
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Facility</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Freight Order</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>TM Officer</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((process, index) => (
                  <TableRow key={process.id} hover>
                    <TableCell>
                      <Chip 
                        label={(page * rowsPerPage) + index + 1} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold" color="primary">
                        {process.facility?.facility_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {process.facility?.region_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={<TruckIcon />}
                        label={process.facility?.route} 
                        size="small" 
                        color="secondary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={process.freight_order_number}
                        size="small"
                        color="info"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {process.tm_officer_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        variant="contained" 
                        color="success" 
                        size="small" 
                        startIcon={<CheckCircleIcon />} 
                        onClick={() => handleIssueGoods(process)}
                      >
                        Issue Goods
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination 
              component="div" 
              count={processes.length} 
              rowsPerPage={rowsPerPage} 
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        </Card>
      </Container>
    </>
  );
};

export default EWMGoodsIssue;
