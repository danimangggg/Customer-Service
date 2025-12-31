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
  Divider
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  CreditCard,
  Payment,
  MonetizationOn
} from '@mui/icons-material';

const FinancialReports = () => {
  // Sample financial data
  const financialMetrics = [
    {
      title: 'Total Revenue',
      value: '$2.4M',
      change: '+18.5%',
      trend: 'up',
      icon: <AttachMoney />,
      color: '#4caf50'
    },
    {
      title: 'Monthly Income',
      value: '$340K',
      change: '+12.3%',
      trend: 'up',
      icon: <MonetizationOn />,
      color: '#2196f3'
    },
    {
      title: 'Outstanding Payments',
      value: '$89K',
      change: '-8.7%',
      trend: 'up',
      icon: <Receipt />,
      color: '#ff9800'
    },
    {
      title: 'Processing Fees',
      value: '$45K',
      change: '+5.2%',
      trend: 'up',
      icon: <CreditCard />,
      color: '#9c27b0'
    }
  ];

  const monthlyRevenue = [
    { month: 'Jan', revenue: 280000, target: 300000 },
    { month: 'Feb', revenue: 320000, target: 300000 },
    { month: 'Mar', revenue: 295000, target: 300000 },
    { month: 'Apr', revenue: 340000, target: 320000 },
    { month: 'May', revenue: 385000, target: 350000 },
    { month: 'Jun', revenue: 410000, target: 380000 }
  ];

  const paymentMethods = [
    { method: 'Bank Transfer', amount: 1450000, percentage: 60.4, color: '#2196f3' },
    { method: 'Credit Card', amount: 580000, percentage: 24.2, color: '#4caf50' },
    { method: 'Cash Payment', amount: 290000, percentage: 12.1, color: '#ff9800' },
    { method: 'Mobile Payment', amount: 80000, percentage: 3.3, color: '#9c27b0' }
  ];

  const recentTransactions = [
    { id: 'TXN-001', customer: 'Black Lion Hospital', amount: 25000, status: 'Completed', date: '2024-12-30' },
    { id: 'TXN-002', customer: 'Bethel Medical Center', amount: 18500, status: 'Pending', date: '2024-12-30' },
    { id: 'TXN-003', customer: 'Pharmaceutical Corp', amount: 42000, status: 'Completed', date: '2024-12-29' },
    { id: 'TXN-004', customer: 'Medical Supplies Ltd', amount: 15750, status: 'Processing', date: '2024-12-29' },
    { id: 'TXN-005', customer: 'Health Research Institute', amount: 33200, status: 'Completed', date: '2024-12-28' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Processing': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Financial Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive financial analysis, revenue tracking, and payment insights
        </Typography>
      </Box>

      {/* Financial Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {financialMetrics.map((metric, index) => (
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

      <Grid container spacing={3}>
        {/* Monthly Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <AccountBalance color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Monthly Revenue vs Target
                </Typography>
              </Stack>
              
              <Box sx={{ mt: 2 }}>
                {monthlyRevenue.map((month, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {month.month}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                          ${(month.revenue / 1000).toFixed(0)}K / ${(month.target / 1000).toFixed(0)}K
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color={month.revenue >= month.target ? 'success.main' : 'warning.main'}>
                          {((month.revenue / month.target) * 100).toFixed(1)}%
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((month.revenue / month.target) * 100, 100)}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          bgcolor: month.revenue >= month.target ? '#4caf50' : '#ff9800'
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Methods & Recent Transactions */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Payment Methods */}
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <Payment color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Payment Methods
                  </Typography>
                </Stack>
                
                <Box sx={{ mt: 2 }}>
                  {paymentMethods.map((method, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {method.method}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {method.percentage}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={method.percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: method.color
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        ${(method.amount / 1000).toFixed(0)}K
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Receipt color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Recent Transactions
                </Typography>
              </Stack>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)' }}>
                      <TableCell fontWeight="bold">Transaction ID</TableCell>
                      <TableCell fontWeight="bold">Customer</TableCell>
                      <TableCell align="right" fontWeight="bold">Amount</TableCell>
                      <TableCell align="center" fontWeight="bold">Status</TableCell>
                      <TableCell fontWeight="bold">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTransactions.map((transaction, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" color="primary">
                            {transaction.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.customer}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            ${transaction.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={transaction.status} 
                            color={getStatusColor(transaction.status)} 
                            variant="outlined" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {transaction.date}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
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

export default FinancialReports;