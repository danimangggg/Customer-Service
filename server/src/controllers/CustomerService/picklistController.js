const express = require('express');
const router = express.Router();
const db = require('../../models');
const path = require("path");
const fs = require('fs');
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

// DELETE picklist + file
const deletePicklist = async (req, res) => {
  try {

     const file = await Picklist.findOne({
            where:{
              id:  req.params.id
            }
            });
    const filePath = path.join(__basedir, "/resources/static/assets/picklists", file.url);
        fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`File does not exist: ${filePath}`);
        return;
      }
      // Delete the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err.message}`);
          return;
        }
        console.log(`File deleted successfully: ${filePath}`);
      });
    });
    await Picklist.destroy({
      where:{
        id:  req.params.id
      }
      });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Failed to delete picklist" });
  }
};


module.exports = {
  retrievePicklists,
  deletePicklist
};
