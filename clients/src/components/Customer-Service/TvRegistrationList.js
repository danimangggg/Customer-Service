import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import dayjs from 'dayjs';
import { useAmharicNumbers } from './useAmharicNumbers';
import YouTube from 'react-youtube';

const TvRegistrationList = () => {
  const [customers, setCustomers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(dayjs().format('dddd, MMMM D, YYYY — hh:mm:ss A'));
  const [audioStarted, setAudioStarted] = useState(false);
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState('video'); // 'video' or 'qr'

  const lastCallTimes = useRef(new Map());
  const ANNOUNCEMENT_REPEAT_INTERVAL_MS = 3 * 1000;
  
  const api_url = process.env.REACT_APP_API_URL;
  const { playNumber } = useAmharicNumbers();

  const audioQueueRef = useRef([]);
  const isPlayingAudio = useRef(false);
  const qrAudioRef = useRef(null);

  // Initialize QR audio once with the correct path
  useEffect(() => {
    if (!qrAudioRef.current) {
      qrAudioRef.current = new Audio('/audio/amharic/qr-audio.mp3');
      qrAudioRef.current.load(); // Pre-load the audio file
    }
  }, []);

  const oneWeekAgo = dayjs().subtract(7, 'days').startOf('day');
  
  // Create a single, ordered list of all relevant customers
  const orderedCustomers = customers
    .filter(cust => {
      const status = cust.status?.toLowerCase();
      const nextServicePoint = cust.next_service_point?.toLowerCase();
      return (
        (status === 'started' || status === 'notifying' || status === 'o2c_started') &&
        nextServicePoint === 'o2c' &&
        dayjs(cust.started_at).isAfter(oneWeekAgo)
      );
    })
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at));

  // Separate the lists for rendering purposes only
  const notifyingCustomers = orderedCustomers.filter(cust => cust.status?.toLowerCase() === 'notifying');
  const otherCustomers = orderedCustomers.filter(cust => cust.status?.toLowerCase() !== 'notifying');
    
  // --- Video Playlist (Short clips, max 10 min) ---
  const videoPlaylist = [
    'cq_yIZqklVk', 
    '244xtmNH4XE',
    'UuVFlCQBZ1A',
    'SefK9obos4w',
    'GrxUvwP0g5Q',
    'XOAb68Ua-ko',
    'seVHsfvcQXQ',
    'gqI9MB221kw', 
    'hVUDS6defgM',
    'rTfdUujskYU',
    'l51zmsyaMU8',
    'la_RHo_DPQE',
    'XJAojU_U6Dk',
    'uua-9WFghbc',
    '8wSE_xbLDt8',
    'u1NlmFa0-68',
    'XmtXC_n6X6Q',
    'b2R9BCyBG3s',
    'lAIVJxXoc_Q',
    '8LyeXD7IVd4',
    'iBjTZIkD6cs',
    '39hZ2apWzpk',
    '9oZVMcF55tQ',
    'JkaxUblCGz0',
    'um2Q9aUecy0',
    '9FqwhW0B3tY',

  ];

  // Feedback QR Code
  const qrCodeImageUrl = '/images/your-qr-code.png'; 
  const qrCodeDuration = 40000; // Display for 1 minute (60000 ms)


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, facRes, empRes] = await Promise.all([
          axios.get(`${api_url}/api/serviceList`),
          axios.get(`${api_url}/api/facilities`),
          axios.get(`${api_url}/api/get-employee`)
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
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [api_url]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('dddd, MMMM D, YYYY — hh:mm:ss A'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const getCustomerIndex = useCallback((customerId) => {
    return orderedCustomers.findIndex(c => c.id === customerId);
  }, [orderedCustomers]);
  
  const getFacility = (id) => facilities.find((f) => f.id === id);
  const getOfficerName = (officerId) => {
    const user = employees.find(u => u.id === officerId);
    return user ? user.full_name : 'N/A';
  };

  const getDisplayStatus = (status) => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'started') {
      return 'Waiting';
    } else if (lowerStatus === 'notifying') {
      return 'Calling';
    } else if (lowerStatus === 'o2c_started') {
      return 'In Progress';
    }
    return status || 'N/A';
  };

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

  const playNextAudioInQueue = useCallback(async () => {
    if (isPlayingAudio.current || audioQueueRef.current.length === 0) {
      isPlayingAudio.current = false;
      return;
    }

    isPlayingAudio.current = true;
    const nextCustomerId = audioQueueRef.current.shift();
    
    const customerIndex = getCustomerIndex(nextCustomerId);
    if (customerIndex !== -1) {
      await playNumber(customerIndex + 1);
    }

    setTimeout(() => {
      isPlayingAudio.current = false;
      playNextAudioInQueue();
    }, 3000);
  }, [getCustomerIndex, playNumber]);

  useEffect(() => {
    if (!audioStarted) return;
    
    const now = Date.now();
    const customersToAnnounce = orderedCustomers.filter(c => c.status?.toLowerCase() === 'notifying');
    
    const currentNotifyingIds = new Set(customersToAnnounce.map(c => c.id));
    for (let customerId of lastCallTimes.current.keys()) {
      if (!currentNotifyingIds.has(customerId)) {
        lastCallTimes.current.delete(customerId);
      }
    }
    
    customersToAnnounce.forEach((cust) => {
      const lastCalled = lastCallTimes.current.get(cust.id);
      const shouldAnnounce = !lastCalled || (now - lastCalled > ANNOUNCEMENT_REPEAT_INTERVAL_MS);

      if (shouldAnnounce) {
        if (!audioQueueRef.current.includes(cust.id)) {
          audioQueueRef.current.push(cust.id);
        }
        lastCallTimes.current.set(cust.id, now);
      }
    });

    if (!isPlayingAudio.current && audioQueueRef.current.length > 0) {
      playNextAudioInQueue();
    }
  }, [orderedCustomers, audioStarted, ANNOUNCEMENT_REPEAT_INTERVAL_MS, playNextAudioInQueue]);

  const renderCustomerCard = (cust, index) => {
    const facility = getFacility(cust.facility_id);
    const status = cust.status?.toLowerCase();
    const isCalling = status === 'notifying';
    const isInProgress = status === 'o2c_started';
    const durationInDays = dayjs().diff(dayjs(cust.started_at), 'day');
    
    let cardBgColor = '#2f3640';
    let textColor = '#fff';

    if (isCalling) {
      cardBgColor = '#ffc107';
      textColor = '#212121';
    } else if (isInProgress) {
      cardBgColor = '#4caf50';
      textColor = '#fff';
    } else if (durationInDays >= 3) {
      cardBgColor = '#f44336';
      textColor = '#fff';
    }

    const customerNumber = getCustomerIndex(cust.id) + 1;

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
        <Typography sx={{ color: textColor, fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'left', pl: 1 }}>
          {getDisplayStatus(cust.status)}
        </Typography>
        <Typography sx={{ color: textColor, fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'right' }}>
          {formatWaitingTime(cust.started_at)}
        </Typography>
      </Box>
    );
  };
  
  const handleStart = async () => {
    setAudioStarted(true);
    // Attempt to play a sound to get initial user interaction permission
    try {
      await qrAudioRef.current.play();
      qrAudioRef.current.pause(); // Immediately pause it
      qrAudioRef.current.currentTime = 0;
    } catch (e) {
      console.error("Autoplay was prevented:", e);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        width: '100vw',
        bgcolor: '#0d131f', 
        color: '#fff', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0
      }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  if (!audioStarted) {
    return (
      <Box sx={{ 
        height: '100vh', 
        width: '100vw',
        bgcolor: '#0d131f', 
        color: '#fff', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0
      }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Click to Start Kiosk
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleStart} 
          sx={{
            px: 6,
            py: 2,
            fontSize: '1.2rem',
            backgroundColor: '#00e5ff',
            '&:hover': {
              backgroundColor: '#00c1e0',
            }
          }}
        >
          Start
        </Button>
      </Box>
    );
  }

  const youtubeOpts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1, 
      mute: 1, 
      start: 0,
    },
  };

  const onVideoEnd = () => {
    setDisplayMode('qr');
    
    // Use an async function for cleaner audio playback with Promises
    const playQrAudio = async () => {
      // Check if the audio element is loaded before proceeding
      if (!qrAudioRef.current || qrAudioRef.current.readyState < 2) {
        console.error("QR audio element is not ready or has no supported source.");
        return;
      }

      try {
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error("Timeout while waiting for customer audio to finish."));
          }, 5000); // 5-second timeout

          const checkInterval = setInterval(() => {
            if (!isPlayingAudio.current) {
              clearInterval(checkInterval);
              clearTimeout(timeoutId);
              resolve();
            }
          }, 200);
        });

        // Attempt to play the QR audio
        await qrAudioRef.current.play();
      } catch (error) {
        console.error('Failed to play QR audio:', error);
      } finally {
        qrAudioRef.current.currentTime = 0;
      }
    };
    
    playQrAudio();

    // Timeout to revert back to video mode after 1 minute
    setTimeout(() => {
      if (qrAudioRef.current) {
        qrAudioRef.current.pause();
        qrAudioRef.current.currentTime = 0;
      }
      const nextIndex = (currentVideoIndex + 1) % videoPlaylist.length;
      setCurrentVideoIndex(nextIndex);
      setDisplayMode('video');
    }, qrCodeDuration);
  };

  const onPlayerReady = (event) => {
    // The player object is only used for internal logic
  };

  const animationDuration = otherCustomers.length > 0 ? `${otherCustomers.length * 3}s` : '0s';
  const shouldScroll = otherCustomers.length > 5;
  
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        bgcolor: '#0d131f',
        color: '#fff',
        p: 2,
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
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
          Customer Queue
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          <img src="/pharmalog-logo.png" alt="EPSS-MT Logo" style={{ height: '60px', width: 'auto' }} />
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

      {orderedCustomers.length === 0 ? (
        <Typography variant="h6" sx={{ mt: 5, color: '#e0f7fa' }}>
          No customers at O2C service point currently.
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
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left' }}>Ticket</Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', pl: 1 }}>Customer</Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', pl: 1 }}>Assigned Officer</Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'left', pl: 1 }}>Status</Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', textAlign: 'right' }}>Wait Time</Typography>
            </Box>

            {/* Static "Notifying" Customers Section */}
            {notifyingCustomers.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mb: 2 }}>
                {notifyingCustomers.map((cust, index) => renderCustomerCard(cust, index))}
              </Box>
            )}

            {/* Scrolling "Other" Customers Section */}
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
                {otherCustomers.length > 0 && otherCustomers.map((cust, index) => renderCustomerCard(cust, index))}
                {shouldScroll && otherCustomers.length > 0 && otherCustomers.map((cust, index) => renderCustomerCard(cust, index))}
              </Box>
            </Box>
          </Box>
            
          {/* YouTube Player & QR Code Container */}
          <Box
            sx={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#000',
              position: 'relative',
            }}
          >
            {displayMode === 'video' ? (
              <YouTube 
                videoId={videoPlaylist[currentVideoIndex]}
                opts={youtubeOpts}
                style={{ width: '100%', height: '100%' }}
                onEnd={onVideoEnd}
                onReady={onPlayerReady}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#fff',
                  p: 4,
                }}
              >
                <Typography variant="h6" sx={{ color: '#000', mb: 2, textAlign: 'center' }}>
                  ውድ ደንበኞቻችን ስለ ቅርንጫፍ መስርያቤቱ አገልግሎት ያልዎትን አስተያየት ከታች ያልውን
                  የ QR Code በስልክዎ ስካን በማድረግ ወደ ተዘጋጀው Link በመግባት እንዲሰጡ በአክብሮት 
                  እንጠይቃለን፥፥
                </Typography>
                <img src={qrCodeImageUrl} alt="QR Code" style={{ width: 250, height: 250 }} />
                <Typography variant="body2" sx={{ color: '#000', mt: 2, textAlign: 'center' }}>
                  የኢትዮጵያ የመድሀኒት አቅርቦት አግልግሎት አ.አ ቁጥር 1 ቅርንጫፍ
                </Typography>
              </Box>
            )}
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

export default TvRegistrationList;