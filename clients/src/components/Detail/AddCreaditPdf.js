import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Container, Grid, Typography, Box, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CancelIcon from '@mui/icons-material/Cancel';

const Input = styled('input')({
  display: 'none',
});

function AddCreaditPdf() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');
  const api_url = process.env.REACT_APP_API_URL;
  const { state } = useLocation();
  const navigate = useNavigate();
  const originalFileName = state?.fileName || '';

  const handleFileChange = (e) => {
    const chosenFile = e.target.files[0];
    if (chosenFile) {
      setFile(chosenFile);
      setFileName(chosenFile.name);
    } else {
      setFileName('No file chosen');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('originalFileName', originalFileName);

    try {
      await axios.post(`${api_url}/api/addCreditPdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('File uploaded successfully');
      window.location.reload()
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <Box
          sx={{
            p: 4,
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: 1,
            position: 'relative',
            width: '100%',
            maxWidth: 600,
            height: '40vh',  // Reduced height
          }}
        >
          <IconButton
            onClick={handleCancel}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'red' }}
          >
            <CancelIcon />
          </IconButton>
          <Typography variant="h5" component="h1" gutterBottom>
            Add Pdf Pages
          </Typography>
          <br/>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <label htmlFor="file-upload">
                  <Input id="file-upload" type="file" onChange={handleFileChange} />
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<UploadFileIcon />}
                    sx={{ backgroundColor: 'white', color: 'black' }}
                  >
                    Choose File
                  </Button>
                </label>
              </Grid>
              <Grid item>
                <Typography variant="body1" component="p">
                  {fileName}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Box mt={2}>
                  <Button type="submit" variant="contained" color="error" fullWidth>
                    Upload
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Box>
    </Container>
  );
}

export default AddCreaditPdf;
