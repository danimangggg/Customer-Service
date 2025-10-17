import { useEffect, useState } from 'react';
import axios from 'axios';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const theme = createTheme();

const AddFacility = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [region2, setRegion] = useState('');
  const [zone_Subcity2, setZone_Subcity] = useState('');
  const [woreda2, setWoreda] = useState('');
  const [facilityName2, setFacilityName] = useState('');
  const [infoRegion2, setData] = useState([]);
  const [infoZone2, setZone] = useState([]);
  const [infoWoreda2, setInfoWoreda] = useState([]);
  const api_url = process.env.REACT_APP_API_URL;

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const submitFacility = async (e) => {
    e.preventDefault();
    const fdata = new FormData();
    fdata.append('region_name', region2);
    fdata.append('zone_name', zone_Subcity2);
    fdata.append('woreda_name', woreda2);
    fdata.append('facility_name', facilityName2);
    fdata.append('facility_type', selectedOption);
    try {
      const res = await axios.post(`${api_url}/api/addfacility`, fdata);
      alert(res.data.message);
      setRegion('');
      setZone_Subcity('');
      setWoreda('');
      setFacilityName('');
      setSelectedOption('');
    } catch (err) {
      console.log(err);
    }
  };

  const getRegion = () => {
    fetch(`${api_url}/api/regions`)
      .then((res) => res.json())
      .then((infoRegion2) => setData(infoRegion2));
  };

  const getZone = () => {
    fetch(`${api_url}/api/zones`)
      .then((res) => res.json())
      .then((infoZone2) => setZone(infoZone2));
  };

  const getWoreda = () => {
    fetch(`${api_url}/api/woredas`)
      .then((res) => res.json())
      .then((infoWoreda2) => setInfoWoreda(infoWoreda2));
  };

  useEffect(() => {
    getRegion();
    getZone();
    getWoreda();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5">
            Add Facility
          </Typography>
          <Box component="form" onSubmit={submitFacility} sx={{ mt: 3 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="region-label">Region</InputLabel>
              <Select
                labelId="region-label"
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
                value={zone_Subcity2}
                onChange={(e) => setZone_Subcity(e.target.value)}
                label="Zone/Subcity"
              >
                <MenuItem value="">
                  <em>Select Zone/Subcity</em>
                </MenuItem>
                {infoZone2.map((data) =>
                  data.region_name === region2 ? (
                    <MenuItem key={data.zone_name} value={data.zone_name}>
                      {data.zone_name}
                    </MenuItem>
                  ) : null
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="woreda-label">Woreda</InputLabel>
              <Select
                labelId="woreda-label"
                value={woreda2}
                onChange={(e) => setWoreda(e.target.value)}
                label="Woreda"
              >
                <MenuItem value="">
                  <em>Select Woreda</em>
                </MenuItem>
                {infoWoreda2.map((data) =>
                  data.zone_name === zone_Subcity2 ? (
                    <MenuItem key={data.woreda_name} value={data.woreda_name}>
                      {data.woreda_name}
                    </MenuItem>
                  ) : null
                )}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Facility Name"
              value={facilityName2}
              onChange={(e) => setFacilityName(e.target.value)}
              required
            />

            <FormControl component="fieldset" margin="normal">
              <FormLabel component="legend">Facility Type</FormLabel>
              <RadioGroup value={selectedOption} onChange={handleOptionChange} row>
                <FormControlLabel value="Public" control={<Radio />} label="Public" />
                <FormControlLabel value="Private" control={<Radio />} label="Private" />
                <FormControlLabel value="Gov" control={<Radio />} label="Gov" />
              </RadioGroup>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
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

export default AddFacility;
