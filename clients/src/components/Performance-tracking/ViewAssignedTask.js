import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

const ViewAssignedTask = () => {
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [achievements, setAchievements] = useState({});
  const [editedAchievements, setEditedAchievements] = useState({});
  const [achievementIds, setAchievementIds] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);

  const loggedInUserId = localStorage.getItem("UserId");
  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignedRes, usersRes, tasksRes, achievementRes] = await Promise.all([
          axios.get("http://localhost:3001/api/viewAssignedTask"),
          axios.get("http://localhost:3001/api/users"),
          axios.get("http://localhost:3001/api/tasks"),
          axios.get("http://localhost:3001/api/get-achievements"),
        ]);

        const allAssignedTasks = assignedRes.data;
        const allUsers = usersRes.data;
        const allTasks = tasksRes.data;
        const allAchievements = achievementRes.data;

        const userAssignedTasks = allAssignedTasks.filter(
          (task) => String(task.userId) === loggedInUserId
        );

        const achievementMap = {};
        const achievementIdMap = {};
        const remarkMap = {};

        allAchievements.forEach((ach) => {
          if (
            ach.savedDate === today &&
            userAssignedTasks.some((task) => task.id == ach.assignmentId)
          ) {
            achievementMap[ach.assignmentId] = ach.achieved;
            achievementIdMap[ach.assignmentId] = ach.id;
            remarkMap[ach.assignmentId] = ach.remark || "";
          }
        });

        setAssignedTasks(userAssignedTasks);
        setUsers(allUsers);
        setTasks(allTasks);
        setAchievements(achievementMap);
        setAchievementIds(achievementIdMap);
        setRemarks(remarkMap);

        const initEdited = {};
        userAssignedTasks.forEach((task) => {
          initEdited[task.id] = achievementMap[task.id] ?? 0;
        });
        setEditedAchievements(initEdited);
        setLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [loggedInUserId, today]);

  const getUserFullName = (userId) => {
    const user = users.find((u) => String(u.id) === String(userId));
    return user ? `${user.first_name} ${user.last_name}` : "Unknown";
  };

  const getUserDepartment = (userId) => {
    const user = users.find((u) => String(u.id) === String(userId));
    return user?.department || "Unknown";
  };

  const getTaskDescription = (taskId) => {
    const task = tasks.find((t) => String(t.id) === String(taskId));
    return task?.description || "NA";
  };

  const handleAchievementChange = (assignmentId, value) => {
    if (value === "" || /^[0-9\b]+$/.test(value)) {
      setEditedAchievements((prev) => ({
        ...prev,
        [assignmentId]: value,
      }));
    }
  };

  const handleRemarkChange = (assignmentId, value) => {
    setRemarks((prev) => ({
      ...prev,
      [assignmentId]: value,
    }));
  };

  const handleSave = async (assignmentId) => {
    try {
      const achievedValue = Number(editedAchievements[assignmentId]) || 0;
      const remarkText = remarks[assignmentId] || "";

      if (achievementIds[assignmentId]) {
        await axios.put(`http://localhost:3001/api/update-achievement/${achievementIds[assignmentId]}`, {
          achieved: achievedValue,
          date: today,
          remark: remarkText,
        });
      } else {
        const res = await axios.post("http://localhost:3001/api/add-achievement", {
          assignmentId,
          achieved: achievedValue,
          date: today,
          remark: remarkText,
        });

        setAchievementIds((prev) => ({
          ...prev,
          [assignmentId]: res.data.id,
        }));
      }

      alert("Saved successfully");

      setAchievements((prev) => ({
        ...prev,
        [assignmentId]: achievedValue,
      }));
    } catch (error) {
      console.error("Save failed:", error.response || error.message || error);
      alert("Save failed");
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Assigned Tasks
        </Typography>
        <Typography variant="subtitle1" gutterBottom color="text.secondary">
          {getUserFullName(loggedInUserId)} | Department: {getUserDepartment(loggedInUserId)}
        </Typography>
        <Typography variant="body2" gutterBottom color="text.secondary">
          Date: {today}
        </Typography>

        <TableContainer sx={{ mt: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Task Description</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Achievement</TableCell>
                <TableCell>Remark</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignedTasks.map((task, index) => (
                <TableRow key={task.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{getTaskDescription(task.taskId)}</TableCell>
                  <TableCell>{task.target}</TableCell>
                  <TableCell>
                    <TextField
                      size="medium"
                      value={editedAchievements[task.id] ?? 0}
                      onChange={(e) => handleAchievementChange(task.id, e.target.value)}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      multiline
                      minRows={2}
                      maxRows={4}
                      size="small"
                      placeholder="Write your remark"
                      value={remarks[task.id] || ""}
                      onChange={(e) => handleRemarkChange(task.id, e.target.value)}
                      sx={{ width: 200 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSave(task.id)}
                    >
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ViewAssignedTask;
