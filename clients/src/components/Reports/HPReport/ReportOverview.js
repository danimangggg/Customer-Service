import React from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, Stack, LinearProgress, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';

const ReportOverview = ({ data }) => {
  // State for facilities table
  const [facilityFilter, setFacilityFilter] = React.useState('all');
  const [facilitySearch, setFacilitySearch] = React.useState('');

  if (!data) return null;

  const { summary, workflowProgress, routeStats, rrfSentFacilities, rrfNotSentFacilities } = data;

  const COLORS = ['#4caf50', '#f44336', '#ff9800', '#2196f3', '#9c27b0'];

  // RRF Status Data for Pie Chart
  const rrfStatusData = [
    { name: 'RRF Sent', value: summary.rrfSent, color: '#4caf50' },
    { name: 'RRF Not Sent', value: summary.rrfNotSent, color: '#f44336' }
  ];

  // Facilities table data
  const allFacilities = [
    ...(rrfSentFacilities || []).map(f => ({ ...f, rrfStatus: 'sent' })),
    ...(rrfNotSentFacilities || []).map(f => ({ ...f, rrfStatus: 'not_sent' }))
  ];

  const filteredFacilities = allFacilities.filter(facility => {
    const matchesSearch = facility.facility_name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
                         facility.route.toLowerCase().includes(facilitySearch.toLowerCase()) ||
                         facility.region_name.toLowerCase().includes(facilitySearch.toLowerCase());
    
    const matchesFilter = facilityFilter === 'all' || 
                         (facilityFilter === 'sent' && facility.rrfStatus === 'sent') ||
                         (facilityFilter === 'not_sent' && facility.rrfStatus === 'not_sent');
    
    return matchesSearch && matchesFilter;
  });

  // Export to Excel function
  const handleExportToExcel = () => {
    const exportData = filteredFacilities.map((facility, index) => ({
      '#': index + 1,
      'Facility Name': facility.facility_name,
      'Route': facility.route,
      'Region': facility.region_name,
      'Zone': facility.zone_name,
      'Woreda': facility.woreda_name,
      'RRF Status': facility.rrfStatus === 'sent' ? 'Sent' : 'Not Sent'
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RRF Facilities Status');
    const filename = `RRF_Facilities_Status_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

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
        {/* RRF Status Pie Chart - Full Width */}
        <Grid item xs={12}>
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
      </Grid>

      {/* Facilities RRF Status Table - Full Width */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Facilities RRF Status</Typography>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportToExcel}
            >
              Excel
            </Button>
          </Stack>
          
          {/* Filters */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search facilities..."
              value={facilitySearch}
              onChange={(e) => setFacilitySearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={facilityFilter}
                label="Filter"
                onChange={(e) => setFacilityFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="sent">RRF Sent</MenuItem>
                <MenuItem value="not_sent">RRF Not Sent</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Table */}
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Facility</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">RRF Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFacilities.length > 0 ? (
                  filteredFacilities.slice(0, 20).map((facility, index) => (
                    <TableRow key={`${facility.id}-${index}`} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {facility.facility_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {facility.region_name} • {facility.zone_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={facility.route} 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={facility.rrfStatus === 'sent' ? 'Sent' : 'Not Sent'}
                          size="small"
                          color={facility.rrfStatus === 'sent' ? 'success' : 'error'}
                          icon={facility.rrfStatus === 'sent' ? <CheckCircleIcon /> : <CancelIcon />}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No facilities data available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredFacilities.length > 20 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing 20 of {filteredFacilities.length} facilities
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportOverview;
