import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Button, Container, CssBaseline, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const defaultTheme = createTheme();

const AddWoreda = () => {
  const navigate = useNavigate();
  const api_url = process.env.REACT_APP_API_URL; 
  const [region2, setRegion] = useState('');
  const [zone_Subcity2, setZone_Subcity] = useState('');
  const [woreda2, setWoreda] = useState('');
  const [infoRegion2, setData] = useState([]);
  const [infoZone2, setZone] = useState([]);

  const submitFacility = (e) => {
    e.preventDefault();
    const fdata = new FormData();
    fdata.append('region', region2);
    fdata.append('zone', zone_Subcity2);
    fdata.append('woreda', woreda2);
    axios.post(`${api_url}/api/addworeda`, fdata)
      .then((res) => {
        alert(res.data.message);
        setRegion('');
        setZone_Subcity('');
        setWoreda('');
      })
      .catch(err => console.log(err));
  };

  const getRegion = () => {
    fetch(`${api_url}/api/regions`)
      .then((e) => e.json())
      .then((infoRegion2) => setData(infoRegion2));
  };

  useEffect(() => {
    getRegion();
  }, []);

  const getZone = () => {
    fetch(`${api_url}/api/zones`)
      .then((e) => e.json())
      .then((infoZone2) => setZone(infoZone2));
  };

  useEffect(() => {
    getZone();
  }, []);

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-end' }}>
            <CloseIcon />
          </IconButton>
          <Typography component="h1" variant="h5">
            Add Woreda
          </Typography>
          <Box component="form" onSubmit={submitFacility} sx={{ mt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="region-label">Region</InputLabel>
              <Select
                labelId="region-label"
                id="region"
                value={region2}
                onChange={(e) => setRegion(e.target.value)}
                label="Region"
              >
                <MenuItem value="">
                  <em>Select Region</em>
                </MenuItem>
                {infoRegion2.map((data) => (
                  <MenuItem key={data.region_name} value={data.region_name}>
                    {data.region_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="zone-label">Zone/Subcity</InputLabel>
              <Select
                labelId="zone-label"
                id="zone"
                value={zone_Subcity2}
                onChange={(e) => setZone_Subcity(e.target.value)}
                label="Zone/Subcity"
              >
                <MenuItem value="">
                  <em>Select Zone/Subcity</em>
                </MenuItem>
                {infoZone2.filter(data => data.region_name === region2).map((data) => (
                  <MenuItem key={data.zone_name} value={data.zone_name}>
                    {data.zone_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Woreda name"
              name="name"
              autoComplete="name"
              value={woreda2}
              onChange={(e) => setWoreda(e.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default AddWoreda;
