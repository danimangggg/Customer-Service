import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Stack,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material';
import {
  Inventory,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  LocalShipping,
  Category,
  Assessment
} from '@mui/icons-material';

const InventoryReports = () => {
  // Sample inventory data
  const inventoryMetrics = [
    {
      title: 'Total Items',
      value: '1,847',
      change: '+5.2%',
      trend: 'up',
      icon: <Inventory />,
      color: '#2196f3'
    },
    {
      title: 'In Stock',
      value: '1,623',
      change: '+3.1%',
      trend: 'up',
      icon: <CheckCircle />,
      color: '#4caf50'
    },
    {
      title: 'Low Stock',
      value: '89',
      change: '+12%',
      trend: 'down',
      icon: <Warning />,
      color: '#ff9800'
    },
    {
      title: 'Out of Stock',
      value: '135',
      change: '-8.3%',
      trend: 'up',
      icon: <LocalShipping />,
      color: '#f44336'
    }
  ];

  const categoryDistribution = [
    { category: 'Medical Equipment', items: 456, percentage: 24.7, color: '#2196f3' },
    { category: 'Pharmaceuticals', items: 389, percentage: 21.1, color: '#4caf50' },
    { category: 'Surgical Instruments', items: 312, percentage: 16.9, color: '#ff9800' },
    { category: 'Laboratory Supplies', items: 267, percentage: 14.5, color: '#9c27b0' },
    { category: 'Protective Equipment', items: 234, percentage: 12.7, color: '#f44336' },
    { category: 'Other Supplies', items: 189, percentage: 10.1, color: '#607d8b' }
  ];

  const lowStockItems = [
    { name: 'Surgical Masks N95', current: 45, minimum: 100, category: 'Protective Equipment', urgency: 'high' },
    { name: 'Insulin Syringes', current: 78, minimum: 150, category: 'Medical Equipment', urgency: 'high' },
    { name: 'Blood Pressure Monitors', current: 12, minimum: 25, category: 'Medical Equipment', urgency: 'medium' },
    { name: 'Latex Gloves (Box)', current: 156, minimum: 200, category: 'Protective Equipment', urgency: 'low' },
    { name: 'Thermometers Digital', current: 23, minimum: 50, category: 'Medical Equipment', urgency: 'medium' }
  ];

  const stockMovement = [
    { month: 'Jan', inbound: 234, outbound: 189, net: 45 },
    { month: 'Feb', inbound: 267, outbound: 223, net: 44 },
    { month: 'Mar', inbound: 198, outbound: 245, net: -47 },
    { month: 'Apr', inbound: 312, outbound: 267, net: 45 },
    { month: 'May', inbound: 289, outbound: 234, net: 55 },
    { month: 'Jun', inbound: 345, outbound: 298, net: 47 }
  ];

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStockLevel = (current, minimum) => {
    const percentage = (current / minimum) * 100;
    if (percentage <= 50) return { color: '#f44336', level: 'Critical' };
    if (percentage <= 75) return { color: '#ff9800', level: 'Low' };
    return { color: '#4caf50', level: 'Good' };
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Inventory Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track inventory levels, stock movements, and supply chain analytics
        </Typography>
      </Box>

      {/* Inventory Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {inventoryMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              height: '100%',
              background: `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}05 100%)`,
              border: `1px solid ${metric.color}30`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease'
              },
              transition: 'all 0.3s ease'
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: metric.color, width: 56, height: 56 }}>
                    {metric.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {metric.title}
                    </Typography>
                    <Chip
                      icon={metric.trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                      label={metric.change}
                      size="small"
                      color={metric.trend === 'up' ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Alert for Low Stock */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Attention:</strong> 89 items are running low on stock. Immediate restocking recommended for critical items.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Category Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 500 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Category color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Inventory by Category
                </Typography>
              </Stack>
              
              <Box sx={{ mt: 2 }}>
                {categoryDistribution.map((category, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {category.category}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          {category.items}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {category.percentage}%
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={category.percentage}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          bgcolor: category.color
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stock Movement */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 500 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Assessment color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Monthly Stock Movement
                </Typography>
              </Stack>
              
              <Box sx={{ mt: 2 }}>
                {stockMovement.map((month, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                      {month.month}
                    </Typography>
                    
                    {/* Inbound */}
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 80 }}>
                        Inbound:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(month.inbound / 400) * 100}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(76, 175, 80, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: '#4caf50'
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 40 }}>
                        {month.inbound}
                      </Typography>
                    </Stack>
                    
                    {/* Outbound */}
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 80 }}>
                        Outbound:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(month.outbound / 400) * 100}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(244, 67, 54, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: '#f44336'
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 40 }}>
                        {month.outbound}
                      </Typography>
                    </Stack>
                    
                    {/* Net Change */}
                    <Typography variant="caption" color={month.net >= 0 ? 'success.main' : 'error.main'} fontWeight="bold">
                      Net: {month.net >= 0 ? '+' : ''}{month.net}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock Items Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Warning color="warning" />
                <Typography variant="h6" fontWeight="bold">
                  Low Stock Items - Immediate Attention Required
                </Typography>
              </Stack>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                      <TableCell fontWeight="bold">Item Name</TableCell>
                      <TableCell fontWeight="bold">Category</TableCell>
                      <TableCell align="center" fontWeight="bold">Current Stock</TableCell>
                      <TableCell align="center" fontWeight="bold">Minimum Required</TableCell>
                      <TableCell align="center" fontWeight="bold">Stock Level</TableCell>
                      <TableCell align="center" fontWeight="bold">Urgency</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lowStockItems.map((item, index) => {
                      const stockInfo = getStockLevel(item.current, item.minimum);
                      return (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.category}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="bold">
                              {item.current}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {item.minimum}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={stockInfo.level} 
                              size="small" 
                              sx={{ 
                                bgcolor: `${stockInfo.color}20`,
                                color: stockInfo.color,
                                border: `1px solid ${stockInfo.color}50`
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={item.urgency.toUpperCase()} 
                              color={getUrgencyColor(item.urgency)} 
                              variant="outlined" 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InventoryReports;