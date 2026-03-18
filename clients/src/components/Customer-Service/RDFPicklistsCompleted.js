import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, CircularProgress, Container,
  Card, Avatar, Stack, Fade, Chip, Button,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const formatDate = (val) => val ? new Date(val).toLocaleString() : '—';
const formatWaiting = (mins) => {
  if (mins === null || mins === undefined) return '—';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const columns = [
  {
    field: '_row',
    headerName: '#',
    width: 60,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Typography variant="body2" color="text.secondary">
        {params.api.getRowIndexRelativeToVisibleRows(params.id) + 1}
      </Typography>
    ),
  },
  { field: 'facility_name', headerName: 'Facility', flex: 1, minWidth: 200 },
  { field: 'odn', headerName: 'ODN Number', width: 160 },
  {
    field: 'store',
    headerName: 'Store',
    width: 100,
    renderCell: (params) => (
      <Chip
        label={params.value}
        color={params.value === 'AA11' ? 'primary' : params.value === 'AA12' ? 'secondary' : params.value === 'AA3' ? 'success' : 'warning'}
        size="small"
        sx={{ fontWeight: 'bold' }}
      />
    ),
  },
  { field: 'operator_name', headerName: 'Operator', width: 160 },
  {
    field: 'completed_at',
    headerName: 'Completed At',
    width: 180,
    renderCell: (params) => formatDate(params.value),
  },
  {
    field: 'waiting_minutes',
    headerName: 'Waiting Time',
    width: 130,
    renderCell: (params) => formatWaiting(params.value),
  },
  {
    field: 'region_name',
    headerName: 'Region',
    width: 140,
    columnVisibilityModel: false,
  },
  {
    field: 'woreda_name',
    headerName: 'Woreda',
    width: 140,
  },
];

const RDFPicklistsCompleted = () => {
  const [picklists, setPicklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api_url}/api/picklist-history`, {
        params: { page: 1, limit: 10000 }
      });
      if (response.data.success && response.data.picklists) {
        const rows = response.data.picklists
          .filter(p => p.store && p.store !== 'HP' && p.store !== 'CR')
          .map(p => ({
            ...p,
            facility_name: p.facility?.facility_name || 'Unknown',
            region_name: p.facility?.region_name || 'N/A',
            woreda_name: p.facility?.woreda_name || 'N/A',
          }));
        setPicklists(rows);
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

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading)
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Fade in={loading}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" color="text.secondary">Loading completed picklists...</Typography>
          </Box>
        </Fade>
      </Container>
    );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(25,118,210,0.1)' }}>
        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', p: 4, borderRadius: '12px 12px 0 0' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <AssignmentTurnedInIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="white">Completed RDF Picklists</Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  All successfully completed RDF picklist submissions
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              startIcon={<PendingActionsIcon />}
              onClick={() => navigate('/rdf-picklists')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              On Progress
            </Button>
          </Stack>
        </Box>

        {/* Table */}
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6" fontWeight="bold">All Completed RDF Picklists</Typography>
            <Chip label={`${picklists.length} records`} color="success" size="small" variant="outlined" />
          </Stack>

          <Box sx={{ height: 650 }}>
            <DataGrid
              rows={picklists}
              columns={columns}
              pageSize={25}
              rowsPerPageOptions={[10, 25, 50, 100]}
              disableSelectionOnClick
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    region_name: false,
                    woreda_name: false,
                  },
                },
              }}
              components={{ Toolbar: GridToolbar }}
              componentsProps={{
                toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 400 } },
              }}
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: '#059669',
                  color: 'white',
                  fontWeight: 700,
                },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
                '& .MuiDataGrid-row:hover': { bgcolor: '#f0fdf4' },
              }}
            />
          </Box>
        </Box>
      </Card>
    </Container>
  );
};

export default RDFPicklistsCompleted;
