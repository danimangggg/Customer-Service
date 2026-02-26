import React, { useRef, useState, useEffect, useCallback } from 'react';
import YouTube from 'react-youtube';
import { Box, IconButton, Typography } from '@mui/material';
import { SkipPrevious, SkipNext, PlayArrow, Pause } from '@mui/icons-material';

const YouTubePlayerIsolated = ({ videos, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);

  // Update current index when videos array changes (new videos added)
  useEffect(() => {
    // If current index is out of bounds, reset to 0
    if (currentIndex >= videos.length && videos.length > 0) {
      setCurrentIndex(0);
    }
  }, [videos.length, currentIndex]);

  const currentVideoId = videos[currentIndex]?.id;

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      fs: 1,
      playsinline: 1,
      enablejsapi: 1,
      mute: 1 // Always muted by default, user can unmute via YouTube controls
    }
  };

  const onReady = useCallback((event) => {
    playerRef.current = event.target;
    event.target.playVideo();
    setIsPlaying(true);
  }, []);

  const onStateChange = useCallback((event) => {
    setIsPlaying(event.data === 1);
  }, []);

  const onEnd = useCallback(() => {
    if (videos.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }
  }, [videos.length]);

  const handleNext = useCallback(() => {
    if (videos.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }
  }, [videos.length]);

  const handlePrevious = useCallback(() => {
    if (videos.length > 0) {
      setCurrentIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
    }
  }, [videos.length]);

  const handlePlayPause = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  }, [isPlaying]);

  if (!currentVideoId || videos.length === 0) return null;

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#000' }}>
      <Box sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}>
        <YouTube
          key={currentVideoId}
          videoId={currentVideoId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          onEnd={onEnd}
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          iframeClassName="youtube-iframe"
        />
      </Box>
      
      {/* YouTube Controls */}
      <Box sx={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: 'rgba(0,0,0,0.9)',
        p: 2,
        borderRadius: 3,
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        zIndex: 10
      }}>
        <IconButton onClick={handlePrevious} sx={{ color: '#fff' }}>
          <SkipPrevious />
        </IconButton>
        <IconButton onClick={handlePlayPause} sx={{ color: '#ff0000' }}>
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton onClick={handleNext} sx={{ color: '#fff' }}>
          <SkipNext />
        </IconButton>
        <Typography variant="body2" sx={{ color: '#fff', ml: 2 }}>
          Video {currentIndex + 1} of {videos.length}
        </Typography>
      </Box>
    </Box>
  );
};

// Only re-render if videos array length changes (new videos added/removed)
export default React.memo(YouTubePlayerIsolated, (prevProps, nextProps) => {
  return prevProps.videos.length === nextProps.videos.length &&
         prevProps.videos[0]?.id === nextProps.videos[0]?.id;
});
