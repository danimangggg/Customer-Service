import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import YouTubePlayerIsolated from './YouTubePlayerIsolated';
import { 
  Box, Typography, CircularProgress, Button, IconButton, 
  Card, CardContent, Fade, Chip, Stack, Divider, Drawer,
  Grid, Paper, TextField, List, ListItem, ListItemText,
  ListItemSecondaryAction, Dialog, DialogTitle, DialogContent,
  DialogActions, Tabs, Tab, Alert
} from '@mui/material';
import {
  AccessTime, PrecisionManufacturing, LocalShipping, 
  CheckCircleOutline, NotificationsActive, Assignment,
  Tv, VolumeUp, VolumeOff, Fullscreen, FullscreenExit,
  PlayArrow, Pause, SkipNext, SkipPrevious, Settings,
  YouTube as YouTubeIcon, LiveTv, Radio, Movie, ControlCamera, Satellite,
  Cable, Wifi, Input, ConnectedTv, VideoLibrary, MusicNote,
  Add, Delete, Close, Save
} from '@mui/icons-material';
import dayjs from 'dayjs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const TvRealEntertainment = () => {
  const [customers, setCustomers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // TV States
  const [currentInput, setCurrentInput] = useState('youtube'); // Default to YouTube
  const [showInstructions, setShowInstructions] = useState(true);
  const [tvPower, setTvPower] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  
  // Mute control for calling audio only
  const [callingAudioMuted, setCallingAudioMuted] = useState(false);
  
  // Audio queue for customer notifications
  const audioQueueRef = useRef([]);
  const isPlayingAudio = useRef(false);
  const lastCallTimes = useRef(new Map());

  // TV Input options for real TV
  const tvInputs = [
    {
      id: 'youtube',
      name: 'YouTube',
      icon: YouTubeIcon,
      color: '#ff0000',
      description: 'YouTube Videos Playlist',
      instruction: 'Auto-playing YouTube videos from your playlist'
    },
    {
      id: 'satellite',
      name: 'Satellite TV',
      icon: Satellite,
      color: '#ff6b35',
      description: 'DSTV / Satellite Channels',
      instruction: 'Press INPUT → Select Satellite → Use CH+/CH- for channels'
    },
    {
      id: 'cable',
      name: 'Cable TV',
      icon: Cable,
      color: '#1976d2',
      description: 'Local Cable Channels',
      instruction: 'Press INPUT → Select Cable/ANT → Browse with remote'
    },
    {
      id: 'smart',
      name: 'Smart TV',
      icon: ConnectedTv,
      color: '#9c27b0',
      description: 'Netflix, YouTube, Apps',
      instruction: 'Press HOME/SMART → Navigate to apps → Select with OK'
    },
    {
      id: 'hdmi1',
      name: 'HDMI 1',
      icon: Input,
      color: '#00b894',
      description: 'External Device Input',
      instruction: 'Press INPUT → Select HDMI 1 → Use device remote'
    },
    {
      id: 'hdmi2',
      name: 'HDMI 2',
      icon: Input,
      color: '#f39c12',
      description: 'External Device Input',
      instruction: 'Press INPUT → Select HDMI 2 → Use device remote'
    },
    {
      id: 'usb',
      name: 'USB Media',
      icon: VideoLibrary,
      color: '#e74c3c',
      description: 'USB Movies & Music',
      instruction: 'Press INPUT → Select USB → Browse files with arrows'
    }
  ];

  // Time update effect - stop on YouTube
  useEffect(() => {
    if (currentInput === 'youtube') return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [currentInput]);

  // Hide instructions after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [custRes, facRes] = await Promise.all([
        axios.get(`${API_URL}/api/tv-display-customers`, { timeout: 5000 }),
        axios.get(`${API_URL}/api/facilities`, { timeout: 5000 })
      ]);
      
      // Only update state if data actually changed to prevent unnecessary re-renders
      setCustomers(prevCustomers => {
        const newData = custRes.data;
        if (JSON.stringify(prevCustomers) === JSON.stringify(newData)) {
          return prevCustomers;
        }
        return newData;
      });
      
      setFacilities(prevFacilities => {
        const newData = facRes.data;
        if (JSON.stringify(prevFacilities) === JSON.stringify(newData)) {
          return prevFacilities;
        }
        return newData;
      });
    } catch (error) {
      console.error('Fetch Error:', error.message || error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    
    // Always run interval to keep queue updated
    const interval = setInterval(() => fetchData(false), 8000);
    
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
              let Icon = PrecisionManufacturing;
              let isCalling = false;
              let currentStep = 0;

              // Set status based on current progress for this specific store
              if (dispatchStatus === 'notifying') {
                statusLabel = `${storeKey} READY FOR PICKUP`;
                themeColor = '#ff3f34'; 
                Icon = NotificationsActive;
                isCalling = true;
                currentStep = 2;
              } else if (dispatchStatus === 'started') {
                statusLabel = `${storeKey} DISPATCH IN PROGRESS`;
                themeColor = '#9c27b0'; 
                Icon = LocalShipping;
                currentStep = 3;
              } else if (ewmStatus === 'started') {
                statusLabel = `${storeKey} STORE PROCESS STARTED`; 
                themeColor = '#0984e3';
                Icon = PrecisionManufacturing;
                currentStep = 2;
              } else if (ewmStatus === 'completed') {
                statusLabel = `${storeKey} READY FOR DISPATCH`; 
                themeColor = '#00b894'; 
                Icon = CheckCircleOutline;
                currentStep = 3;
              } else if (globalStatus === 'o2c_completed') {
                statusLabel = `${storeKey} PROCESSING STARTED`; 
                themeColor = '#636e72';
                Icon = Assignment;
                currentStep = 1;
              } else if (dispatchStatus === 'completed') {
                statusLabel = `${storeKey} READY FOR EXIT`;
                themeColor = '#f39c12';
                Icon = CheckCircleOutline;
                currentStep = 4;
              }

              allOrders.push({
                ...cust,
                statusLabel,
                themeColor,
                isCalling,
                Icon,
                currentStep,
                assignedStore: storeKey,
                storeOdns: storeInfo.odns || [],
                uniqueKey: `${cust.id}-${storeKey}` // Unique key for each customer-store combination
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
    // Skip if calling audio is muted
    if (callingAudioMuted) {
      return Promise.resolve();
    }
    
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
  }, [callingAudioMuted]);

  const processQueue = useCallback(async () => {
    try {
      if (isPlayingAudio.current || audioQueueRef.current.length === 0) return;
      isPlayingAudio.current = true;
      const nextId = audioQueueRef.current.shift();
      const order = activeOrders.find(c => c && c.id === nextId);
      if (order && order.displayTicket) {
        await playNumber(order.displayTicket);
      }
      // Wait 3 seconds after audio finishes before allowing next audio
      setTimeout(() => {
        isPlayingAudio.current = false;
      }, 3000);
    } catch (error) {
      console.error('Error in processQueue:', error);
      isPlayingAudio.current = false;
    }
  }, [activeOrders, playNumber]);

  useEffect(() => {
    if (!audioStarted) return;
    
    // Set up interval to check for calling customers every 2 seconds
    const checkInterval = setInterval(() => {
      try {
        const now = Date.now();
        activeOrders.forEach(cust => {
          try {
            if (cust && cust.isCalling && cust.id) {
              const lastTime = lastCallTimes.current.get(cust.id) || 0;
              // Call every 10 seconds (10000ms)
              if (now - lastTime >= 10000) {
                if (!audioQueueRef.current.includes(cust.id)) {
                  audioQueueRef.current.push(cust.id);
                  lastCallTimes.current.set(cust.id, now);
                }
              }
            } else if (cust && !cust.isCalling && cust.id) {
              // Clear the last call time when customer is no longer in calling state
              lastCallTimes.current.delete(cust.id);
            }
          } catch (error) {
            console.error('Error processing customer audio:', error, cust);
          }
        });
        processQueue();
      } catch (error) {
        console.error('Error in audio check interval:', error);
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(checkInterval);
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

  const currentInputData = tvInputs.find(input => input.id === currentInput);

  // Memoize derived data before any early returns
  const callingOrders = useMemo(() => activeOrders.filter(o => o.isCalling), [activeOrders]);
  const regularOrders = useMemo(() => activeOrders.filter(o => !o.isCalling), [activeOrders]);
  const shouldScroll = regularOrders.length > 6;

  // Load YouTube videos from database
  useEffect(() => {
    const loadYoutubePlaylist = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/settings/youtube_playlist`);
        if (response.data.success && response.data.value) {
          setYoutubeVideos(response.data.value);
        }
      } catch (error) {
        console.error('Error loading YouTube playlist:', error);
        // Fallback to localStorage for migration
        const savedVideos = localStorage.getItem('tv_youtube_videos');
        if (savedVideos) {
          try {
            const videos = JSON.parse(savedVideos);
            setYoutubeVideos(videos);
            // Migrate to database
            await axios.put(`${API_URL}/api/settings/youtube_playlist`, {
              value: videos,
              description: 'YouTube videos playlist for TV entertainment'
            });
            // Clear localStorage after successful migration
            localStorage.removeItem('tv_youtube_videos');
          } catch (err) {
            console.error('Error migrating YouTube videos:', err);
          }
        }
      }
    };
    
    loadYoutubePlaylist();
  }, []);

  // Extract YouTube video ID from URL
  const extractVideoId = (url) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  };

  // Settings Dialog Component
  const SettingsDialog = () => {
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [tempVideos, setTempVideos] = useState([...youtubeVideos]);
    const [settingsTab, setSettingsTab] = useState(0); // 0 = Play, 1 = Manage

    // Update tempVideos when youtubeVideos changes
    useEffect(() => {
      setTempVideos([...youtubeVideos]);
    }, [youtubeVideos]);

    const handleAddVideo = () => {
      try {
        const videoId = extractVideoId(newVideoUrl);
        if (videoId) {
          setTempVideos([...tempVideos, { id: videoId, url: newVideoUrl }]);
          setNewVideoUrl('');
        } else {
          alert('Invalid YouTube URL');
        }
      } catch (error) {
        console.error('Error adding video:', error);
        alert('Error adding video. Please check the URL.');
      }
    };

    const handleDeleteVideo = (index) => {
      try {
        setTempVideos(tempVideos.filter((_, i) => i !== index));
      } catch (error) {
        console.error('Error deleting video:', error);
      }
    };

    const handleSave = async () => {
      try {
        // Save to database
        await axios.put(`${API_URL}/api/settings/youtube_playlist`, {
          value: tempVideos,
          description: 'YouTube videos playlist for TV entertainment'
        });
        
        setYoutubeVideos(tempVideos);
        setShowSettings(false);
      } catch (error) {
        console.error('Error saving videos:', error);
        alert('Error saving playlist. Please try again.');
      }
    };

    const handleClose = () => {
      try {
        setTempVideos([...youtubeVideos]); // Reset to original
        setShowSettings(false);
      } catch (error) {
        console.error('Error closing dialog:', error);
        setShowSettings(false);
      }
    };

    return (
      <Dialog open={showSettings} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <YouTubeIcon sx={{ color: '#ff0000' }} />
              <Typography variant="h6">YouTube Entertainment</Typography>
            </Box>
            <IconButton onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={settingsTab} onChange={(e, v) => setSettingsTab(v)}>
            <Tab label="Now Playing" icon={<PlayArrow />} iconPosition="start" />
            <Tab label="Manage Playlist" icon={<Settings />} iconPosition="start" />
          </Tabs>
        </Box>

        <DialogContent>
          {/* Tab 0: Now Playing */}
          {settingsTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Current Playlist
              </Typography>

              {tempVideos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <YouTubeIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No videos in playlist
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Switch to "Manage Playlist" tab to add videos
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setSettingsTab(1)}
                    sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
                  >
                    Add Videos Now
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {tempVideos.length} video{tempVideos.length !== 1 ? 's' : ''} in playlist • Auto-playing in sequence
                  </Typography>
                  
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {tempVideos.map((video, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Box sx={{
                            minWidth: 40,
                            height: 40,
                            bgcolor: '#ff0000',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                              {index + 1}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Video {index + 1}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {video.url}
                            </Typography>
                          </Box>
                          <Chip 
                            label="Ready" 
                            size="small" 
                            color="success"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    Videos will play automatically in sequence. Use the controls on screen to skip or pause.
                  </Alert>
                </Box>
              )}
            </Box>
          )}

          {/* Tab 1: Manage Playlist */}
          {settingsTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Add YouTube Videos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Paste YouTube video URLs to build your playlist. Videos will auto-play in order.
              </Typography>

              {/* Add Video Form */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="YouTube Video URL"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddVideo()}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddVideo}
                    sx={{ 
                      minWidth: 120,
                      bgcolor: '#ff0000',
                      '&:hover': { bgcolor: '#cc0000' }
                    }}
                  >
                    Add
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Playlist ({tempVideos.length} videos)
              </Typography>

              {tempVideos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <YouTubeIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                  <Typography color="text.secondary">
                    No videos in playlist. Add YouTube URLs above.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {tempVideos.map((video, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemText
                        primary={`Video ${index + 1}`}
                        secondary={video.url}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteVideo(index)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            startIcon={<Save />}
            sx={{ 
              bgcolor: '#ff0000',
              '&:hover': { bgcolor: '#cc0000' }
            }}
          >
            Save & Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (!audioStarted) return (
    <Box sx={{ 
      height: '100vh', 
      width: '100vw',
      background: 'linear-gradient(135deg, #010a14 0%, #021a33 100%)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0,
      padding: 0
    }}>
      <Card sx={{ 
        bgcolor: 'rgba(255,255,255,0.1)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 4,
        p: 4
      }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Tv sx={{ fontSize: 80, color: '#00d2ff', mb: 2 }} />
          <Typography variant="h4" sx={{ color: '#fff', mb: 2, fontWeight: 'bold' }}>
            Real TV Entertainment
          </Typography>
          <Typography variant="body1" sx={{ color: '#ccc', mb: 4 }}>
            Customer queue with real TV control
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            sx={{ 
              bgcolor: '#00d2ff', 
              color: '#000',
              px: 4, 
              py: 2,
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#0099cc' }
            }} 
            onClick={() => setAudioStarted(true)}
          >
            START TV SYSTEM
          </Button>
        </CardContent>
      </Card>
    </Box>
  );

  // Memoize CustomerRow to prevent re-renders
  const CustomerRow = React.memo(({ cust, isSpecial }) => {
    // Add error handling for missing data
    if (!cust || !cust.facility_id) {
      return null;
    }
    
    const facilityInfo = getFacilityWithStore(cust.facility_id, cust.assignedStore || 'AA1');
    
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start',
        mb: 1,
        p: 1.5,
        bgcolor: isSpecial ? `${cust.themeColor}22` : 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        border: `1px solid ${isSpecial ? cust.themeColor : 'rgba(255,255,255,0.1)'}`,
        animation: isSpecial ? 'pulse 1.5s infinite' : 'none',
        minHeight: '70px'
      }}>
        {/* Ticket Number */}
        <Box sx={{ 
          minWidth: '50px',
          height: '35px',
          bgcolor: cust.themeColor,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
          flexShrink: 0
        }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000' }}>
            {cust.displayTicket}
          </Typography>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
          {/* Facility Name with Bold Store Prefix */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ 
              color: cust.themeColor, 
              fontWeight: 'bold',
              fontSize: '0.9rem',
              backgroundColor: `${cust.themeColor}22`,
              px: 1,
              py: 0.2,
              borderRadius: 1,
              border: `1px solid ${cust.themeColor}`
            }}>
              {facilityInfo.storeKey}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#fff', 
              fontWeight: 'bold',
              fontSize: '0.85rem',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: 1.3,
              flex: 1
            }}>
              {facilityInfo.facilityName}
            </Typography>
          </Box>

          {/* Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <cust.Icon sx={{ color: cust.themeColor, fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ 
              color: cust.themeColor,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: 1.2
            }}>
              {cust.statusLabel}
            </Typography>
          </Box>
        </Box>

        {/* Timer */}
        <Box sx={{ 
          minWidth: '40px',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <Typography variant="caption" sx={{ 
            color: cust.themeColor, 
            fontWeight: 'bold',
            fontSize: '0.75rem'
          }}>
            {dayjs().diff(dayjs(cust.started_at), 'm')}m
          </Typography>
        </Box>
      </Box>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if customer data actually changes
    return prevProps.cust.uniqueKey === nextProps.cust.uniqueKey &&
           prevProps.cust.statusLabel === nextProps.cust.statusLabel &&
           prevProps.isSpecial === nextProps.isSpecial;
  });

  return (
    <>
      <Box sx={{ 
        height: '100vh', 
        width: '100vw',
        background: 'linear-gradient(135deg, #010a14 0%, #021a33 100%)', 
        color: '#fff',
        display: 'flex',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        zIndex: 9999
      }}>
        
        {/* Left Side - Compact Customer Queue (30% width) */}
        <Box sx={{ 
          width: '30%', 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: '2px solid rgba(255,255,255,0.1)',
          bgcolor: 'rgba(0,0,0,0.95)',
          zIndex: 100,
          position: 'relative',
          height: '100vh',
          overflow: 'hidden'
        }}>
          
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#00d2ff' }}>
                ALL STORES QUEUE
              </Typography>
              {/* Calling Audio Mute Toggle */}
              <IconButton
                onClick={() => setCallingAudioMuted(!callingAudioMuted)}
                sx={{
                  bgcolor: callingAudioMuted ? 'rgba(255, 63, 52, 0.2)' : 'rgba(0, 210, 255, 0.2)',
                  color: callingAudioMuted ? '#ff3f34' : '#00d2ff',
                  '&:hover': {
                    bgcolor: callingAudioMuted ? 'rgba(255, 63, 52, 0.3)' : 'rgba(0, 210, 255, 0.3)',
                  },
                  border: `2px solid ${callingAudioMuted ? '#ff3f34' : '#00d2ff'}`,
                }}
                title={callingAudioMuted ? 'Calling Audio Muted' : 'Calling Audio On'}
              >
                {callingAudioMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime sx={{ color: '#00d2ff', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#ccc', fontWeight: 'bold' }}>
                {currentTime.toLocaleTimeString()}
              </Typography>
            </Box>
            <Divider sx={{ mt: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
          </Box>

          {/* Stats */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={`${activeOrders.length} Total`}
                size="small"
                sx={{ bgcolor: '#00d2ff', color: '#000', fontWeight: 'bold', fontSize: '0.8rem' }}
              />
              <Chip 
                label={`${callingOrders.length} Ready`}
                size="small"
                sx={{ bgcolor: '#ff3f34', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}
              />
            </Stack>
          </Box>

          {/* Ready/Calling Customers */}
          {callingOrders.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#ff3f34', mb: 1, fontWeight: 'bold', display: 'block', fontSize: '0.8rem' }}>
                🔔 READY NOW (ALL STORES)
              </Typography>
              {callingOrders.map((cust) => (
                <CustomerRow key={cust.uniqueKey} cust={cust} isSpecial={true} />
              ))}
            </Box>
          )}

          {/* Regular Queue */}
          <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            <Typography variant="caption" sx={{ color: '#ccc', mb: 1, fontWeight: 'bold', display: 'block', fontSize: '0.8rem' }}>
              WAITING (ALL STORES)
            </Typography>
            
            <Box sx={{ 
              height: 'calc(100% - 30px)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <Box sx={{ 
                position: 'absolute',
                width: '100%',
                animation: shouldScroll ? `scrollUp ${Math.max(regularOrders.length * 2, 10)}s linear infinite` : 'none'
              }}>
                {regularOrders.map((cust) => (
                  <CustomerRow key={cust.uniqueKey} cust={cust} isSpecial={false} />
                ))}
                {shouldScroll && regularOrders.map((cust) => (
                  <CustomerRow key={`clone-${cust.uniqueKey}`} cust={cust} isSpecial={false} />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Right Side - Real TV Control (70% width) */}
        <Box sx={{ 
          width: '70%', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1
        }}>
          
          {/* TV Status Bar - Simplified for YouTube */}
          <Box sx={{ 
            p: 1.5, 
            bgcolor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {currentInput === 'youtube' ? (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Settings />}
                  onClick={() => setShowSettings(true)}
                  sx={{ 
                    color: '#ff0000', 
                    borderColor: '#ff0000',
                    '&:hover': { bgcolor: 'rgba(255, 0, 0, 0.1)' }
                  }}
                >
                  YouTube Settings
                </Button>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 'auto' }}>
                    <currentInputData.icon sx={{ color: currentInputData.color, fontSize: 32 }} />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {currentInputData.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', fontWeight: 'bold' }}>
                        {currentInputData.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label="LIVE TV"
                    sx={{ bgcolor: '#ff3f34', color: '#fff', fontWeight: 'bold' }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Settings />}
                    onClick={() => setShowSettings(true)}
                    sx={{ 
                      color: '#ff0000', 
                      borderColor: '#ff0000',
                      '&:hover': { bgcolor: 'rgba(255, 0, 0, 0.1)' }
                    }}
                  >
                    YouTube Settings
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowInstructions(true)}
                    sx={{ 
                      color: '#00d2ff', 
                      borderColor: '#00d2ff',
                      '&:hover': { bgcolor: 'rgba(0, 210, 255, 0.1)' }
                    }}
                  >
                    📺 TV Help
                  </Button>
                  <Typography variant="h6" sx={{ color: '#00d2ff', fontWeight: 'bold' }}>
                    Use Your TV Remote
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {/* Input Selection - Hidden on YouTube */}
          {currentInput !== 'youtube' && (
          <Box sx={{ 
            p: 2, 
            bgcolor: 'rgba(0,0,0,0.6)',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Grid container spacing={2}>
              {tvInputs.map((input) => (
                <Grid item xs={2} key={input.id}>
                  <Button
                    variant={currentInput === input.id ? 'contained' : 'outlined'}
                    fullWidth
                    size="small"
                    startIcon={<input.icon />}
                    onClick={() => setCurrentInput(input.id)}
                    sx={{
                      color: currentInput === input.id ? '#000' : input.color,
                      bgcolor: currentInput === input.id ? input.color : 'transparent',
                      borderColor: input.color,
                      '&:hover': {
                        bgcolor: currentInput === input.id ? input.color : `${input.color}22`
                      },
                      fontSize: '0.8rem',
                      py: 1
                    }}
                  >
                    {input.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
          )}

          {/* Main TV Display Area */}
          <Box sx={{ 
            flex: 1, 
            position: 'relative',
            bgcolor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            
            {/* TV Screen Simulation */}
            <Box sx={{
              width: currentInput === 'youtube' ? '98%' : '90%',
              height: currentInput === 'youtube' ? '96%' : '80%',
              bgcolor: '#111',
              border: '4px solid #333',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* TV Content Area */}
              {currentInput === 'youtube' && youtubeVideos.length > 0 ? (
                <YouTubePlayerIsolated videos={youtubeVideos} />
              ) : currentInput === 'youtube' ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <YouTubeIcon sx={{ fontSize: 120, color: '#ff0000', mb: 3 }} />
                  <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
                    YouTube Playlist
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#ccc', mb: 3 }}>
                    No videos in playlist
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Settings />}
                    onClick={() => setShowSettings(true)}
                    sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
                  >
                    Add YouTube Videos
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <currentInputData.icon sx={{ fontSize: 120, color: currentInputData.color, mb: 3 }} />
                  <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
                    {currentInputData.name}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#ccc', mb: 3 }}>
                    {currentInputData.description}
                  </Typography>
                  <Typography variant="body1" sx={{ color: currentInputData.color, fontWeight: 'bold' }}>
                    {currentInputData.instruction}
                  </Typography>
                </Box>
              )}

              {/* TV Remote Instructions Overlay */}
              {showInstructions && currentInput !== 'youtube' && (
                <Box sx={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  bgcolor: 'rgba(0,0,0,0.95)',
                  p: 4,
                  borderRadius: 3,
                  border: '3px solid #00d2ff',
                  maxWidth: 400,
                  zIndex: 1000
                }}>
                  <Typography variant="h5" sx={{ color: '#00d2ff', fontWeight: 'bold', mb: 3 }}>
                    📺 Real TV Control Guide
                  </Typography>
                  
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
                    How to Access TV Inputs:
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: '#ff6b35', mb: 1, fontWeight: 'bold' }}>
                      🛰️ Satellite TV (DSTV):
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mb: 1, ml: 2 }}>
                      • Press "INPUT" or "SOURCE" on your TV remote
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mb: 1, ml: 2 }}>
                      • Select "Satellite" or "SAT" input
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mb: 2, ml: 2 }}>
                      • Use channel up/down to browse DSTV channels
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: '#1976d2', mb: 1, fontWeight: 'bold' }}>
                      📺 Cable TV:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mb: 1, ml: 2 }}>
                      • Press "INPUT" → Select "Cable" or "ANT"
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mb: 2, ml: 2 }}>
                      • Browse local channels with remote
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: '#9c27b0', mb: 1, fontWeight: 'bold' }}>
                      📱 Smart TV Apps:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mb: 1, ml: 2 }}>
                      • Press "HOME" or "SMART" button
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mb: 1, ml: 2 }}>
                      • Navigate to Netflix, YouTube, etc.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mb: 2, ml: 2 }}>
                      • Use arrow keys to select apps
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ color: '#00b894', mb: 1, fontWeight: 'bold' }}>
                      🔌 HDMI Devices:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mb: 1, ml: 2 }}>
                      • Press "INPUT" → Select "HDMI 1" or "HDMI 2"
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', mb: 2, ml: 2 }}>
                      • Control connected device with its remote
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ color: '#ccc', fontStyle: 'italic', display: 'block', textAlign: 'center' }}>
                    Instructions will disappear in 15 seconds
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => setShowInstructions(false)}
                    sx={{ 
                      mt: 2, 
                      color: '#00d2ff', 
                      borderColor: '#00d2ff',
                      width: '100%'
                    }}
                  >
                    Got It - Hide Instructions
                  </Button>
                </Box>
              )}

              {/* Channel/Input Info - Hidden on YouTube */}
              {currentInput !== 'youtube' && (
              <Box sx={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                bgcolor: 'rgba(0,0,0,0.9)',
                p: 3,
                borderRadius: 2,
                border: `2px solid ${currentInputData.color}`,
                minWidth: 300
              }}>
                <Typography variant="h6" sx={{ color: currentInputData.color, fontWeight: 'bold', mb: 1 }}>
                  INPUT: {currentInputData.name.toUpperCase()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                  {currentInputData.description}
                </Typography>
                <Typography variant="caption" sx={{ color: '#ccc', fontWeight: 'bold' }}>
                  📋 {currentInputData.instruction}
                </Typography>
              </Box>
              )}

              {/* EPSS-MT Branding - Hidden on YouTube */}
              {currentInput !== 'youtube' && (
              <Box sx={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                bgcolor: 'rgba(0,0,0,0.8)',
                p: 2,
                borderRadius: 2,
                backdropFilter: 'blur(10px)'
              }}>
                <Typography variant="body2" sx={{ color: '#00d2ff', fontWeight: 'bold' }}>
                  EPSS-MT Entertainment
                </Typography>
              </Box>
              )}
            </Box>
          </Box>
        </Box>

        <style>{`
          @keyframes pulse { 
            0%, 100% { opacity: 1; transform: scale(1); } 
            50% { opacity: 0.8; transform: scale(1.02); } 
          }
          @keyframes scrollUp { 
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
        <style>{`
          .youtube-iframe {
            width: 100% !important;
            height: 100% !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
        `}</style>
      </Box>

      {/* Settings Dialog */}
      <SettingsDialog />
    </>
  );
};

export default TvRealEntertainment;