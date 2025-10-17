import { useEffect, useState } from 'react';
import axios from 'axios';
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
  FormHelperText,
} from '@mui/material';

const AddCreadit = () => {
  const api_url = process.env.REACT_APP_API_URL;
  const [file, setFile] = useState();
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
  const [loading, setLoading] = useState(false);

  const submitUploaded = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formdata = new FormData();
    formdata.append('file', file);
    formdata.append('fiscalYear', fiscalYear);
    formdata.append('region', region);
    formdata.append('zone_Subcity', zone_Subcity);
    formdata.append('woreda', woreda);
    formdata.append('facilityName', facilityName);
    formdata.append('facilityDeligate', facilityDeligate);
    formdata.append('creaditAmount', creaditAmount);

    try {
      const res = await axios.post(`${api_url}/api/upload`, formdata);
      alert(res.data.message);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e) => {
    setFile(e.target.files[0]);
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

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Add Contract Information
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
                <MenuItem value="2018">2018</MenuItem>
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
                <MenuItem value="">Select Region</MenuItem>
                {infoRegion.map((data) => (
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
                <MenuItem value="">Select Zone/Subcity</MenuItem>
                {infoZone
                  .filter((data) => data.region_name === region)
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
                <MenuItem value="">Select Woreda</MenuItem>
                {infoWoreda
                  .filter((data) => data.zone_name === zone_Subcity)
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
                <MenuItem value="">Select Facility</MenuItem>
                {infoFacility
                  .filter((data) => data.woreda_name === woreda)
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
              label="Creadit Amount"
              type="number"
              value={creaditAmount}
              onChange={(e) => setCreaditAmount(e.target.value)}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Facility Deligate"
              type="text"
              value={facilityDeligate}
              onChange={(e) => setFacilityDeligate(e.target.value)}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12}>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              required
            />
            <FormHelperText>Select a PDF file to attach</FormHelperText>
          </Grid>

          <Grid item xs={12} >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              style={{
                borderRadius: 35,
                backgroundColor: "#21b6ae",
                padding: "10px 20px",
                fontSize: "15px"
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AddCreadit;
