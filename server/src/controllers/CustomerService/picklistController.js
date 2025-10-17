const express = require('express');
const router = express.Router();
const db = require('../../models');
const path = require("path");
const Picklist = db.picklist; 
// matches your model name

// ✅ GET all picklists
const retrievePicklists = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}/picklists`; // <-- use /picklists route
    const picklists = await Picklist.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'odn', 'url', 'process_id', 'store'],
    });

    const formatted = picklists.map(p => ({
      ...p.toJSON(),
      url: p.url ? `${baseUrl}/${p.url}` : null, // prepend folder path
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching picklists:', error);
    res.status(500).json({ message: 'Failed to fetch picklists.' });
  }
};


module.exports = {
  retrievePicklists,
};
