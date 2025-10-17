import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  CircularProgress,
  Grid,
  Box,
} from '@mui/material';

const UpdateComponent = () => {
  const navigate = useNavigate();
  const api_url = process.env.REACT_APP_API_URL;
  const { state } = useLocation();
  const id = state?.idNo || '';

  const [message, setMessage] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');
  const [region, setRegion] = useState('');
  const [zone_Subcity, setZone_Subcity] = useState('');
  const [woreda, setWoreda] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [facilityDeligate, setFacilityDeligate] = useState('');
  const [creaditAmount, setCreaditAmount] = useState('');
  const [infoRegion, setData] = useState([]);
  const [infoZone, setZone] = useState([]);
  const [infoWoreda, setInfoWoreda] = useState([]);
  const [infoFacility, setInfoFacility] = useState([]);
  const [credit, setCredit] = useState({});
  const [loading, setLoading] = useState(false);

  const submitUploaded = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formdata = new FormData();
    if (fiscalYear) formdata.append('fiscalYear', fiscalYear);
    if (region) formdata.append('region', region);
    if (zone_Subcity) formdata.append('zone_Subcity', zone_Subcity);
    if (woreda) formdata.append('woreda', woreda);
    if (facilityName) formdata.append('facilityName', facilityName);
    formdata.append('facilityDeligate', facilityDeligate);
    formdata.append('creaditAmount', creaditAmount);

    try {
      await axios.put(`${api_url}/api/updateContract/${id}`, formdata);
      navigate('/viewContract');
    } catch (err) {
      console.error(err);
      setMessage('Error updating data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (endpoint, setter) => {
    try {
      const response = await fetch(`${api_url}/api/${endpoint}`);
      const data = await response.json();
      setter(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData('regions', setData);
    fetchData('zones', setZone);
    fetchData('woredas', setInfoWoreda);
    fetchData('facilities', setInfoFacility);
  }, []);

  const GetCredit = async () => {
    try {
      const response = await fetch(`${api_url}/api/find/${id}`);
      const credit = await response.json();
      setCredit(credit);
      setFiscalYear(credit.fiscalYear || '');
      setRegion(credit.region || '');
      setZone_Subcity(credit.zone_Subcity || '');
      setWoreda(credit.woreda || '');
      setFacilityName(credit.facilityName || '');
      setFacilityDeligate(credit.facilityDeligate || '');
      setCreaditAmount(credit.creaditAmount || '');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) {
      GetCredit();
    }
  }, [id]);

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Update Facility
      </Typography>
      <br/>
      <Box
        component="form"
        onSubmit={submitUploaded}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Fiscal Year</InputLabel>
              <Select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                label="Fiscal Year"
              >
                <MenuItem value="2015">2015</MenuItem>
                <MenuItem value="2016">2016</MenuItem>
                <MenuItem value="2017">2017</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Region</InputLabel>
              <Select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                label="Region"
              >
                <MenuItem value={credit.region}>{credit.region || 'Select Region'}</MenuItem>
                {infoRegion
                  .filter((data) => data.region_name !== credit.region)
                  .map((data) => (
                    <MenuItem key={data.region_name} value={data.region_name}>
                      {data.region_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Zone/Subcity</InputLabel>
              <Select
                value={zone_Subcity}
                onChange={(e) => setZone_Subcity(e.target.value)}
                label="Zone/Subcity"
                disabled={!region}
              >
                <MenuItem value={credit.zone_Subcity}>{credit.zone_Subcity || 'Select Zone/Subcity'}</MenuItem>
                {infoZone
                  .filter((data) => data.region_name === region && data.zone_name !== credit.zone_Subcity)
                  .map((data) => (
                    <MenuItem key={data.zone_name} value={data.zone_name}>
                      {data.zone_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Woreda</InputLabel>
              <Select
                value={woreda}
                onChange={(e) => setWoreda(e.target.value)}
                label="Woreda"
                disabled={!zone_Subcity}
              >
                <MenuItem value={credit.woreda}>{credit.woreda || 'Select Woreda'}</MenuItem>
                {infoWoreda
                  .filter((data) => data.zone_name === zone_Subcity && data.woreda_name !== credit.woreda)
                  .map((data) => (
                    <MenuItem key={data.woreda_name} value={data.woreda_name}>
                      {data.woreda_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Facility Name</InputLabel>
              <Select
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                label="Facility Name"
                disabled={!woreda}
              >
                <MenuItem value={credit.facilityName}>{credit.facilityName || 'Select Facility Name'}</MenuItem>
                {infoFacility
                  .filter((data) => data.woreda_name === woreda && data.facility_name !== credit.facilityName)
                  .map((data) => (
                    <MenuItem key={data.facility_name} value={data.facility_name}>
                      {data.facility_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Credit Amount"
              type="text"
              value={creaditAmount}
              onChange={(e) => setCreaditAmount(e.target.value)}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Facility Delegate"
              type="text"
              value={facilityDeligate}
              onChange={(e) => setFacilityDeligate(e.target.value)}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
          </Grid>
        </Grid>
      </Box>
      {message && (
        <Typography color="error" align="center" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Container>
  );
};

export default UpdateComponent;
