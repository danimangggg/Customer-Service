// server.js

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const app = express();
const db = require("../../models");
const Employee = db.employee;

app.use(bodyParser.json());

// Endpoint to handle password reset
const ResetPassword = async (req, res) => {
    const user_name = req.body.user_name;

    // Find employee by username
    const employee = await Employee.findOne({ where: { user_name } });
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }
        try {
            // Hash the new password
            const hashedPassword = await bcrypt.hash("123", 10);

            // Update employee's password
            await employee.update({password: hashedPassword})

            res.status(200).json({ message: 'Password reset to 123 successfully' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Failed to reset password' });
        }
}


module.exports = {
    ResetPassword
  };