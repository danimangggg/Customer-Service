import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InventoryIcon from '@mui/icons-material/Inventory';
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

  // Determine dynamic store key (AA1 -> store_completed_1)
  const dynamicStoreKey = useMemo(() => {
    const storeVal = localStorage.getItem('store') || 'AA1';
    const num = storeVal.replace(/^\D+/g, ''); 
    return `store_completed_${num}`;
  }, []);

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
    const interval = setInterval(() => fetchData(false), 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // FILTER & SORT LOGIC
  const activeOrders = useMemo(() => {
    const filtered = customers
      .filter(cust => {
        const globalStatus = (cust.status || '').toLowerCase();
        const storeStatus = (cust[dynamicStoreKey] || '').toLowerCase();
        
        // CONDITION 1: Global status must be ewm_completed
        const isGlobalReady = globalStatus === 'ewm_completed';
        
        // CONDITION 2: Store status must be one of the three active dispatch states
        const isValidStoreStatus = ['notifying', 'dispatch_started', 'ewm_completed'].includes(storeStatus);
        
        return isGlobalReady && isValidStoreStatus;
      })
      .sort((a, b) => {
        const sA = (a[dynamicStoreKey] || '').toLowerCase();
        const sB = (b[dynamicStoreKey] || '').toLowerCase();
        
        // Pin notifying items to the top
        if (sA === 'notifying' && sB !== 'notifying') return -1;
        if (sB === 'notifying' && sA !== 'notifying') return 1;
        
        return new Date(a.started_at) - new Date(b.started_at);
      });

    return filtered.map((cust, index) => {
      const storeVal = (cust[dynamicStoreKey] || '').toLowerCase();
      
      let statusLabel = 'READY';
      let themeColor = '#00d2ff'; // Cyan
      let Icon = InventoryIcon;
      let isCalling = false;

      if (storeVal === 'notifying') {
        statusLabel = 'CALLING...';
        themeColor = '#f1c40f'; // Yellow
        Icon = NotificationsActiveIcon;
        isCalling = true;
      } else if (storeVal === 'dispatch_started') {
        statusLabel = 'IN PROGRESS';
        themeColor = '#2ecc71'; // Green
        Icon = LocalShippingIcon;
      }

      return { ...cust, displayTicket: index + 1, statusLabel, themeColor, isCalling, Icon };
    });
  }, [customers, dynamicStoreKey]);

  // Audio Processing
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
        if (now - lastTime > 12000) {
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
      <Button variant="outlined" sx={{ color: '#00d2ff', borderColor: '#00d2ff', fontSize: '1.2rem', px: 4 }} onClick={() => setAudioStarted(true)}>
        START DISPATCH MONITOR
      </Button>
    </Box>
  );

  const callingOrders = activeOrders.filter(o => o.isCalling);
  const regularOrders = activeOrders.filter(o => !o.isCalling);
  const shouldScroll = regularOrders.length > 5;

  const RowItem = ({ cust, isSpecial }) => (
    <Box sx={{ 
      display: 'grid', gridTemplateColumns: '120px 1fr 400px 160px', gap: 2, mb: 2,
      animation: isSpecial ? 'vibrate 0.3s infinite alternate, glow 1.2s infinite alternate' : 'none',
    }}>
      <Box sx={{ height: '85px', bgcolor: '#011122', borderRadius: '15px 0 0 15px', border: `3px solid ${cust.themeColor}`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff' }}>{cust.displayTicket}</Typography>
      </Box>
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid ${cust.themeColor}33`, px: 3, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>{getFacility(cust.facility_id)}</Typography>
      </Box>
      <Box sx={{ bgcolor: `${cust.themeColor}22`, display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', border: `1px solid ${cust.themeColor}66` }}>
        <cust.Icon sx={{ color: cust.themeColor, fontSize: '3rem' }} />
        <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff', letterSpacing: 2 }}>{cust.statusLabel}</Typography>
      </Box>
      <Box sx={{ bgcolor: '#011122', border: `3px solid ${cust.themeColor}`, borderRadius: '0 15px 15px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff' }}>{dayjs().diff(dayjs(cust.started_at), 'm')}</Typography>
        <Typography variant="caption" sx={{ color: cust.themeColor, fontWeight: 900 }}>MIN</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ height: '100vh', background: '#010a14', color: '#fff', p: 4, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 900 }}>DISPATCH MONITOR</Typography>
        <img src="/Epss-logo.png" alt="Logo" style={{ height: '65px' }} />
      </Box>

      {/* Pinned Items */}
      {callingOrders.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {callingOrders.map((cust) => <RowItem key={cust.id} cust={cust} isSpecial={true} />)}
        </Box>
      )}

      {/* Scrolling List */}
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ 
          position: 'absolute', width: '100%', 
          animation: shouldScroll ? `scrollList ${regularOrders.length * 4}s linear infinite` : 'none' 
        }}>
          {regularOrders.map((cust) => <RowItem key={cust.id} cust={cust} isSpecial={false} />)}
          {shouldScroll && regularOrders.map((cust) => <RowItem key={`clone-${cust.id}`} cust={cust} isSpecial={false} />)}
        </Box>
      </Box>

      <style>{`
        @keyframes vibrate { 0% { transform: translate(2px, 2px); } 100% { transform: translate(-2px, -2px); } }
        @keyframes glow { 0% { box-shadow: 0 0 10px #f1c40f; } 100% { box-shadow: 0 0 35px #f1c40f; } }
        @keyframes scrollList { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
      `}</style>
    </Box>
  );
};

export default TvCustomer;