import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const PicklistsPage = () => {
  const [picklists, setPicklists] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const userStore = (localStorage.getItem('store') || '').toUpperCase();
  const jobTitle = (localStorage.getItem('JobTitle') || '').toLowerCase();

  const pollIntervalRef = useRef(null);
  const audioRef = useRef(null);
  const lastPicklistsCountRef = useRef(0);

  const fetchFacilities = useCallback(async () => {
    try {
      const facRes = await axios.get(`${api_url}/api/facilities`);
      const facilitiesData = Array.isArray(facRes.data) ? facRes.data : [];
      setFacilities(facilitiesData);
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  }, []);

  const fetchPicklists = useCallback(async () => {
    try {
      const pickRes = await axios.get(`${api_url}/api/getPicklists`);
      const allPicklists = Array.isArray(pickRes.data) ? pickRes.data : [];
      const filtered = allPicklists.filter(
        (p) => String(p.store || '').toUpperCase() === userStore
      );

      const enriched = filtered.map((p) => {
        let fac = null;
        if (p.facility_id) fac = facilities.find(f => f.id === p.facility_id);
        if (!fac && p.facility_name) {
          fac = facilities.find(
            f => f.facility_name?.trim().toLowerCase() === p.facility_name?.trim().toLowerCase()
          );
        }
        return {
          ...p,
          facility_name: fac?.facility_name || 'Unknown',
          woreda_name: fac?.woreda_name || 'Unknown',
          zone_name: fac?.zone_name || '',
          region_name: fac?.region_name || '',
        };
      });

      // Compare IDs and ODN only to prevent unnecessary state updates
      const isDifferent = enriched.length !== picklists.length || enriched.some((p, i) => {
        const old = picklists[i];
        return !old || old.id !== p.id || old.odn !== p.odn || old.url !== p.url;
      });

      if (isDifferent) setPicklists(enriched);

      // Trigger notifications only if new picklists arrived
      if (filtered.length > lastPicklistsCountRef.current) {
        const newCount = filtered.length - lastPicklistsCountRef.current;
        triggerNotifications(newCount);
      }

      lastPicklistsCountRef.current = filtered.length;
    } catch (err) {
      console.error('Error fetching picklists:', err);
    }
  }, [facilities, picklists, userStore]);

  useEffect(() => {
    if (!jobTitle.includes('wim operator') && !jobTitle.includes('ewm officer')) {
      Swal.fire('Access Denied', 'You do not have permission to view this page', 'error');
      return;
    }

    const init = async () => {
      await fetchFacilities();
      await fetchPicklists();
      setLoading(false);
    };
    init();

    pollIntervalRef.current = setInterval(() => {
      fetchPicklists();
    }, 5000);

    return () => {
      clearInterval(pollIntervalRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [fetchFacilities, fetchPicklists, jobTitle]);

  const triggerNotifications = (newCount) => {
    try {
      audioRef.current = new Audio('/audio/notification/notification.mp3');
    } catch (e) {
      audioRef.current = null;
    }

    let fired = 0;
    const maxFires = 2;
    const intervalMs = 60000; // 1 minute

    const fire = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('New Picklist submitted', {
            body: `${newCount} new picklist(s) for ${userStore}`,
          });
        } catch (e) {}
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
    };

    fire();
    fired++;

    const intervalId = setInterval(() => {
      if (fired >= maxFires) {
        clearInterval(intervalId);
        return;
      }
      fire();
      fired++;
    }, intervalMs);
  };

  const handleComplete = async (id) => {
    const res = await Swal.fire({
      title: 'Mark as Complete?',
      text: 'This will delete the picklist.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, complete it',
    });

    if (!res.isConfirmed) return;

    try {
      await axios.delete(`${api_url}/api/deletePicklist/${id}`);
      Swal.fire('Completed', 'Picklist has been deleted', 'success');
      setPicklists(prev => prev.filter(p => p.id !== id));
      if (audioRef.current) audioRef.current.pause();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to complete picklist', 'error');
    }
  };

  const handleView = (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading picklists...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Picklists
      </Typography>

      <Paper sx={{ p: 3, boxShadow: 4, borderRadius: 4 }}>
        {picklists.length === 0 ? (
          <Typography color="text.secondary">No picklists available.</Typography>
        ) : (
          <List>
            {picklists.map((p) => (
              <React.Fragment key={p.id}>
                <ListItem
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    mb: 1,
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                  }}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => handleView(p.url)}>
                        View
                      </Button>
                      <Button variant="contained" color="error" onClick={() => handleComplete(p.id)}>
                        Complete
                      </Button>
                    </Stack>
                  }
                >
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`ODN: ${p.odn}`}
                    secondary={
                      <>
                        <Typography variant="body2">
                          Facility: {p.facility_name} | Woreda: {p.woreda_name} | Zone: {p.zone_name} | Region: {p.region_name}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider sx={{ my: 1 }} />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Button variant="contained" startIcon={<NotificationsActiveIcon />} disabled>
          WIM Operator Alerts
        </Button>
      </Box>
    </Box>
  );
};

export default PicklistsPage;
