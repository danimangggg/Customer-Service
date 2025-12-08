import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';
import dayjs from 'dayjs';

// NOTE: You must pass the 'userStore' prop to this component (e.g., 'AA1', 'AA2', etc.)
// and an 'apiUrl' prop.

const getStoreCompletedKey = (userStore) => {
  // *** IMPLEMENT YOUR ACTUAL STORE-TO-INDEX MAPPING LOGIC HERE ***
  // Example: AA1 -> 1, AA2 -> 2, etc.
  const storeMap = { 'AA1': 1, 'AA2': 2, 'AA3': 3, 'AA4': 4 };
  const index = storeMap[userStore] || 1; // Default to 1
  return `store_completed_${index}`;
};

/**
 * Determines the display status and styling for an order in the post-O2C flow.
 * It iterates through the required status checks in order and returns the highest one reached.
 * * The DB response for an order is assumed to be an object like:
 * { o2c_completed: true, ewm_started: true, store_completed_1: false, ... }
 */
const getDisplayStatusAndStyle = (orderData, userStore) => {
  const storeCompletedKey = getStoreCompletedKey(userStore);

  // Define the process flow in reverse order of precedence (highest to lowest)
  const statusFlow = [
    // 6. FINAL - Remove from TV (Must be checked first to exit/remove)
    { key: 'dispatch_completed', display: 'COMPLETED', color: 'status-removed', bgColor: 'transparent', textColor: '#fff', isFinal: true },
    // 5. Calling/Notify
    { key: 'dispatch_notify', display: 'CALLING', color: 'status-yellow-glow', bgColor: '#ffc107', textColor: '#212121', isCalling: true },
    // 4. Dispatching
    { key: 'dispatching', display: 'DISPATCHING', color: 'status-green', bgColor: '#4caf50', textColor: '#fff' },
    // 3. EWM Completed (Dynamic Store Check)
    { key: storeCompletedKey, display: 'EWM COMPLETED', color: 'status-purple', bgColor: '#9c27b0', textColor: '#fff' },
    // 2. EWM Started
    { key: 'ewm_started', display: 'EWM STARTED', color: 'status-blue', bgColor: '#2196f3', textColor: '#fff' },
    // 1. Initial State (O2C Completed)
    { key: 'o2c_completed', display: 'WAITING', color: 'status-normal', bgColor: '#2f3640', textColor: '#fff' },
  ];

  // Find the highest status that is marked as true in the database data
  for (const statusDef of statusFlow) {
    // If the key exists in the data and is true, this is the current status.
    if (orderData[statusDef.key]) {
      return statusDef;
    }
  }

  // Fallback if o2c_completed is not true or data is malformed (shouldn't happen for this component)
  return { display: 'N/A', color: 'status-default', bgColor: '#607d8b', textColor: '#fff' };
};

const formatWaitingTime = (startedAt) => {
  if (!startedAt) return 'N/A';
  // Use 'started_at' from the original component as the timestamp to calculate duration
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


const PostO2cTvDisplay = ({ userStore, apiUrl }) => {
  const [customers, setCustomers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(dayjs().format('dddd, MMMM D, YYYY — hh:mm:ss A'));
  
  // Define the required DB status key for filtering
  const storeCompletedKey = getStoreCompletedKey(userStore);

  // Filter orders that have *started* the post-O2C process but are *not yet* completed.
  const activeOrders = customers
    .map(cust => ({
      ...cust,
      currentStatus: getDisplayStatusAndStyle(cust.process_status_data || {}, userStore)
    }))
    .filter(cust => {
      // 1. Must have reached the starting point ('o2c_completed' status)
      // 2. Must NOT have reached the final completion point ('dispatch_completed' status)
      const hasStarted = cust.process_status_data?.o2c_completed === true;
      const hasCompleted = cust.process_status_data?.dispatch_completed === true;
      return hasStarted && !hasCompleted;
    })
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at));


  // Fetching logic, similar to your original component
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, facRes, empRes] = await Promise.all([
          // NOTE: The API endpoint needs to be adapted to return the new process status data.
          // I'm assuming the customer object now includes a 'process_status_data' field
          // for the required checks (e.g., { o2c_completed: true, ewm_started: false, ... }).
          axios.get(`${apiUrl}/api/postO2cServiceList`), // A new, dedicated endpoint is best
          axios.get(`${apiUrl}/api/facilities`),
          axios.get(`${apiUrl}/api/get-employee`)
        ]);
        setCustomers(custRes.data);
        setFacilities(facRes.data);
        setEmployees(empRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // 3-second refresh
    return () => clearInterval(interval);
  }, [apiUrl, userStore]); // Depend on userStore to ensure correct dynamic key is used

  // Time update logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('dddd, MMMM D, YYYY — hh:mm:ss A'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const getFacility = (id) => facilities.find((f) => f.id === id);
  const getOfficerName = (officerId) => {
    const user = employees.find(u => u.id === officerId);
    return user ? user.full_name : 'N/A';
  };
  
  // This is a placeholder for the equivalent of getCustomerIndex in the new context
  const getOrderIndex = useCallback((orderId) => {
    return activeOrders.findIndex(c => c.id === orderId);
  }, [activeOrders]);

  const renderCustomerCard = (cust, index) => {
    const facility = getFacility(cust.facility_id);
    const statusData = cust.currentStatus;
    const isCalling = statusData.isCalling;

    // Use the dynamic styles defined in getDisplayStatusAndStyle
    const cardBgColor = statusData.bgColor;
    const textColor = statusData.textColor;
    
    // The index for the TV display
    const customerNumber = getOrderIndex(cust.id) + 1;

    return (
      <Box
        key={`${cust.id}-${index}`}
        sx={{
          backgroundColor: cardBgColor,
          borderRadius: 1.5,
          padding: '20px 16px',
          minHeight: '60px',
          display: 'grid',
          gridTemplateColumns: '0.5fr 2fr 2fr 1.5fr 1fr',
          alignItems: 'center',
          px: 2,
          transition: 'all 0.2s ease-in-out',
          // Use your original glow pulse keyframe for the CALLING status
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
        <Typography 
          sx={{ 
            color: textColor, 
            fontWeight: 'bold', 
            fontSize: '1.1rem',
            wordBreak: 'break-word',
            textAlign: 'left',
            pl: 1
          }}
        >
          {facility?.facility_name || 'N/A'}
        </Typography>
        <Typography 
          sx={{ 
            color: textColor, 
            fontWeight: 'bold', 
            fontSize: '1.1rem',
            wordBreak: 'break-word',
            textAlign: 'left',
            pl: 1
          }}
        >
          {getOfficerName(cust.assigned_officer_id)}
        </Typography>
        {/* Display the custom mapped status */}
        <Typography sx={{ color: textColor, fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'left', pl: 1 }}>
          {statusData.display} 
        </Typography>
        <Typography sx={{ color: textColor, fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'right' }}>
          {formatWaitingTime(cust.started_at)}
        </Typography>
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ height: '100vh', bgcolor: '#0d131f', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  // Separate list into Calling/Other for static/scrolling sections, similar to your original component
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
          sx={{
            flexGrow: 1,
            width: '98vw',
            maxWidth: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 2,
            p: 1,
            overflow: 'hidden',
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
            display: 'flex',
            gap: '16px',
          }}
        >
          <Box
            sx={{
              flex: 1,
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
                gridTemplateColumns: '0.5fr 2fr 2fr 1.5fr 1fr',
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
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', pl: 1 }}>Assigned Officer</Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', pl: 1 }}>Current Status</Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'right' }}>Process Time</Typography>
            </Box>

            {/* Static "Calling" Orders Section */}
            {callingOrders.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mb: 2 }}>
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
                  gap: '12px',
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
                {/* Duplicate items for continuous scroll effect */}
                {shouldScroll && otherOrders.length > 0 && otherOrders.map((cust, index) => renderCustomerCard(cust, index))}
              </Box>
            </Box>
          </Box>
            
          {/* Status Key / Legend */}
          <Box
            sx={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: 2,
              p: 4,
            }}
          >
            <Typography variant="h5" sx={{ color: '#00e5ff', fontWeight: 'bold', mb: 3 }}>
              Process Status Legend
            </Typography>
            {[
              { status: 'WAITING', color: '#2f3640', desc: 'O2C Completed (Waiting for EWM)' },
              { status: 'EWM STARTED', color: '#2196f3', desc: 'Warehouse Process Started' },
              { status: 'EWM COMPLETED', color: '#9c27b0', desc: 'Warehouse Process Completed' },
              { status: 'DISPATCHING', color: '#4caf50', desc: 'Loading/Dispatch in Progress' },
              { status: 'CALLING', color: '#ffc107', desc: 'Customer/Driver Notified' },
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '80%' }}>
                <Box sx={{ width: 30, height: 30, bgcolor: item.color, borderRadius: 1, mr: 2, boxShadow: '0 0 5px rgba(255,255,255,0.3)' }} />
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold', flexGrow: 1 }}>
                  {item.status}
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc', ml: 1, textAlign: 'right' }}>
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

export default Customer-Dispatch;