import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Container,
  Card,
  Avatar,
  Stack,
  Fade,
  Chip,
  Grid,
  Button,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import StoreIcon from '@mui/icons-material/Store';
import { useNavigate } from 'react-router-dom';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const RDFPicklists = () => {
  const [picklists, setPicklists] = useState([]);
  const [combinedPicklists, setCombinedPicklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const pickRes = await axios.get(`${api_url}/api/getPicklists`);

      let allPicklists = Array.isArray(pickRes.data) ? pickRes.data : [];

      // ✅ Remove completed picklists - show only uncompleted
      allPicklists = allPicklists.filter(
        (p) => String(p.status || '').toLowerCase() !== 'completed'
      );

      setPicklists(allPicklists);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Combine picklist info (facility info comes from backend)
  useEffect(() => {
    const combined = picklists.map((p) => ({
      ...p,
    }));
    setCombinedPicklists(combined);
  }, [picklists]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleView = (url) => window.open(url, '_blank');

  if (loading)
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Fade in={loading}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3
          }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" color="text.secondary">
              Loading picklists...
            </Typography>
          </Box>
        </Fade>
      </Container>
    );

  if (error) 
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography color="error" variant="h6" align="center">
          {error}
        </Typography>
      </Container>
    );

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeInUp 0.6s ease-out;
          }
          .picklist-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .picklist-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px;
            border-radius: 20px 20px 0 0;
            position: relative;
            overflow: hidden;
          }
          .header-gradient::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            pointer-events: none;
          }
          .picklist-item {
            transition: all 0.3s ease;
            border-radius: 16px;
            margin-bottom: 16px;
            border: 1px solid rgba(0,0,0,0.08);
            background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
          }
          .picklist-item:hover {
            transform: translateX(8px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            border-color: rgba(99, 102, 241, 0.3);
          }
          .action-button {
            border-radius: 12px;
            font-weight: 600;
            text-transform: none;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }
        `}
      </style>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card className="picklist-card animate-fade-in" elevation={0}>
          {/* Header Section */}
          <Box className="header-gradient">
            <Stack direction="row" alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 64, 
                height: 64,
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.3)'
              }}>
                <AssignmentIcon fontSize="large" />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 1
                }}>
                  RDF Picklists
                </Typography>
                <Typography variant="h6" sx={{ 
                  opacity: 0.9, 
                  fontWeight: 300,
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Manage and track RDF picklist submissions
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate('/rdf-completed-picklists')}
                className="action-button"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    border: '2px solid rgba(255,255,255,0.5)',
                  }
                }}
              >
                Completed Picklists
              </Button>
            </Stack>
          </Box>

          {/* Content Section */}
          <Box sx={{ p: 4 }}>
            {combinedPicklists.length === 0 ? (
              <Fade in={true}>
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  borderRadius: 3,
                  border: '2px dashed rgba(99, 102, 241, 0.2)'
                }}>
                  <AssignmentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    No picklists submitted yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Picklists will appear here once they are submitted
                  </Typography>
                </Box>
              </Fade>
            ) : (
              <Grid container spacing={3}>
                {combinedPicklists.map((p) => (
                  <Grid item xs={12} key={p.id}>
                    <Card className="picklist-item" elevation={0}>
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={3} alignItems="center">
                          {/* ODN and Main Info */}
                          <Grid item xs={12} md={6}>
                            <Stack spacing={2}>
                              <Box>
                                <Chip 
                                  label={`ODN: ${p.odn}`} 
                                  color="primary" 
                                  variant="filled"
                                  sx={{ 
                                    fontSize: '1rem', 
                                    fontWeight: 'bold',
                                    height: 32,
                                    borderRadius: 2
                                  }} 
                                />
                              </Box>
                              
                              {p.facility && (
                                <Stack spacing={1}>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <LocationOnIcon fontSize="small" color="primary" />
                                    <Typography variant="body1" fontWeight="bold">
                                      {p.facility.facility_name}
                                    </Typography>
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                                    {p.facility.woreda_name}, {p.facility.zone_name}, {p.facility.region_name}
                                  </Typography>
                                </Stack>
                              )}

                              {p.store && (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <StoreIcon fontSize="small" color="secondary" />
                                  <Typography variant="body2" fontWeight="bold" color="secondary.main">
                                    Store: {p.store}
                                  </Typography>
                                </Stack>
                              )}

                              <Stack direction="row" alignItems="center" spacing={1}>
                                <PersonIcon fontSize="small" color="info" />
                                <Typography variant="body2" color="text.secondary">
                                  Process ID: {p.process_id}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Grid>

                          {/* Actions */}
                          <Grid item xs={12} md={6}>
                            <Stack 
                              direction="row" 
                              spacing={2} 
                              justifyContent="flex-end"
                              alignItems="center"
                            >
                              <Button
                                variant="outlined"
                                onClick={() => handleView(p.url)}
                                startIcon={<PictureAsPdfIcon />}
                                className="action-button"
                                sx={{ minWidth: 120 }}
                              >
                                View PDF
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Card>
      </Container>
    </>
  );
};

export default RDFPicklists;
