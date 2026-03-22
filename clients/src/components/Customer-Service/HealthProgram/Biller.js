import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Card, CardContent, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, LinearProgress, Alert, TextField, MenuItem
} from '@mui/material';
import {
  Print as PrintIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Undo as UndoIcon
} from '@mui/icons-material';
import axios from 'axios';
import api from '../../../axiosInstance';
import Swal from 'sweetalert2';
import { successToast } from '../../../utils/toast';

const Biller = () => {
  const [processes, setProcesses] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processType, setProcessType] = useState('regular');

  const loggedInUserId = localStorage.getItem('UserId');
  const loggedInUserName = localStorage.getItem('FullName');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isBiller = userJobTitle === 'Biller';
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
  }, [processType]);

  // Silent background polling every 5s
  useEffect(() => {
    const silentFetch = async () => {
      try {
        const response = await api.get(`${api_url}/api/biller-processes`, {
          params: { month: currentEthiopian.month, year: currentEthiopian.year, process_type: processType }
        });
        setProcesses(response.data.processes || []);
      } catch (_) {}
    };
    const interval = setInterval(silentFetch, 5000);
    return () => clearInterval(interval);
  }, [processType]);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`${api_url}/api/biller-processes`, {
        params: {
          month: currentEthiopian.month,
          year: currentEthiopian.year,
          process_type: processType
        }
      });
      setProcesses(response.data.processes || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load processes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (process) => {
    const result = await Swal.fire({
      title: 'Return to Previous Step?',
      text: `This will return "${process.facility?.facility_name}" back to EWM Goods Issue.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Return',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f44336'
    });
    if (result.isConfirmed) {
      try {
        await api.post(`${api_url}/api/hp-revert-process`, { process_id: process.id });
        successToast('Process returned to previous step');
        fetchProcesses();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.error || 'Failed to revert process', 'error');
      }
    }
  };

  const handlePrintDocuments = async (process) => {
    const result = await Swal.fire({
      title: 'Complete Billing?',
      text: `Complete billing for ${process.facility?.facility_name}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Complete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4caf50'
    });

    if (result.isConfirmed) {
      try {
        // First receive goods if not already received
        if (process.status === 'ewm_goods_issued' || process.status === 'tm_confirmed') {
          await api.post(`${api_url}/api/biller-receive-goods`, {
            process_id: process.id,
            biller_officer_id: loggedInUserId,
            biller_officer_name: loggedInUserName
          });
        }

        // Then complete billing
        await api.post(`${api_url}/api/biller-print-documents`, {
          process_id: process.id
        });

        // Record service time for Biller
        try {
          await api.post(`${api_url}/api/service-time-hp`, {
            process_id: process.id,
            service_unit: 'Biller - HP',
            end_time: new Date().toISOString(),
            officer_id: loggedInUserId,
            officer_name: loggedInUserName,
            status: 'completed',
            notes: `Billing completed for ${process.facility?.facility_name}`
          });
        } catch (err) {
          console.error('Failed to record Biller service time:', err);
        }

        successToast('Billing completed successfully');
        fetchProcesses();
      } catch (err) {
        console.error('Complete billing error:', err);
        Swal.fire('Error', 'Failed to complete billing', 'error');
      }
    }
  };

  if (!isBiller) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to Biller role only.
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
          <Box sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', color: 'white', p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <PrintIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Biller - Complete Billing
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Complete billing for goods issued by EWM
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

        {/* Type Filter */}
        <Card sx={{ mb: 2, p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body2" color="text.secondary">Process Type:</Typography>
            <TextField select size="small" value={processType} onChange={e => setProcessType(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="regular">HP Regular</MenuItem>
              <MenuItem value="emergency">Emergency</MenuItem>
              <MenuItem value="breakdown">Breakdown</MenuItem>
              <MenuItem value="vaccine">Vaccine</MenuItem>
            </TextField>
          </Stack>
        </Card>

        {/* Processes Table */}
        <Card>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <AssignmentIcon color="primary" />
                <Typography variant="h6">Processes Ready for Billing</Typography>
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Region</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>EWM Officer</TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={process.facility?.route} 
                        size="small" 
                        color="secondary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {process.facility?.region_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {process.ewm_goods_issued_by_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button 
                          variant="contained" 
                          color="success" 
                          size="small" 
                          startIcon={<PrintIcon />} 
                          onClick={() => handlePrintDocuments(process)}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<UndoIcon />}
                          onClick={() => handleRevert(process)}
                        >
                          Return
                        </Button>
                      </Stack>
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

export default Biller;
