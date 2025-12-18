import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AssignmentIcon from '@mui/icons-material/Assignment';
import dayjs from 'dayjs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const TvCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);
  
  const audioQueueRef = useRef([]);
  const isPlayingAudio = useRef(false);
  const lastCallTimes = useRef(new Map());
  const storeIdx = 1;

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [custRes, facRes] = await Promise.all([
        axios.get(`${API_URL}/api/serviceList`),
        axios.get(`${API_URL}/api/facilities`)
      ]);
      setCustomers(custRes.data);
      setFacilities(facRes.data);
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeOrders = useMemo(() => {
    const filtered = customers
      .filter(cust => {
        const storeVal = (cust[`store_completed_${storeIdx}`] || '').toLowerCase();
        const globalStatus = (cust.status || '').toLowerCase();
        return storeVal !== '' && storeVal !== 'null' && globalStatus !== 'completed' && globalStatus !== 'canceled';
      })
      .sort((a, b) => new Date(a.started_at) - new Date(b.started_at));

    return filtered.map((cust, index) => {
      const storeVal = (cust[`store_completed_${storeIdx}`] || '').toLowerCase();
      
      let statusLabel = 'WAITING';
      let themeColor = '#00d2ff'; // Default Cyan
      let Icon = PrecisionManufacturingIcon;
      let isCalling = false;

      // Restoring previous labels with the new creative theme
      if (storeVal === 'notifying') {
        statusLabel = 'READY';
        themeColor = '#ff3f34'; 
        Icon = NotificationsActiveIcon;
        isCalling = true;
      } else if (storeVal === 'dispatch_started') {
        statusLabel = 'DISPATCH STARTED';
        themeColor = '#9c27b0'; 
        Icon = LocalShippingIcon;
      } else if (storeVal === 'ewm_started') {
        statusLabel = 'STORE PROCESS STARTED'; 
        themeColor = '#0984e3';
        Icon = PrecisionManufacturingIcon;
      } else if (storeVal === 'ewm_completed') {
        statusLabel = 'STORE PROCESS COMPLETED'; 
        themeColor = '#00b894'; 
        Icon = CheckCircleOutlineIcon;
      } else if (storeVal === 'o2c_completed') {
        statusLabel = 'REQUISITION COMPLETED'; 
        themeColor = '#636e72';
        Icon = AssignmentIcon;
      }

      return { ...cust, displayTicket: index + 1, statusLabel, themeColor, isCalling, Icon };
    });
  }, [customers]);

  const playNumber = useCallback(async (number) => {
    return new Promise((resolve) => {
      const audio = new Audio(`/audio/amharic/${number}.mp3`);
      audio.onended = () => resolve();
      audio.onerror = () => resolve(); 
      audio.play().catch(() => resolve());
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (isPlayingAudio.current || audioQueueRef.current.length === 0) return;
    isPlayingAudio.current = true;
    const nextId = audioQueueRef.current.shift();
    const order = activeOrders.find(c => c.id === nextId);
    if (order) await playNumber(order.displayTicket);
    setTimeout(() => {
      isPlayingAudio.current = false;
      processQueue();
    }, 2000);
  }, [activeOrders, playNumber]);

  useEffect(() => {
    if (!audioStarted) return;
    const now = Date.now();
    activeOrders.forEach(cust => {
      if (cust.isCalling) {
        const lastTime = lastCallTimes.current.get(cust.id) || 0;
        if (now - lastTime > 15000) {
          if (!audioQueueRef.current.includes(cust.id)) audioQueueRef.current.push(cust.id);
          lastCallTimes.current.set(cust.id, now);
        }
      }
    });
    processQueue();
  }, [activeOrders, audioStarted, processQueue]);

  const getFacility = (id) => facilities.find(f => f.id === id)?.facility_name || 'Customer';

  if (!audioStarted) return (
    <Box sx={{ height: '100vh', bgcolor: '#010a14', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Button variant="outlined" sx={{ color: '#00d2ff', borderColor: '#00d2ff', px: 4, py: 2 }} onClick={() => setAudioStarted(true)}>
        START SYSTEM MONITOR
      </Button>
    </Box>
  );

  const callingOrders = activeOrders.filter(o => o.isCalling);
  const regularOrders = activeOrders.filter(o => !o.isCalling);
  const shouldScroll = regularOrders.length > 5;

  const RowItem = ({ cust, isSpecial }) => (
    <Box sx={{ 
      display: 'grid', gridTemplateColumns: '120px 1fr 400px 160px', gap: 2, mb: 2,
      animation: isSpecial ? 'vibrantGlow 1.5s infinite alternate' : 'none',
      opacity: isSpecial ? 1 : 0.95
    }}>
      {/* Ticket Badge */}
      <Box sx={{ 
        height: '80px', bgcolor: '#011122', borderRadius: '15px 0 0 15px', 
        border: `2px solid ${cust.themeColor}`, display: 'flex', 
        justifyContent: 'center', alignItems: 'center', position: 'relative'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', bgcolor: cust.themeColor }} />
        <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff' }}>{cust.displayTicket}</Typography>
      </Box>

      {/* Facility Box */}
      <Box sx={{ 
        bgcolor: 'rgba(255,255,255,0.03)', borderY: '2px solid rgba(255,255,255,0.1)', 
        px: 3, display: 'flex', alignItems: 'center', border: `1px solid ${cust.themeColor}33`
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}>
          {getFacility(cust.facility_id)}
        </Typography>
      </Box>

      {/* Status Label Box */}
      <Box sx={{ 
        bgcolor: `${cust.themeColor}22`, display: 'flex', gap: 2, 
        justifyContent: 'center', alignItems: 'center', border: `1px solid ${cust.themeColor}66`
      }}>
        <cust.Icon sx={{ color: cust.themeColor, fontSize: '2.5rem' }} />
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff', letterSpacing: 1 }}>
          {cust.statusLabel}
        </Typography>
      </Box>

      {/* Timer Box */}
      <Box sx={{ 
        bgcolor: '#011122', border: `2px solid ${cust.themeColor}`, 
        borderRadius: '0 15px 15px 0', display: 'flex', 
        justifyContent: 'center', alignItems: 'center', gap: 1 
      }}>
        <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff' }}>
          {dayjs().diff(dayjs(cust.started_at), 'm')}
        </Typography>
        <Typography variant="caption" sx={{ color: cust.themeColor, fontWeight: 900 }}>MIN</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100vh', 
      background: 'linear-gradient(135deg, #010a14 0%, #021a33 100%)', 
      color: '#fff', p: 4, display: 'flex', flexDirection: 'column', overflow: 'hidden' 
    }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff' }}>EPSS MONITOR</Typography>
          <Typography variant="caption" sx={{ color: '#00d2ff', letterSpacing: 5 }}>REAL-TIME DISPATCH FLOW</Typography>
        </Box>
        <img src="/Epss-logo.png" alt="Logo" style={{ height: '65px' }} />
      </Box>

      {/* FIXED READY ITEMS */}
      {callingOrders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {callingOrders.map((cust) => <RowItem key={cust.id} cust={cust} isSpecial={true} />)}
        </Box>
      )}

      {/* SCROLLING ITEMS */}
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ 
          position: 'absolute', width: '100%', 
          animation: shouldScroll ? `scrollList ${regularOrders.length * 5}s linear infinite` : 'none' 
        }}>
          {regularOrders.map((cust) => <RowItem key={cust.id} cust={cust} isSpecial={false} />)}
          {shouldScroll && regularOrders.map((cust) => <RowItem key={`clone-${cust.id}`} cust={cust} isSpecial={false} />)}
        </Box>
      </Box>

      <style>{`
        @keyframes vibrantGlow { 
          0% { box-shadow: 0 0 5px #ff3f34; transform: scale(1); } 
          100% { box-shadow: 0 0 25px #ff3f34; transform: scale(1.02); } 
        }
        @keyframes scrollList { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
      `}</style>
    </Box>
  );
};

export default TvCustomer;