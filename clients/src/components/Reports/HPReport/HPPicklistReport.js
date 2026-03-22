import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../../axiosInstance';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Chip, Stack, Button, CircularProgress } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Assignment } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const HPPicklistReport = ({ branchCode = '' }) => {
  const [picklists, setPicklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const response = await api.get(`${API_URL}/api/picklist-history`, { params: { page: 1, limit: 10000, ...(branchCode ? { branch_code: branchCode } : {}) } });
        if (response.data.success && response.data.picklists) {
          const rows = response.data.picklists
            .filter(p => p.store === 'HP')
            .map(p => ({
              ...p,
              facility_name: p.facility?.facility_name || 'Unknown',
              region_name: p.facility?.region_name || 'N/A',
              woreda_name: p.facility?.woreda_name || 'N/A',
            }));
          setPicklists(rows);
        }
      } catch (err) {
        console.error('Error fetching HP picklists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <Box>
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(25,118,210,0.1)' }}>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Assignment color="success" />
              <Typography variant="h6" fontWeight="bold">All Completed HP Picklists</Typography>
              <Chip label={`${picklists.length} records`} color="success" size="small" variant="outlined" />
            </Stack>
            <Button variant="outlined" color="warning" onClick={() => navigate('/all-picklists')}>
              On Progress
            </Button>
          </Stack>
          <Box sx={{ height: 650 }}>
            <DataGrid
              loading={loading}
              rows={picklists}
              columns={[
                {
                  field: '_row', headerName: '#', width: 60, sortable: false, filterable: false,
                  renderCell: (params) => (
                    <Typography variant="body2" color="text.secondary">
                      {params.api.getRowIndexRelativeToVisibleRows(params.id) + 1}
                    </Typography>
                  ),
                },
                { field: 'facility_name', headerName: 'Facility', flex: 1, minWidth: 200 },
                { field: 'odn', headerName: 'ODN Number', width: 160 },
                {
                  field: 'store', headerName: 'Store', width: 100,
                  renderCell: (params) => (
                    <Chip label={params.value} color="primary" size="small" sx={{ fontWeight: 'bold' }} />
                  ),
                },
                { field: 'operator_name', headerName: 'Operator', width: 160 },
                {
                  field: 'completed_at', headerName: 'Completed At', width: 180,
                  renderCell: (params) => params.value ? new Date(params.value).toLocaleString() : '—',
                },
                {
                  field: 'waiting_minutes', headerName: 'Waiting Time', width: 130,
                  renderCell: (params) => {
                    const mins = params.value;
                    if (mins === null || mins === undefined) return '—';
                    if (mins < 60) return `${mins} min`;
                    const h = Math.floor(mins / 60), m = mins % 60;
                    return m > 0 ? `${h}h ${m}m` : `${h}h`;
                  },
                },
                { field: 'region_name', headerName: 'Region', width: 140 },
                { field: 'woreda_name', headerName: 'Woreda', width: 140 },
              ]}
              pageSize={25}
              rowsPerPageOptions={[10, 25, 50, 100]}
              disableSelectionOnClick
              initialState={{
                columns: { columnVisibilityModel: { region_name: false, woreda_name: false } },
              }}
              components={{ Toolbar: GridToolbar }}
              componentsProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 400 } } }}
              sx={{
                bgcolor: 'white', borderRadius: 2,
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#059669', color: 'white', fontWeight: 700 },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
                '& .MuiDataGrid-row:hover': { bgcolor: '#f0fdf4' },
              }}
            />
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default HPPicklistReport;
