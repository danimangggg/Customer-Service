import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  Grid,
  Box,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { styled } from '@mui/material/styles';

const api_url = process.env.REACT_APP_API_URL;

const StyledForm = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const UpdateComponent = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const id = state?.idNo;

  const [date, setDate] = useState(null);
  const [region, setRegion] = useState('');
  const [zone_Subcity, setZone_Subcity] = useState('');
  const [woreda, setWoreda] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [dnNo, setDnNo] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [podNo, setPodNo] = useState('');
  const [manualDeliveryNo, setManualDeliveryNo] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [infoRegion, setData] = useState([]);
  const [infoZone, setZone] = useState([]);
  const [infoWoreda, setInfoWoreda] = useState([]);
  const [infoFacility, setInfoFacility] = useState([]);
  const [pod, setPod] = useState({});
  const [infoPodReceiver, setInfoPodReceiver] = useState([]);

  useEffect(() => {
    if (id) {
      axios.get(`${api_url}/api/findPod/${id}`)
        .then((response) => {
          const podData = response.data;
          setPod(podData);
          setDate(podData.date ? new Date(podData.date) : null);
          setRegion(podData.region || '');
          setZone_Subcity(podData.zone_Subcity || '');
          setWoreda(podData.woreda || '');
          setFacilityName(podData.facilityName || '');
          setDnNo(podData.dn_no || '');
          setOrderNo(podData.order_no || '');
          setPodNo(podData.pod_no || '');
          setManualDeliveryNo(podData.manual_dno || '');
          setReceivedBy(podData.received_by || '');
        })
        .catch(err => console.log(err));
    }

    fetchData('regions', setData);
    fetchData('zones', setZone);
    fetchData('woredas', setInfoWoreda);
    fetchData('facilities', setInfoFacility);
    fetchData('receivedBy', setInfoPodReceiver);
  }, [id]);

  const fetchData = (endpoint, setter) => {
    fetch(`${api_url}/api/${endpoint}`)
      .then((res) => res.json())
      .then((data) => setter(data))
      .catch((err) => console.log(err));
  };

  const submitUploaded = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (date) {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const newDate = `${year}-${month}-${day}`;
      formData.append('date', newDate);
    }
    if (region) formData.append('region', region);
    if (zone_Subcity) formData.append('zone_Subcity', zone_Subcity);
    if (woreda) formData.append('woreda', woreda);
    if (facilityName) formData.append('facilityName', facilityName);
    if (dnNo) formData.append('dnNo', dnNo);
    if (podNo) formData.append('podNo', podNo);
    if (orderNo) formData.append('orderNo', orderNo);
    if (manualDeliveryNo) formData.append('manualDeliveryNo', manualDeliveryNo);
    if (receivedBy) formData.append('receivedBy', receivedBy);

    await axios.put(`${api_url}/api/updatePod/${id}`, formData)
      .then((res) => {
        alert(res.data.message);
        navigate('/viewPod');
      })
      .catch((err) => console.log(err));
  };

  return (
    <Container maxWidth="md">
      <StyledForm component="form" onSubmit={submitUploaded}>
        <Typography variant="h4" gutterBottom>
          Update Pod
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={date}
                onChange={(newDate) => setDate(newDate)}
                renderInput={(params) => <TextField fullWidth {...params} />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Region</InputLabel>
              <Select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                label="Region"
              >
                <MenuItem value="">Select Region</MenuItem>
                {infoRegion.map((data) => (
                  <MenuItem key={data.region_name} value={data.region_name}>
                    {data.region_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Zone/Subcity</InputLabel>
              <Select
                value={zone_Subcity}
                onChange={(e) => setZone_Subcity(e.target.value)}
                label="Zone/Subcity"
              >
                <MenuItem value="">Select Zone/Subcity</MenuItem>
                {infoZone.filter(zone => zone.region_name === region).map((data) => (
                  <MenuItem key={data.zone_name} value={data.zone_name}>
                    {data.zone_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Woreda</InputLabel>
              <Select
                value={woreda}
                onChange={(e) => setWoreda(e.target.value)}
                label="Woreda"
              >
                <MenuItem value="">Select Woreda</MenuItem>
                {infoWoreda.filter(woreda => woreda.zone_name === zone_Subcity).map((data) => (
                  <MenuItem key={data.woreda_name} value={data.woreda_name}>
                    {data.woreda_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Facility Name</InputLabel>
              <Select
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                label="Facility Name"
              >
                <MenuItem value="">Select Facility</MenuItem>
                {infoFacility.filter(facility => facility.woreda_name === woreda).map((data) => (
                  <MenuItem key={data.facility_name} value={data.facility_name}>
                    {data.facility_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="DN Number"
              variant="outlined"
              value={dnNo}
              onChange={(e) => setDnNo(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Order Number"
              variant="outlined"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Manual Delivery No"
              variant="outlined"
              value={manualDeliveryNo}
              onChange={(e) => setManualDeliveryNo(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Pod Number"
              variant="outlined"
              value={podNo}
              onChange={(e) => setPodNo(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Pod Receiver</InputLabel>
              <Select
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                label="Pod Receiver"
              >
                <MenuItem value="">Select Receiver</MenuItem>
                {infoPodReceiver.map((data) => (
                  <MenuItem key={data.receiver} value={data.receiver}>
                    {data.receiver}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Button variant="contained" color="primary" type="submit">
          Submit
        </Button>
      </StyledForm>
    </Container>
  );
};

export default UpdateComponent;
