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
      subtitle: 'Customer Display',
      description: 'Customer waiting area information display',
      icon: EventSeatIcon,
      color: '#4caf50',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
      route: '/tvcustomer'
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
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 40px;
            border-radius: 24px 24px 0 0;
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
          .icon-container {
            animation: float 3s ease-in-out infinite;
          }
          .time-display {
            animation: pulse 2s infinite;
          }
        `}
      </style>
      
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
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
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header Section */}
          <Box className="header-gradient">
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={4}>
                  <Box className="icon-container" sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 100, 
                    height: 100,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '3px solid rgba(255,255,255,0.3)'
                  }}>
                    <TvIcon sx={{ fontSize: 50 }} />
                  </Box>
                  <Box>
                    <Typography variant="h2" fontWeight="bold" sx={{ 
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      mb: 1
                    }}>
                      TV Display Menu
                    </Typography>
                    <Typography variant="h5" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 300,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      Select your display mode
                    </Typography>
                  </Box>
                </Stack>
                
                <Box className="time-display" sx={{ 
                  textAlign: 'right',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  p: 3,
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <AccessTimeIcon sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {currentTime.toLocaleTimeString()}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.8 }}>
                        {currentTime.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
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
          <Box sx={{ flex: 1, p: 6 }}>
            <Grid container spacing={4} justifyContent="center">
              {menuItems.map((item, index) => (
                <Grid item xs={12} md={4} key={item.id}>
                  <Fade in={true} timeout={800 + (index * 200)}>
                    <Card 
                      className="menu-card"
                      onClick={() => handleMenuClick(item.route)}
                      sx={{
                        height: '400px',
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
                        p: 4,
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <Avatar sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          width: 100, 
                          height: 100,
                          mb: 3,
                          backdropFilter: 'blur(10px)',
                          border: '3px solid rgba(255,255,255,0.3)'
                        }}>
                          <item.icon sx={{ fontSize: 50 }} />
                        </Avatar>
                        
                        <Typography variant="h3" fontWeight="bold" sx={{ 
                          mb: 1,
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          {item.title}
                        </Typography>
                        
                        <Typography variant="h6" sx={{ 
                          mb: 2, 
                          opacity: 0.9,
                          fontWeight: 500,
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                          {item.subtitle}
                        </Typography>
                        
                        <Typography variant="body1" sx={{ 
                          opacity: 0.8,
                          lineHeight: 1.6,
                          maxWidth: '280px'
                        }}>
                          {item.description}
                        </Typography>
                        
                        <Button
                          variant="contained"
                          sx={{
                            mt: 3,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
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
            p: 4,
            color: 'white',
            opacity: 0.8
          }}>
            <Typography variant="body2">
              © 2025 PharmaLog - Pharmaceutical Logistics Management System
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default TvMainMenu;