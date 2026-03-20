import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Card, CardContent, CardHeader, Button, Container, 
  TablePagination, Stack, Box, Chip, Avatar, Divider, Grid, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  FormControl, Select, MenuItem
} from '@mui/material';
import {
  LocalShipping as DispatchIcon,
  Route as RouteIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CompleteIcon,
  Person as DriverIcon,
  PersonOutline as DelivererIcon,
  DirectionsCar as VehicleIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from 'sweetalert2';
import { successToast } from '../../utils/toast';
import withReactContent from 'sweetalert2-react-content';
import { formatTimestamp } from '../../utils/serviceTimeHelper';

const MySwal = withReactContent(Swal);

const DispatchManagement = () => {
  const [routeData, setRouteData] = useState([]);
  const [filterType, setFilterType] = useState('Regular');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const loggedInUserId = localStorage.getItem('UserId');
  const userJobTitle = localStorage.getItem('JobTitle') || '';
  const isDispatcher = userJobTitle === 'Dispatcher - HP';
  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Ethiopian calendar function
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
      year: ethYear,
      monthIndex: ethMonthIndex
    };
  };

  const currentEthiopian = getCurrentEthiopianMonth();
  const currentEthiopianMonth = currentEthiopian.month;
  const currentEthiopianYear = currentEthiopian.year;

  useEffect(() => {
    fetchAssignedRoutes();
    fetchStats();
  }, [currentEthiopianMonth, currentEthiopianYear, filterType]);

  // Silent background polling every 5s
  useEffect(() => {
    const silentFetch = async () => {
      try {
        const res = await axios.get(`${api_url}/api/dispatch-routes`, {
          params: { month: currentEthiopianMonth, year: currentEthiopianYear, process_type: filterType.toLowerCase(), includeAll: true }
        });
        setRouteData(res.data.routes || []);
      } catch (_) {}
    };
    const interval = setInterval(silentFetch, 5000);
    return () => clearInterval(interval);
  }, [currentEthiopianMonth, currentEthiopianYear, filterType]);

  const fetchAssignedRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${api_url}/api/dispatch-routes`, {
        params: {
          month: currentEthiopianMonth,
          year: currentEthiopianYear,
          process_type: filterType.toLowerCase(),
          includeAll: true
        }
      });
      
      setRouteData(response.data.routes || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load assigned routes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${api_url}/api/dispatch-routes/stats`, {
        params: {
          month: currentEthiopianMonth,
          year: currentEthiopianYear
        }
      });
      setStats(response.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const handleCompleteDispatch = async (routeId, routeName) => {
    try {
      // routeId is now process_id from the new API
      const processId = routeId;
      
      // Update process status to dispatch_completed
      await axios.put(`${api_url}/api/processes/${processId}/complete-dispatch`, {
        completed_by: loggedInUserId
      });
      
      // Record service time for Dispatcher - HP
      try {
        const dispatchEndTime = new Date().toISOString();
        
        // Calculate waiting time from TM Phase 2 end time
        let waitingMinutes = 0;
        try {
          const lastServiceQuery = `
            SELECT end_time 
            FROM service_time_hp
            WHERE process_id = ? AND service_unit = 'TM - Driver & Deliverer Assignment'
            ORDER BY created_at DESC 
            LIMIT 1
          `;
          
          const lastServiceResponse = await axios.get(`${api_url}/api/service-time-hp/last-end-time`, {
            params: {
              process_id: processId,
              service_unit: 'TM - Driver & Deliverer Assignment'
            }
          });
          
          if (lastServiceResponse.data.end_time) {
            const prevTime = new Date(lastServiceResponse.data.end_time);
            const currTime = new Date(dispatchEndTime);
            const diffMs = currTime - prevTime;
            waitingMinutes = Math.floor(diffMs / 60000);
            waitingMinutes = waitingMinutes > 0 ? waitingMinutes : 0;
          }
        } catch (err) {
          console.error('Failed to get TM end time:', err);
        }
        
        await axios.post(`${api_url}/api/service-time-hp`, {
          process_id: processId,
          service_unit: 'Dispatcher - HP',
          end_time: dispatchEndTime,
          officer_id: loggedInUserId,
          officer_name: localStorage.getItem('FullName'),
          status: 'completed',
          notes: `Dispatch completed for route: ${routeName}, waiting time: ${waitingMinutes} minutes`
        });
        
        console.log(`✅ Dispatcher - HP service time recorded for process ${processId}: ${waitingMinutes} minutes`);
      } catch (err) {
        console.error('❌ Failed to record Dispatcher service time:', err);
        // Don't fail the completion if service time recording fails
      }
      
      successToast('Route completed successfully.');
      fetchAssignedRoutes();
      fetchStats();
      
    } catch (err) {
      console.error('Complete dispatch error:', err);
      MySwal.fire('Error', 'Failed to complete route.', 'error');
    }
  };

  // Access control
  if (!isDispatcher) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Access Denied</Typography>
          <Typography>
            This page is restricted to Dispatcher - HP role only.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            <strong>Current JobTitle:</strong> "{userJobTitle}"
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <style>
        {`
          .dispatch-card {
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
          }
          .dispatch-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-left-color: #4caf50;
          }
          .stats-card {
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white;
            border-radius: 16px;
          }
          .stats-card-2 {
            background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
            color: white;
            border-radius: 16px;
          }
          .stats-card-3 {
            background: linear-gradient(135deg, #2196f3 0%, #42a5f5 100%);
            color: white;
            border-radius: 16px;
          }
          .header-gradient {
            background: #f5f5f5;
            color: #333;
            border-bottom: 1px solid #e0e0e0;
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
                <DispatchIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
                  Dispatch Management
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Manage assigned routes and mark them as completed
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card className="stats-card" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <RouteIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalAssigned || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Assigned Routes
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className="stats-card-2" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <CompleteIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.completedDispatches || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completed
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className="stats-card-3" sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <CalendarTodayIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {currentEthiopianMonth}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {currentEthiopianYear}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading Progress */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Type Filter */}
        <Card sx={{ mb: 2, p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body2" fontWeight="bold" color="text.secondary">Process Type:</Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
              >
                <MenuItem value="Regular">HP Regular</MenuItem>
                <MenuItem value="Emergency">Emergency</MenuItem>
                <MenuItem value="Breakdown">Breakdown</MenuItem>
                <MenuItem value="Vaccine">Vaccine</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Routes Table */}
        <Card className="dispatch-card">
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <RouteIcon color="primary" />
                <Typography variant="h6">Routes with Vehicle Assignments</Typography>
                <Chip 
                  label={`${routeData.length} routes`} 
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
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <RouteIcon fontSize="small" />
                      <span>Route</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BusinessIcon fontSize="small" />
                      <span>Facilities</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <VehicleIcon fontSize="small" />
                      <span>Vehicle</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <DriverIcon fontSize="small" />
                      <span>Driver</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <DelivererIcon fontSize="small" />
                      <span>Deliverer</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                      <CompleteIcon fontSize="small" />
                      <span>Status</span>
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {routeData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((route, index) => {
                  // Check if this route has passed dispatch stage (already completed)
                  const isInactive = route.process_status === 'dispatch_completed';
                  
                  return (
                  <TableRow 
                    key={route.process_id} 
                    hover 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      bgcolor: isInactive ? 'grey.100' : 'inherit',
                      opacity: isInactive ? 0.6 : 1
                    }}
                  >
                    <TableCell>
                      <Chip   
                        label={(page * rowsPerPage) + index + 1} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {route.route_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {route.facilities && route.facilities.length > 0 ? (
                          <Box>
                            <Typography variant="body2" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                              {route.facilities.length} Facilities
                            </Typography>
                            {route.facilities.map((facility, idx) => (
                              <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                                • {facility.facility_name}
                              </Typography>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No facilities data
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {route.vehicle_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {route.plate_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {route.driver_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {route.deliverer_name || 'Not assigned'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {isInactive ? (
                        <Chip 
                          label="Passed to Documentation" 
                          color="info" 
                          size="small" 
                          variant="outlined"
                        />
                      ) : (
                        <Button 
                          variant="outlined" 
                          color="success" 
                          size="small" 
                          startIcon={<CompleteIcon />} 
                          onClick={() => handleCompleteDispatch(route.process_id, route.route_name)}
                          sx={{ borderRadius: 2 }}
                        >
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination 
              component="div" 
              count={routeData.length} 
              rowsPerPage={rowsPerPage} 
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </TableContainer>
        </Card>
      </Container>
    </>
  );
};

export default DispatchManagement;