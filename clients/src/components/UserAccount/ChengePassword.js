import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  LinearProgress,
  Fade,
  Slide,
  Card,
  CardContent,
} from '@mui/material';
import {
  Lock,
  LockOpen,
  Visibility,
  VisibilityOff,
  CheckCircle,
  VpnKey,
  Security,
  Close,
} from '@mui/icons-material';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [user_name, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const apiUrl = process.env.REACT_APP_API_URL;

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    if (strength < 40) return { strength, label: 'Weak', color: '#f44336' };
    if (strength < 70) return { strength, label: 'Medium', color: '#ff9800' };
    return { strength, label: 'Strong', color: '#4caf50' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${apiUrl}/api/changePassword`, {
        user_name,
        currentPassword,
        newPassword,
      });

      setMessage(response.data.message);
      
      // Logout after password change
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
      }}
    >
      <Container maxWidth="sm">
        <Slide direction="down" in={true} timeout={800}>
          <Card
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: 4,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 150,
                  height: 150,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                },
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  backdropFilter: 'blur(10px)',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <VpnKey sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 800,
                  mb: 1,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}
              >
                Change Password
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 500,
                }}
              >
                Secure your account with a new password
              </Typography>
            </Box>

            {/* Form Section */}
            <CardContent sx={{ padding: 4 }}>
              <Box component="form" onSubmit={handleSubmit}>
                {/* Username Field */}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Username"
                  value={user_name}
                  onChange={(e) => setUsername(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Security sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                />

                {/* Current Password Field */}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Current Password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                />

                {/* New Password Field */}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOpen sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                />

                {/* Password Strength Indicator */}
                {newPassword && (
                  <Fade in={true}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Password Strength
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: passwordStrength.color, fontWeight: 600 }}
                        >
                          {passwordStrength.label}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength.strength}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: passwordStrength.color,
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  </Fade>
                )}

                {/* Confirm Password Field */}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={confirmPassword && newPassword !== confirmPassword}
                  helperText={
                    confirmPassword && newPassword !== confirmPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CheckCircle
                          sx={{
                            color:
                              confirmPassword && newPassword === confirmPassword
                                ? '#4caf50'
                                : '#667eea',
                          }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 2,
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </Button>

                {/* Messages */}
                {message && (
                  <Fade in={true}>
                    <Alert
                      severity="success"
                      icon={<CheckCircle />}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                      }}
                    >
                      {message}
                    </Alert>
                  </Fade>
                )}
                {error && (
                  <Fade in={true}>
                    <Alert
                      severity="error"
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                {/* Password Requirements */}
                <Paper
                  elevation={0}
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: '#f5f7ff',
                    borderRadius: 2,
                    border: '1px solid #e0e7ff',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: '#667eea', display: 'block', mb: 1 }}
                  >
                    Password Requirements:
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    • At least 6 characters long
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    • Mix of uppercase and lowercase letters (recommended)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    • Include numbers and special characters (recommended)
                  </Typography>
                </Paper>

                {/* Close Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  startIcon={<Close />}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: 2,
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#764ba2',
                      backgroundColor: 'rgba(102, 126, 234, 0.05)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Close
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Slide>
      </Container>
    </Box>
  );
};

export default ChangePassword;
