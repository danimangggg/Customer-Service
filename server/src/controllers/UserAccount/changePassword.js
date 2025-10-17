// server.js

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const app = express();
const db = require("../../models");
const User = db.employee;
 
app.use(bodyParser.json());



// Endpoint to handle password change
const changePassword = async (req, res) => {
    const { user_name, currentPassword, newPassword } = req.body;

    // Find user by username (simulate database query)
    const user = await User.findOne({ where: { user_name } });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Compare current password with stored hashed password
    bcrypt.compare(currentPassword, user.password, async (err, result) => {
        if (err || !result) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        try {
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update user's password (simulate database update)
            await user.update({password: hashedPassword})

            res.status(200).json({ message: 'Password changed successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update password' });
        }
    });
}


module.exports = {
    changePassword
  };