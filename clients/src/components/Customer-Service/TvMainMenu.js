import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Avatar, Fade, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import TvIcon from '@mui/icons-material/Tv';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const TvMainMenu = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    {
      id: 'o2c',
      title: 'O2C',
      subtitle: 'Order-to-Cash Service',
      description: 'Customer registration and order processing queue',
      icon: AssignmentIcon,
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      route: '/customer-slide'
    },
    {
      id: 'dispatcher',
      title: 'Dispatcher',
      subtitle: 'Dispatch Operations',
      description: 'Real-time dispatch monitoring and notifications',
      icon: LocalShippingIcon,
      color: '#ff6b35',
      gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
      route: '/tv-dispatch'
    },
    {
      id: 'waiting-room',
      title: 'Waiting Room',
      subtitle: 'All Stores Display',
      description: 'All stores customer waiting area information display',
      icon: EventSeatIcon,
      color: '#4caf50',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
      route: '/tvcustomer'
    },
    {
      id: 'real-tv',
      title: 'Real TV',
      subtitle: 'All Stores + TV',
      description: 'All stores customer queue with real TV (DSTV, Netflix, Cable)',
      icon: TvIcon,
      color: '#ff5722',
      gradient: 'linear-gradient(135deg, #ff5722 0%, #d84315 100%)',
      route: '/tv-real-entertainment'
    }
  ];

  const handleMenuClick = (route) => {
    navigate(route);
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          .animate-fade-in {
            animation: fadeInUp 0.8s ease-out;
          }
          .menu-card {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            border-radius: 24px;
            overflow: hidden;
            position: relative;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .menu-card:hover {
            transform: translateY(-12px) scale(1.02);
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          }
          .menu-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            pointer-events: none;
          }
          .header-gradient {
            background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
            color: white;
            padding: 40px;
            border-radius: 24px 24px 0 0;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
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
          .icon-container {
            animation: float 3s ease-in-out infinite;
          }
          .time-display {
            animation: pulse 2s infinite;
          }
        `}
      </style>
      
      <Box sx={{ 
        height: '100vh',
        width: '100vw', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: 'none'
        }} />

        <Box className="animate-fade-in" sx={{ 
          position: 'relative', 
          zIndex: 1,
          maxWidth: '1400px',
          mx: 'auto',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          overflow: 'auto'
        }}>
          {/* Header Section */}
          <Box className="header-gradient" sx={{ 
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
            minHeight: '160px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Box sx={{ 
              position: 'relative', 
              zIndex: 11,
              width: '100%'
            }}>
              <Stack 
                direction={{ xs: 'column', md: 'row' }} 
                alignItems="center" 
                justifyContent="space-between" 
                sx={{ 
                  flexWrap: 'wrap', 
                  gap: 3,
                  width: '100%'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={3} sx={{ flex: 1 }}>
                  <Box className="icon-container" sx={{ 
                    bgcolor: 'rgba(255,255,255,0.3)', 
                    width: 80, 
                    height: 80,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '3px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}>
                    <TvIcon sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ 
                      textShadow: '0 3px 6px rgba(0,0,0,0.3)',
                      mb: 1,
                      color: 'white',
                      fontSize: { xs: '2rem', md: '3rem' }
                    }}>
                      TV Display Menu
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.95, 
                      fontWeight: 400,
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      color: 'white',
                      fontSize: { xs: '1rem', md: '1.25rem' }
                    }}>
                      Select your display mode
                    </Typography>
                  </Box>
                </Stack>
                
                <Box className="time-display" sx={{ 
                  textAlign: 'right',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  p: 3,
                  borderRadius: 4,
                  backdropFilter: 'blur(15px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  minWidth: '220px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <AccessTimeIcon sx={{ fontSize: 28, color: 'white' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ 
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        fontSize: { xs: '1.5rem', md: '2rem' }
                      }}>
                        {currentTime.toLocaleTimeString()}
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        opacity: 0.9,
                        color: 'white',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        fontSize: { xs: '0.875rem', md: '1rem' }
                      }}>
                        {currentTime.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Box>

          {/* Menu Cards Section */}
          <Box sx={{ flex: 1, p: 4, minHeight: 0 }}>
            <Grid container spacing={3} justifyContent="center">
              {menuItems.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <Fade in={true} timeout={800 + (index * 200)}>
                    <Card 
                      className="menu-card"
                      onClick={() => handleMenuClick(item.route)}
                      sx={{
                        height: '350px',
                        background: item.gradient,
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <CardContent sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        p: 3,
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <Avatar sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          width: 80, 
                          height: 80,
                          mb: 2,
                          backdropFilter: 'blur(10px)',
                          border: '3px solid rgba(255,255,255,0.3)'
                        }}>
                          <item.icon sx={{ fontSize: 40 }} />
                        </Avatar>
                        
                        <Typography variant="h4" fontWeight="bold" sx={{ 
                          mb: 1,
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          {item.title}
                        </Typography>
                        
                        <Typography variant="body1" sx={{ 
                          mb: 2, 
                          opacity: 0.9,
                          fontWeight: 500,
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                          {item.subtitle}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ 
                          opacity: 0.8,
                          lineHeight: 1.4,
                          maxWidth: '250px',
                          mb: 2
                        }}>
                          {item.description}
                        </Typography>
                        
                        <Button
                          variant="contained"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            px: 3,
                            py: 1,
                            borderRadius: 3,
                            fontWeight: 'bold',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.3)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                            }
                          }}
                        >
                          Launch Display
                        </Button>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Footer */}
          <Box sx={{ 
            textAlign: 'center', 
            p: 2,
            color: 'white',
            opacity: 0.8,
            flexShrink: 0
          }}>
            <Typography variant="body2">
              © 2025 EPSS-MT - Ethiopian Pharmaceutical Supply Service - Monitoring Tool
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default TvMainMenu;