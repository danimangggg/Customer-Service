import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import api from '../../../axiosInstance';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import dayjs from 'dayjs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const TvCustomer = () => {
  const [searchParams] = useSearchParams();
  const branchParam = searchParams.get('branch_code') || '';
  const [customers, setCustomers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [audioStarted, setAudioStarted] = useState(false);

  const announcementCounts = useRef(new Map());
  const lastAnnouncementTime = useRef(new Map());
  const audioCtx = useRef(null);
  const isPlayingRef = useRef(false);
  const queue = useRef([]);

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
        api.get(`${API_URL}/api/tv-display-customers`, { params: branchParam ? { branch_code: branchParam } : {} }),
        api.get(`${API_URL}/api/facilities`, { params: branchParam ? { branch_code: branchParam } : {} })
      ]);
      setCustomers(custRes.data);
      setFacilities(facRes.data);
    } catch (error) { console.error("API Error"); }
  }, [branchParam]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeOrders = useMemo(() => {
    const seen = new Set();
    const orders = [];

    customers.forEach(cust => {
      const storeDetails = cust.store_details || {};

      Object.entries(storeDetails).forEach(([storeKey, storeInfo]) => {
        const ewmStatus = (storeInfo.ewm_status || '').toLowerCase();
        const dispatchStatus = (storeInfo.dispatch_status || '').toLowerCase();

        if (
          ewmStatus === 'completed' &&
          (dispatchStatus === 'pending' || dispatchStatus === 'notifying' || dispatchStatus === 'started' || dispatchStatus === 'almost_there')
        ) {
          const uid = `${cust.id}-${storeKey}`;
          if (!seen.has(uid)) {
            seen.add(uid);
            orders.push({
              ...cust,
              _storeKey: storeKey,
              _storeInfo: storeInfo,
              isNotifying: dispatchStatus === 'notifying',
              isAlmostThere: dispatchStatus === 'almost_there',
              isEwmCompleted: dispatchStatus === 'pending',
            });
          }
        }
      });
    });

    return orders.map((o, i) => ({ ...o, displayTicket: i + 1 }));
  }, [customers]);

  // Audio trigger logic for "EWM Completed / pending dispatch" status
  useEffect(() => {
    if (!audioStarted) return;
    const now = Date.now();
    activeOrders.forEach(cust => {
      if (cust.isEwmCompleted) {
        const key = `${cust.id}-${cust._storeKey}`;
        const count = announcementCounts.current.get(key) || 0;
        const lastTime = lastAnnouncementTime.current.get(key) || 0;
        if (count < 2 && (now - lastTime > 10000)) {
          queue.current.push(key);
          announcementCounts.current.set(key, count + 1);
          lastAnnouncementTime.current.set(key, now);
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
      rowBg = "#d32f2f";
    } else if (cust.isAlmostThere) {
      statusLabel = "Almost There";
      themeColor = "#ff9800";
    } else if (cust.isEwmCompleted) {
      statusLabel = "EWM Completed";
      themeColor = "#f1c40f";
    }

    return (
      <Box sx={{ 
        display: 'grid', gridTemplateColumns: '100px 1fr 180px 200px 120px', gap: 2, mb: 2.5,
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

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: cust.isNotifying ? 'transparent' : 'rgba(255,255,255,0.05)', borderY: `1.5px solid ${themeColor}44` }}>
          <Typography sx={{ fontWeight: 700, color: '#4facfe', fontSize: '1.1rem' }}>
            {cust._storeKey}
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
    <Box sx={{ 
      height: '100vh', 
      width: '100vw',
      bgcolor: '#010a14', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0,
      padding: 0
    }}>
      <Button variant="contained" onClick={handleStart} sx={{ bgcolor: '#f1c40f', color: '#000', fontWeight: 900, px: 6, py: 2.5, fontSize: '1.4rem' }}>
        START MONITOR
      </Button>
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw',
      background: '#010a14', 
      color: '#fff', 
      p: 4, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>Dispatch Monitor</Typography>
        <img src="/pharmalog-logo.png" alt="EPSS-MT Logo" style={{ height: '50px' }} />
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