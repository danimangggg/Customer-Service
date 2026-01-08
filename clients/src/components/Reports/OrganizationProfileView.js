import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  Grid,
  Avatar,
  Stack,
  Chip,
  Paper,
  Fade,
  Zoom,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  TablePagination,
} from '@mui/material';
import {
  Business,
  Info,
  Public,
  Map,
  LocationCity,
  Domain,
} from '@mui/icons-material';

const OrganizationProfileView = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination states
  const [facilitiesPage, setFacilitiesPage] = useState(0);
  const [facilitiesRowsPerPage, setFacilitiesRowsPerPage] = useState(10);
  const [woredasPage, setWoredasPage] = useState(0);
  const [woredasRowsPerPage, setWoredasRowsPerPage] = useState(10);
  
  const api_url = process.env.REACT_APP_API_URL;
  
  const [orgData] = useState({
    name: 'Ethiopian Pharmaceutical Supply Service (EPSS)',
    shortName: 'EPSS',
    description: 'Leading pharmaceutical supply chain management organization in Ethiopia, ensuring reliable access to quality medicines and health commodities.',
    address: 'Addis Ababa, Ethiopia',
    zone: 'Addis Ababa Zone',
    woreda: 'Kirkos',
    phone: '+251-11-XXX-XXXX',
    email: 'info@epss.gov.et',
    website: 'www.epss.gov.et',
    establishedYear: '2007',
    employeeCount: '2,500+',
    branches: '15',
    logo: null
  });

  // Administrative divisions data - will be fetched from API
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Fetch data from API
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch facilities from the actual facilities table
      const facilitiesRes = await axios.get(`${api_url}/api/facilities`);
      setFacilities(facilitiesRes.data);

      // Fetch employees data
      const employeesRes = await axios.get(`${api_url}/api/get-employee`);
      setEmployees(employeesRes.data);

      // Extract unique regions, zones, and woredas from facilities
      const uniqueRegions = [...new Set(facilitiesRes.data.map(f => f.region_name).filter(Boolean))]
        .map((name, index) => ({ id: index + 1, name, code: name.substring(0, 2).toUpperCase() }));
      
      const uniqueZones = [...new Set(facilitiesRes.data.map(f => f.zone_name).filter(Boolean))]
        .map((name, index) => ({ 
          id: index + 1, 
          name, 
          regionId: uniqueRegions.find(r => facilitiesRes.data.find(f => f.zone_name === name && f.region_name === r.name))?.id || 1
        }));
      
      const uniqueWoredas = [...new Set(facilitiesRes.data.map(f => f.woreda_name).filter(Boolean))]
        .map((name, index) => ({ 
          id: index + 1, 
          name, 
          zoneId: uniqueZones.find(z => facilitiesRes.data.find(f => f.woreda_name === name && f.zone_name === z.name))?.id || 1
        }));

      setRegions(uniqueRegions);
      setZones(uniqueZones);
      setWoredas(uniqueWoredas);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getRegionName = (regionId) => regions.find(r => r.id === regionId)?.name || 'N/A';
  const getZoneName = (zoneId) => zones.find(z => z.id === zoneId)?.name || 'N/A';

  // Pagination handlers
  const handleFacilitiesPageChange = (event, newPage) => {
    setFacilitiesPage(newPage);
  };

  const handleFacilitiesRowsPerPageChange = (event) => {
    setFacilitiesRowsPerPage(parseInt(event.target.value, 10));
    setFacilitiesPage(0);
  };

  const handleWoredasPageChange = (event, newPage) => {
    setWoredasPage(newPage);
  };

  const handleWoredasRowsPerPageChange = (event) => {
    setWoredasRowsPerPage(parseInt(event.target.value, 10));
    setWoredasPage(0);
  };

  // Get paginated data
  const paginatedFacilities = facilities.slice(
    facilitiesPage * facilitiesRowsPerPage,
    facilitiesPage * facilitiesRowsPerPage + facilitiesRowsPerPage
  );

  const paginatedWoredas = woredas.slice(
    woredasPage * woredasRowsPerPage,
    woredasPage * woredasRowsPerPage + woredasRowsPerPage
  );

  // Get job title statistics
  const getJobTitleStats = () => {
    const jobTitleCounts = {};
    employees.forEach(emp => {
      const jobTitle = emp.jobTitle || 'Unassigned';
      jobTitleCounts[jobTitle] = (jobTitleCounts[jobTitle] || 0) + 1;
    });
    
    const sortedEntries = Object.entries(jobTitleCounts).sort(([a], [b]) => {
      const aIsNA = ['N/A', 'Unassigned', '', null, undefined].includes(a);
      const bIsNA = ['N/A', 'Unassigned', '', null, undefined].includes(b);
      
      if (aIsNA && !bIsNA) return 1;
      if (!aIsNA && bIsNA) return -1;
      return a.localeCompare(b);
    });
    
    return sortedEntries;
  };

  const jobTitleStats = getJobTitleStats();

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading organization data...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeInUp 0.6s ease-out;
          }
          .org-profile-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .org-profile-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
            color: white;
            padding: 32px;
            border-radius: 20px 20px 0 0;
            position: relative;
            overflow: hidden;
          }
          .header-gradient::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            pointer-events: none;
          }
          .info-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.3s ease;
            border: 1px solid rgba(0,0,0,0.05);
          }
          .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          }
          .stat-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(99, 102, 241, 0.1);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--card-gradient, linear-gradient(90deg, #667eea 0%, #764ba2 100%));
          }
          .stat-card:hover {
            transform: translateY(-6px) scale(1.02);
            box-shadow: 0 12px 32px rgba(0,0,0,0.15);
            border-color: rgba(99, 102, 241, 0.3);
          }
          .professional-section {
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 20px;
            padding: 32px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
            border: 1px solid rgba(99, 102, 241, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .professional-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          }
          .professional-section:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 48px rgba(0,0,0,0.12);
          }
          .section-title {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
            margin-bottom: 24px;
            position: relative;
          }
          .section-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
          }
        `}
      </style>
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', p: 2 }}>
        <Box className="org-profile-card animate-fade-in" sx={{ mx: 'auto', maxWidth: 1200 }}>
          {/* Header Section */}
          <Box className="header-gradient">
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="flex-start" flexWrap="wrap" gap={3}>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 80, 
                    height: 80,
                    backdropFilter: 'blur(10px)',
                    border: '3px solid rgba(255,255,255,0.3)'
                  }}>
                    <Business sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" sx={{ 
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      mb: 1
                    }}>
                      Organization Profile
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.9, 
                      fontWeight: 300,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      View organization information and statistics
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Content Section */}
          <Box sx={{ p: 4 }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="organization profile tabs">
                <Tab 
                  icon={<Info />} 
                  label="Overview" 
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab 
                  icon={<Public />} 
                  label="Regions" 
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab 
                  icon={<Map />} 
                  label="Zones" 
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab 
                  icon={<LocationCity />} 
                  label="Woredas" 
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab 
                  icon={<Domain />} 
                  label="Facilities" 
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            {activeTab === 0 && (
              <Grid container spacing={4}>
                {/* Employee Information */}
                <Grid item xs={12} md={6}>
                  <Zoom in timeout={1000}>
                    <Box className="professional-section">
                      <Typography variant="h5" className="section-title">
                        Employee Information
                      </Typography>
                      
                      {/* Total Employees */}
                      <Box sx={{ mb: 3 }}>
                        <Paper className="stat-card" elevation={0} sx={{ '--card-gradient': 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)' }}>
                          <Typography variant="h4" fontWeight="bold" color="success.main">
                            {employees.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Total Employees
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Job Title Cards */}
                      <Grid container spacing={2}>
                        {jobTitleStats.map(([jobTitle, count], index) => {
                          const colors = [
                            { color: "primary.main", gradient: "linear-gradient(90deg, #2196f3 0%, #21cbf3 100%)" },
                            { color: "secondary.main", gradient: "linear-gradient(90deg, #9c27b0 0%, #e91e63 100%)" },
                            { color: "error.main", gradient: "linear-gradient(90deg, #f44336 0%, #ff5722 100%)" },
                            { color: "warning.main", gradient: "linear-gradient(90deg, #ff9800 0%, #ffc107 100%)" },
                            { color: "info.main", gradient: "linear-gradient(90deg, #00bcd4 0%, #009688 100%)" },
                            { color: "success.main", gradient: "linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)" }
                          ];
                          const colorConfig = colors[index % colors.length];
                          
                          return (
                            <Grid item xs={6} key={jobTitle}>
                              <Paper 
                                className="stat-card" 
                                elevation={0}
                                sx={{ 
                                  '--card-gradient': colorConfig.gradient,
                                  height: '100px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center'
                                }}
                              >
                                <Typography variant="h5" fontWeight="bold" color={colorConfig.color}>
                                  {count}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    lineHeight: 1.2,
                                    mt: 0.5
                                  }}
                                >
                                  {jobTitle}
                                </Typography>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  </Zoom>
                </Grid>

                {/* Location Information */}
                <Grid item xs={12} md={6}>
                  <Zoom in timeout={1200}>
                    <Box className="professional-section">
                      <Typography variant="h5" className="section-title">
                        Location Information
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Paper className="stat-card" elevation={0} sx={{ 
                            '--card-gradient': 'linear-gradient(90deg, #f44336 0%, #e91e63 100%)',
                            height: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h4" fontWeight="bold" color="error.main">
                              {regions.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Regions
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Paper className="stat-card" elevation={0} sx={{ 
                            '--card-gradient': 'linear-gradient(90deg, #ff9800 0%, #ffc107 100%)',
                            height: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h4" fontWeight="bold" color="warning.main">
                              {zones.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Zones
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Paper className="stat-card" elevation={0} sx={{ 
                            '--card-gradient': 'linear-gradient(90deg, #9c27b0 0%, #673ab7 100%)',
                            height: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h4" fontWeight="bold" color="secondary.main">
                              {woredas.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Woredas
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Paper className="stat-card" elevation={0} sx={{ 
                            '--card-gradient': 'linear-gradient(90deg, #00bcd4 0%, #2196f3 100%)',
                            height: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="h4" fontWeight="bold" color="info.main">
                              {facilities.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Facilities
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  </Zoom>
                </Grid>
              </Grid>
            )}

            {/* Regions Tab */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                  Regions Overview
                </Typography>
                <TableContainer component={Paper} className="info-card">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Code</strong></TableCell>
                        <TableCell><strong>Zones</strong></TableCell>
                        <TableCell><strong>Facilities</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {regions.map((region) => {
                        const regionZones = zones.filter(z => z.regionId === region.id);
                        const regionFacilities = facilities.filter(f => f.region_name === region.name);
                        
                        return (
                          <TableRow key={region.id}>
                            <TableCell>{region.name}</TableCell>
                            <TableCell>{region.code}</TableCell>
                            <TableCell>
                              <Chip label={regionZones.length} color="primary" size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip label={regionFacilities.length} color="secondary" size="small" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Zones Tab */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                  Zones Overview
                </Typography>
                <TableContainer component={Paper} className="info-card">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Region</strong></TableCell>
                        <TableCell><strong>Woredas</strong></TableCell>
                        <TableCell><strong>Facilities</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {zones.map((zone) => {
                        const zoneWoredas = woredas.filter(w => w.zoneId === zone.id);
                        const zoneFacilities = facilities.filter(f => f.zone_name === zone.name);
                        
                        return (
                          <TableRow key={zone.id}>
                            <TableCell>{zone.name}</TableCell>
                            <TableCell>{getRegionName(zone.regionId)}</TableCell>
                            <TableCell>
                              <Chip label={zoneWoredas.length} color="primary" size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip label={zoneFacilities.length} color="secondary" size="small" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Woredas Tab */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                  Woredas Overview
                </Typography>
                <TableContainer component={Paper} className="info-card">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Zone</strong></TableCell>
                        <TableCell><strong>Facilities</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedWoredas.map((woreda) => {
                        const woredaFacilities = facilities.filter(f => f.woreda_name === woreda.name);
                        
                        return (
                          <TableRow key={woreda.id}>
                            <TableCell>{woreda.name}</TableCell>
                            <TableCell>{getZoneName(woreda.zoneId)}</TableCell>
                            <TableCell>
                              <Chip label={woredaFacilities.length} color="secondary" size="small" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={woredas.length}
                    page={woredasPage}
                    onPageChange={handleWoredasPageChange}
                    rowsPerPage={woredasRowsPerPage}
                    onRowsPerPageChange={handleWoredasRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    sx={{ 
                      borderTop: '1px solid rgba(224, 224, 224, 1)',
                      bgcolor: 'rgba(0,0,0,0.02)'
                    }}
                  />
                </TableContainer>
              </Box>
            )}

            {/* Facilities Tab */}
            {activeTab === 4 && (
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                  Facilities Overview
                </Typography>
                <TableContainer component={Paper} className="info-card">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Facility Name</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Woreda</strong></TableCell>
                        <TableCell><strong>Zone</strong></TableCell>
                        <TableCell><strong>Region</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedFacilities.map((facility) => (
                        <TableRow key={facility.id}>
                          <TableCell>{facility.facility_name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={facility.facility_type || 'N/A'} 
                              size="small" 
                              color={facility.facility_type === 'Hospital' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>{facility.woreda_name || 'N/A'}</TableCell>
                          <TableCell>{facility.zone_name || 'N/A'}</TableCell>
                          <TableCell>{facility.region_name || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={facilities.length}
                    page={facilitiesPage}
                    onPageChange={handleFacilitiesPageChange}
                    rowsPerPage={facilitiesRowsPerPage}
                    onRowsPerPageChange={handleFacilitiesRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    sx={{ 
                      borderTop: '1px solid rgba(224, 224, 224, 1)',
                      bgcolor: 'rgba(0,0,0,0.02)'
                    }}
                  />
                </TableContainer>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default OrganizationProfileView;