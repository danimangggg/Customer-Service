import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Settings, YouTube as YouTubeIcon } from '@mui/icons-material';
import YouTubePlayerIsolated from './YouTubePlayerIsolated';

const YouTubeSection = ({ videoPlaylist, setShowSettings }) => {
  return (
    <Box
      sx={{
        width: '65%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#000',
        position: 'relative',
      }}
    >
      {videoPlaylist.length > 0 ? (
        <YouTubePlayerIsolated 
          key="youtube-player-stable" 
          videos={videoPlaylist} 
        />
      ) : (
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
      )}
    </Box>
  );
};

// Only re-render if videoPlaylist length or first video changes
export default React.memo(YouTubeSection, (prevProps, nextProps) => {
  return prevProps.videoPlaylist.length === nextProps.videoPlaylist.length &&
         prevProps.videoPlaylist[0]?.id === nextProps.videoPlaylist[0]?.id;
});
