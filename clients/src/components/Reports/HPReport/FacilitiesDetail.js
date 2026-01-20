import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Stack, TextField, TablePagination, Tabs, Tab,
  Grid, Avatar, LinearProgress
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DescriptionIcon from '@mui/icons-material/Description';
import QualityIcon from '@mui/icons-material/HighQuality';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const ServiceUnitsDetail = ({ data }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!data) return null;

  const { summary, workflowProgress } = data;

  // Service units data
  const serviceUnits = [
    {
      name: 'O2C (Order to Cash)',
      icon: <AccountBalanceIcon />,
      count: workflowProgress?.o2c_stage || 0,
      color: 'primary',
      description: 'Initial order processing and cash management'
    },
    {
      name: 'EWM (Extended Warehouse Management)',
      icon: <BusinessIcon />,
      count: workflowProgress?.ewm_stage || 0,
      color: 'secondary',
      description: 'Warehouse management and inventory control'
    },
    {
      name: 'PI (Physical Inventory)',
      icon: <InventoryIcon />,
      count: workflowProgress?.pi_stage || 0,
      color: 'success',
      description: 'Physical inventory verification and counting'
    },
    {
      name: 'TM Management',
      icon: <LocalShippingIcon />,
      count: workflowProgress?.tm_stage || 0,
      color: 'warning',
      description: 'Transportation and logistics management'
    },
    {
      name: 'Documentation',
      icon: <DescriptionIcon />,
      count: workflowProgress?.documentation_stage || 0,
      color: 'info',
      description: 'Document processing and POD confirmation'
    },
    {
      name: 'Quality Evaluation',
      icon: <QualityIcon />,
      count: workflowProgress?.quality_stage || 0,
      color: 'error',
      description: 'Quality assessment and evaluation'
    }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearchTerm('');
  };

  const currentServiceUnit = serviceUnits[activeTab];
  const totalODNs = summary?.totalODNs || 0;

  // Workflow Progress Data for Bar Chart
  const workflowData = [
    { stage: 'O2C', count: workflowProgress?.o2c_stage || 0, color: '#2196f3' },
    { stage: 'EWM', count: workflowProgress?.ewm_stage || 0, color: '#4caf50' },
    { stage: 'PI', count: workflowProgress?.pi_stage || 0, color: '#ff9800' },
    { stage: 'TM Management', count: workflowProgress?.tm_stage || 0, color: '#9c27b0' },
    { stage: 'Dispatched', count: workflowProgress?.dispatched_stage || 0, color: '#795548' },
    { stage: 'Documentation', count: workflowProgress?.documentation_stage || 0, color: '#f44336' },
    { stage: 'Quality', count: workflowProgress?.quality_stage || 0, color: '#607d8b' }
  ];

  // Custom label component for bar charts
  const renderCustomizedLabel = (props) => {
    const { x, y, width, height, value, payload } = props;
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#000" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  return (
    <Box>
      {/* Service Units Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {serviceUnits.map((unit, index) => {
          const percentage = totalODNs > 0 ? ((unit.count / totalODNs) * 100).toFixed(1) : 0;
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
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {unit.count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {unit.name}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(percentage)}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        color={unit.color}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {percentage}% of total ODNs
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
                    {currentServiceUnit.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ODNs Processed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {totalODNs > 0 ? ((currentServiceUnit.count / totalODNs) * 100).toFixed(1) : 0}%
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
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {totalODNs - currentServiceUnit.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending ODNs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {serviceUnits.findIndex(unit => unit.name === currentServiceUnit.name) + 1}
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
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">ODNs Processed</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Completion Rate</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceUnits.map((unit, index) => {
                  const percentage = totalODNs > 0 ? ((unit.count / totalODNs) * 100).toFixed(1) : 0;
                  const isActive = index === activeTab;
                  
                  return (
                    <TableRow 
                      key={index} 
                      hover 
                      sx={{ 
                        bgcolor: isActive ? `${unit.color}.50` : 'inherit',
                        cursor: 'pointer'
                      }}
                      onClick={() => setActiveTab(index)}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ 
                            bgcolor: `${unit.color}.light`, 
                            color: `${unit.color}.main`,
                            width: 32, 
                            height: 32 
                          }}>
                            {unit.icon}
                          </Avatar>
                          <Typography variant="body2" fontWeight={isActive ? 'bold' : 'normal'}>
                            {unit.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold" color={`${unit.color}.main`}>
                          {unit.count}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack alignItems="center" spacing={1}>
                          <LinearProgress
                            variant="determinate"
                            value={parseFloat(percentage)}
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                            color={unit.color}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {percentage}%
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={unit.count > 0 ? 'Active' : 'Pending'}
                          size="small"
                          color={unit.count > 0 ? 'success' : 'default'}
                          variant={unit.count > 0 ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {unit.description}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Workflow Stage Progress Chart - Moved to End */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Workflow Stage Progress (ODN Count)</Typography>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={workflowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'Number of ODNs', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name, props) => [value, `${props.payload.stage} ODNs`]}
                labelFormatter={(label) => `Service Unit: ${label}`}
              />
              <Bar dataKey="count" name="ODN Count" label={renderCustomizedLabel} maxBarSize={40}>
                {workflowData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServiceUnitsDetail;
