import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import MUIDataTable from 'mui-datatables';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CompletedPicklists = () => {
  const [picklists, setPicklists] = useState([]);
  const [services, setServices] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [combinedPicklists, setCombinedPicklists] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pickRes, serviceRes, facilityRes, empRes] = await Promise.all([
        axios.get(`${api_url}/api/getPicklists`),
        axios.get(`${api_url}/api/serviceList`),
        axios.get(`${api_url}/api/facilities`),
        axios.get(`${api_url}/api/get-employee`),
      ]);

      // Filter picklists with status "completed"
      const completed = (Array.isArray(pickRes.data) ? pickRes.data : []).filter(
        (p) => String(p.status || '').toLowerCase() === 'completed'
      );

      setPicklists(completed);
      setServices(Array.isArray(serviceRes.data) ? serviceRes.data : []);
      setFacilities(Array.isArray(facilityRes.data) ? facilityRes.data : []);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
    } catch (err) {
      console.error('Error fetching completed picklists:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine facility and operator info
  useEffect(() => {
    const combined = picklists.map((p) => {
      const service = services.find((s) => String(s.id) === String(p.process_id));
      const facility = facilities.find(
        (f) => service && String(f.id) === String(service.facility_id)
      );
      const operator = employees.find(
        (e) => Number(e.id) === Number(p.operator_id)
      );
      return {
        ...p,
        facility,
        operator,
      };
    });
    setCombinedPicklists(combined);
  }, [picklists, services, facilities, employees]);

  const columns = [
    { name: 'odn', label: 'ODN' },
    {
      name: 'facility',
      label: 'Facility',
      options: {
        customBodyRender: (facility) =>
          facility ? facility.facility_name : 'Unknown',
      },
    },
    {
      name: 'operator',
      label: 'Operator',
      options: {
        customBodyRender: (operator) =>
          operator ? operator.full_name : 'N/A',
      },
    },
    {
      name: 'store',
      label: 'Store',
    },
    {
      name: 'region',
      label: 'Region',
      options: {
        customBodyRenderLite: (dataIndex) =>
          combinedPicklists[dataIndex].facility?.region_name || 'N/A',
      },
    },
    {
      name: 'woreda',
      label: 'Woreda',
      options: {
        customBodyRenderLite: (dataIndex) =>
          combinedPicklists[dataIndex].facility?.woreda_name || 'N/A',
      },
    },
    {
      name: 'status',
      label: 'Status',
      options: {
        customBodyRender: (status) => (
          <span style={{ color: 'green', fontWeight: 'bold' }}>
            {status}
          </span>
        ),
      },
    },
  ];

  const options = {
    selectableRows: 'none',
    filter: true,
    search: true,
    download: true,
    print: true,
    rowsPerPage: 10,
    responsive: isMobile ? 'vertical' : 'standard',
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
      <CircularProgress
        sx={{ mt: 5, display: 'block', mx: 'auto', color: 'primary.main' }}
      />
    );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>
        Completed Picklists
      </Typography>

      <Paper sx={{ p: 2, boxShadow: 3, borderRadius: 3 }}>
        <MUIDataTable
          title={'All Completed Picklists'}
          data={combinedPicklists}
          columns={columns}
          options={options}
        />
      </Paper>
    </Box>
  );
};

export default CompletedPicklists;
