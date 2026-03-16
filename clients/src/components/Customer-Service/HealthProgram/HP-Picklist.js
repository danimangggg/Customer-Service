import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
  MenuItem,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const HPPickListDetail = () => {
  const { processId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedODN = searchParams.get('odn') || '';

  const [hpProcess, setHpProcess] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittedPicklists, setSubmittedPicklists] = useState([]);

  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState('');

  const userStore = (localStorage.getItem('store') || '').toUpperCase();
  const jobTitle = localStorage.getItem('JobTitle') || '';
  const process_id = String(processId);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch HP process details
      const processRes = await axios.get(`${api_url}/api/active-processes`);
      const processes = Array.isArray(processRes.data) ? processRes.data : [];
      const processItem = processes.find(p => String(p.id) === process_id);

      if (!processItem) {
        setError('Health Program process not found');
        return;
      }

      setHpProcess(processItem);

      console.log('HP Process Item:', processItem); // Debug log to see what data we have

      // Fetch facility details
      const facilitiesRes = await axios.get(`${api_url}/api/facilities`);
      const facilities = Array.isArray(facilitiesRes.data) ? facilitiesRes.data : [];
      const facilityItem = facilities.find(f => String(f.id) === String(processItem.facility_id));
      setFacility(facilityItem || null);

      // Fetch submitted picklists for this HP process
      const picklistsRes = await axios.get(`${api_url}/api/getPicklists`);
      
      // Handle both old format (array) and new format (object with data property)
      let allPicklists = Array.isArray(picklistsRes.data) 
        ? picklistsRes.data 
        : (picklistsRes.data.data || []);

      console.log('=== PICKLIST FILTERING DEBUG ===');
      console.log('Raw API response:', picklistsRes.data);
      console.log('Total picklists from API:', allPicklists.length);
      console.log('Current process_id:', process_id);
      console.log('Current userStore:', userStore);
      console.log('Current jobTitle:', jobTitle);
      
      // Show all picklists for this process_id
      const processPicklists = allPicklists.filter(p => String(p.process_id) === process_id);
      console.log('Picklists for this process_id:', processPicklists.length);
      if (processPicklists.length > 0) {
        console.log('Sample picklist:', processPicklists[0]);
        console.log('All picklists for this process:', processPicklists);
      }

      // For EWM Officer - show ALL picklists for this process (regardless of store)
      // For Program/WIM Operative - filter by store AND process_id
      let filtered;
      if (jobTitle === 'EWM Officer - HP' || jobTitle === 'EWM Officer') {
        // EWM can see all picklists for this process
        filtered = allPicklists.filter(p => String(p.process_id) === process_id);
        console.log('EWM Officer - showing all picklists for process:', filtered.length);
      } else {
        // Program/WIM Operative - filter by store AND process_id
        filtered = allPicklists.filter(
          p => String(p.store || '').toUpperCase() === userStore &&
               String(p.process_id) === process_id
        );
        console.log('Program/WIM Operative - filtered by store AND process_id:', filtered.length);
      }

      // Remove completed picklists
      const beforeCompletedFilter = filtered.length;
      filtered = filtered.filter(
        p => String(p.status || '').toLowerCase() !== 'completed'
      );

      console.log('Before removing completed:', beforeCompletedFilter);
      console.log('After removing completed:', filtered.length);
      console.log('Final filtered picklists:', filtered);
      console.log('=== END PICKLIST DEBUG ===');

      setSubmittedPicklists(filtered);

      // Fetch WIM Operators with store information
      const empRes = await axios.get(`${api_url}/api/get-employee`);
      const employees = Array.isArray(empRes.data) ? empRes.data : [];
      
      console.log('=== WIM OPERATOR DEBUG ===');
      console.log('Total employees:', employees.length);
      console.log('EWM Officer store from localStorage:', userStore);
      
      // Find all WIM Operators
      const allWimOps = employees.filter(emp => {
        const jobTitle = emp.jobTitle || emp.JobTitle || emp.job_title || '';
        return jobTitle.toLowerCase() === 'wim operator';
      });
      
      console.log('All WIM Operators found:', allWimOps.length);
      
      // Log each WIM Operator with their store info
      allWimOps.forEach(op => {
        console.log('  - Name:', op.full_name, '| Store Object:', op.store, '| Store Name:', op.store?.store_name);
      });
      
      // Filter WIM Operators by store - must match exactly
      console.log('Filtering by store:', userStore);
      const wimOps = allWimOps.filter(emp => {
        // Check if employee has store object from join
        const empStoreName = emp.store?.store_name || '';
        const empStoreUpper = empStoreName.toUpperCase();
        const matches = empStoreUpper === userStore;
        console.log('  - Checking:', emp.full_name, '| Store:', empStoreName, '| Upper:', empStoreUpper, '| Match with', userStore, ':', matches);
        return matches;
      });
      
      console.log('Filtered WIM Operators:', wimOps.length);
      if (wimOps.length === 0) {
        console.warn('⚠️ No WIM Operators found for store:', userStore);
        console.warn('⚠️ Make sure WIM Operators have store_id assigned in the database');
      }
      console.log('=== END DEBUG ===');
      
      setOperators(wimOps);

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
    const files = e.target.files;
    if (files && files.length > 0) {
      setPdfFiles(Array.from(files));
      setPdfFile(null); // Clear single file
      setUploadMessage('');
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if ((!selectedODN || pdfFiles.length === 0 || !selectedOperator)) {
      setUploadMessage('Please provide PDF file(s) and select a WIM Operator.');
      return;
    }

    setUploading(true);
    
    try {
      // Upload each file separately
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const formData = new FormData();
        formData.append('odn', selectedODN);
        formData.append('attachment', file);
        formData.append('process_id', process_id);
        formData.append('store', userStore);
        formData.append('operator_id', selectedOperator);

        await axios.post(`${api_url}/api/uploadPicklist`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      Swal.fire({
        icon: 'success',
        title: 'Uploaded',
        text: `${pdfFiles.length} picklist(s) uploaded successfully`,
      });

      // Refresh the picklist display
      console.log('🔄 Refreshing picklists after upload...');
      await fetchAll();
      console.log('✅ Picklists refreshed');
      
      setPdfFiles([]);
      setPdfFile(null);
      setSelectedOperator('');
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

  const handleCompletePicklist = async (id) => {
    const result = await Swal.fire({
      title: 'Complete Picklist?',
      text: 'Mark this picklist as completed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, complete it',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.put(`${api_url}/api/completePicklist/${id}`);
      
      Swal.fire({ 
        icon: 'success', 
        title: 'Completed', 
        text: 'Picklist marked as completed.' 
      });
      
      // Remove from list since we filter out completed picklists
      setSubmittedPicklists(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Complete error:', err);
      Swal.fire({ 
        icon: 'error', 
        title: 'Failed', 
        text: err.response?.data?.message || 'Could not complete picklist.' 
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Health Program PickList...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const facilityDisplay = facility
    ? `${facility.facility_name}, ${facility.woreda_name}, ${facility.zone_name}, ${facility.region_name}`
    : 'N/A';

  const canUpload = jobTitle === 'EWM Officer - HP' || jobTitle === 'EWM Officer' || jobTitle === 'WIM Operator';

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Paper sx={{ p: 4, mb: 3, boxShadow: 6, borderRadius: 4, background: 'linear-gradient(135deg,#2e7d32 20%,#4caf50 90%)', color: 'white' }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <BusinessIcon sx={{ fontSize: 40 }} />
          <Typography variant="h4" fontWeight="bold">
            {facility?.facility_name || 'Health Program Facility'}
          </Typography>
        </Stack>
        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
        
        <Stack spacing={1}>
          <Typography variant="body1"><strong>Process ID:</strong> {process_id}</Typography>
          <Typography variant="body1"><strong>Program Type:</strong> Health Program</Typography>
          <Typography variant="body1"><strong>Selected ODN:</strong> {selectedODN}</Typography>
          <Typography variant="body1"><strong>Process Date:</strong> {hpProcess?.created_at ? new Date(hpProcess.created_at).toLocaleString() : 'N/A'}</Typography>
          <Typography variant="body1"><strong>Reporting Month:</strong> {hpProcess?.reporting_month || 'N/A'}</Typography>
          <Typography variant="body1"><strong>Status:</strong> {hpProcess?.status?.toUpperCase() || 'N/A'}</Typography>
          <Typography variant="body1"><strong>O2C Officer:</strong> {hpProcess?.o2c_officer_name || hpProcess?.o2c_officer_id || 'Not Assigned'}</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}><strong>Location:</strong> {facilityDisplay}</Typography>
        </Stack>
      </Paper>

      {/* Upload Section */}
      {canUpload && (
        <Paper sx={{ p: 3, mb: 3, boxShadow: 3, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <AssignmentIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">Upload Health Program PickList PDF</Typography>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack direction="column" spacing={2}>
              {/* Display selected ODN */}
              <Paper sx={{ p: 2, bgcolor: '#e8f5e9', border: '1px solid #4caf50' }}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  Selected ODN: {selectedODN}
                </Typography>
              </Paper>

              <TextField
                select
                label="Select WIM Operator"
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                required
                fullWidth
              >
                {operators.map((op) => (
                  <MenuItem key={op.id} value={op.id}>
                    {op.full_name} {op.store?.store_name ? `(${op.store.store_name})` : ''}
                  </MenuItem>
                ))}
              </TextField>

              <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
                Choose PDF File(s)
                <input type="file" accept=".pdf" multiple hidden onChange={handlePdfChange} />
              </Button>

              {pdfFiles.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Selected {pdfFiles.length} file(s):
                  </Typography>
                  {pdfFiles.map((file, index) => (
                    <Chip
                      key={index}
                      icon={<PictureAsPdfIcon color="error" />}
                      label={file.name}
                      color="success"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}

              <Button type="submit" variant="contained" color="primary" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Submit Health Program Picklist'}
              </Button>

              {uploadMessage && <Alert severity="info">{uploadMessage}</Alert>}
            </Stack>
          </form>
        </Paper>
      )}

      {/* Submitted Picklists Section */}
      <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>Submitted Health Program Picklists</Typography>

        {submittedPicklists.length === 0 ? (
          <Typography color="text.secondary">No Health Program Picklists submitted yet.</Typography>
        ) : (
          <List>
            {submittedPicklists.map(item => (
              <ListItem
                key={item.id}
                divider
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={() => window.open(item.url, '_blank')}>View</Button>
                    <Button 
                      variant="outlined" 
                      color="success" 
                      startIcon={<CheckCircleIcon />} 
                      onClick={() => handleCompletePicklist(item.id)}
                    >
                      Complete
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(item.id, item.url)}>Delete</Button>
                  </Stack>
                }
              >
                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                <ListItemText
                  primary={`ODN: ${item.odn}`}
                  secondary={`File: ${item.url ? item.url.split('/').pop() : 'Undefined'}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default HPPickListDetail;