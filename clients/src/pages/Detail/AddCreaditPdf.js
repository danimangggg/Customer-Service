import React from 'react'
import AddCreaditPdf from '../../components/Detail/AddCreaditPdf'
import { CssBaseline, Container } from '@mui/material';

export default function AddPdf() {
  return (
    
    <div>
        <React.Fragment>
            <CssBaseline />
            <Container maxWidth="md">
            <AddCreaditPdf/>
            </Container>
        </React.Fragment>
      
    </div>
  )
}
