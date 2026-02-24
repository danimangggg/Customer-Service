import React, { useState, useEffect } from 'react';
import {
  Box, Paper, IconButton, Typography, Slider, Grid, 
  Chip, Card, CardContent, Switch, FormControlLabel,
  Divider, Stack, Tooltip
} from '@mui/material';
import {
  PowerSettingsNew, VolumeUp, VolumeDown, VolumeOff,
  KeyboardArrowUp, KeyboardArrowDown, Fullscreen, FullscreenExit,
  PlayArrow, Pause, Stop, FastRewind, FastForward,
  Settings, Home, ArrowBack, ArrowForward, ArrowUpward, ArrowDownward,
  FiberManualRecord, YouTube, LiveTv, Radio, Movie, Tv,
  Brightness6, Contrast, ColorLens, AspectRatio
} from '@mui/icons-material';

const TvRemoteControl = ({ onChannelChange, onVolumeChange, onPowerToggle, currentChannel, isOn }) => {
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState(80);
  const [contrast, setContrast] = useState(70);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const channels = [
    { id: 'youtube', name: 'YouTube', icon: YouTube, color: '#ff0000', number: 1 },
    { id: 'news', name: 'News', icon: LiveTv, color: '#1976d2', number: 2 },
    { id: 'entertainment', name: 'Movies', icon: Movie, color: '#9c27b0', number: 3 },
    { id: 'radio', name: 'Music', icon: Radio, color: '#ff9800', number: 4 }
  ];

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    setIsMuted(false);
    onVolumeChange?.(newValue);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    onVolumeChange?.(isMuted ? volume : 0);
  };

  const handleChannelUp = () => {
    const currentIndex = channels.findIndex(ch => ch.id === currentChannel);
    const nextIndex = (currentIndex + 1) % channels.length;
    onChannelChange?.(channels[nextIndex].id);
  };

  const handleChannelDown = () => {
    const currentIndex = channels.findIndex(ch => ch.id === currentChannel);
    const prevIndex = currentIndex === 0 ? channels.length - 1 : currentIndex - 1;
    onChannelChange?.(channels[prevIndex].id);
  };

  const handleDirectChannel = (channelId) => {
    onChannelChange?.(channelId);
  };

  const handlePower = () => {
    onPowerToggle?.();
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // You can emit this to the TV component
  };

  const currentChannelData = channels.find(ch => ch.id === currentChannel);

  return (
    <Paper 
      elevation={8}
      sx={{ 
        width: 320,
        p: 3,
        background: 'linear-gradient(145deg, #2c2c2c 0%, #1a1a1a 100%)',
        borderRadius: 4,
        border: '2px solid #333',
        position: 'relative'
      }}
    >
      {/* Remote Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Tv sx={{ fontSize: 40, color: '#00d2ff', mb: 1 }} />
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
          EPSS-MT TV Remote
        </Typography>
        <Chip 
          label={isOn ? 'ON' : 'OFF'}
          color={isOn ? 'success' : 'error'}
          size="small"
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Power Button */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <IconButton
          onClick={handlePower}
          sx={{
            bgcolor: isOn ? '#ff3f34' : '#333',
            color: '#fff',
            width: 60,
            height: 60,
            '&:hover': {
              bgcolor: isOn ? '#cc2c24' : '#555'
            }
          }}
        >
          <PowerSettingsNew sx={{ fontSize: 30 }} />
        </IconButton>
      </Box>

      {isOn && (
        <>
          {/* Current Channel Display */}
          <Card sx={{ mb: 3, bgcolor: '#333', border: '1px solid #555' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                {currentChannelData && (
                  <>
                    <currentChannelData.icon sx={{ color: currentChannelData.color, fontSize: 30 }} />
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        CH {currentChannelData.number}
                      </Typography>
                      <Typography variant="body2" sx={{ color: currentChannelData.color }}>
                        {currentChannelData.name}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Channel Controls */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 2, textAlign: 'center' }}>
              Channel Control
            </Typography>
            <Stack direction="row" justifyContent="center" spacing={2}>
              <Tooltip title="Previous Channel">
                <IconButton
                  onClick={handleChannelDown}
                  sx={{ bgcolor: '#444', color: '#00d2ff', '&:hover': { bgcolor: '#555' } }}
                >
                  <KeyboardArrowDown />
                </IconButton>
              </Tooltip>
              <Tooltip title="Next Channel">
                <IconButton
                  onClick={handleChannelUp}
                  sx={{ bgcolor: '#444', color: '#00d2ff', '&:hover': { bgcolor: '#555' } }}
                >
                  <KeyboardArrowUp />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Direct Channel Buttons */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 2, textAlign: 'center' }}>
              Quick Channels
            </Typography>
            <Grid container spacing={1}>
              {channels.map((channel) => (
                <Grid item xs={6} key={channel.id}>
                  <IconButton
                    onClick={() => handleDirectChannel(channel.id)}
                    sx={{
                      width: '100%',
                      height: 50,
                      bgcolor: currentChannel === channel.id ? channel.color : '#444',
                      color: '#fff',
                      border: `1px solid ${channel.color}`,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: currentChannel === channel.id ? channel.color : `${channel.color}33`
                      }
                    }}
                  >
                    <Stack alignItems="center" spacing={0.5}>
                      <channel.icon sx={{ fontSize: 20 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {channel.number}
                      </Typography>
                    </Stack>
                  </IconButton>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ borderColor: '#555', mb: 3 }} />

          {/* Volume Control */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 2, textAlign: 'center' }}>
              Volume Control
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                onClick={handleMute}
                sx={{ color: isMuted ? '#ff3f34' : '#00d2ff' }}
              >
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
              <Slider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                min={0}
                max={100}
                sx={{
                  color: '#00d2ff',
                  '& .MuiSlider-thumb': {
                    bgcolor: '#00d2ff'
                  },
                  '& .MuiSlider-track': {
                    bgcolor: '#00d2ff'
                  }
                }}
              />
              <Typography variant="body2" sx={{ color: '#ccc', minWidth: 30 }}>
                {isMuted ? 0 : volume}
              </Typography>
            </Stack>
          </Box>

          {/* Navigation Controls */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 2, textAlign: 'center' }}>
              Navigation
            </Typography>
            <Grid container spacing={1} justifyContent="center">
              <Grid item xs={4}>
                <IconButton sx={{ color: '#ccc', width: '100%' }}>
                  <ArrowUpward />
                </IconButton>
              </Grid>
              <Grid item xs={4}>
                <IconButton sx={{ color: '#ccc' }}>
                  <ArrowBack />
                </IconButton>
              </Grid>
              <Grid item xs={4}>
                <IconButton sx={{ color: '#00d2ff', bgcolor: '#333', borderRadius: '50%' }}>
                  <FiberManualRecord />
                </IconButton>
              </Grid>
              <Grid item xs={4}>
                <IconButton sx={{ color: '#ccc' }}>
                  <ArrowForward />
                </IconButton>
              </Grid>
              <Grid item xs={4}>
                <IconButton sx={{ color: '#ccc', width: '100%' }}>
                  <ArrowDownward />
                </IconButton>
              </Grid>
            </Grid>
          </Box>

          {/* Playback Controls */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 2, textAlign: 'center' }}>
              Playback
            </Typography>
            <Stack direction="row" justifyContent="center" spacing={1}>
              <IconButton sx={{ color: '#ccc', bgcolor: '#444' }}>
                <FastRewind />
              </IconButton>
              <IconButton sx={{ color: '#00d2ff', bgcolor: '#444' }}>
                <PlayArrow />
              </IconButton>
              <IconButton sx={{ color: '#ccc', bgcolor: '#444' }}>
                <Pause />
              </IconButton>
              <IconButton sx={{ color: '#ccc', bgcolor: '#444' }}>
                <Stop />
              </IconButton>
              <IconButton sx={{ color: '#ccc', bgcolor: '#444' }}>
                <FastForward />
              </IconButton>
            </Stack>
          </Box>

          {/* Display Settings */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#ccc', mb: 2, textAlign: 'center' }}>
              Display Settings
            </Typography>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isFullscreen}
                    onChange={handleFullscreen}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00d2ff'
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00d2ff'
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Fullscreen
                  </Typography>
                }
              />
              
              <Stack direction="row" alignItems="center" spacing={2}>
                <Brightness6 sx={{ color: '#ccc', fontSize: 20 }} />
                <Slider
                  value={brightness}
                  onChange={(e, val) => setBrightness(val)}
                  min={0}
                  max={100}
                  size="small"
                  sx={{ color: '#00d2ff' }}
                />
                <Typography variant="caption" sx={{ color: '#ccc', minWidth: 25 }}>
                  {brightness}
                </Typography>
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={2}>
                <Contrast sx={{ color: '#ccc', fontSize: 20 }} />
                <Slider
                  value={contrast}
                  onChange={(e, val) => setContrast(val)}
                  min={0}
                  max={100}
                  size="small"
                  sx={{ color: '#00d2ff' }}
                />
                <Typography variant="caption" sx={{ color: '#ccc', minWidth: 25 }}>
                  {contrast}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Quick Actions */}
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <IconButton sx={{ color: '#ccc' }}>
              <Home />
            </IconButton>
            <IconButton sx={{ color: '#ccc' }}>
              <ArrowBack />
            </IconButton>
            <IconButton sx={{ color: '#ccc' }}>
              <Settings />
            </IconButton>
            <IconButton 
              onClick={handleFullscreen}
              sx={{ color: isFullscreen ? '#00d2ff' : '#ccc' }}
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Stack>
        </>
      )}
    </Paper>
  );
};

export default TvRemoteControl;