import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Stack, TextField, TablePagination, Tabs, Tab,
  Grid, Avatar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BusinessIcon from '@mui/icons-material/Business';
import RouteIcon from '@mui/icons-material/Route';

const FacilitiesDetail = ({ data }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!data) return null;

  const { rrfSentFacilities, rrfNotSentFacilities, summary } = data;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearchTerm('');
  };

  const currentData = activeTab === 0 ? rrfSentFacilities : rrfNotSentFacilities;

  const filteredData = currentData.filter(facility =>
    (facility.facility_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (facility.route || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (facility.region_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 56, height: 56 }}>
                  <BusinessIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {summary.expectedFacilities}
                  </Typography>
                  <Typography variant="body2">
                    Total Expected Facilities
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'white', color: 'success.main', width: 56, height: 56 }}>
                  <CheckCircleIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {summary.rrfSent}
                  </Typography>
                  <Typography variant="body2">
                    RRF Sent ({((summary.rrfSent / summary.expectedFacilities) * 100).toFixed(1)}%)
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'white', color: 'error.main', width: 56, height: 56 }}>
                  <CancelIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {summary.rrfNotSent}
                  </Typography>
                  <Typography variant="body2">
                    RRF Not Sent ({((summary.rrfNotSent / summary.expectedFacilities) * 100).toFixed(1)}%)
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs and Table */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            label={`RRF Sent (${rrfSentFacilities.length})`}
            icon={<CheckCircleIcon />}
            iconPosition="start"
          />
          <Tab
            label={`RRF Not Sent (${rrfNotSentFacilities.length})`}
            icon={<CancelIcon />}
            iconPosition="start"
          />
        </Tabs>

        <CardContent>
          {/* Search */}
          <TextField
            placeholder="Search facilities, routes, or regions..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Facility Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Region</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Zone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Woreda</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
                  {activeTab === 0 && (
                    <TableCell sx={{ fontWeight: 'bold' }}>Process Status</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((facility, index) => (
                    <TableRow key={facility.id} hover>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <BusinessIcon fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight="medium">
                            {facility.facility_name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{facility.region_name || 'N/A'}</TableCell>
                      <TableCell>{facility.zone_name || 'N/A'}</TableCell>
                      <TableCell>{facility.woreda_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          icon={<RouteIcon />}
                          label={facility.route || 'N/A'}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      {activeTab === 0 && (
                        <TableCell>
                          <Chip
                            label={facility.process_status?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                            size="small"
                            color={
                              facility.process_status === 'ewm_completed' ? 'success' :
                              facility.process_status === 'o2c_completed' ? 'info' :
                              'default'
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={activeTab === 0 ? 7 : 6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No facilities found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default FacilitiesDetail;
