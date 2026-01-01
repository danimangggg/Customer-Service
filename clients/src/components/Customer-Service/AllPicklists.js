import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Button,
  useMediaQuery,
  Container,
  Card,
  CardHeader,
  Avatar,
  Divider,
  Fade,
  Chip,
  Grid,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import StoreIcon from '@mui/icons-material/Store';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AllPicklists = () => {
  const [picklists, setPicklists] = useState([]);
  const [services, setServices] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [combinedPicklists, setCombinedPicklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const jobTitle = (localStorage.getItem('JobTitle') || '').toLowerCase();
  const userId = Number(localStorage.getItem('UserId')) || null;
  const userStore = (localStorage.getItem('store') || '').toUpperCase();

  const audioRef = useRef(null);
  const notificationIntervalRef = useRef(null);
  const lastPicklistsCountRef = useRef(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pickRes, serviceRes, facilityRes, empRes] = await Promise.all([
        axios.get(`${api_url}/api/getPicklists`),
        axios.get(`${api_url}/api/serviceList`),
        axios.get(`${api_url}/api/facilities`),
        axios.get(`${api_url}/api/get-employee`),
      ]);

      let allPicklists = Array.isArray(pickRes.data) ? pickRes.data : [];

      // ✅ Remove completed picklists
      allPicklists = allPicklists.filter(
        (p) => String(p.status || '').toLowerCase() !== 'completed'
      );

      // ✅ If user is a WIM Operator, show only their assigned picklists
      if (jobTitle.includes('wim operator')) {
        allPicklists = allPicklists.filter(
          (p) => Number(p.operator_id) === userId
        );
      }

      // ✅ If user is an EWM Officer, show only their store picklists
      if (jobTitle.includes('ewm officer')) {
        allPicklists = allPicklists.filter(
          (p) => String(p.store || '').toUpperCase() === userStore
        );
      }

      setPicklists(allPicklists);
      setServices(serviceRes.data || []);
      setFacilities(facilityRes.data || []);
      setEmployees(empRes.data || []);
      lastPicklistsCountRef.current = allPicklists.length;
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [jobTitle, userId, userStore]);

  // 🔹 Combine picklist + facility + operator info
  useEffect(() => {
    const combined = picklists.map((p) => {
      const service = services.find((s) => String(s.id) === String(p.process_id));
      const facility = facilities.find(
        (f) => service && String(f.id) === String(service.facility_id)
      );
      const operator = employees.find(
        (e) => Number(e.id) === Number(p.operator_id)
      );
      return {
        ...p,
        facility,
        operator,
      };
    });
    setCombinedPicklists(combined);
  }, [picklists, services, facilities, employees]);

  // 🔹 Audio setup
  useEffect(() => {
    audioRef.current = new Audio('/audio/notification/notification.mp3');
    audioRef.current.load();

    const unlockAudio = () => {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          window.removeEventListener('click', unlockAudio);
        })
        .catch(() => {});
    };

    window.addEventListener('click', unlockAudio);
    return () => window.removeEventListener('click', unlockAudio);
  }, []);

  // 🔹 Poll for updates
  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        const pickRes = await axios.get(`${api_url}/api/getPicklists`);
        let allPicklists = Array.isArray(pickRes.data) ? pickRes.data : [];

        // Remove completed
        allPicklists = allPicklists.filter(
          (p) => String(p.status || '').toLowerCase() !== 'completed'
        );

        // ✅ WIM Operator: only their assigned
        if (jobTitle.includes('wim operator')) {
          allPicklists = allPicklists.filter(
            (p) => Number(p.operator_id) === userId
          );
        }

        // ✅ EWM Officer: only their store
        if (jobTitle.includes('ewm officer')) {
          allPicklists = allPicklists.filter(
            (p) => String(p.store || '').toUpperCase() === userStore
          );
        }

        if (
          allPicklists.length > lastPicklistsCountRef.current &&
          jobTitle.includes('wim operator')
        ) {
          const newlyAdded =
            allPicklists.length - lastPicklistsCountRef.current;
          triggerNotifications(newlyAdded);
        }

        lastPicklistsCountRef.current = allPicklists.length;
        setPicklists(allPicklists);
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchData, jobTitle, userId, userStore]);

  const triggerNotifications = (newlyAddedCount) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch(() => console.warn('Audio blocked, user interaction needed.'));

      let played = 1;
      const interval = setInterval(() => {
        if (played >= 2) {
          clearInterval(interval);
          return;
        }
        played++;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }, 60000);
    }

    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      new Notification('New Picklist Submitted', {
        body: `${newlyAddedCount} new picklist(s) submitted.`,
      });
    }

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'New Picklist Submitted',
      text: `Check the new picklists list.`,
      showConfirmButton: false,
      timer: 4000,
    });
  };

  const handleComplete = async (picklistId) => {
    const picklist = combinedPicklists.find((p) => p.id === picklistId);
    if (!picklist) return;

    const result = await Swal.fire({
      title: 'Complete Picklist?',
      text: 'This will delete the PDF file and mark it as completed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, complete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      clearInterval(notificationIntervalRef.current);
      if (audioRef.current) audioRef.current.pause();

      await axios.put(`${api_url}/api/completePicklist/${picklistId}`, {
        fileUrl: picklist.url,
        status: 'Completed',
      });

      Swal.fire({ icon: 'success', title: 'Picklist marked as completed' });
      fetchData();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: 'Could not complete picklist',
      });
    }
  };

  const handleView = (url) => window.open(url, '_blank');

  if (loading)
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Fade in={loading}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3
          }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" color="text.secondary">
              Loading picklists...
            </Typography>
          </Box>
        </Fade>
      </Container>
    );

  if (error) 
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography color="error" variant="h6" align="center">
          {error}
        </Typography>
      </Container>
    );

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
          .picklist-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .picklist-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px;
            border-radius: 20px 20px 0 0;
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
          .picklist-item {
            transition: all 0.3s ease;
            border-radius: 16px;
            margin-bottom: 16px;
            border: 1px solid rgba(0,0,0,0.08);
            background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
          }
          .picklist-item:hover {
            transform: translateX(8px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            border-color: rgba(99, 102, 241, 0.3);
          }
          .action-button {
            border-radius: 12px;
            font-weight: 600;
            text-transform: none;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }
        `}
      </style>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card className="picklist-card animate-fade-in" elevation={0}>
          {/* Header Section */}
          <Box className="header-gradient">
            <Stack direction="row" alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 64, 
                height: 64,
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.3)'
              }}>
                <AssignmentIcon fontSize="large" />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 1
                }}>
                  All Picklists
                </Typography>
                <Typography variant="h6" sx={{ 
                  opacity: 0.9, 
                  fontWeight: 300,
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Manage and track picklist submissions
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate('/completed-picklists')}
                className="action-button"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    border: '2px solid rgba(255,255,255,0.5)',
                  }
                }}
              >
                Completed Picklists
              </Button>
            </Stack>
          </Box>

          {/* Content Section */}
          <Box sx={{ p: 4 }}>
            {combinedPicklists.length === 0 ? (
              <Fade in={true}>
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  borderRadius: 3,
                  border: '2px dashed rgba(99, 102, 241, 0.2)'
                }}>
                  <AssignmentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    No picklists submitted yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Picklists will appear here once they are submitted
                  </Typography>
                </Box>
              </Fade>
            ) : (
              <Grid container spacing={3}>
                {combinedPicklists.map((p) => (
                  <Grid item xs={12} key={p.id}>
                    <Card className="picklist-item" elevation={0}>
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={3} alignItems="center">
                          {/* ODN and Main Info */}
                          <Grid item xs={12} md={6}>
                            <Stack spacing={2}>
                              <Box>
                                <Chip 
                                  label={`ODN: ${p.odn}`} 
                                  color="primary" 
                                  variant="filled"
                                  sx={{ 
                                    fontSize: '1rem', 
                                    fontWeight: 'bold',
                                    height: 32,
                                    borderRadius: 2
                                  }} 
                                />
                              </Box>
                              
                              {p.facility && (
                                <Stack spacing={1}>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <LocationOnIcon fontSize="small" color="primary" />
                                    <Typography variant="body1" fontWeight="bold">
                                      {p.facility.facility_name}
                                    </Typography>
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                                    {p.facility.woreda_name}, {p.facility.zone_name}, {p.facility.region_name}
                                  </Typography>
                                </Stack>
                              )}

                              {p.store && (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <StoreIcon fontSize="small" color="secondary" />
                                  <Typography variant="body2" fontWeight="bold" color="secondary.main">
                                    Store: {p.store}
                                  </Typography>
                                </Stack>
                              )}

                              {p.operator && (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <PersonIcon fontSize="small" color="success" />
                                  <Typography variant="body2" fontWeight="bold" color="success.main">
                                    Assigned: {p.operator.full_name}
                                  </Typography>
                                </Stack>
                              )}
                            </Stack>
                          </Grid>

                          {/* Actions */}
                          <Grid item xs={12} md={6}>
                            <Stack 
                              direction={isMobile ? "column" : "row"} 
                              spacing={2} 
                              justifyContent="flex-end"
                              alignItems="center"
                            >
                              <Button
                                variant="outlined"
                                onClick={() => handleView(p.url)}
                                startIcon={<PictureAsPdfIcon />}
                                className="action-button"
                                sx={{ minWidth: 120 }}
                              >
                                View PDF
                              </Button>

                              {jobTitle.includes('wim operator') &&
                                Number(p.operator_id) === userId && (
                                  <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleComplete(p.id)}
                                    startIcon={<CheckCircleIcon />}
                                    className="action-button"
                                    sx={{ minWidth: 120 }}
                                  >
                                    Complete
                                  </Button>
                                )}
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Card>

        {/* Floating Alert Button */}
        {jobTitle.includes('wim operator') && (
          <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
            <Button 
              variant="contained" 
              startIcon={<NotificationsActiveIcon />}
              className="action-button"
              sx={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                borderRadius: 3,
                px: 3,
                py: 1.5,
                fontSize: '0.9rem',
                fontWeight: 'bold',
                boxShadow: '0 8px 24px rgba(255, 107, 107, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ee5a24 0%, #ff6b6b 100%)',
                  boxShadow: '0 12px 32px rgba(255, 107, 107, 0.6)',
                }
              }}
            >
              WIM Operator Alerts Active
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
};

export default AllPicklists;
