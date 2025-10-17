import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box,
  Button,
  TableContainer,
  Pagination,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DepartmentTasks = () => {
  const departmentOptions = [
    'ICT',
    'Finance',
    'Human Resource',
    'Transport Management',
    'Demand',
    'EWM',
  ];

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/tasks`);
        setAllTasks(res.data);
        setFilteredTasks(res.data); // Show all tasks by default
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };

    fetchAllTasks();
  }, []);

  const handleDepartmentChange = (value) => {
    setSelectedDepartment(value);
    setCurrentPage(1); // Reset to first page after filtering
    if (value) {
      const filtered = allTasks.filter((task) => task.department === value);
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(allTasks);
    }
  };

  const handleAddTask = () => {
    navigate('/add-task');
  };

  const handleEdit = (task) => {
    alert(`Edit Task: ${task.description}`);
  };

  const handleDelete = (taskId) => {
    alert(`Delete Task ID: ${taskId}`);
  };

  const indexOfLastTask = currentPage * rowsPerPage;
  const indexOfFirstTask = indexOfLastTask - rowsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / rowsPerPage);

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4, backgroundColor: '#fafafa' }}>
        <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
          Department Tasks
        </Typography>

        {/* Department Dropdown & Add Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel>Filter by Department</InputLabel>
            <Select
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              label="Filter by Department"
            >
              <MenuItem value="">All Departments</MenuItem>
              {departmentOptions.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddTask}
            sx={{
              backgroundColor: '#2F3C7E',
              '&:hover': { backgroundColor: '#1f2a5c' },
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            Add Task
          </Button>
        </Box>

        {/* Task Table */}
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
              <TableRow>
                <TableCell><strong>Task Description</strong></TableCell>
                <TableCell><strong>Department</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentTasks.length > 0 ? (
                currentTasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>{task.description}</TableCell>
                    <TableCell>{task.department}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleEdit(task)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(task.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No tasks found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, value) => setCurrentPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default DepartmentTasks;
