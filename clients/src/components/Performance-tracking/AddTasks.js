import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
  Box,
  IconButton,
  Grid,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const departmentOptions = [
  'ICT',
  'Finance Administration',
  'Human Resource',
  'Transport Management',
  'Demand',
  'EWM',
];

const AddTaskForm = () => {
  const [department, setDepartment] = useState('');
  const [measurements, setMeasurements] = useState([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState('');
  const [tasks, setTasks] = useState([{ description: '', target: '' }]);

  // Fetch measurements by department
  useEffect(() => {
    const fetchMeasurements = async () => {
      if (!department) {
        setMeasurements([]);
        setSelectedMeasurement('');
        return;
      }

      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/get-measure`);
        const filtered = res.data.filter((m) => m.department === department);
        setMeasurements(filtered);
      } catch (err) {
        console.error('Failed to fetch measurements', err);
        setMeasurements([]);
      }
    };

    fetchMeasurements();
  }, [department]);

  const handleTaskChange = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };

  const handleAddTask = () => {
    setTasks([...tasks, { description: '', target: '' }]);
  };

  const handleRemoveTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!department || !selectedMeasurement || tasks.some((t) => !t.description || !t.target)) {
      alert('Please complete all fields before submitting.');
      return;
    }

    try {
      await Promise.all(
        tasks.map((task) =>
          axios.post(`${process.env.REACT_APP_API_URL}/api/addTask`, {
            ...task,
            department,
            measurement: selectedMeasurement,
          })
        )
      );

      alert('Tasks successfully submitted!');
      setDepartment('');
      setSelectedMeasurement('');
      setTasks([{ description: '', target: '' }]);
    } catch (error) {
      console.error('Error submitting tasks:', error);
      alert('There was an error submitting the tasks.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom align="center">
        Add Department Tasks
      </Typography>

      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" gap={3}>
          <TextField
            select
            label="Select Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            fullWidth
            required
          >
            {departmentOptions.map((dept, index) => (
              <MenuItem key={index} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Select Measurement"
            value={selectedMeasurement}
            onChange={(e) => setSelectedMeasurement(e.target.value)}
            fullWidth
            required
            disabled={!measurements.length}
            helperText={
              !measurements.length && department
                ? 'No measurements found for selected department.'
                : ''
            }
          >
            {measurements.map((m) => (
              <MenuItem key={m.id} value={m.measurement}>
                {m.measurement}
              </MenuItem>
            ))}
          </TextField>

          <Divider sx={{ my: 1 }} />

          {tasks.map((task, index) => (
            <Box key={index} sx={{ position: 'relative', mb: 3, pb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Task {index + 1}
              </Typography>
              <TextField
                label="Task Description"
                value={task.description}
                onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                fullWidth
                multiline
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Target"
                value={task.target}
                onChange={(e) => handleTaskChange(index, 'target', e.target.value)}
                fullWidth
                required
              />
              {tasks.length > 1 && (
                <IconButton
                  onClick={() => handleRemoveTask(index)}
                  color="error"
                  sx={{ position: 'absolute', top: 0, right: 0 }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={handleAddTask}
            variant="outlined"
            sx={{ mt: 1 }}
          >
            Add Another Task
          </Button>

          <Button
            onClick={handleSubmit}
            variant="contained"
            size="large"
            sx={{ mt: 2 }}
          >
            Submit Tasks
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddTaskForm;
