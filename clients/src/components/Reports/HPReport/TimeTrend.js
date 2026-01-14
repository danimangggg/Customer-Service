import { Box, Card, CardContent, Typography, Grid, Stack, Chip } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';

const TimeTrend = ({ data }) => {
  if (!data || !data.trendData || data.trendData.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No historical data available yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Time trend analysis will appear once multiple reporting periods have data
        </Typography>
      </Box>
    );
  }

  const { trendData } = data;

  // Calculate trends (compare last two periods)
  const calculateTrend = (field) => {
    if (trendData.length < 2) return { value: 0, direction: 'stable' };
    const latest = parseInt(trendData[trendData.length - 1][field] || 0);
    const previous = parseInt(trendData[trendData.length - 2][field] || 0);
    const change = latest - previous;
    const percentChange = previous > 0 ? ((change / previous) * 100).toFixed(1) : 0;
    
    return {
      value: percentChange,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      absolute: change
    };
  };

  const facilitiesTrend = calculateTrend('facilities_reported');
  const odnsTrend = calculateTrend('total_odns');
  const dispatchTrend = calculateTrend('dispatched_odns');
  const podTrend = calculateTrend('pod_confirmed');

  const TrendCard = ({ title, trend, color }) => (
    <Card sx={{ borderLeft: 4, borderColor: color }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          {trend.direction === 'up' && <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 32 }} />}
          {trend.direction === 'down' && <TrendingDownIcon sx={{ color: '#f44336', fontSize: 32 }} />}
          {trend.direction === 'stable' && <RemoveIcon sx={{ color: '#ff9800', fontSize: 32 }} />}
          <Box>
            <Typography variant="h4" fontWeight="bold" color={
              trend.direction === 'up' ? '#4caf50' :
              trend.direction === 'down' ? '#f44336' :
              '#ff9800'
            }>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {trend.absolute > 0 ? '+' : ''}{trend.absolute} from last period
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Trend Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <TrendCard
            title="Facilities Reporting"
            trend={facilitiesTrend}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TrendCard
            title="Total ODNs"
            trend={odnsTrend}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TrendCard
            title="Dispatched ODNs"
            trend={dispatchTrend}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TrendCard
            title="POD Confirmed"
            trend={podTrend}
            color="#4caf50"
          />
        </Grid>
      </Grid>

      {/* Facilities Reporting Trend */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Facilities Reporting Over Time</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="reporting_month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="facilities_reported"
                stroke="#2196f3"
                fill="#2196f3"
                fillOpacity={0.3}
                name="Facilities Reported"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ODN Processing Trend */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>ODN Processing Trend</Typography>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="reporting_month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_odns"
                stroke="#9c27b0"
                strokeWidth={2}
                name="Total ODNs"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="dispatched_odns"
                stroke="#ff9800"
                strokeWidth={2}
                name="Dispatched"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="pod_confirmed"
                stroke="#4caf50"
                strokeWidth={2}
                name="POD Confirmed"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="quality_evaluated"
                stroke="#f44336"
                strokeWidth={2}
                name="Quality Evaluated"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Completion Rate Trend */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Completion Rate Trend (%)</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={trendData.map(item => ({
                month: item.reporting_month,
                dispatchRate: item.total_odns > 0
                  ? ((item.dispatched_odns / item.total_odns) * 100).toFixed(1)
                  : 0,
                podRate: item.total_odns > 0
                  ? ((item.pod_confirmed / item.total_odns) * 100).toFixed(1)
                  : 0,
                qualityRate: item.total_odns > 0
                  ? ((item.quality_evaluated / item.total_odns) * 100).toFixed(1)
                  : 0
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="dispatchRate" fill="#ff9800" name="Dispatch Rate %" />
              <Bar dataKey="podRate" fill="#4caf50" name="POD Rate %" />
              <Bar dataKey="qualityRate" fill="#9c27b0" name="Quality Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Period Summary */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Historical Summary</Typography>
          <Grid container spacing={2}>
            {trendData.map((period, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {period.reporting_month}
                      </Typography>
                      {index === trendData.length - 1 && (
                        <Chip label="Latest" size="small" color="primary" />
                      )}
                    </Stack>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Facilities:</Typography>
                        <Typography variant="body2" fontWeight="medium">{period.facilities_reported}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">ODNs:</Typography>
                        <Typography variant="body2" fontWeight="medium">{period.total_odns}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Dispatched:</Typography>
                        <Typography variant="body2" fontWeight="medium">{period.dispatched_odns}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">POD:</Typography>
                        <Typography variant="body2" fontWeight="medium">{period.pod_confirmed}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimeTrend;
