import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Grid, Paper } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// Styled Feature Card
const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[6],
  },
}));

const LandingPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('token') !== null;
  const Explore = ()=> {
      if(isLoggedIn){
        navigate('/customer-dashboard')
      }else{
        navigate('/login')
      }
  }

  return (
    <div>
      {/* AppBar */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <AssessmentIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            EPSS-AA1 Software Bundles
          </Typography>
          <Button color="inherit" href="#features">
            Features
          </Button>
          <Button color="inherit" onClick={()=> navigate('/login')}>
            Sign In
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(to right, #2196f3, #21cbf3)',
          color: 'white',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome!!
          </Typography>
          <Typography variant="h5" sx={{ mb: 4 }}>
            Unlock your potential with our Bundle of Software Solutions
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={()=> Explore()}
            sx={{
              backgroundColor: 'white',
              color: '#2196f3',
              '&:hover': { backgroundColor: '#f0f0f0' },
              fontWeight: 'bold',
              borderRadius: '50px',
              px: 4,
              py: 1.5,
            }}
          >
            Explore Digital tools
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h4" align="center" gutterBottom>
          EPSS AA one Software Bundles
        </Typography>
        <Typography align="center" color="text.secondary" sx={{ mb: 6 }}>
          Our app empowers you to assess yourself in a simple, effective, and insightful way.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <FeatureCard elevation={3}>
              <Typography variant="h6" gutterBottom>
                Easy Self-Assessment
              </Typography>
              <Typography>
                Simple, intuitive questions designed to help you reflect and evaluate effectively.
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FeatureCard elevation={3}>
              <Typography variant="h6" gutterBottom>
                Customer service managment
              </Typography>
              <Typography>
                Optimize communication, enhance customer satisfaction, and drive sustainable growth.
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FeatureCard elevation={3}>
              <Typography variant="h6" gutterBottom>
                Contract Managment
              </Typography>
              <Typography>
                All Facilities Contract agreement is one click away from you 
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FeatureCard elevation={3}>
              <Typography variant="h6" gutterBottom>
                POD
              </Typography>
              <Typography>
               Track Pharmacuiticals proof of delivery 
              </Typography>
            </FeatureCard>
          </Grid>
        </Grid>
      </Container>

      
    </div>
  );
};

export default LandingPage;
