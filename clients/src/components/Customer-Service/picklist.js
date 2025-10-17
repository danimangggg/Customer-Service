import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  TextField,
  Button,
  Alert,
  Divider,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete,
  Snackbar,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const PickListDetail = () => {
  const { processId } = useParams();

  const [pickList, setPickList] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [odnInput, setOdnInput] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittedPicklists, setSubmittedPicklists] = useState([]);
  const [odnOptions, setOdnOptions] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  const userStore = localStorage.getItem('store');
  const jobTitle = localStorage.getItem('JobTitle');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const serviceRes = await axios.get(`${api_url}/api/serviceList`);
      const pickListData = serviceRes.data.find((item) => item.id === Number(processId));
      if (!pickListData) throw new Error('PickList not found');
      setPickList(pickListData);

      const facilitiesRes = await axios.get(`${api_url}/api/facilities`);
      const facilityData = facilitiesRes.data.find((f) => f.id === pickListData.facility_id);
      setFacility(facilityData || null);

      const existing = await axios.get(`${api_url}/api/getPicklists`);
      const filtered = existing.data.filter((p) => p.store === userStore);
      setSubmittedPicklists(filtered);

      if (userStore && pickListData) {
        const storeOdnKey = `${userStore.toLowerCase()}_odn`;
        const odnValue = pickListData[storeOdnKey];
        setOdnInput(odnValue || '');
        setOdnOptions(
          serviceRes.data
            .filter((item) => item[storeOdnKey])
            .map((item) => item[storeOdnKey])
        );
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [processId, userStore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPdfFile(file);
      setUploadMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!odnInput || !pdfFile) {
      setUploadMessage('Please provide both ODN and PDF file.');
      return;
    }

    const isOdnExist = submittedPicklists.some((p) => p.odn === odnInput);
    if (isOdnExist) {
      setUploadMessage('This ODN number is already submitted!');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('odn', odnInput);
      formData.append('attachment', pdfFile);
      formData.append('process_id', processId);
      formData.append('store', userStore);

      const res = await axios.post(`${api_url}/api/uploadPicklist`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadMessage(res.data.message || 'Picklist uploaded successfully!');
      setShowNotification(true);

      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play();

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading PickList...</Typography>
      </Box>
    );

  if (error) return <Alert severity="error">{error}</Alert>;

  const facilityDisplay = facility
    ? `${facility.facility_name}, ${facility.woreda_name}, ${facility.zone_name}, ${facility.region_name}`
    : 'N/A';

  const canUpload = jobTitle?.toLowerCase().includes('ewm officer');

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Info */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          boxShadow: 6,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #1976d2 20%, #64b5f6 90%)',
          color: 'white',
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {facility?.facility_name || 'Customer / Facility Name'}
        </Typography>
        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
        <Typography variant="body1">Process ID: {processId}</Typography>
        <Typography variant="body1">
          Customer Type: {pickList?.customer_type || 'N/A'}
        </Typography>
        <Typography variant="body1">
          Registration Date: {new Date(pickList?.started_at).toLocaleDateString() || 'N/A'}
        </Typography>
        <Typography variant="body1">
          Delegate: {pickList?.delegate || 'N/A'}
        </Typography>
        <Typography variant="body1">
          Delegate Phone: {pickList?.delegate_phone || 'N/A'}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Location: {facilityDisplay}
        </Typography>
      </Paper>

      {/* Upload Form */}
      {canUpload && (
        <Paper sx={{ p: 3, mb: 3, boxShadow: 4, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Upload PickList PDF
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Autocomplete
                freeSolo
                fullWidth
                options={odnOptions}
                value={odnInput}
                onChange={(e, value) => setOdnInput(value || '')}
                onInputChange={(e, value) => setOdnInput(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="ODN Number"
                    required
                    fullWidth
                    sx={{
                      flex: 1,
                      '& .MuiInputBase-root': {
                        height: 70,
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        borderRadius: 2,
                        backgroundColor: '#f9f9f9',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1rem',
                        fontWeight: 600,
                      },
                    }}
                  />
                )}
              />

              <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
                Choose PDF
                <input type="file" accept=".pdf" hidden onChange={handlePdfChange} />
              </Button>
            </Stack>

            {pdfFile && (
              <Chip
                icon={<PictureAsPdfIcon color="error" />}
                label={`Selected: ${pdfFile.name}`}
                color="success"
                variant="outlined"
                sx={{ mt: 2 }}
              />
            )}

            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" color="primary" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Submit'}
              </Button>
            </Box>

            {uploadMessage && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {uploadMessage}
              </Alert>
            )}
          </form>
        </Paper>
      )}

      {/* Submitted Picklists */}
      <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Submitted Picklists
        </Typography>
        {submittedPicklists.length === 0 ? (
          <Typography color="text.secondary">No Picklists submitted yet.</Typography>
        ) : (
          <List>
            {submittedPicklists.map((item, index) => (
              <ListItem
                key={index}
                divider
                secondaryAction={
                  <Button variant="outlined" onClick={() => window.open(item.url, '_blank')}>
                    View
                  </Button>
                }
              >
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={`ODN: ${item.odn}`}
                  secondary={`File: ${item.url?.split('/').pop() || 'Undefined'}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Snackbar
        open={showNotification}
        autoHideDuration={3000}
        onClose={() => setShowNotification(false)}
        message={
          <Stack direction="row" alignItems="center" spacing={1}>
            <NotificationsActiveIcon color="warning" />
            <Typography>New Picklist Submitted!</Typography>
          </Stack>
        }
      />
    </Box>
  );
};

export default PickListDetail;
