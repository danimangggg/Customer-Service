import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/get-employee`);

        let selfAssessmentUsers = userRes.data.filter(
          (user) => user.account_type === 'Self Assesment'
        );

        const position = localStorage.getItem("Position");
        const department = localStorage.getItem("Department");

        // Filter by department for coordinators
        if (position?.toLowerCase() === 'coordinator') {
          selfAssessmentUsers = selfAssessmentUsers.filter(
            (user) =>
              user.department?.trim().toLowerCase() === department?.trim().toLowerCase()
          );
        }

        const enhancedUsers = selfAssessmentUsers.map((user, index) => ({
          ...user,
          userId: user.id,
          id: index + 1, // Assign ID after filtering
          serialId: index + 1,
        }));

        setUsers(enhancedUsers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const columns = [
    { field: 'serialId', headerName: "No", width: 70, headerClassName: 'bold-header' },
    { field: 'full_name', headerName: "Full Name", flex: 1, headerClassName: 'bold-header' },
    {
      field: 'department',
      headerName: "Department",
      flex: 1,
      headerClassName: 'bold-header',
      valueGetter: (params) => params.row.department || '-',
    },
    {
      field: 'position',
      headerName: "Position",
      flex: 1,
      headerClassName: 'bold-header',
      valueGetter: (params) => params.row.position || '-',
    },
    {
      field: 'email',
      headerName: "Email",
      flex: 1,
      headerClassName: 'bold-header',
      valueGetter: (params) => params.row.email || '-',
    },
    {
      field: 'actions',
      headerName: "Actions",
      width: 120,
      headerClassName: 'bold-header',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 4, backgroundColor: '#fafafa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="primary">
            {"Self Assessment Employee List"}
          </Typography>
        </Box>

        <Box sx={{ height: 520, width: '100%', '& .bold-header': { fontWeight: 'bold' } }}>
          <DataGrid
            rows={users}
            columns={columns}
            pageSize={50}
            rowsPerPageOptions={[ 10, 50, 100]}
            disableSelectionOnClick
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default UserList;
