// server.js

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const app = express();
const db = require("../../models");
const User = db.user;

app.use(bodyParser.json());

// Endpoint to handle password change
const ResetPassword = async (req, res) => {
    const user_name = req.body.user_name;

    // Find user by username (simulate database query)
    const user = await User.findOne({ where: { user_name } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
        try {
            // Hash the new password
            const hashedPassword = await bcrypt.hash("123", 10);

            // Update user's password (simulate database update)
            await user.update({password: hashedPassword})

            res.status(200).json({ message: 'Password reseted to 123' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update password' });
        }
}


module.exports = {
    ResetPassword
  };