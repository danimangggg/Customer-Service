import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Stack, TextField, TablePagination, Tabs, Tab,
  Grid, Avatar, LinearProgress
} from '@mui/material';import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DescriptionIcon from '@mui/icons-material/Description';
import QualityIcon from '@mui/icons-material/HighQuality';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const ServiceUnitsDetail = ({ data }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!data) return null;

  const { summary, workflowProgress } = data;

  const wp = workflowProgress || {};

  const expectedThisMonth = summary?.expectedThisMonth ?? summary?.expectedFacilities ?? 0;
  const doneFacilities = summary?.doneFacilities ?? 0;
  const donePercent = expectedThisMonth > 0 ? ((doneFacilities / expectedThisMonth) * 100).toFixed(1) : 0;

  // Cumulative counts — each stage includes all ODNs that reached it or beyond
  // Actual flow: O2C → EWM → TM Phase 1 → Biller → TM Phase 2 → Dispatch → Documentation → Quality
  const cumulative = {
    o2c:     wp.o2c_stage              || 0,
    ewm1:    wp.ewm_phase1_facilities  || 0,
    tm1:     wp.tm_phase1_facilities   || 0,
    ewm2:    wp.ewm_phase2_facilities  || 0,
    biller:  wp.biller_facilities      || 0,
    pi:      wp.pi_facilities          || 0,
    tm2:     wp.tm_phase2_facilities   || 0,
    dispatch:wp.dispatch_odns          || 0,
    doc:     wp.documentation_stage    || 0,
    quality: wp.quality_stage          || 0,
  };

  // "Currently at stage" = cumulative[stage] - cumulative[next stage]
  const atStage = {
    o2c:      Math.max(0, cumulative.o2c     - cumulative.ewm1),
    ewm1:     Math.max(0, cumulative.ewm1    - cumulative.tm1),
    tm1:      Math.max(0, cumulative.tm1     - cumulative.ewm2),
    ewm2:     Math.max(0, cumulative.ewm2    - cumulative.biller),
    biller:   Math.max(0, cumulative.biller  - cumulative.pi),
    pi:       Math.max(0, cumulative.pi      - cumulative.tm2),
    tm2:      Math.max(0, cumulative.tm2     - cumulative.dispatch),
    dispatch: Math.max(0, cumulative.dispatch- cumulative.doc),
    doc:      Math.max(0, cumulative.doc     - cumulative.quality),
    quality:  0,
  };

  const totalODNs = cumulative.o2c || summary?.totalODNs || 0;
  const rateBase = expectedThisMonth > 0 ? expectedThisMonth : totalODNs;

  // Service units — correct workflow order
  const serviceUnits = [
    {
      name: 'O2C (Order to Cash)',
      icon: <AccountBalanceIcon />,
      atStage: atStage.o2c,
      cumulative: cumulative.o2c,
      color: 'secondary',
      description: 'Initial order processing'
    },
    {
      name: 'EWM',
      icon: <BusinessIcon />,
      atStage: atStage.ewm1,
      cumulative: cumulative.ewm1,
      color: 'info',
      description: 'EWM goods issued'
    },
    {
      name: 'TM Phase 1',
      icon: <LocalShippingIcon />,
      atStage: atStage.tm1,
      cumulative: cumulative.tm1,
      color: 'success',
      description: 'Vehicle assigned'
    },
    {
      name: 'EWM Phase 2 (Goods Issue)',
      icon: <BusinessIcon />,
      atStage: atStage.ewm2,
      cumulative: cumulative.ewm2,
      color: 'info',
      description: 'EWM goods issued after TM Phase 1'
    },
    {
      name: 'Biller',
      icon: <InventoryIcon />,
      atStage: atStage.biller,
      cumulative: cumulative.biller,
      color: 'warning',
      description: 'Biller documents printed'
    },
    {
      name: 'PI Officer',
      icon: <AssignmentIcon />,
      atStage: atStage.pi,
      cumulative: cumulative.pi,
      color: 'secondary',
      description: 'PI officer processing'
    },
    {
      name: 'TM Phase 2',
      icon: <LocalShippingIcon />,
      atStage: atStage.tm2,
      cumulative: cumulative.tm2,
      color: 'success',
      description: 'Driver & deliverer assigned'
    },
    {
      name: 'Dispatch',
      icon: <AssignmentIcon />,
      atStage: atStage.dispatch,
      cumulative: cumulative.dispatch,
      color: 'error',
      description: 'Dispatched to facilities'
    },
    {
      name: 'Documentation',
      icon: <DescriptionIcon />,
      atStage: atStage.doc,
      cumulative: cumulative.doc,
      color: 'info',
      description: 'POD confirmed'
    },
    {
      name: 'Quality Evaluation',
      icon: <QualityIcon />,
      atStage: atStage.quality,
      cumulative: cumulative.quality,
      color: 'error',
      description: 'Quality assessment completed'
    },
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearchTerm('');
  };

  const currentServiceUnit = serviceUnits[activeTab];

  // Workflow Progress Data for Bar Chart — show "currently at stage" counts
  const totalFacilities = summary?.totalFacilities ?? summary?.totalODNs ?? 0;

  return (
    <Box>
      {/* Expected This Month vs Done — facility-based summary */}
      <Card sx={{ mb: 3, borderLeft: 4, borderColor: 'primary.main' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
              <TrendingUpIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary">Expected This Month</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{expectedThisMonth} facilities</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">{doneFacilities} / {expectedThisMonth}</Typography>
            </Box>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={parseFloat(donePercent)}
            sx={{ height: 10, borderRadius: 5 }}
            color="success"
          />
          <Typography variant="caption" color="text.secondary">{donePercent}% complete</Typography>
        </CardContent>
      </Card>

      {/* Service Units Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {serviceUnits.map((unit, index) => {
          const pct = rateBase > 0 ? ((unit.atStage / rateBase) * 100).toFixed(1) : 0;
          return (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ 
                height: '100%',
                cursor: 'pointer',
                border: activeTab === index ? 2 : 0,
                borderColor: activeTab === index ? `${unit.color}.main` : 'transparent',
                '&:hover': { boxShadow: 3 }
              }}
              onClick={() => setActiveTab(index)}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: `${unit.color}.light`, 
                      color: `${unit.color}.main`,
                      width: 48, 
                      height: 48 
                    }}>
                      {unit.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" fontWeight="bold" color={`${unit.color}.main`}>
                        {unit.cumulative}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {unit.name}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Service Unit Details */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Avatar sx={{ 
              bgcolor: `${currentServiceUnit.color}.light`, 
              color: `${currentServiceUnit.color}.main`,
              width: 56, 
              height: 56 
            }}>
              {currentServiceUnit.icon}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {currentServiceUnit.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentServiceUnit.description}
              </Typography>
            </Box>
          </Stack>

          {/* Service Unit Statistics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color={`${currentServiceUnit.color}.main`}>
                    {currentServiceUnit.atStage}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently at this Stage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {currentServiceUnit.cumulative}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reached this Stage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {rateBase > 0 ? ((currentServiceUnit.cumulative / rateBase) * 100).toFixed(1) : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {serviceUnits.findIndex(u => u.name === currentServiceUnit.name) + 1}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Process Stage
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Service Unit Performance Table */}
          <Typography variant="h6" gutterBottom>
            Service Unit Performance Comparison
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Service Unit</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Currently Here</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Reached (Cumulative %)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceUnits.map((unit, index) => {
                  const pct = rateBase > 0 ? ((unit.cumulative / rateBase) * 100).toFixed(1) : 0;
                  const isActive = index === activeTab;
                  return (
                    <TableRow 
                      key={index} 
                      hover 
                      sx={{ bgcolor: isActive ? `${unit.color}.50` : 'inherit', cursor: 'pointer' }}
                      onClick={() => setActiveTab(index)}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: `${unit.color}.light`, color: `${unit.color}.main`, width: 32, height: 32 }}>
                            {unit.icon}
                          </Avatar>
                          <Typography variant="body2" fontWeight={isActive ? 'bold' : 'normal'}>
                            {unit.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold" color={`${unit.color}.main`}>
                          {unit.atStage}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">currently here</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold">{unit.cumulative}</Typography>
                        <Stack alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={parseFloat(pct)}
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                            color={unit.color}
                          />
                          <Typography variant="caption">{pct}%</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{unit.description}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

    </Box>
  );
};

export default ServiceUnitsDetail;
