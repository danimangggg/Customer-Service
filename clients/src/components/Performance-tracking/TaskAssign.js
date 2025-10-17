import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

const TaskAssign = () => {
  const FullName = localStorage.getItem('FullName');
  const Department = localStorage.getItem('Department');
  const Position = localStorage.getItem('Position');

  const [allUsers, setAllUsers] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const [dailyTarget, setDailyTarget] = useState('');
  const [assignedTasks, setAssignedTasks] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/get-employee`);
        setAllUsers(res.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    const fetchTasks = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/tasks`);
        setAllTasks(res.data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };

    fetchUsers();
    fetchTasks();
  }, []);

  useEffect(() => {
    if (Position === 'Manager') {
      const coordinators = allUsers.filter(user => user.position === 'Coordinator');
      setFilteredEmployees(coordinators);
    } else if (Position === 'Coordinator') {
      const officers = allUsers.filter(user =>
        user.position === 'Officer' && user.department === Department
      );
      setFilteredEmployees(officers);
    }
  }, [allUsers, Position, Department]);

  useEffect(() => {
    const departmentTasks = allTasks.filter(task => task.department === Department);
    setFilteredTasks(departmentTasks);
  }, [allTasks, Department]);

  useEffect(() => {
    const fetchAssignedTasks = async () => {
      if (!selectedEmployeeId) return;
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/viewAssignedTask`, {
          params: { userId: selectedEmployeeId },
        });
        setAssignedTasks(res.data);
      } catch (err) {
        console.error('Error fetching assigned tasks:', err);
      }
    };

    fetchAssignedTasks();
  }, [selectedEmployeeId]);

  const handleSubmit = async () => {
    if (!selectedEmployeeId || !selectedTaskId || !dailyTarget) {
      alert('Please select an employee, a task, and enter the daily target.');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/addAssignedTask`, {
        userId: selectedEmployeeId,
        taskId: selectedTaskId,
        target: Number(dailyTarget),
      });
      alert('Task assigned successfully!');
      setSelectedTaskId('');
      setDailyTarget('');
    } catch (err) {
      console.error('Error assigning task:', err);
      alert('Failed to assign task.');
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4, position: 'relative', backgroundColor: '#fafafa' }}>
        <IconButton
          sx={{ position: 'absolute', top: 8, right: 8 }}
          onClick={handleBack}
          color="primary"
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h5" align="center" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
          Assign Task
        </Typography>

        <Typography variant="subtitle1" align="center" sx={{ mb: 3, color: '#666' }}>
          {FullName} | {Position} | {Department}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Select Employee */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel shrink>Select Employee</InputLabel>
          <Select
            label="Select Employee"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
          >
            {filteredEmployees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.full_name} 
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Select Task */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel shrink>Select Task</InputLabel>
          <Select
            label="Select Task"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
          >
            {filteredTasks.map((task) => {const isAssigned = assignedTasks.some(
            (assigned) => assigned.taskId === task.id && assigned.userId === selectedEmployeeId
             );
              return (
                <MenuItem key={task.id} value={task.id} disabled={isAssigned}>
                  {task.description} {isAssigned ? '(Already Assigned)' : ''}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {/* Daily Target */}
        <TextField
          fullWidth
          label="Daily Target"
          type="number"
          value={dailyTarget}
          onChange={(e) => setDailyTarget(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth
          sx={{
            py: 1.2,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            backgroundColor: '#2F3C7E',  // Match Sidebar Here (change if needed)
            '&:hover': {
              backgroundColor: '#1f2a5c',
            },
          }}
        >
          Assign Task
        </Button>
      </Paper>
    </Container>
  );
};

export default TaskAssign;
