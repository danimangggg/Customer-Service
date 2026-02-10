import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Button
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const ServiceDebug = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/serviceList`);
      setRecords(response.data);
      console.log('All service records:', response.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Service Records Debug
      </Typography>
      
      <Button onClick={fetchData} variant="contained" sx={{ mb: 2 }}>
        Refresh Data
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Receipt Count</TableCell>
              <TableCell>Vehicle Plate</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Measurement Unit</TableCell>
              <TableCell>Gate Status</TableCell>
              <TableCell>Customer Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.id}</TableCell>
                <TableCell>{record.status || 'N/A'}</TableCell>
                <TableCell>{record.receipt_count || 'N/A'}</TableCell>
                <TableCell>{record.vehicle_plate || 'N/A'}</TableCell>
                <TableCell>{record.total_amount || 'N/A'}</TableCell>
                <TableCell>{record.measurement_unit || 'N/A'}</TableCell>
                <TableCell>{record.gate_status || 'N/A'}</TableCell>
                <TableCell>{record.customer_type || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Statistics:</Typography>
        <Typography>Total Records: {records.length}</Typography>
        <Typography>Archived Records: {records.filter(r => r.status === 'archived').length}</Typography>
        <Typography>Records with Exit Permit Data: {records.filter(r => 
          r.status === 'archived' && r.receipt_count && r.vehicle_plate && r.total_amount && r.measurement_unit
        ).length}</Typography>
        <Typography>Records Ready for Gate Keeper: {records.filter(r => 
          r.status === 'archived' && r.receipt_count && r.vehicle_plate && r.total_amount && r.measurement_unit && !r.gate_status
        ).length}</Typography>
      </Box>
    </Box>
  );
};

export default ServiceDebug;