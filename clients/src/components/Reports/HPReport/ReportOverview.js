import { Grid, Card, CardContent, Typography, Box, Stack, LinearProgress, Chip } from '@mui/material';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const ReportOverview = ({ data }) => {
  if (!data) return null;

  const { summary, workflowProgress, routeStats } = data;

  const COLORS = ['#4caf50', '#f44336', '#ff9800', '#2196f3', '#9c27b0'];

  // RRF Status Data for Pie Chart
  const rrfStatusData = [
    { name: 'RRF Sent', value: summary.rrfSent, color: '#4caf50' },
    { name: 'RRF Not Sent', value: summary.rrfNotSent, color: '#f44336' }
  ];

  // ODN Status Data for Bar Chart
  const odnStatusData = [
    { name: 'Total ODNs', value: summary.totalODNs, color: '#2196f3' },
    { name: 'Dispatched', value: summary.dispatchedODNs, color: '#ff9800' },
    { name: 'POD Confirmed', value: summary.podConfirmed, color: '#4caf50' },
    { name: 'Quality Evaluated', value: summary.qualityEvaluated, color: '#9c27b0' }
  ];

  // Workflow Progress Data
  const workflowData = [
    { stage: 'O2C', count: workflowProgress?.o2c_stage || 0 },
    { stage: 'EWM', count: workflowProgress?.ewm_stage || 0 },
    { stage: 'PI', count: workflowProgress?.pi_stage || 0 },
    { stage: 'Dispatch', count: workflowProgress?.dispatch_stage || 0 },
    { stage: 'POD', count: workflowProgress?.pod_stage || 0 },
    { stage: 'Doc Follow-up', count: workflowProgress?.doc_followup_stage || 0 },
    { stage: 'Quality', count: workflowProgress?.quality_stage || 0 }
  ];

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', borderLeft: 4, borderColor: color }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ bgcolor: `${color}20`, p: 1.5, borderRadius: 2 }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const rrfPercentage = summary.expectedFacilities > 0
    ? ((summary.rrfSent / summary.expectedFacilities) * 100).toFixed(1)
    : 0;

  const podPercentage = summary.totalODNs > 0
    ? ((summary.podConfirmed / summary.totalODNs) * 100).toFixed(1)
    : 0;

  return (
    <Box>
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Facilities"
            value={summary.expectedFacilities}
            subtitle="Expected this month"
            icon={<CheckCircleIcon sx={{ fontSize: 40, color: '#2196f3' }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="RRF Sent"
            value={summary.rrfSent}
            subtitle={`${rrfPercentage}% of expected`}
            icon={<CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="RRF Not Sent"
            value={summary.rrfNotSent}
            subtitle={`${(100 - rrfPercentage).toFixed(1)}% pending`}
            icon={<CancelIcon sx={{ fontSize: 40, color: '#f44336' }} />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total ODNs"
            value={summary.totalODNs}
            subtitle="From RRF sent facilities"
            icon={<AssignmentTurnedInIcon sx={{ fontSize: 40, color: '#9c27b0' }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* RRF Status Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>RRF Submission Progress</Typography>
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2">
                {summary.rrfSent} of {summary.expectedFacilities} facilities submitted
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {rrfPercentage}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={parseFloat(rrfPercentage)}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* RRF Status Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>RRF Status Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={rrfStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {rrfStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ODN Status Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>ODN Processing Status</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={odnStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {odnStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workflow Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Workflow Stage Progress</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workflowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#667eea" name="Facilities Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Route Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Route Summary</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="white">
                  {routeStats?.length || 0}
                </Typography>
                <Typography variant="body2" color="white">
                  Active Routes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="white">
                  {summary.dispatchedODNs}
                </Typography>
                <Typography variant="body2" color="white">
                  Dispatched ODNs
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="white">
                  {summary.podConfirmed}
                </Typography>
                <Typography variant="body2" color="white">
                  POD Confirmed ({podPercentage}%)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportOverview;
