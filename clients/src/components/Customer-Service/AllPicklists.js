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
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AllPicklists = () => {
  const [picklists, setPicklists] = useState([]);
  const [services, setServices] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [combinedPicklists, setCombinedPicklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userStore = (localStorage.getItem('store') || '').toUpperCase();
  const jobTitle = (localStorage.getItem('JobTitle') || '').toLowerCase();
  const userId = Number(localStorage.getItem('UserId')) || null;

  const audioRef = useRef(null);
  const notificationIntervalRef = useRef(null);
  const lastPicklistsCountRef = useRef(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isAllowed =
    jobTitle.includes('wim operator') || jobTitle.includes('ewm officer');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pickRes, serviceRes, facilityRes] = await Promise.all([
        axios.get(`${api_url}/api/getPicklists`),
        axios.get(`${api_url}/api/serviceList`),
        axios.get(`${api_url}/api/facilities`),
      ]);

      const allPicklists = Array.isArray(pickRes.data) ? pickRes.data : [];

      // 🔹 Filter picklists based on role
      const filteredPicklists = allPicklists.filter((p) => {
        const sameStore = String(p.store || '').toUpperCase() === userStore;
        if (jobTitle.includes('ewm officer')) return sameStore;
        if (jobTitle.includes('wim operator'))
          return sameStore && Number(p.operator_id) === userId;
        return false;
      });

      setPicklists(filteredPicklists);
      setServices(Array.isArray(serviceRes.data) ? serviceRes.data : []);
      setFacilities(Array.isArray(facilityRes.data) ? facilityRes.data : []);
      lastPicklistsCountRef.current = filteredPicklists.length;
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userStore, jobTitle, userId]);

  // Combine picklist + facility info
  useEffect(() => {
    const combined = picklists.map((p) => {
      const service = services.find(
        (s) => String(s.id) === String(p.process_id)
      );
      const facility = facilities.find(
        (f) => service && String(f.id) === String(service.facility_id)
      );
      return {
        ...p,
        facility,
      };
    });
    setCombinedPicklists(combined);
  }, [picklists, services, facilities]);

  // Preload audio on mount
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

  // Poll for new picklists (without flicker)
  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        const pickRes = await axios.get(`${api_url}/api/getPicklists`);
        const allPicklists = Array.isArray(pickRes.data) ? pickRes.data : [];

        const filteredPicklists = allPicklists.filter((p) => {
          const sameStore = String(p.store || '').toUpperCase() === userStore;
          if (jobTitle.includes('ewm officer')) return sameStore;
          if (jobTitle.includes('wim operator'))
            return sameStore && Number(p.operator_id) === userId;
          return false;
        });

        if (
          filteredPicklists.length > lastPicklistsCountRef.current &&
          jobTitle.includes('wim operator')
        ) {
          const newlyAdded =
            filteredPicklists.length - lastPicklistsCountRef.current;
          triggerNotifications(newlyAdded);
        }

        lastPicklistsCountRef.current = filteredPicklists.length;
        setPicklists(filteredPicklists);
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 10000); // every 10 sec

    return () => clearInterval(interval);
  }, [fetchData, userStore, jobTitle, userId]);

  // 🔔 Trigger audio + Swal + browser notification
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
        body: `${newlyAddedCount} new picklist(s) for ${userStore}`,
      });
    }

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'New Picklist Submitted',
      text: `Check submitted picklists for ${userStore}`,
      showConfirmButton: false,
      timer: 4000,
    });
  };

  const handleComplete = async (picklistId) => {
    const picklist = combinedPicklists.find((p) => p.id === picklistId);
    if (!picklist) return;

    const result = await Swal.fire({
      title: 'Complete Picklist?',
      text: 'This will remove the picklist and stop alerts.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, complete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      clearInterval(notificationIntervalRef.current);
      if (audioRef.current) audioRef.current.pause();

      await axios.delete(`${api_url}/api/deletePicklist/${picklistId}`, {
        data: { fileUrl: picklist.url },
      });

      Swal.fire({ icon: 'success', title: 'Picklist completed' });
      setPicklists((prev) => prev.filter((p) => p.id !== picklistId));
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: 'Could not complete picklist',
      });
    }
  };

  const handleView = (url) => {
    window.open(url, '_blank');
  };

  if (!isAllowed)
    return <Typography color="error">Access Denied</Typography>;

  if (loading)
    return (
      <CircularProgress sx={{ mt: 5, display: 'block', mx: 'auto' }} />
    );

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>
        All Picklists
      </Typography>

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
                    p.facility ? (
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: 'normal',
                            overflowWrap: 'break-word',
                            wordWrap: 'break-word',
                          }}
                        >
                          <strong>Facility:</strong> {p.facility.facility_name}
                          <br />
                          <strong>Woreda:</strong> {p.facility.woreda_name}
                          <br />
                          <strong>Zone:</strong> {p.facility.zone_name}
                          <br />
                          <strong>Region:</strong> {p.facility.region_name}
                        </Typography>
                      </>
                    ) : (
                      'Facility: Unknown'
                    )
                  }
                />

                <Stack
                  direction={isMobile ? 'row' : 'row'}
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
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleComplete(p.id)}
                    startIcon={<DeleteIcon />}
                  >
                    Complete
                  </Button>
                </Stack>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {jobTitle.includes('wim operator') && (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          <Button
            variant="contained"
            startIcon={<NotificationsActiveIcon />}
          >
            WIM Operator Alerts Active
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AllPicklists;
