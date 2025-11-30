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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
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
    return <CircularProgress sx={{ mt: 5, display: 'block', mx: 'auto' }} />;

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>
        All Picklists
      </Typography>

      {/* ✅ Completed Picklists button (top-right) */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/completed-picklists')}
        >
          Completed Picklists
        </Button>
      </Box>

      <Paper sx={{ p: 2, boxShadow: 3, borderRadius: 3 }}>
        {combinedPicklists.length === 0 ? (
          <Typography>No picklists submitted yet.</Typography>
        ) : (
          <List>
            {combinedPicklists.map((p) => (
              <ListItem
                key={p.id}
                divider
                sx={{
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                <ListItemText
                  primary={`ODN: ${p.odn}`}
                  secondary={
                    <>
                      {p.facility ? (
                        <Typography variant="body2" sx={{ whiteSpace: 'normal' }}>
                          <strong>Facility:</strong> {p.facility.facility_name}
                          <br />
                          <strong>Woreda:</strong> {p.facility.woreda_name}
                          <br />
                          <strong>Zone:</strong> {p.facility.zone_name}
                          <br />
                          <strong>Region:</strong> {p.facility.region_name}
                        </Typography>
                      ) : (
                        'Facility: Unknown'
                      )}

                      {/* 🟩 Added Store Information */}
                      {p.store && (
                        <Typography
                          variant="body2"
                          sx={{ mt: 1, fontWeight: 'bold', color: 'text.secondary' }}
                        >
                          Store: {p.store}
                        </Typography>
                      )}

                      {p.operator && (
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1,
                            fontWeight: 'bold',
                            color: 'primary.main',
                          }}
                        >
                          Assigned Operator: {p.operator.full_name}
                        </Typography>
                      )}
                    </>
                  }
                />

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    mt: isMobile ? 1.5 : 0,
                    flexWrap: 'wrap',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: isMobile ? 'flex-start' : 'flex-end',
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => handleView(p.url)}
                    startIcon={<PictureAsPdfIcon />}
                  >
                    View
                  </Button>

                  {/* ✅ Only assigned WIM Operator can complete */}
                  {jobTitle.includes('wim operator') &&
                    Number(p.operator_id) === userId && (
                      <Button
                        variant="outlined"
                        color="success"
                        onClick={() => handleComplete(p.id)}
                        startIcon={<CheckCircleIcon />}
                      >
                        Complete
                      </Button>
                    )}
                </Stack>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {jobTitle.includes('wim operator') && (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          <Button variant="contained" startIcon={<NotificationsActiveIcon />}>
            WIM Operator Alerts Active
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AllPicklists;
