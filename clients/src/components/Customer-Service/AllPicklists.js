import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AllPicklists = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [picklists, setPicklists] = useState([]);
  const [services, setServices] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const userStore = (localStorage.getItem('store') || '').toUpperCase();
  const jobTitle = (localStorage.getItem('JobTitle') || '').toLowerCase();

  const audioRef = useRef(null);
  const notificationIntervalRef = useRef(null);
  const lastPicklistsCountRef = useRef(0);

  // fetch all data once
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pickRes, serviceRes, facilityRes] = await Promise.all([
        axios.get(`${api_url}/api/getPicklists`),
        axios.get(`${api_url}/api/serviceList`),
        axios.get(`${api_url}/api/facilities`),
      ]);

      const allPicklists = Array.isArray(pickRes.data) ? pickRes.data : [];
      const filtered = allPicklists.filter(p => String(p.store || '').toUpperCase() === userStore);

      setPicklists(filtered);
      lastPicklistsCountRef.current = filtered.length;

      setServices(Array.isArray(serviceRes.data) ? serviceRes.data : []);
      setFacilities(Array.isArray(facilityRes.data) ? facilityRes.data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [userStore]);

  useEffect(() => {
    fetchAll();

    // poll for new picklists
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${api_url}/api/getPicklists`);
        const all = Array.isArray(res.data) ? res.data : [];
        const filtered = all.filter(p => String(p.store || '').toUpperCase() === userStore);

        // new picklists
        if (jobTitle.includes('wim operator') && filtered.length > lastPicklistsCountRef.current) {
          const newlyAdded = filtered.length - lastPicklistsCountRef.current;
          triggerNotifications(newlyAdded);
        }

        lastPicklistsCountRef.current = filtered.length;
        setPicklists(filtered);
      } catch (err) {
        console.error(err);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(notificationIntervalRef.current);
    };
  }, [fetchAll, userStore, jobTitle]);

  const triggerNotifications = (newlyAddedCount) => {
    if (!audioEnabled) return;

    // system notification permission
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      Notification.requestPermission().catch(() => {});
    }

    // setup audio
    if (!audioRef.current) {
      audioRef.current = new Audio('/audio/notification/notification.mp3');
    }

    let fired = 0;
    const maxFires = 2;
    const intervalMs = 60000; // 1 minute

    const fire = () => {
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('New Picklist submitted', {
            body: `${newlyAddedCount} new picklist(s) for ${userStore}`,
          });
        }

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'New picklist(s) submitted',
          text: `Check Submitted Picklists (${userStore})`,
          showConfirmButton: false,
          timer: 4000,
        });

      } catch (e) {
        console.warn(e);
      }
    };

    fire();
    fired++;

    notificationIntervalRef.current = setInterval(() => {
      if (fired >= maxFires) {
        clearInterval(notificationIntervalRef.current);
        return;
      }
      fire();
      fired++;
    }, intervalMs);
  };

  const enableAudio = () => {
    try {
      audioRef.current = new Audio('/audio/notification/notification.mp3');
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAudioEnabled(true);
      }).catch(() => setAudioEnabled(true));
    } catch (e) {
      console.warn('Audio init failed', e);
      setAudioEnabled(true);
    }
  };

  const handleComplete = async (picklist) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will mark the picklist as complete and delete it.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, complete it',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${api_url}/api/deletePicklist/${picklist.id}`, { data: { fileUrl: picklist.url } });
      Swal.fire({ icon: 'success', title: 'Completed', text: 'Picklist deleted.' });
      setPicklists(prev => prev.filter(p => p.id !== picklist.id));

      // stop audio immediately
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      clearInterval(notificationIntervalRef.current);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not complete picklist.' });
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Loading Picklists...</Typography>
    </Box>
  );

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      {!audioEnabled && (
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={enableAudio}>
            Enable Notification Sound
          </Button>
        </Box>
      )}

      <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>All Picklists</Typography>
        {picklists.length === 0 ? (
          <Typography color="text.secondary">No picklists available.</Typography>
        ) : (
          <List>
            {picklists.map(p => {
              const service = services.find(s => String(s.id) === String(p.process_id));
              const facility = facilities.find(f => service && String(f.id) === String(service.facility_id));
              return (
                <React.Fragment key={p.id}>
                  <ListItem divider
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={() => window.open(p.url, '_blank')}>
                          View
                        </Button>
                        <Button variant="outlined" color="error" onClick={() => handleComplete(p)}>
                          Complete
                        </Button>
                      </Stack>
                    }
                  >
                    <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                    <ListItemText
                      primary={`ODN: ${p.odn}`}
                      secondary={
                        facility
                          ? `Facility: ${facility.facility_name} | Woreda: ${facility.woreda_name} | Zone: ${facility.zone_name} | Region: ${facility.region_name}`
                          : 'Facility: Unknown | Woreda: Unknown | Zone: Unknown | Region: Unknown'
                      }
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default AllPicklists;
