import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { recordServiceTimeAuto, formatTimestamp } from '../../utils/serviceTimeHelper';
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
  MenuItem,
  Container,
  Card,
  Avatar,
  Fade,
  Grid,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

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

  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState('');

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

      // Fetch ODNs from the new odns_rdf table
      try {
        const odnRes = await axios.get(`${api_url}/api/rdf-odns/${process_id}`);
        if (odnRes.data.success && odnRes.data.odns) {
          // Filter ODNs for the current user's store
          const storeOdns = odnRes.data.odns
            .filter(odn => odn.store === userStore)
            .map(odn => odn.odn_number);
          setOdnOptions(storeOdns);
          
          // Set first ODN as default if available
          if (storeOdns.length > 0 && !odnInput) {
            setOdnInput(storeOdns[0]);
          }
        }
      } catch (odnError) {
        console.error('Error fetching ODNs:', odnError);
        setOdnOptions([]);
      }

      const facilitiesRes = await axios.get(`${api_url}/api/facilities`);
      const facilities = Array.isArray(facilitiesRes.data) ? facilitiesRes.data : [];
      const fac = processItem ? facilities.find(f => String(f.id) === String(processItem.facility_id)) : null;
      setFacility(fac || null);

      const picklistsRes = await axios.get(`${api_url}/api/getPicklists`);
      let allPicklists = Array.isArray(picklistsRes.data) ? picklistsRes.data : [];

      // ✅ Filter by store AND by process_id for EWM Officers
      let filtered = allPicklists.filter(
        p => String(p.store || '').toUpperCase() === userStore
      );
      if (jobTitle === 'EWM Officer' && process_id) {
        filtered = filtered.filter(p => String(p.process_id) === process_id);
      }

      // ✅ Remove completed picklists
      filtered = filtered.filter(
        p => String(p.status || '').toLowerCase() !== 'completed'
      );

      setSubmittedPicklists(filtered);

      // ✅ Fetch WIM Operators filtered by store
      const empRes = await axios.get(`${api_url}/api/get-employee`);
      const employees = Array.isArray(empRes.data) ? empRes.data : [];
      const wimOps = employees.filter(
        emp =>
          emp.jobTitle?.toLowerCase() === 'wim operator' &&
          String(emp.store || '').toUpperCase() === userStore
      );
      setOperators(wimOps);
    } catch (err) {
      console.error('fetchAll error:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [process_id, userStore, jobTitle]);

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
    if (!odnInput || !pdfFile || !selectedOperator) {
      setUploadMessage('Please provide ODN, PDF, and select a WIM Operator.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('odn', odnInput);
      formData.append('attachment', pdfFile);
      formData.append('process_id', process_id);
      formData.append('store', userStore);
      formData.append('operator_id', selectedOperator);

      const res = await axios.post(`${api_url}/api/uploadPicklist`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Record service time for EWM Officer with store
      try {
        await recordServiceTimeAuto({
          processId: parseInt(process_id),
          serviceUnit: `EWM ${userStore}`,
          endTime: formatTimestamp(),
          isHP: false,
          notes: `Uploaded picklist for ODN ${odnInput}, assigned to WIM operator`
        });
        console.log(`✅ EWM ${userStore} service time recorded`);
      } catch (err) {
        console.error('❌ Failed to record EWM service time:', err);
        // Don't fail the upload if service time recording fails
      }

      Swal.fire({
        icon: 'success',
        title: 'Uploaded',
        text: res.data?.message || 'Picklist uploaded successfully',
      });

      await fetchAll();
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

  if (loading) {
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
              Loading PickList details...
            </Typography>
          </Box>
        </Fade>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const facilityDisplay = facility
    ? `${facility.facility_name}, ${facility.woreda_name}, ${facility.zone_name}, ${facility.region_name}`
    : 'N/A';

  const canUpload = jobTitle === 'EWM Officer';

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
          .picklist-card {
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            border: 1px solid rgba(25, 118, 210, 0.1);
          }
          .picklist-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          }
          .header-gradient {
            background: linear-gradient(135deg, #1976d2 0%, #64b5f6 100%);
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
          .form-field {
            transition: all 0.3s ease;
          }
          .form-field:hover {
            transform: translateY(-1px);
          }
          .upload-button {
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            border-radius: 12px;
            padding: 12px 32px;
            font-weight: 600;
            font-size: 16px;
            text-transform: none;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            transition: all 0.3s ease;
          }
          .upload-button:hover {
            background: linear-gradient(135deg, #388e3c 0%, #4caf50 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
          }
          .list-item {
            transition: all 0.3s ease;
            border-radius: 12px;
            margin-bottom: 8px;
            border: 1px solid rgba(0,0,0,0.08);
          }
          .list-item:hover {
            transform: translateX(8px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            border-color: rgba(25, 118, 210, 0.3);
          }
        `}
      </style>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card className="picklist-card animate-fade-in" elevation={0}>
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
                <AssignmentIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight="bold" sx={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 1
                }}>
                  {facility?.facility_name || 'Customer / Facility Name'}
                </Typography>
                <Typography variant="h6" sx={{ 
                  opacity: 0.9, 
                  fontWeight: 300,
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  Process ID: {process_id}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Content Section */}
          <Box sx={{ p: 4 }}>
            {/* Process Details */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AssignmentIcon fontSize="small" color="primary" />
                    <Typography variant="body1" fontWeight="bold">
                      Customer Type: {pickList?.customer_type || 'N/A'}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarTodayIcon fontSize="small" color="secondary" />
                    <Typography variant="body1">
                      Registration: {pickList?.started_at ? new Date(pickList.started_at).toLocaleString() : 'N/A'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PersonIcon fontSize="small" color="success" />
                    <Typography variant="body1">
                      Delegate: {pickList?.delegate || 'N/A'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PhoneIcon fontSize="small" color="warning" />
                    <Typography variant="body1">
                      Phone: {pickList?.delegate_phone || 'N/A'}
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <LocationOnIcon fontSize="small" color="error" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      Location:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {facilityDisplay}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>

            {/* Upload Section */}
            {canUpload && (
              <Card sx={{ p: 3, mb: 4, borderRadius: 3, border: '2px dashed rgba(25, 118, 210, 0.2)', background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(100, 181, 246, 0.05) 100%)' }}>
                <Typography variant="h6" fontWeight="bold" mb={3} color="primary">
                  Upload PickList PDF
                </Typography>

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="Select ODN Number"
                        value={odnInput}
                        onChange={(e) => setOdnInput(e.target.value)}
                        required
                        fullWidth
                        className="form-field"
                        helperText={odnOptions.length === 0 ? "No ODNs available for your store" : `${odnOptions.length} ODN(s) available`}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                            }
                          }
                        }}
                      >
                        {odnOptions.length === 0 ? (
                          <MenuItem value="" disabled>
                            No ODNs available
                          </MenuItem>
                        ) : (
                          odnOptions.map((odn) => (
                            <MenuItem key={odn} value={odn}>
                              {odn}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="Select WIM Operator"
                        value={selectedOperator}
                        onChange={(e) => setSelectedOperator(e.target.value)}
                        required
                        fullWidth
                        className="form-field"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                            }
                          }
                        }}
                      >
                        {operators.map((op) => (
                          <MenuItem key={op.id} value={op.id}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                                <PersonIcon fontSize="small" />
                              </Avatar>
                              <span>{op.full_name} ({op.store})</span>
                            </Stack>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <Button 
                        variant="contained" 
                        component="label" 
                        startIcon={<CloudUploadIcon />}
                        className="upload-button"
                        sx={{ mb: 2 }}
                      >
                        Choose PDF File
                        <input type="file" accept=".pdf" hidden onChange={handlePdfChange} />
                      </Button>

                      {pdfFile && (
                        <Chip
                          icon={<PictureAsPdfIcon />}
                          label={`Selected: ${pdfFile.name}`}
                          color="success"
                          variant="filled"
                          sx={{ ml: 2, borderRadius: 2 }}
                        />
                      )}
                    </Grid>

                    <Grid item xs={12}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        disabled={uploading}
                        className="upload-button"
                        size="large"
                      >
                        {uploading ? 'Uploading...' : 'Submit PickList'}
                      </Button>

                      {uploadMessage && (
                        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                          {uploadMessage}
                        </Alert>
                      )}
                    </Grid>
                  </Grid>
                </form>
              </Card>
            )}

            {/* Submitted Picklists */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={3} color="primary">
                Submitted Picklists
              </Typography>

              {submittedPicklists.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  borderRadius: 3,
                  border: '2px dashed rgba(99, 102, 241, 0.2)'
                }}>
                  <PictureAsPdfIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Picklists submitted yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload your first picklist to get started
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {submittedPicklists.map(item => (
                    <ListItem
                      key={item.id}
                      className="list-item"
                      sx={{ 
                        mb: 1,
                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(102, 187, 106, 0.05) 100%)',
                        border: '1px solid rgba(76, 175, 80, 0.2)'
                      }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                          <CheckCircleIcon />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="h6" fontWeight="bold">
                            ODN: {item.odn}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            File: {item.url ? item.url.split('/').pop() : 'Undefined'}
                          </Typography>
                        }
                      />
                      <Stack direction="row" spacing={1}>
                        <Button 
                          variant="outlined" 
                          onClick={() => window.open(item.url, '_blank')}
                          startIcon={<PictureAsPdfIcon />}
                          sx={{ borderRadius: 2 }}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          startIcon={<DeleteIcon />} 
                          onClick={() => handleDelete(item.id, item.url)}
                          sx={{ borderRadius: 2 }}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
            </Card>
          </Box>
        </Card>
      </Container>
    </>
  );
};

export default PickListDetail;
