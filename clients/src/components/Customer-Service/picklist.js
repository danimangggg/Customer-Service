import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const PickListDetail = () => {
  const { processId } = useParams();

  const [pickList, setPickList] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [odnInput, setOdnInput] = useState('');
  const [odnOptions, setOdnOptions] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittedPicklists, setSubmittedPicklists] = useState([]);

  const userStore = (localStorage.getItem('store') || '').toUpperCase();
  const jobTitle = localStorage.getItem('JobTitle') || '';
  const process_id = String(processId);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const serviceRes = await axios.get(`${api_url}/api/serviceList`);
      const services = Array.isArray(serviceRes.data) ? serviceRes.data : [];

      const processItem = services.find(item => String(item.id) === process_id);
      if (!processItem) {
        setPickList(null);
      } else {
        setPickList(processItem);
      }

      const storeKey = userStore.toLowerCase();
      const odnField = `${storeKey}_odn`;
      const odns = services
        .map(s => s[odnField])
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i);
      setOdnOptions(odns);

      if (processItem) {
        setOdnInput(processItem[odnField] || '');
      }

      const facilitiesRes = await axios.get(`${api_url}/api/facilities`);
      const facilities = Array.isArray(facilitiesRes.data) ? facilitiesRes.data : [];
      const fac = processItem ? facilities.find(f => String(f.id) === String(processItem.facility_id)) : null;
      setFacility(fac || null);

      const picklistsRes = await axios.get(`${api_url}/api/getPicklists`);
      const allPicklists = Array.isArray(picklistsRes.data) ? picklistsRes.data : [];
      const filtered = allPicklists.filter(p => String(p.store || '').toUpperCase() === userStore);
      setSubmittedPicklists(filtered);
    } catch (err) {
      console.error('fetchAll error:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [process_id, userStore]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handlePdfChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setPdfFile(f);
      setUploadMessage('');
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!odnInput || !pdfFile) {
      setUploadMessage('Please provide both ODN and PDF file.');
      return;
    }

    if (submittedPicklists.some(p => p.odn === odnInput)) {
      setUploadMessage('This ODN number is already submitted!');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('odn', odnInput);
      formData.append('attachment', pdfFile);
      formData.append('process_id', process_id);
      formData.append('store', userStore);

      const res = await axios.post(`${api_url}/api/uploadPicklist`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Swal.fire({
        icon: 'success',
        title: 'Uploaded',
        text: res.data?.message || 'Picklist uploaded successfully',
      });

      await fetchAll();
      setPdfFile(null);
      setOdnInput('');
      window.location.reload();
    } catch (err) {
      console.error('upload error', err);
      const msg = err?.response?.data?.message || 'Upload failed';
      Swal.fire({ icon: 'error', title: 'Upload failed', text: msg });
      setUploadMessage(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, fileUrl) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the file and the picklist record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${api_url}/api/deletePicklist/${id}`, { data: { fileUrl } });
      Swal.fire({ icon: 'success', title: 'Deleted', text: 'Picklist deleted.' });
      setSubmittedPicklists(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('delete error', err);
      Swal.fire({ icon: 'error', title: 'Delete failed', text: 'Could not delete picklist.' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading PickList...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const facilityDisplay = facility
    ? `${facility.facility_name}, ${facility.woreda_name}, ${facility.zone_name}, ${facility.region_name}`
    : 'N/A';

  const canUpload = jobTitle === 'EWM Officer';

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, mb: 3, boxShadow: 6, borderRadius: 4, background: 'linear-gradient(135deg,#1976d2 20%,#64b5f6 90%)', color: 'white' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {facility?.facility_name || 'Customer / Facility Name'}
        </Typography>
        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
        <Typography variant="body1">Process ID: {process_id}</Typography>
        <Typography variant="body1">Customer Type: {pickList?.customer_type || 'N/A'}</Typography>
        <Typography variant="body1">Registration Date: {pickList?.started_at ? new Date(pickList.started_at).toLocaleString() : 'N/A'}</Typography>
        <Typography variant="body1">Delegate: {pickList?.delegate || 'N/A'}</Typography>
        <Typography variant="body1">Delegate Phone: {pickList?.delegate_phone || 'N/A'}</Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>Location: {facilityDisplay}</Typography>
      </Paper>

      {canUpload && (
        <Paper sx={{ p: 3, mb: 3, boxShadow: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>Upload PickList PDF</Typography>

          <form onSubmit={handleSubmit}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Autocomplete
                freeSolo
                fullWidth
                options={odnOptions}
                value={odnInput}
                onChange={(e, val) => setOdnInput(val || '')}
                onInputChange={(e, val) => setOdnInput(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="ODN Number"
                    required
                    sx={{
                      '& .MuiInputBase-root': {
                        height: 56,
                        fontSize: '1rem',
                      },
                    }}
                  />
                )}
              />

              <Button variant="contained" component="label" startIcon={<CloudUploadIcon />} sx={{ minWidth: 200 }}>
                Choose PDF File
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

            {uploadMessage && <Alert severity="info" sx={{ mt: 2 }}>{uploadMessage}</Alert>}
          </form>
        </Paper>
      )}

      <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>Submitted Picklists</Typography>

        {submittedPicklists.length === 0 ? (
          <Typography color="text.secondary">No Picklists submitted yet.</Typography>
        ) : (
          <List>
            {submittedPicklists.map(item => (
              <ListItem key={item.id} divider
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={() => window.open(item.url, '_blank')}>View</Button>
                    <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(item.id, item.url)}>Delete</Button>
                  </Stack>
                }
              >
                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                <ListItemText primary={`ODN: ${item.odn}`} secondary={`File: ${item.url ? item.url.split('/').pop() : 'Undefined'}`} />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default PickListDetail;
