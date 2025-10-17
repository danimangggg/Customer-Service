import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  LinearProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, assignedTaskRes, achievementRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/get-employee`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/viewAssignedTask`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/get-achievements`),
        ]);

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
        setAssignedTasks(assignedTaskRes.data);
        setAchievements(achievementRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const calculateWeeklyProgress = (user) => {
    const userAssignedTasks = assignedTasks.filter(task => task.userId === user.userId);
    if (userAssignedTasks.length === 0) return 0;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const taskPercentages = userAssignedTasks.map(task => {
      const relatedAchievements = achievements.filter(a => {
        const date = new Date(a.savedDate);
        return (
          a.assignmentId === task.id &&
          date >= sevenDaysAgo &&
          date <= today
        );
      });

      const totalAchieved = relatedAchievements.reduce(
        (sum, a) => sum + (parseInt(a.achieved, 10) || 0),
        0
      );
      const dailyTarget = parseInt(task.target, 10) || 0;
      const weeklyTarget = dailyTarget * 7;

      if (weeklyTarget === 0) return 0;
      return (totalAchieved / weeklyTarget) * 100;
    });

    const averageProgress =
      taskPercentages.length === 0
        ? 0
        : Math.round(taskPercentages.reduce((sum, p) => sum + p, 0) / taskPercentages.length);

    return averageProgress;
  };

  const handleView = (user) => {
    navigate(`/employee-detail/${user.userId}`, { state: { user } });
  };

  const getWeekRangeText = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    const options = { day: 'numeric', month: 'short' };
    return `${sevenDaysAgo.toLocaleDateString('en-US', options)} - ${today.toLocaleDateString('en-US', options)}`;
  };

  const columns = [
    { field: 'serialId', headerName: t('No'), width: 70, headerClassName: 'bold-header' },
    { field: 'full_name', headerName: t('Full Name'), flex: 1, headerClassName: 'bold-header' },
    {
      field: 'department',
      headerName: t('Department'),
      flex: 1,
      headerClassName: 'bold-header',
      valueGetter: (params) => params.row.department || '-',
    },
    {
      field: 'position',
      headerName: t('Position'),
      flex: 1,
      headerClassName: 'bold-header',
      valueGetter: (params) => params.row.position || '-',
    },
    {
      field: 'weeklyProgress',
      headerName: `${t('Weekly Progress')} (${getWeekRangeText()})`,
      flex: 2,
      headerClassName: 'bold-header',
      renderCell: (params) => {
        const progress = calculateWeeklyProgress(params.row);
        return (
          <Box width="100%">
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="caption">{progress}%</Typography>
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: t('Actions'),
      width: 120,
      headerClassName: 'bold-header',
      sortable: false,
      renderCell: (params) => (
        <Button variant="outlined" size="small" onClick={() => handleView(params.row)}>
          {t('Detail')}
        </Button>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 4, backgroundColor: '#fafafa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="primary">
            {t('Self Assessment Employee List')}
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
