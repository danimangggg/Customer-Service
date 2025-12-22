import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import dayjs from 'dayjs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const TvCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [audioStarted, setAudioStarted] = useState(false);

  const announcementCounts = useRef(new Map());
  const lastAnnouncementTime = useRef(new Map());
  const audioCtx = useRef(null);
  const isPlayingRef = useRef(false);
  const queue = useRef([]);

  const dynamicStoreKey = useMemo(() => {
    const storeVal = localStorage.getItem('store') || 'AA1';
    const num = storeVal.replace(/^\D+/g, ''); 
    return `store_completed_${num}`;
  }, []);

  const playNotification = async () => {
    const url = `${window.location.origin}/audio/notification/notification.mp3`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`File not found: ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.current.decodeAudioData(arrayBuffer);
      const source = audioCtx.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.current.destination);
      return new Promise((resolve) => {
        source.onended = resolve;
        source.start(0);
      });
    } catch (e) { console.error("Audio Error:", e.message); }
  };

  const processQueue = useCallback(async () => {
    if (isPlayingRef.current || queue.current.length === 0) return;
    isPlayingRef.current = true;
    queue.current.shift();
    await playNotification();
    isPlayingRef.current = false;
    if (queue.current.length > 0) processQueue();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [custRes, facRes] = await Promise.all([
        axios.get(`${API_URL}/api/serviceList`),
        axios.get(`${API_URL}/api/facilities`)
      ]);
      setCustomers(custRes.data);
      setFacilities(facRes.data);
    } catch (error) { console.error("API Error"); }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeOrders = useMemo(() => {
    return customers
      .filter(cust => {
        const globalStatus = (cust.status || '').toLowerCase();
        const storeStatus = (cust[dynamicStoreKey] || '').toLowerCase();
        return globalStatus === 'ewm_completed' && ['notifying', 'dispatch_started', 'ewm_completed'].includes(storeStatus);
      })
      .map((cust, index) => {
        const statusVal = (cust[dynamicStoreKey] || '').toLowerCase();
        return {
          ...cust,
          displayTicket: index + 1,
          isNotifying: statusVal === 'notifying',
          isEwmCompleted: statusVal === 'ewm_completed'
        };
      });
  }, [customers, dynamicStoreKey]);

  // FIXED: Audio trigger logic is now for "EWM Completed" status
  useEffect(() => {
    if (!audioStarted) return;
    const now = Date.now();
    activeOrders.forEach(cust => {
      if (cust.isEwmCompleted) {
        const count = announcementCounts.current.get(cust.id) || 0;
        const lastTime = lastAnnouncementTime.current.get(cust.id) || 0;
        if (count < 2 && (now - lastTime > 10000)) {
          queue.current.push(cust.id);
          announcementCounts.current.set(cust.id, count + 1);
          lastAnnouncementTime.current.set(cust.id, now);
        }
      }
    });
    if (!isPlayingRef.current && queue.current.length > 0) processQueue();
  }, [activeOrders, audioStarted, processQueue]);

  const handleStart = async () => {
    const Context = window.AudioContext || window.webkitAudioContext;
    audioCtx.current = new Context();
    await audioCtx.current.resume();
    setAudioStarted(true);
  };

  const shouldScroll = activeOrders.length > 6;

  const RowItem = ({ cust }) => {
    let statusLabel = "IN PROGRESS";
    let themeColor = "#00d2ff"; 
    let rowBg = "transparent";

    if (cust.isNotifying) {
      statusLabel = "Ready to Dispatch";
      themeColor = "#fff"; 
      rowBg = "#d32f2f"; // RED BACKGROUND
    } else if (cust.isEwmCompleted) {
      statusLabel = "EWM Completed";
      themeColor = "#f1c40f"; // YELLOW THEME
    }

    return (
      <Box sx={{ 
        display: 'grid', gridTemplateColumns: '100px 1fr 250px 120px', gap: 2, mb: 2.5,
        bgcolor: rowBg,
        borderRadius: '10px',
        animation: (cust.isNotifying || cust.isEwmCompleted) ? 'vibrate 0.3s infinite alternate' : 'none',
        border: cust.isNotifying ? '2px solid #fff' : 'none'
      }}>
        <Box sx={{ height: '65px', border: `2px solid ${themeColor}`, borderRadius: '10px 0 0 10px', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: cust.isNotifying ? 'transparent' : '#011122' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff' }}>{cust.displayTicket}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', px: 3, bgcolor: cust.isNotifying ? 'transparent' : 'rgba(255,255,255,0.07)', borderY: `1.5px solid ${themeColor}44` }}>
          <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1.3rem' }}>
            {facilities.find(f => f.id === cust.facility_id)?.facility_name || 'Customer'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'transparent', borderY: `2px solid ${themeColor}` }}>
          <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: '1.1rem', letterSpacing: '0.5px' }}>
            {statusLabel}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', border: `2px solid ${themeColor}`, borderRadius: '0 10px 10px 0', bgcolor: cust.isNotifying ? 'transparent' : '#011122', gap: 0.8 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff' }}>{dayjs().diff(dayjs(cust.started_at), 'm')}</Typography>
          <Typography variant="body1" sx={{ fontWeight: 800, color: '#fff' }}>MIN</Typography>
        </Box>
      </Box>
    );
  };

  if (!audioStarted) return (
    <Box sx={{ height: '100vh', bgcolor: '#010a14', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Button variant="contained" onClick={handleStart} sx={{ bgcolor: '#f1c40f', color: '#000', fontWeight: 900, px: 6, py: 2.5, fontSize: '1.4rem' }}>
        START MONITOR
      </Button>
    </Box>
  );

  return (
    <Box sx={{ height: '100vh', background: '#010a14', color: '#fff', p: 4, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>Dispatch Monitor</Typography>
        <img src="/Epss-logo.png" alt="Logo" style={{ height: '50px' }} />
      </Box>

      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ 
          position: 'absolute', 
          width: '100%', 
          animation: shouldScroll ? `scrollVertical ${activeOrders.length * 4.8}s linear infinite` : 'none' 
        }}>
          {activeOrders.map((cust) => <RowItem key={cust.id} cust={cust} />)}
          {shouldScroll && activeOrders.map((cust) => <RowItem key={`${cust.id}-clone`} cust={cust} />)}
        </Box>
      </Box>

      <style>{`
        @keyframes vibrate { 0% { transform: translateX(1.5px); } 100% { transform: translateX(-1.5px); } }
        @keyframes scrollVertical {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </Box>
  );
};

export default TvCustomer;