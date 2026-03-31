import React, { useEffect, useState, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
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
  useLayoutEffect(() => {
    document.body.classList.add('tv-display');
    return () => document.body.classList.remove('tv-display');
  }, []);

  const [searchParams] = useSearchParams();
  const branchParam = searchParams.get('branch_code') || '';
  const [customers, setCustomers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  const audioQueueRef = useRef([]);
  const isPlayingAudio = useRef(false);
  const lastCallTimes = useRef(new Map());
  const scrollRef = useRef(null);
  const scrollPosRef = useRef(0);
  const rafRef = useRef(null);

  const scrollCallbackRef = useCallback((el) => {
    scrollRef.current = el;
    if (!el) { cancelAnimationFrame(rafRef.current); return; }
    cancelAnimationFrame(rafRef.current);
    const step = () => {
      scrollPosRef.current += 0.8;
      const half = el.scrollHeight / 2;
      if (scrollPosRef.current >= half) scrollPosRef.current = 0;
      el.style.transform = `translateY(-${scrollPosRef.current}px)`;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [custRes, facRes] = await Promise.all([
        axios.get(`${API_URL}/api/tv-display-customers`, { timeout: 5000, params: branchParam ? { branch_code: branchParam } : {} }),
        axios.get(`${API_URL}/api/facilities`,            { timeout: 5000, params: branchParam ? { branch_code: branchParam } : {} })
      ]);
      setCustomers(prev => {
        const next = custRes.data;
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
      setFacilities(prev => {
        const next = facRes.data;
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    } catch (error) {
      console.error('TvCustomer Fetch Error:', error.message || error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [branchParam]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Active orders ──────────────────────────────────────────────────────────
  const activeOrders = useMemo(() => {
    try {
      const allOrders = [];
      customers.forEach(cust => {
        try {
          const globalStatus = (cust.status || '').toLowerCase();
          if (globalStatus === 'completed' || globalStatus === 'canceled') return;

          const storeDetails = cust.store_details || {};
          const assignedStores = cust.assigned_stores || [];

          assignedStores.forEach(storeKey => {
            const storeInfo = storeDetails[storeKey];
            if (!storeInfo) return;

            const ewmStatus      = (storeInfo.ewm_status      || '').toLowerCase();
            const dispatchStatus = (storeInfo.dispatch_status || '').toLowerCase();

            let statusLabel = 'WAITING';
            let themeColor  = '#00d2ff';
            let Icon        = PrecisionManufacturingIcon;
            let isCalling   = false;
            let currentStep = 0;

            const processFlow = [
              { name: 'Registration', status: 'completed',  color: '#00b894' },
              { name: 'O2C Process',  status: 'completed',  color: '#00b894' },
              { name: 'EWM Process',  status: 'pending',    color: '#636e72' },
              { name: 'Dispatch',     status: 'pending',    color: '#636e72' },
              { name: 'Exit Permit',  status: 'pending',    color: '#636e72' }
            ];

            if (ewmStatus === 'started') {
              processFlow[2].status = 'in_progress'; processFlow[2].color = '#0984e3';
              currentStep = 2; statusLabel = `${storeKey} STORE PROCESSING`;
              themeColor = '#0984e3'; Icon = PrecisionManufacturingIcon;
            } else if (ewmStatus === 'completed') {
              processFlow[2].status = 'completed'; processFlow[2].color = '#00b894';
              currentStep = 3; statusLabel = `${storeKey} READY FOR DISPATCH`;
              themeColor = '#00b894'; Icon = CheckCircleOutlineIcon;
            }

            if (dispatchStatus === 'started') {
              processFlow[3].status = 'in_progress'; processFlow[3].color = '#9c27b0';
              currentStep = 3; statusLabel = `${storeKey} DISPATCH IN PROGRESS`;
              themeColor = '#9c27b0'; Icon = LocalShippingIcon;
            } else if (dispatchStatus === 'notifying') {
              processFlow[3].status = 'in_progress'; processFlow[3].color = '#ff3f34';
              currentStep = 3; statusLabel = `${storeKey} READY FOR PICKUP`;
              themeColor = '#ff3f34'; Icon = NotificationsActiveIcon; isCalling = true;
            } else if (dispatchStatus === 'almost_there') {
              processFlow[3].status = 'in_progress'; processFlow[3].color = '#ff9800';
              currentStep = 3; statusLabel = `${storeKey} ALMOST THERE`;
              themeColor = '#ff9800'; Icon = LocalShippingIcon;
            } else if (dispatchStatus === 'completed') {
              return;
            }

            if (globalStatus === 'o2c_completed' && ewmStatus === 'pending') {
              statusLabel = `${storeKey} PROCESSING STARTED`;
              themeColor = '#636e72'; Icon = AssignmentIcon; currentStep = 1;
            }

            allOrders.push({
              ...cust, statusLabel, themeColor, isCalling, Icon,
              processFlow, currentStep, assignedStore: storeKey,
              storeOdns: storeInfo.odns || [],
              uniqueKey: `${cust.id}-${storeKey}`
            });
          });
        } catch (e) { console.error('Error processing customer:', e, cust); }
      });

      return allOrders
        .sort((a, b) => new Date(a.started_at || 0) - new Date(b.started_at || 0))
        .map((cust, index) => ({ ...cust, displayTicket: index + 1 }));
    } catch (e) {
      console.error('Error in activeOrders processing:', e);
      return [];
    }
  }, [customers]);

  // ── Audio ──────────────────────────────────────────────────────────────────
  const playNumber = useCallback(async (number) => {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(`/audio/amharic/${number}.mp3`);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      } catch { resolve(); }
    });
  }, []);

  const activeOrdersRef = useRef([]);
  activeOrdersRef.current = activeOrders;

  const processQueueRef = useRef(null);

  const processQueue = useCallback(async () => {
    try {
      if (isPlayingAudio.current || audioQueueRef.current.length === 0) return;
      isPlayingAudio.current = true;
      const next = audioQueueRef.current.shift();
      // next is { id, ticket } — use stored ticket so number matches what's on screen
      const ticket = next?.ticket ?? activeOrdersRef.current.find(c => c?.id === next?.id)?.displayTicket;
      if (ticket) await playNumber(ticket);
      setTimeout(() => {
        isPlayingAudio.current = false;
        if (audioQueueRef.current.length > 0 && processQueueRef.current) processQueueRef.current();
      }, 1500);
    } catch { isPlayingAudio.current = false; }
  }, [playNumber]);

  processQueueRef.current = processQueue;

  useEffect(() => {
    if (!audioStarted) return;
    const checkInterval = setInterval(() => {
      const now = Date.now();
      activeOrdersRef.current.forEach(cust => {
        if (cust && cust.isCalling && cust.id) {
          const lastTime = lastCallTimes.current.get(cust.id) || 0;
          if (now - lastTime >= 15000 && !audioQueueRef.current.find(q => q.id === cust.id)) {
            audioQueueRef.current.push({ id: cust.id, ticket: cust.displayTicket });
            lastCallTimes.current.set(cust.id, now);
          }
        } else if (cust && !cust.isCalling && cust.id) {
          lastCallTimes.current.delete(cust.id);
        }
      });
      processQueue();
    }, 2000);
    return () => clearInterval(checkInterval);
  }, [audioStarted, processQueue]);

  // ── RAF scroll — must be declared before any conditional return ────────────
  const callingOrders = activeOrders.filter(o => o.isCalling);
  const regularOrders = activeOrders.filter(o => !o.isCalling);
  const shouldScroll  = regularOrders.length > 2;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !shouldScroll) return;
    cancelAnimationFrame(rafRef.current);
    const step = () => {
      scrollPosRef.current += 0.8;
      const half = el.scrollHeight / 2;
      if (scrollPosRef.current >= half) scrollPosRef.current = 0;
      el.style.transform = `translateY(-${scrollPosRef.current}px)`;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [shouldScroll, regularOrders.length]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getFacilityWithStore = (facilityId, storeKey) => {
    try {
      const facilityName = facilities.find(f => f && f.id === facilityId)?.facility_name || 'Customer';
      return { storeKey: storeKey || 'AA1', facilityName };
    } catch { return { storeKey: 'AA1', facilityName: 'Customer' }; }
  };

  // ── Early return (after all hooks) ────────────────────────────────────────
  if (!audioStarted) return (
    <Box sx={{ height: '100vh', width: '100vw', bgcolor: '#010a14', display: 'flex',
      justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0 }}>
      <Button variant="outlined" sx={{ color: '#00d2ff', borderColor: '#00d2ff', px: 4, py: 2, fontWeight: 'bold' }}
        onClick={async () => {
          try {
            const unlock = new Audio('/audio/amharic/1.mp3');
            unlock.volume = 0.01;
            await unlock.play();
            unlock.pause();
            unlock.currentTime = 0;
          } catch (_) {}
          setAudioStarted(true);
        }}>
        START SYSTEM MONITOR
      </Button>
    </Box>
  );

  // ── Row component ──────────────────────────────────────────────────────────
  const RowItem = ({ cust, isSpecial }) => {
    if (!cust || !cust.facility_id) return null;
    const facilityInfo = getFacilityWithStore(cust.facility_id, cust.assignedStore || 'AA1');
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '70px 1fr 0.8fr 80px', sm: '140px 2.5fr 1.2fr 180px' },
        gap: { xs: 0.5, sm: 2 }, mb: 2,
        animation: isSpecial ? 'vibrantGlow 1.5s infinite alternate' : 'none',
        opacity: isSpecial ? 1 : 0.95, minHeight: { xs: '70px', sm: '110px' } }}>
        <Box sx={{ height: { xs: '60px', sm: '90px' }, bgcolor: '#011122', borderRadius: '15px 0 0 15px',
          border: `2px solid ${cust.themeColor}`, display: 'flex', justifyContent: 'center',
          alignItems: 'center', position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', bgcolor: cust.themeColor }} />
          <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff', fontSize: { xs: '2rem', sm: '3.5rem' } }}>{cust.displayTicket}</Typography>
        </Box>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', px: { xs: 1, sm: 3 }, py: { xs: 1, sm: 2 },
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          border: `1px solid ${cust.themeColor}33`, minHeight: { xs: '60px', sm: '90px' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 }, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ color: cust.themeColor, fontWeight: 'bold',
              backgroundColor: `${cust.themeColor}22`, px: { xs: 0.8, sm: 2 }, py: { xs: 0.3, sm: 0.8 },
              borderRadius: 2, border: `2px solid ${cust.themeColor}`, fontSize: { xs: '0.7rem', sm: '1.4rem' } }}>
              {facilityInfo.storeKey}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff', textTransform: 'uppercase',
              whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: 1.3, flex: 1,
              fontSize: { xs: '0.75rem', sm: '1.8rem' } }}>
              {facilityInfo.facilityName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
            {cust.processFlow?.map((step, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Box sx={{ width: { xs: 6, sm: 10 }, height: { xs: 6, sm: 10 }, borderRadius: '50%',
                  bgcolor: step.status === 'completed' ? '#00b894' : step.status === 'in_progress' ? step.color : '#444',
                  border: index === cust.currentStep ? `2px solid ${cust.themeColor}` : 'none' }} />
                {index < cust.processFlow.length - 1 && <Box sx={{ width: { xs: 8, sm: 14 }, height: 2, bgcolor: '#444' }} />}
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ bgcolor: `${cust.themeColor}22`, display: 'flex', gap: { xs: 0.5, sm: 2 },
          justifyContent: 'center', alignItems: 'center', border: `1px solid ${cust.themeColor}66`,
          flexDirection: 'column', py: { xs: 1, sm: 2 }, px: { xs: 0.5, sm: 1 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexDirection: 'column' }}>
            <cust.Icon sx={{ color: cust.themeColor, fontSize: { xs: '1.5rem', sm: '3rem' } }} />
            <Typography sx={{ fontWeight: 'bold', color: '#fff', letterSpacing: 0.5, textAlign: 'center',
              whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: 1.2, fontSize: { xs: '0.6rem', sm: '1.1rem' } }}>
              {cust.statusLabel}
            </Typography>
          </Box>
          <Typography sx={{ color: cust.themeColor, fontWeight: 'bold', fontSize: { xs: '0.55rem', sm: '0.95rem' } }}>
            Step {cust.currentStep + 1} of {cust.processFlow?.length || 5}
          </Typography>
        </Box>
        <Box sx={{ bgcolor: '#011122', border: `2px solid ${cust.themeColor}`, borderRadius: '0 15px 15px 0',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: { xs: '1.8rem', sm: '3.5rem' } }}>
            {dayjs().diff(dayjs(cust.started_at), 'm')}
          </Typography>
          <Typography sx={{ color: cust.themeColor, fontWeight: 'bold', fontSize: { xs: '0.6rem', sm: '1rem' } }}>MIN</Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100vh', width: '100vw',
      background: 'linear-gradient(135deg, #010a14 0%, #021a33 100%)',
      color: '#fff', p: { xs: 1.5, sm: 4 }, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, sm: 3 } }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', fontSize: { xs: '1.2rem', sm: '2.5rem' } }}>EPSS-MT MONITOR</Typography>
          <Typography variant="caption" sx={{ color: '#00d2ff', letterSpacing: { xs: 1, sm: 4 }, fontWeight: 'bold', fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
            REAL-TIME DISPATCH FLOW
          </Typography>
        </Box>
        <img src="/pharmalog-logo.png" alt="EPSS-MT Logo" style={{ height: '40px' }} />
      </Box>

      {callingOrders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {callingOrders.map(cust => <RowItem key={cust.uniqueKey} cust={cust} isSpecial={true} />)}
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0, paddingBottom: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: '#00d2ff' }} size={60} />
          </Box>
        ) : activeOrders.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: '#00b894' }} />
            <Typography variant="h4" sx={{ color: '#00d2ff', fontWeight: 'bold', letterSpacing: 4 }}>NO ACTIVE ORDERS</Typography>
            <Typography sx={{ color: '#636e72', fontSize: '1rem' }}>All processes are up to date</Typography>
          </Box>
        ) : (
          <Box ref={scrollCallbackRef} sx={{ position: 'absolute', width: '100%' }}>
            {regularOrders.map(cust => <RowItem key={cust.uniqueKey} cust={cust} isSpecial={false} />)}
            {shouldScroll && regularOrders.map(cust => <RowItem key={`clone-${cust.uniqueKey}`} cust={cust} isSpecial={false} />)}
          </Box>
        )}
      </Box>

      <style>{`
        @keyframes vibrantGlow {
          0%   { box-shadow: 0 0 20px #ff3f34; }
          100% { box-shadow: 0 0 40px #ff3f34, 0 0 60px #ff3f34; }
        }
        body.tv-display { overflow: hidden !important; }
        .footer { display: none !important; }
      `}</style>
    </Box>
  );
};

export default TvCustomer;
