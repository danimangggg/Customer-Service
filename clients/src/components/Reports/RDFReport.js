import { useState, useEffect } from 'react';
import React from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Card, CardContent,
  Grid, Chip, Stack, Divider, Alert, Tooltip, Container, Tabs, Tab
} from '@mui/material';
import {
  AccessTime, Person, TrendingUp, Speed, Business, History
} from '@mui/icons-material';
import UserActivityLog from './UserActivityLog';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const RDFReport = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchServiceTimeData();
  }, []);

  const fetchServiceTimeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/service-time-report`);
      
      // Transform the data to match the expected format
      const records = response.data.records || [];
      
      // Get all unique stores from service units
      const stores = new Set();
      records.forEach(record => {
        record.service_units.forEach(unit => {
          // Extract store from service unit name (e.g., "EWM Officer - AA1" -> "AA1")
          const match = unit.service_unit.match(/- (AA\d+)$/);
          if (match) {
            stores.add(match[1]);
          }
        });
      });
      
      // If no stores found in data, use default stores
      if (stores.size === 0) {
        stores.add('AA1');
        stores.add('AA2');
        stores.add('AA3');
      }
      
      const storeList = Array.from(stores).sort();
      
      // Calculate summary statistics
      const summary = {
        averageDurations: {
          total: 0,
          registration: 0,
          o2c: 0,
          gate: 0
        },
        stores: {}
      };
      
      // Initialize store-specific averages
      storeList.forEach(store => {
        summary.stores[store] = {
          ewm: 0,
          dispatch: 0,
          dispatchDoc: 0
        };
      });
      
      // Calculate averages from service_units
      const serviceUnitTotals = {};
      const serviceUnitCounts = {};
      
      records.forEach(record => {
        record.service_units.forEach(unit => {
          const unitName = unit.service_unit;
          if (!serviceUnitTotals[unitName]) {
            serviceUnitTotals[unitName] = 0;
            serviceUnitCounts[unitName] = 0;
          }
          if (unit.duration_minutes) {
            serviceUnitTotals[unitName] += unit.duration_minutes;
            serviceUnitCounts[unitName]++;
          }
        });
      });
      
      // Calculate averages for common units
      if (serviceUnitCounts['Customer Service Officer'] > 0) {
        summary.averageDurations.registration = Math.round(
          serviceUnitTotals['Customer Service Officer'] / serviceUnitCounts['Customer Service Officer']
        );
      }
      if (serviceUnitCounts['O2C Officer'] > 0) {
        summary.averageDurations.o2c = Math.round(
          serviceUnitTotals['O2C Officer'] / serviceUnitCounts['O2C Officer']
        );
      }
      if (serviceUnitCounts['Gate Keeper'] > 0) {
        summary.averageDurations.gate = Math.round(
          serviceUnitTotals['Gate Keeper'] / serviceUnitCounts['Gate Keeper']
        );
      }
      
      // Calculate averages for store-specific units
      storeList.forEach(store => {
        const ewmKey = `EWM Officer - ${store}`;
        const dispatchKey = `Dispatcher - ${store}`;
        const dispatchDocKey = `Dispatch-Documentation - ${store}`;
        
        if (serviceUnitCounts[ewmKey] > 0) {
          summary.stores[store].ewm = Math.round(
            serviceUnitTotals[ewmKey] / serviceUnitCounts[ewmKey]
          );
        }
        if (serviceUnitCounts[dispatchKey] > 0) {
          summary.stores[store].dispatch = Math.round(
            serviceUnitTotals[dispatchKey] / serviceUnitCounts[dispatchKey]
          );
        }
        if (serviceUnitCounts[dispatchDocKey] > 0) {
          summary.stores[store].dispatchDoc = Math.round(
            serviceUnitTotals[dispatchDocKey] / serviceUnitCounts[dispatchDocKey]
          );
        }
      });
      
      // Transform records to match expected format
      const transformedRecords = records.map(record => {
        const transformed = {
          id: record.process_id,
          facility_name: record.facility_name,
          customer_type: record.customer_type,
          route: record.route,
          total_duration_minutes: 0,
          registration_duration_minutes: 0,
          o2c_duration_minutes: 0,
          gate_duration_minutes: 0,
          stores: {}
        };
        
        // Initialize store-specific data
        storeList.forEach(store => {
          transformed.stores[store] = {
            ewm_duration_minutes: 0,
            ewm_officer_name: null,
            ewm_completed_at: null,
            dispatch_duration_minutes: 0,
            dispatcher_name: null,
            dispatch_completed_at: null,
            dispatch_doc_duration_minutes: 0,
            dispatch_doc_officer_name: null,
            dispatch_doc_completed_at: null
          };
        });
        
        // Sort service units by end_time to get them in order
        const sortedUnits = record.service_units.sort((a, b) => 
          new Date(a.end_time) - new Date(b.end_time)
        );
        
        // Map each service unit and calculate duration from previous unit's end time
        sortedUnits.forEach((unit, index) => {
          const unitName = unit.service_unit;
          
          // Calculate duration: current end time - previous end time
          let duration = 0;
          if (index > 0) {
            const prevTimeStr = sortedUnits[index - 1].end_time;
            const currTimeStr = unit.end_time;
            
            const prevEndTime = new Date(prevTimeStr.replace(' ', 'T'));
            const currEndTime = new Date(currTimeStr.replace(' ', 'T'));
            
            const diffMs = currEndTime - prevEndTime;
            duration = Math.round(diffMs / 60000);
            duration = duration > 0 ? duration : 0;
          }
          
          // Add to totals
          transformed.total_duration_minutes += duration;
          
          // Map to appropriate field
          if (unitName === 'Customer Service Officer') {
            transformed.registration_duration_minutes = 0;
            transformed.registered_by_name = unit.officer_name;
            transformed.registration_completed_at = unit.end_time;
          } else if (unitName === 'O2C Officer') {
            transformed.o2c_duration_minutes = duration;
            transformed.o2c_officer_name = unit.officer_name;
            transformed.o2c_started_at = unit.start_time;
            transformed.o2c_completed_at = unit.end_time;
          } else if (unitName === 'Gate Keeper') {
            transformed.gate_duration_minutes = duration;
            transformed.gate_processed_by = unit.officer_name;
            transformed.gate_processed_at = unit.end_time;
          } else {
            // Check for store-specific units
            const storeMatch = unitName.match(/^(EWM Officer|Dispatcher|Dispatch-Documentation) - (AA\d+)$/);
            if (storeMatch) {
              const [, serviceType, store] = storeMatch;
              if (transformed.stores[store]) {
                if (serviceType === 'EWM Officer') {
                  transformed.stores[store].ewm_duration_minutes = duration;
                  transformed.stores[store].ewm_officer_name = unit.officer_name;
                  transformed.stores[store].ewm_completed_at = unit.end_time;
                } else if (serviceType === 'Dispatcher') {
                  transformed.stores[store].dispatch_duration_minutes = duration;
                  transformed.stores[store].dispatcher_name = unit.officer_name;
                  transformed.stores[store].dispatch_completed_at = unit.end_time;
                } else if (serviceType === 'Dispatch-Documentation') {
                  transformed.stores[store].dispatch_doc_duration_minutes = duration;
                  transformed.stores[store].dispatch_doc_officer_name = unit.officer_name;
                  transformed.stores[store].dispatch_doc_completed_at = unit.end_time;
                }
              }
            }
          }
        });
        
        return transformed;
      });
      
      setData({
        serviceTimeData: transformedRecords,
        summary,
        stores: storeList
      });
    } catch (err) {
      console.error('Error fetching service time data:', err);
      setError('Failed to load service time tracking data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '—';
    return new Date(dateTime).toLocaleString();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!data || !data.serviceTimeData) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="info">
          No service time tracking data available.
        </Alert>
      </Container>
    );
  }

  const { serviceTimeData, summary } = data;

  // Filter only RDF/Customer Service records (records without routes)
  const rdfRecords = serviceTimeData.filter(record => {
    return !record.route || record.route.trim() === '';
  });

  const renderServiceCell = (duration, officerName, startTime, completedTime, waitingTime, isRegistration = false) => {
    if (!duration && !officerName) {
      return (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">—</Typography>
        </Box>
      );
    }

    return (
      <Box>
        {/* Duration chip - this is the time from previous service end to current service end */}
        {duration > 0 && (
          <Chip 
            label={formatDuration(duration)} 
            size="small" 
            color="success"
            sx={{ mb: 0.5, fontWeight: 'bold' }}
          />
        )}
        {/* Officer name at the bottom */}
        {officerName && (
          <Tooltip title={`Completed: ${formatDateTime(completedTime)}`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {officerName}
              </Typography>
            </Box>
          </Tooltip>
        )}
        {/* For registration, show registered time at the bottom */}
        {isRegistration && completedTime && (
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {formatDateTime(completedTime)}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Business sx={{ fontSize: 56, color: 'white' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold" color="white">
                RDF Report
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Regular Distribution Flow - Customer Service Performance
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Service Time Tracking" icon={<AccessTime />} iconPosition="start" />
          <Tab label="User Activity Log" icon={<History />} iconPosition="start" />
        </Tabs>
      </Card>

      {activeTab === 0 && (
        <Box>
        {/* Summary Statistics */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          RDF Service Time Performance Summary
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Speed sx={{ fontSize: 40, color: '#2196f3' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {rdfRecords.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      RDF Records
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#f3e5f5', borderLeft: '4px solid #9c27b0' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <AccessTime sx={{ fontSize: 40, color: '#9c27b0' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatDuration(summary.averageDurations.total)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Total Time
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TrendingUp sx={{ fontSize: 40, color: '#4caf50' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatDuration(summary.averageDurations.o2c)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg O2C Time
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Person sx={{ fontSize: 40, color: '#ff9800' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatDuration(summary.averageDurations.ewm)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg EWM Time
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Average Duration by Service Unit - ALL RDF UNITS */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Average Duration by Service Unit (RDF Process)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">Customer Service Officer</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatDuration(summary.averageDurations.registration || 0)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">O2C Officer</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatDuration(summary.averageDurations.o2c)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">Gate Keeper</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatDuration(summary.averageDurations.gate || 0)}
                  </Typography>
                </Box>
              </Grid>
              
              {/* Store-specific averages */}
              {data.stores && data.stores.map(store => (
                <React.Fragment key={store}>
                  <Grid item xs={12} md={12}>
                    <Divider sx={{ my: 2 }}>
                      <Chip label={`Store ${store}`} color="primary" />
                    </Divider>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">EWM Officer - {store}</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatDuration(summary.stores[store]?.ewm || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">Dispatcher - {store}</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatDuration(summary.stores[store]?.dispatch || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">Dispatch-Doc - {store}</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatDuration(summary.stores[store]?.dispatchDoc || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Detailed Service Time Table - ALL RDF SERVICE UNITS */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Detailed RDF Service Time Records
        </Typography>

        {rdfRecords.length === 0 ? (
          <Alert severity="info">
            No RDF (Customer Service) records found.
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ maxHeight: 600, overflowX: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 150 }}>Facility</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>CS Officer</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>O2C Officer</TableCell>
                    {/* Dynamic store columns */}
                    {data.stores && data.stores.map(store => (
                      <React.Fragment key={store}>
                        <TableCell sx={{ fontWeight: 700, bgcolor: '#e3f2fd', minWidth: 120 }}>
                          EWM - {store}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: '#e8f5e9', minWidth: 120 }}>
                          Dispatch - {store}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: '#fff3e0', minWidth: 120 }}>
                          Dispatch-Doc - {store}
                        </TableCell>
                      </React.Fragment>
                    ))}
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 120 }}>Gate Keeper</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f5f5f5', minWidth: 100 }}>Total Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rdfRecords.slice(0, 50).map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {record.facility_name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {record.customer_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {renderServiceCell(
                          record.registration_duration_minutes,
                          record.registered_by_name,
                          record.registration_completed_at,
                          record.registration_completed_at,
                          0,
                          true
                        )}
                      </TableCell>
                      <TableCell>
                        {renderServiceCell(
                          record.o2c_duration_minutes,
                          record.o2c_officer_name,
                          record.o2c_started_at,
                          record.o2c_completed_at,
                          0
                        )}
                      </TableCell>
                      {/* Dynamic store columns */}
                      {data.stores && data.stores.map(store => (
                        <React.Fragment key={store}>
                          <TableCell>
                            {renderServiceCell(
                              record.stores[store]?.ewm_duration_minutes,
                              record.stores[store]?.ewm_officer_name,
                              null,
                              record.stores[store]?.ewm_completed_at,
                              0
                            )}
                          </TableCell>
                          <TableCell>
                            {renderServiceCell(
                              record.stores[store]?.dispatch_duration_minutes,
                              record.stores[store]?.dispatcher_name,
                              null,
                              record.stores[store]?.dispatch_completed_at,
                              0
                            )}
                          </TableCell>
                          <TableCell>
                            {renderServiceCell(
                              record.stores[store]?.dispatch_doc_duration_minutes,
                              record.stores[store]?.dispatch_doc_officer_name,
                              null,
                              record.stores[store]?.dispatch_doc_completed_at,
                              0
                            )}
                          </TableCell>
                        </React.Fragment>
                      ))}
                      <TableCell>
                        {renderServiceCell(
                          record.gate_duration_minutes,
                          record.gate_processed_by,
                          null,
                          record.gate_processed_at,
                          0
                        )}
                      </TableCell>
                      <TableCell>
                        {record.total_duration_minutes > 0 ? (
                          <Chip 
                            label={formatDuration(record.total_duration_minutes)} 
                            size="small" 
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {rdfRecords.length > 50 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Showing first 50 records out of {rdfRecords.length} total records.
              </Alert>
            )}
          </>
        )}
      </Box>
      )}

      {activeTab === 1 && <UserActivityLog />}
    </Container>
  );
};

export default RDFReport;