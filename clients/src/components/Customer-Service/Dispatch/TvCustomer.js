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

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [custRes, facRes] = await Promise.all([
        axios.get(`${API_URL}/api/tv-display-customers`),
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
    
    // Add TV display class to body
    document.body.classList.add('tv-display');
    
    return () => {
      clearInterval(interval);
      document.body.classList.remove('tv-display');
    };
  }, [fetchData]);

  const activeOrders = useMemo(() => {
      try {
        const allOrders = [];

        // Process customers - now using ODN-based store assignments
        customers.forEach(cust => {
          try {
            const globalStatus = (cust.status || '').toLowerCase();
            
            // Skip completed/canceled customers
            if (globalStatus === 'completed' || globalStatus === 'canceled') {
              return;
            }

            // Get store details from ODN data
            const storeDetails = cust.store_details || {};
            const assignedStores = cust.assigned_stores || [];

            // Create an entry for each assigned store
            assignedStores.forEach(storeKey => {
              const storeInfo = storeDetails[storeKey];
              if (!storeInfo) return;

              const ewmStatus = (storeInfo.ewm_status || '').toLowerCase();
              const dispatchStatus = (storeInfo.dispatch_status || '').toLowerCase();

              let statusLabel = 'WAITING';
              let themeColor = '#00d2ff';
              let Icon = PrecisionManufacturingIcon;
              let isCalling = false;
              let currentStep = 0;

              // Define the complete process flow
              const processFlow = [
                { name: 'Registration', status: 'completed', color: '#00b894' },
                { name: 'O2C Process', status: 'completed', color: '#00b894' },
                { name: 'EWM Process', status: 'pending', color: '#636e72' },
                { name: 'Dispatch', status: 'pending', color: '#636e72' },
                { name: 'Exit Permit', status: 'pending', color: '#636e72' }
              ];

              // Update process flow based on actual status
              if (ewmStatus === 'started') {
                processFlow[2].status = 'in_progress';
                processFlow[2].color = '#0984e3';
                currentStep = 2;
                statusLabel = `${storeKey} STORE PROCESSING`;
                themeColor = '#0984e3';
                Icon = PrecisionManufacturingIcon;
              } else if (ewmStatus === 'completed') {
                processFlow[2].status = 'completed';
                processFlow[2].color = '#00b894';
                currentStep = 3;
                statusLabel = `${storeKey} READY FOR DISPATCH`;
                themeColor = '#00b894';
                Icon = CheckCircleOutlineIcon;
              }

              if (dispatchStatus === 'started') {
                processFlow[3].status = 'in_progress';
                processFlow[3].color = '#9c27b0';
                currentStep = 3;
                statusLabel = `${storeKey} DISPATCH IN PROGRESS`;
                themeColor = '#9c27b0';
                Icon = LocalShippingIcon;
              } else if (dispatchStatus === 'notifying') {
                processFlow[3].status = 'in_progress';
                processFlow[3].color = '#ff3f34';
                currentStep = 3;
                statusLabel = `${storeKey} READY FOR PICKUP`;
                themeColor = '#ff3f34';
                Icon = NotificationsActiveIcon;
                isCalling = true;
              } else if (dispatchStatus === 'completed') {
                processFlow[3].status = 'completed';
                processFlow[3].color = '#00b894';
                currentStep = 4;
                statusLabel = `${storeKey} READY FOR EXIT`;
                themeColor = '#f39c12';
                Icon = CheckCircleOutlineIcon;
              }

              // If O2C completed but EWM not started
              if (globalStatus === 'o2c_completed' && ewmStatus === 'pending') {
                statusLabel = `${storeKey} PROCESSING STARTED`;
                themeColor = '#636e72';
                Icon = AssignmentIcon;
                currentStep = 1;
              }

              allOrders.push({
                ...cust,
                statusLabel,
                themeColor,
                isCalling,
                Icon,
                processFlow,
                currentStep,
                assignedStore: storeKey,
                storeOdns: storeInfo.odns || []
              });
            });
          } catch (error) {
            console.error('Error processing customer:', error, cust);
          }
        });

        // Sort all orders by start time and assign display ticket numbers
        return allOrders
          .sort((a, b) => {
            try {
              return new Date(a.started_at || 0) - new Date(b.started_at || 0);
            } catch (error) {
              return 0;
            }
          })
          .map((cust, index) => ({
            ...cust,
            displayTicket: index + 1
          }));
      } catch (error) {
        console.error('Error in activeOrders processing:', error);
        return [];
      }
    }, [customers])

  const playNumber = useCallback(async (number) => {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(`/audio/amharic/${number}.mp3`);
        audio.onended = () => resolve();
        audio.onerror = () => {
          console.error('Audio playback error for number:', number);
          resolve();
        }; 
        audio.play().catch((error) => {
          console.error('Audio play error:', error);
          resolve();
        });
      } catch (error) {
        console.error('Error creating audio:', error);
        resolve();
      }
    });
  }, []);

  const processQueue = useCallback(async () => {
    try {
      if (isPlayingAudio.current || audioQueueRef.current.length === 0) return;
      isPlayingAudio.current = true;
      const nextId = audioQueueRef.current.shift();
      const order = activeOrders.find(c => c && c.id === nextId);
      if (order && order.displayTicket) {
        await playNumber(order.displayTicket);
      }
      setTimeout(() => {
        isPlayingAudio.current = false;
        processQueue();
      }, 2000);
    } catch (error) {
      console.error('Error in processQueue:', error);
      isPlayingAudio.current = false;
    }
  }, [activeOrders, playNumber]);

  useEffect(() => {
    try {
      if (!audioStarted) return;
      const now = Date.now();
      activeOrders.forEach(cust => {
        try {
          if (cust && cust.isCalling && cust.id) {
            const lastTime = lastCallTimes.current.get(cust.id) || 0;
            if (now - lastTime > 15000) {
              if (!audioQueueRef.current.includes(cust.id)) audioQueueRef.current.push(cust.id);
              lastCallTimes.current.set(cust.id, now);
            }
          }
        } catch (error) {
          console.error('Error processing customer audio:', error, cust);
        }
      });
      processQueue();
    } catch (error) {
      console.error('Error in audio useEffect:', error);
    }
  }, [activeOrders, audioStarted, processQueue]);

  const getFacilityWithStore = (facilityId, storeKey) => {
    try {
      const facilityName = facilities.find(f => f && f.id === facilityId)?.facility_name || 'Customer';
      return { storeKey: storeKey || 'AA1', facilityName };
    } catch (error) {
      console.error('Error in getFacilityWithStore:', error);
      return { storeKey: 'AA1', facilityName: 'Customer' };
    }
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
      <Button variant="outlined" sx={{ color: '#00d2ff', borderColor: '#00d2ff', px: 4, py: 2, fontWeight: 'bold' }} onClick={() => setAudioStarted(true)}>
        START SYSTEM MONITOR
      </Button>
    </Box>
  );

  const callingOrders = activeOrders.filter(o => o.isCalling);
  const regularOrders = activeOrders.filter(o => !o.isCalling);
  const shouldScroll = regularOrders.length > 5;

  const RowItem = ({ cust, isSpecial }) => {
    // Add error handling for missing data
    if (!cust || !cust.facility_id) {
      return null;
    }
    
    const facilityInfo = getFacilityWithStore(cust.facility_id, cust.assignedStore || 'AA1');
    
    return (
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: '120px 2fr 1fr 160px', 
        gap: 2, 
        mb: 2,
        animation: isSpecial ? 'vibrantGlow 1.5s infinite alternate' : 'none',
        opacity: isSpecial ? 1 : 0.95,
        minHeight: '100px'
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
          px: 3, py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', 
          border: `1px solid ${cust.themeColor}33`, minHeight: '80px'
        }}>
          {/* Store Badge and Facility Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ 
              color: cust.themeColor, 
              fontWeight: 'bold',
              backgroundColor: `${cust.themeColor}22`,
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              border: `2px solid ${cust.themeColor}`,
              fontSize: '1rem'
            }}>
              {facilityInfo.storeKey}
            </Typography>
            <Typography variant="h5" sx={{ 
              fontWeight: 'bold', 
              color: '#fff', 
              textTransform: 'uppercase', 
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: 1.3,
              overflow: 'visible',
              flex: 1
            }}>
              {facilityInfo.facilityName}
            </Typography>
          </Box>
          
          {/* Progress Steps */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
            {cust.processFlow?.map((step, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: step.status === 'completed' ? '#00b894' : 
                           step.status === 'in_progress' ? step.color : '#444',
                  border: index === cust.currentStep ? `2px solid ${cust.themeColor}` : 'none'
                }} />
                {index < cust.processFlow.length - 1 && (
                  <Box sx={{ width: 12, height: 2, bgcolor: '#444' }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Status Label Box */}
        <Box sx={{ 
          bgcolor: `${cust.themeColor}22`, display: 'flex', gap: 2, 
          justifyContent: 'center', alignItems: 'center', border: `1px solid ${cust.themeColor}66`,
          flexDirection: 'column', py: 2, px: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'column' }}>
            <cust.Icon sx={{ color: cust.themeColor, fontSize: '2.5rem' }} />
            <Typography variant="body1" sx={{ 
              fontWeight: 'bold', 
              color: '#fff', 
              letterSpacing: 1,
              textAlign: 'center',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: 1.2,
              fontSize: '0.9rem'
            }}>
              {cust.statusLabel}
            </Typography>
          </Box>
          {/* Current Step Indicator */}
          <Typography variant="caption" sx={{ color: cust.themeColor, fontWeight: 'bold' }}>
            Step {cust.currentStep + 1} of {cust.processFlow?.length || 5}
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
          <Typography variant="caption" sx={{ color: cust.themeColor, fontWeight: 'bold' }}>MIN</Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw',
      background: 'linear-gradient(135deg, #010a14 0%, #021a33 100%)', 
      color: '#fff', 
      p: 4, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0,
      paddingBottom: 0,
      zIndex: 9999
    }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff' }}>EPSS-MT MONITOR</Typography>
          <Typography variant="caption" sx={{ color: '#00d2ff', letterSpacing: 5, fontWeight: 'bold' }}>REAL-TIME DISPATCH FLOW</Typography>
        </Box>
        <img src="/pharmalog-logo.png" alt="EPSS-MT Logo" style={{ height: '65px' }} />
      </Box>

      {/* FIXED READY ITEMS */}
      {callingOrders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {callingOrders.map((cust) => (
            <RowItem key={cust.id} cust={cust} isSpecial={true} />
          ))}
        </Box>
      )}

      {/* SCROLLING QUEUE */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0, paddingBottom: 2 }}>
        <Box sx={{ 
          position: 'absolute', 
          width: '100%', 
          height: '100%',
          animation: shouldScroll ? `scrollList ${Math.max(regularOrders.length * 4, 15)}s linear infinite` : 'none' 
        }}>
          {regularOrders.map((cust) => <RowItem key={cust.id} cust={cust} isSpecial={false} />)}
          {shouldScroll && regularOrders.map((cust) => <RowItem key={`clone-${cust.id}`} cust={cust} isSpecial={false} />)}
        </Box>
      </Box>

      <style>{`
        @keyframes vibrantGlow { 
          0% { box-shadow: 0 0 20px #ff3f34; } 
          100% { box-shadow: 0 0 40px #ff3f34, 0 0 60px #ff3f34; } 
        }
        @keyframes scrollList { 
          0% { transform: translateY(0); } 
          100% { transform: translateY(-50%); } 
        }
        
        /* Ensure no footer interference on TV displays */
        body.tv-display {
          overflow: hidden !important;
        }
        
        .footer {
          display: none !important;
        }
      `}</style>
    </Box>
  );
};

export default TvCustomer;