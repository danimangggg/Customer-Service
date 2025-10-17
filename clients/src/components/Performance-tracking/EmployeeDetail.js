import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Divider,
  Grid,
  TextField,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import axios from 'axios';
import LinearProgress from '@mui/material/LinearProgress';

// ⬅️ EXTEND dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const EmployeeDetail = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [rangeStart, setRangeStart] = useState(dayjs().startOf('month'));
  const [rangeEnd, setRangeEnd] = useState(dayjs());
      const api_url = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get(`${api_url}/api/get-employee`);
        const foundUser = userRes.data.find(u => u.id === parseInt(id));
        setUser(foundUser);

        const tasksRes = await axios.get(`${api_url}//api/viewAssignedTask`);
        const userAssignedTasks = tasksRes.data.filter(task => task.userId === foundUser.id);
        setAssignedTasks(userAssignedTasks);

        const achRes = await axios.get(`${api_url}//api/get-achievements`);
        setAchievements(achRes.data);

        const allTasksRes = await axios.get(`${api_url}//api/tasks`);
        setTasks(allTasksRes.data);

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (date) => dayjs(date).format('YYYY-MM-DD');

  const filteredAchievementsByDay = assignedTasks.map(task => {
    const achievementSum = achievements
      .filter(a => {
        const date = dayjs(a.savedDate);
        return (
          String(a.assignmentId) === String(task.id) &&
          date.isSame(selectedDate, 'day')
        );
      })
      .reduce((sum, a) => sum + parseInt(a.achieved || 0), 0);
      const remark = achievements
      .filter(a => {
        const date = dayjs(a.savedDate);
        return (
          String(a.assignmentId) === String(task.id) &&
          date.isSame(selectedDate, 'day')
        );
      })
      .reduce((sum, a) => a.remark , "");

    const percent = task.target > 0 ? Math.round((achievementSum / task.target) * 100) : 0;

    return {
      ...task,
      achieved: achievementSum,
      target: task.target,
      remark: remark,
      percent
    };
  });

  const filteredAchievementsByRange = assignedTasks.map(task => {
    const achievementSum = achievements
      .filter(a => {
        const date = dayjs(a.savedDate);
        return (
          String(a.assignmentId) === String(task.id) &&
          date.isSameOrAfter(rangeStart, 'day') &&
          date.isSameOrBefore(rangeEnd, 'day')
        );
      })
      .reduce((sum, a) => sum + parseInt(a.achieved || 0), 0);

    const totalDays = rangeEnd.diff(rangeStart, 'day') + 1;
    const target = task.target * totalDays;
    const percent = target > 0 ? Math.round((achievementSum / target) * 100) : 0;

    return {
      ...task,
      achieved: achievementSum,
      target,
      percent
    };
  });

  const getTaskDescription = (taskId) => {
    const task = tasks.find(t => String(t.id) === String(taskId));
    return task ? task.description : 'N/A';
  };

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Employee Detail</Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Personal Info</Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}><b>Name:</b> <span style={{ fontWeight: 'bold', color: '#1565c0' }}>{user.full_name} </span></Grid>
          <Grid item xs={6}><b>Position:</b> <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{user.position}</span></Grid>
          <Grid item xs={6}><b>Department:</b> <span style={{ fontWeight: 'bold', color: '#6a1b9a' }}>{user.department}</span></Grid>
        </Grid>
      </Paper>

      {/* Filter by Day */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Filter by Day</Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={newDate => setSelectedDate(newDate)}
            renderInput={(params) => <TextField {...params} sx={{ mt: 2 }} />}
          />
        </LocalizationProvider>

        <Typography variant="subtitle1" sx={{ mt: 3 }}>
          Achievements on {formatDate(selectedDate)}:
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Task Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Target</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Achieved</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>% Achievement</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Remark</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAchievementsByDay.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{getTaskDescription(task.taskId)}</TableCell>
                <TableCell>{task.target}</TableCell>
                <TableCell>{task.achieved}</TableCell>
                <TableCell>
                  {task.percent}%
                  <LinearProgress variant="determinate" value={task.percent} sx={{ height: 8, borderRadius: 5, mt: 1 }} color={task.percent < 50 ? "error" : task.percent < 80 ? "warning" : "success"} />
                </TableCell>
                <TableCell>{task.remark}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Filter by Date Range */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6">Filter by Date Range</Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box display="flex" gap={2} mt={2}>
            <DatePicker
              label="From"
              value={rangeStart}
              onChange={setRangeStart}
              renderInput={(params) => <TextField {...params} />}
            />
            <DatePicker
              label="To"
              value={rangeEnd}
              onChange={setRangeEnd}
              renderInput={(params) => <TextField {...params} />}
            />
          </Box>
        </LocalizationProvider>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
          Achievements from {formatDate(rangeStart)} to {formatDate(rangeEnd)}:
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Task Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Target</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Achieved</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>% Achievement</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAchievementsByRange.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{getTaskDescription(task.taskId)}</TableCell>
                <TableCell>{task.target}</TableCell>
                <TableCell>{task.achieved}</TableCell>
                <TableCell>
                  {task.percent}%
                  <LinearProgress variant="determinate" value={task.percent} sx={{ height: 8, borderRadius: 5, mt: 1 }} color={task.percent < 50 ? "error" : task.percent < 80 ? "warning" : "success"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default EmployeeDetail;
