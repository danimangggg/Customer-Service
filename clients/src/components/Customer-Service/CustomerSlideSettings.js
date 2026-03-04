import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, List, ListItem,
  ListItemText, ListItemSecondaryAction, IconButton, Paper,
  Container, AppBar, Toolbar
} from '@mui/material';
import { ArrowBack, Add, Delete, YouTube as YouTubeIcon } from '@mui/icons-material';

const CustomerSlideSettings = () => {
  const navigate = useNavigate();
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [videos, setVideos] = useState([]);
  const api_url = process.env.REACT_APP_API_URL;

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await axios.get(`${api_url}/api/settings/youtube_playlist`);
      if (response.data.success && response.data.value) {
        setVideos(response.data.value);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

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

  const handleAddVideo = () => {
    const videoId = extractVideoId(newVideoUrl);
    if (videoId) {
      setVideos([...videos, { id: videoId, url: newVideoUrl }]);
      setNewVideoUrl('');
    } else {
      alert('Invalid YouTube URL');
    }
  };

  const handleDeleteVideo = (index) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await axios.put(`${api_url}/api/settings/youtube_playlist`, {
        value: videos,
        description: 'YouTube videos playlist for customer slide'
      });
      alert('Playlist saved successfully!');
      navigate('/customer-slide');
    } catch (error) {
      console.error('Error saving videos:', error);
      alert('Error saving playlist. Please try again.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: '#ff0000' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/customer-slide')}>
            <ArrowBack />
          </IconButton>
          <YouTubeIcon sx={{ ml: 2, mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            YouTube Playlist Settings
          </Typography>
          <Button color="inherit" variant="outlined" onClick={handleSave}>
            Save & Return
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add YouTube Video
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="YouTube Video URL"
              placeholder="https://www.youtube.com/watch?v=..."
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddVideo()}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddVideo}
              sx={{ minWidth: 120, bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
            >
              Add
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Playlist ({videos.length} videos)
          </Typography>

          {videos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <YouTubeIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography color="text.secondary">
                No videos in playlist. Add YouTube URLs above.
              </Typography>
            </Box>
          ) : (
            <List>
              {videos.map((video, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Box sx={{
                    minWidth: 40,
                    height: 40,
                    bgcolor: '#ff0000',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {index + 1}
                    </Typography>
                  </Box>
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
        </Paper>
      </Container>
    </Box>
  );
};

export default CustomerSlideSettings;
