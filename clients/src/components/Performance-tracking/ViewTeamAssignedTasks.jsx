import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MUIDataTable from 'mui-datatables';

const ViewTeamAssignedTasks = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const userPosition = localStorage.getItem('Position');
  const userDept = localStorage.getItem('Department');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [assignedRes, usersRes, tasksRes, achievementsRes] = await Promise.all([
          axios.get('http://localhost:3001/api/viewAssignedTask'),
          axios.get('http://localhost:3001/api/users'),
          axios.get('http://localhost:3001/api/tasks'),
          axios.get('http://localhost:3001/api/get-achievements')
        ]);

        const allAssignments = assignedRes.data;
        const allUsers = usersRes.data;
        const allTasks = tasksRes.data;
        const allAchievements = achievementsRes.data;

        let filteredAssignments = [];

        if (userPosition === 'Coordinator') {
          filteredAssignments = allAssignments.filter(assign => {
            const user = allUsers.find(u => String(u.id) === String(assign.userId));
            return user && user.position === 'Officer' && user.department === userDept;
          });
        } else if (userPosition === 'Manager') {
          filteredAssignments = allAssignments.filter(assign => {
            const user = allUsers.find(u => String(u.id) === String(assign.userId));
            return user && user.position === 'Coordinator';
          });
        }

        console.log("Filtered Assignments:", filteredAssignments);

        const combined = filteredAssignments.map((assign, index) => {
          const user = allUsers.find(u => String(u.id) === String(assign.userId));
          const task = allTasks.find(t => String(t.id) === String(assign.taskId));
          
          // Find today's achievement matching assignment.id
          const todaysAch = allAchievements.find(
            ach =>
              String(ach.assignmentId) === String(assign.id) &&
              ach.savedDate === today
          );

          return {
            rollNumber: index + 1,
            fullName: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
            department: user?.department || 'Unknown',
            taskDescription: task?.description || 'N/A',
            target: assign.target || '',
            achievement: todaysAch ? todaysAch.achieved : 0
          };
        });

        console.log("Rows for display:", combined);
        setRows(combined);
      } catch (error) {
        console.error('Error fetching data:', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userPosition, userDept, today]);

  const columns = [
    { name: 'rollNumber', label: 'Roll No.' },
    { name: 'fullName', label: 'Full Name' },
    { name: 'department', label: 'Department' },
    { name: 'taskDescription', label: 'Task Description' },
    { name: 'target', label: 'Target' },
    { name: 'achievement', label: "Today's Achievement" }
  ];

  const options = {
    selectableRows: 'none',
    rowsPerPage: 10,
    textLabels: {
      body: {
        noMatch: loading ? 'Loading...' : 'No tasks found.'
      }
    },
    setTableProps: () => ({
      sx: {
        '& thead th': {
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }
      }
    })
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>
        {userPosition === 'Coordinator'
          ? `Tasks Assigned to Officers in ${userDept}`
          : userPosition === 'Manager'
          ? 'Tasks Assigned to Coordinators'
          : 'No Access'}
      </h2>
      <MUIDataTable
        title=""
        data={rows}
        columns={columns}
        options={options}
      />
    </div>
  );
};

export default ViewTeamAssignedTasks;
