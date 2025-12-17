import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';
import dayjs from 'dayjs';

// --- CONFIGURATION ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// --- UTILITY FUNCTIONS ---

// Function to check if two arrays of objects have the same content (ULTRA-STABILIZATION)
const arraysAreEqual = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) return false;
    }
    return true;
};

const getUserStoreFromLocalStorage = () => {
    return 'AA1';
};

const getStoreCompletedKey = (userStore) => {
  const storeMap = { 'AA1': 1, 'AA2': 2, 'AA3': 3, 'AA4': 4 };
  const index = storeMap[userStore] || 1; 
  return `store_completed_${index}`; 
};

/**
 * Calculates the elapsed time in Dd Hh Mm Ss format.
 */
const formatWaitingTime = (startedAt) => {
  if (!startedAt) return 'N/A';
  const duration = dayjs().diff(dayjs(startedAt));
  const totalSeconds = Math.floor(duration / 1000);
  
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  result += `${minutes}m ${seconds}s`;
  
  return result.trim();
};

/**
 * Determines the display status and styling.
 */
const getDisplayStatusAndStyle = (cust, userStore) => {
  const primaryStatus = cust.status?.toLowerCase();
  const storeCompletedKey = getStoreCompletedKey(userStore); 
  const storeValue = cust[storeCompletedKey]?.toLowerCase() || '';

  if (primaryStatus === 'completed' || primaryStatus === 'canceled') {
    return { key: 'completed', display: 'COMPLETED (Removed)', color: 'status-removed', bgColor: 'transparent', textColor: '#fff', isFinal: true };
  }
  if (storeValue === 'notifying') { 
    return { key: 'notifying', display: 'CALLING', color: 'status-yellow-glow', bgColor: '#ffc107', textColor: '#212121', isCalling: true };
  }
  if (storeValue === 'dispatching') { 
    return { key: 'dispatching', display: 'DISPATCHING', color: 'status-green', bgColor: '#4caf50', textColor: '#fff' };
  }
  if (storeValue === 'ewm_completed') {
    return { key: 'ewm_completed', display: 'EWM COMPLETED', color: 'status-blue', bgColor: '#2196f3', textColor: '#fff' };
  }
  if (storeValue === 'ewm_started') {
    return { key: 'ewm_started', display: 'EWM STARTED', color: 'status-purple', bgColor: '#9c27b0', textColor: '#fff' };
  }
  if (primaryStatus === 'o2c_completed') {
      return { key: 'o2c_completed', display: 'WAITING', color: 'status-normal', bgColor: '#2f3640', textColor: '#fff' };
  }
  
  return { key: 'o2c_not_started', display: 'N/A', color: 'status-default', bgColor: '#607d8b', textColor: '#fff' };
};

// --- NEW DECOUPLED COMPONENT FOR SMOOTH TIME REFRESH ---
const TimeDisplay = React.memo(({ startedAt }) => {
    const [waitingTime, setWaitingTime] = useState(() => formatWaitingTime(startedAt));

    useEffect(() => {
        if (!startedAt) return;
        // This interval runs every second, but only updates *this* component
        const interval = setInterval(() => {
            setWaitingTime(formatWaitingTime(startedAt));
        }, 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    return (
        <Typography 
            sx={{ 
                color: '#fff', 
                fontWeight: 'bold', 
                fontSize: '1.1rem', 
                textAlign: 'right' 
            }}
        >
            {waitingTime}
        </Typography>
    );
});
// ---------------------------------------------------------


// --- MAIN COMPONENT ---

const PostO2cTvDisplay = () => {
  const [userStore, setUserStore] = useState(null); 
  const [customers, setCustomers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(dayjs().format('dddd, MMMM D, YYYY — hh:mm:ss A'));
  const lastCallingCountRef = useRef(0); 
  const audioRef = useRef(null); 

  // --- AUDIO LOGIC ---
  const playAlert = useCallback(() => { 
      if (audioRef.current) {
          audioRef.current.play().catch(error => {
              console.warn("Audio autoplay blocked or failed:", error.message);
          });
      }
  }, []);

  useEffect(() => {
    const store = getUserStoreFromLocalStorage();
    setUserStore(store);
  }, []);

  // Step 2: Data Fetching (ULTRA-STABILIZED)
  const fetchData = useCallback(async () => {
    if (!userStore) return; 
    setLoading(true);

    try {
        const [custRes, facRes] = await Promise.all([
            axios.get(`${API_URL}/api/serviceList`), 
            axios.get(`${API_URL}/api/facilities`),
        ]);

        const newCustomers = custRes.data;
        const newFacilities = facRes.data;
        
        // STABILIZATION 1: Customers
        setCustomers(prevCustomers => arraysAreEqual(prevCustomers, newCustomers) ? prevCustomers : newCustomers);
        
        // STABILIZATION 2: Facilities
        setFacilities(prevFacilities => arraysAreEqual(prevFacilities, newFacilities) ? prevFacilities : newFacilities);

    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        setLoading(false);
    }
  }, [userStore]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); 
    return () => clearInterval(interval);
  }, [fetchData]);

  // Global Time update logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('dddd, MMMM D, YYYY — hh:mm:ss A'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // --- Data Filtering and Processing (Memoized) ---
  const activeOrders = useMemo(() => {
    if (!userStore) return [];

    return customers
      .map(cust => ({
        ...cust,
        currentStatus: getDisplayStatusAndStyle(cust, userStore)
      }))
      .filter(cust => {
        const primaryStatus = cust.status?.toLowerCase();
        const hasStarted = primaryStatus === 'o2c_completed' || cust.currentStatus.key !== 'o2c_not_started';
        const hasCompleted = cust.currentStatus.isFinal;
        
        return hasStarted && !hasCompleted;
      })
      .sort((a, b) => new Date(a.started_at) - new Date(b.started_at));
  }, [customers, userStore]);

  
  // --- AUDIO ALERT TRIGGER ---
  useEffect(() => {
    const currentCallingCount = activeOrders.filter(cust => cust.currentStatus.isCalling).length;
    const lastCount = lastCallingCountRef.current;
    
    if (currentCallingCount > lastCount) {
      playAlert();
    }
    
    lastCallingCountRef.current = currentCallingCount;
  }, [activeOrders, playAlert]); 


  const getFacility = (id) => facilities.find((f) => f.id === id);
  
  const getOrderIndex = useCallback((orderId) => {
    return activeOrders.findIndex(c => c.id === orderId);
  }, [activeOrders]);

  const renderCustomerCard = (cust, index) => {
    const facility = getFacility(cust.facility_id);
    const statusData = cust.currentStatus;
    const isCalling = statusData.isCalling;

    const cardBgColor = statusData.bgColor;
    const textColor = statusData.textColor;
    const customerNumber = getOrderIndex(cust.id) + 1; 

    return (
      <Box
        key={`${cust.id}-${index}`}
        sx={{
          backgroundColor: cardBgColor,
          borderRadius: 1.5,
          // Row size fix
          padding: '16px 16px', 
          minHeight: '60px',
          display: 'grid',
          // Column setup: Order, Customer/Facility, Status, Time
          gridTemplateColumns: '0.5fr 2fr 2fr 1fr', 
          alignItems: 'center',
          px: 2,
          transition: 'all 0.2s ease-in-out',
          animation: isCalling ? 'glowPulse 1.5s infinite alternate' : 'none',
          boxShadow: isCalling ? '0 0 12px #ffc107' : 'none',
          '&:hover': {
            boxShadow: `0 0 15px rgba(0, 229, 255, 0.7), 0 0 8px ${isCalling ? '#ffc107' : '#00e5ff'}`,
            transform: 'translateY(-2px)',
          }
        }}
      >
        <Typography sx={{ color: textColor, fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'left' }}>
          {customerNumber}
        </Typography>
        
        {/* FACILITY NAME: Text Wrapping enabled */}
        <Typography 
          sx={{ 
            color: textColor, 
            fontWeight: 'bold', 
            fontSize: '1.1rem',
            wordBreak: 'break-word', 
            whiteSpace: 'normal',   
            textAlign: 'left',
            pl: 1
          }}
        >
          {facility?.facility_name || 'N/A'}
        </Typography>
        
        {/* STATUS: Text Wrapping enabled */}
        <Typography 
            sx={{ 
                color: textColor, 
                fontWeight: 'bold', 
                fontSize: '1.2rem', 
                textAlign: 'left', 
                pl: 1,
                wordBreak: 'break-word', 
                whiteSpace: 'normal',
            }}
        >
          {statusData.display} 
        </Typography>
        
        {/* TIME FIX: Use the decoupled TimeDisplay component */}
        <TimeDisplay startedAt={cust.started_at} />
      </Box>
    );
  };
  
  if (loading || !userStore) { 
    return (
      <Box sx={{ height: '100vh', bgcolor: '#0d131f', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  const callingOrders = activeOrders.filter(cust => cust.currentStatus?.isCalling);
  const otherOrders = activeOrders.filter(cust => !cust.currentStatus?.isCalling);

  const animationDuration = otherOrders.length > 0 ? `${otherOrders.length * 3}s` : '0s';
  const shouldScroll = otherOrders.length > 5;
  
  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: '#0d131f',
        color: '#fff',
        p: 2,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
        overflowX: 'hidden'
      }}
    >
      {/* AUDIO FIX: Hidden HTML5 Audio Element (Ensure the 'src' path is correct) */}
      <audio ref={audioRef} src="/path/to/your/alert_sound.mp3" preload="auto" />

      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          mb: 2,
          p: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e0f7fa', textAlign: 'left' }}>
          Post-O2C Process Tracking (Store: {userStore})
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          <img src="/Epss-logo.png" alt="EPSS Logo" style={{ height: '60px', width: 'auto' }} />
        </Box>
        <Typography
          sx={{
            fontSize: { xs: '0.7rem', sm: '0.9rem', md: '1rem' },
            fontWeight: 'bold',
            color: '#e0f7fa',
            textAlign: 'right'
          }}
        >
          {currentTime}
        </Typography>
      </Box>

      {activeOrders.length === 0 ? (
        <Typography variant="h6" sx={{ mt: 5, color: '#e0f7fa' }}>
          No orders currently in the Post-O2C process.
        </Typography>
      ) : (
        <Box
          key="tv-display-container" 
          sx={{
            flexGrow: 1,
            width: '98vw',
            maxWidth: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 2,
            p: 1,
            overflow: 'hidden',
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
            display: 'grid',
            // LAYOUT FIX: Main list (2fr) is wider than the legend (1fr)
            gridTemplateColumns: '2fr 1fr', 
            gap: '16px',
          }}
        >
          <Box
            sx={{
              overflowY: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Static Header */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '0.5fr 2fr 2fr 1fr', 
                alignItems: 'center',
                bgcolor: '#1a1a1a',
                borderRadius: '8px 8px 0 0',
                p: 1.5,
                mb: 0.8,
                fontWeight: 'bold',
                fontSize: '1rem',
                color: '#bbb',
              }}
            >
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left' }}>Order</Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', pl: 1 }}>Customer/Facility</Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', pl: 1 }}>Current Status</Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'right' }}>Process Time</Typography>
            </Box>

            {/* Static "Calling" Orders Section */}
            {callingOrders.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mb: 1 }}>
                {callingOrders.map((cust, index) => renderCustomerCard(cust, index))}
              </Box>
            )}

            {/* Scrolling "Other" Orders Section */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'hidden',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  animation: shouldScroll ? `scroll-up ${animationDuration} linear infinite` : 'none',
                  '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                  },
                }}
              >
                {otherOrders.length > 0 && otherOrders.map((cust, index) => renderCustomerCard(cust, index))}
                {shouldScroll && otherOrders.length > 0 && otherOrders.map((cust, index) => renderCustomerCard(cust, index))}
              </Box>
            </Box>
          </Box>
            
          {/* Status Key / Legend (MADE LARGER) */}
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: 2,
              p: 3, 
            }}
          >
            <Typography variant="h5" sx={{ color: '#00e5ff', fontWeight: 'bold', mb: 3, fontSize: '1.4rem' }}>
              Process Status Legend
            </Typography>
            {[
              { status: 'WAITING', color: '#2f3640', desc: 'O2C Completed' },
              { status: 'EWM STARTED', color: '#9c27b0', desc: 'EWM Started (Purple)' },
              { status: 'EWM COMPLETED', color: '#2196f3', desc: 'Warehouse Done (Blue)' },
              { status: 'DISPATCHING', color: '#4caf50', desc: 'Loading/Dispatch (Green)' },
              { status: 'CALLING', color: '#ffc107', desc: 'Customer Notified (Yellow)' },
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '90%' }}>
                <Box sx={{ width: 24, height: 24, bgcolor: item.color, borderRadius: 1, mr: 1.5, boxShadow: '0 0 5px rgba(255,255,255,0.3)' }} />
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', flexGrow: 1, fontSize: '1rem' }}>
                  {item.status}
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc', ml: 1, textAlign: 'right', fontSize: '0.85rem' }}>
                  {item.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <style>
        {`
          @keyframes glowPulse {
            from {
              box-shadow: 0 0 10px #ffc107;
            }
            to {
              box-shadow: 0 0 20px 5px #ffc107;
            }
          }
          
          @keyframes scroll-up {
            from { transform: translateY(0); }
            to { transform: translateY(-50%); }
          }
        `}
      </style>
    </Box>
  );
};

export default PostO2cTvDisplay;