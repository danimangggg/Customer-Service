import React, { useRef, useState, useCallback } from 'react';
import YouTube from 'react-youtube';
import { Box } from '@mui/material';

const YouTubePlayerSimple = ({ videos, onVideoEnd }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const playerRef = useRef(null);

  const currentVideoId = videos[currentIndex]?.id;

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      mute: 1,
      start: 0,
    }
  };

  const onReady = useCallback((event) => {
    playerRef.current = event.target;
    event.target.playVideo();
  }, []);

  const handleEnd = useCallback(() => {
    // Call parent's onVideoEnd handler
    if (onVideoEnd) {
      onVideoEnd();
    }
    // Move to next video
    if (videos.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }
  }, [videos.length, onVideoEnd]);

  if (!currentVideoId || videos.length === 0) return null;

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#000' }}>
      <YouTube
        key={currentVideoId}
        videoId={currentVideoId}
        opts={opts}
        onReady={onReady}
        onEnd={handleEnd}
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </Box>
  );
};

// Only re-render if videos array length changes
export default React.memo(YouTubePlayerSimple, (prevProps, nextProps) => {
  return prevProps.videos.length === nextProps.videos.length &&
         prevProps.videos[0]?.id === nextProps.videos[0]?.id;
});
