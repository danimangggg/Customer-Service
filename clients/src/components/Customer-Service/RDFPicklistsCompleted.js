import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Container,
  Card,
  Avatar,
  Stack,
  Fade,
  Chip,
  Button,
} from '@mui/material';
import MUIDataTable from 'mui-datatables';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const RDFPicklistsCompleted = () => {
  const [picklists, setPicklists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api_url}/api/picklist-history`, { 
        params: { 
          page: 1, 
          limit: 10000 // Get all records
        } 
      });

      if (response.data.success && response.data.picklists) {
        // Filter for RDF picklists only (AA1, AA2, AA3)
        const rdfPicklists = response.data.picklists.filter(
          p => ['AA1', 'AA2', 'AA3'].includes(p.store)
        );
        console.log('RDF Completed Picklists:', rdfPicklists);
        setPicklists(rdfPicklists);
      } else {
        setPicklists([]);
      }
    } catch (err) {
      console.error('Error fetching completed picklists:', err);
      setPicklists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    { name: 'odn', label: 'ODN Number' },
    {
      name: 'facility',
      label: 'Facility',
      options: {
        customBodyRender: (facility) =>
          facility ? facility.facility_name : 'Unknown',
      },
    },
    {
      name: 'region',
      label: 'Region',
      options: {
        customBodyRenderLite: (dataIndex) =>
          picklists[dataIndex].facility?.region_name || 'N/A',
      },
    },
    {
      name: 'woreda',
      label: 'Woreda',
      options: {
        customBodyRenderLite: (dataIndex) =>
          picklists[dataIndex].facility?.woreda_name || 'N/A',
      },
    },
    {
      name: 'store',
      label: 'Store',
      options: {
        customBodyRender: (value) => (
          <Chip 
            label={value} 
            color={value === 'AA1' ? 'primary' : value === 'AA2' ? 'secondary' : 'success'}
            size="small"
            variant="filled"
            sx={{ fontWeight: 'bold', borderRadius: 2 }}
          />
        )
      }
    },
    {
      name: 'operator_name',
      label: 'Operator',
      options: {
        customBodyRender: (value) => value || 'N/A',
      },
    },
  ];

  const options = {
    selectableRows: 'none',
    filter: true,
    search: true,
    download: true,
    print: true,
    rowsPerPage: 25,
    rowsPerPageOptions: [10, 25, 50, 100],
    responsive: 'standard',
    elevation: 3,
    textLabels: {
      body: {
        noMatch: loading
          ? 'Loading completed picklists...'
          : 'No completed picklists found.',
      },
    },
  };

  if (loading)
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Fade in={loading}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3
          }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" color="text.secondary">
              Loading completed picklists...
            </Typography>
          </Box>
        </Fade>
      </Container>
    );

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
          .completed-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .completed-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
          .enhanced-table {
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
        `}
      </style>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card className="completed-card animate-fade-in" elevation={0}>
          {/* Header Section */}
          <Box className="header-gradient">
            <Stack direction="row" alignItems="center" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 64, 
                height: 64,
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.3)'
              }}>
                <AssignmentTurnedInIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight="bold" sx={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 1
                }}>
                  Completed RDF Picklists
                </Typography>
                <Typography variant="h6" sx={{ 
                  opacity: 0.9, 
                  fontWeight: 300,
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  View all successfully completed RDF picklist submissions
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Content Section */}
          <Box sx={{ p: 4 }}>
            <Paper className="enhanced-table" elevation={0}>
              <MUIDataTable
                title={
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="h6" fontWeight="bold">
                      All Completed RDF Picklists
                    </Typography>
                    <Chip 
                      label={`${picklists.length} completed`} 
                      color="success" 
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                }
                data={picklists}
                columns={columns}
                options={{
                  ...options,
                  customToolbar: () => null,
                  elevation: 0,
                }}
              />
            </Paper>
          </Box>
        </Card>
      </Container>
    </>
  );
};

export default RDFPicklistsCompleted;
