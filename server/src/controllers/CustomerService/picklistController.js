const express = require('express');
const router = express.Router();
const db = require('../../models');
const path = require("path");
const fs = require('fs');
const Picklist = db.picklist; 
// matches your model name

// ✅ GET all picklists with facility information
const retrievePicklists = async (req, res) => {
  try {
    console.log('Fetching picklists...');
    console.log('Picklist model:', Picklist);
    
    const baseUrl = `${req.protocol}://${req.get('host')}/picklists`;
    
    // Get related models for joins
    const Process = db.process;
    const Facility = db.facility;
    const Employee = db.employee;
    
    const picklists = await Picklist.findAll({
      order: [['id', 'DESC']],
      attributes: ['id', 'odn', 'url', 'process_id', 'operator_id', 'store', 'status'],
      include: [
        {
          model: Employee,
          as: 'operator',
          attributes: ['id', 'full_name'],
          required: false
        }
      ]
    });

    console.log(`Found ${picklists.length} picklists`);

    // Get all processes and facilities to match with picklists
    const processes = await Process.findAll({
      attributes: ['id', 'facility_id']
    });
    
    const facilities = await Facility.findAll({
      attributes: ['id', 'facility_name', 'woreda_name', 'zone_name', 'region_name']
    });

    // Create lookup maps for better performance
    const processMap = {};
    processes.forEach(p => {
      processMap[p.id] = p;
    });

    const facilityMap = {};
    facilities.forEach(f => {
      facilityMap[f.id] = f;
    });

    const formatted = picklists.map(p => {
      const picklistData = p.toJSON();
      
      // Find the process using process_id from picklist
      const process = processMap[picklistData.process_id];
      
      // Find the facility using facility_id from the process
      const facility = process ? facilityMap[process.facility_id] : null;
      
      return {
        ...picklistData,
        url: picklistData.url ? `${baseUrl}/${picklistData.url}` : null,
        facility: facility ? {
          id: facility.id,
          facility_name: facility.facility_name,
          woreda_name: facility.woreda_name,
          zone_name: facility.zone_name,
          region_name: facility.region_name
        } : null
      };
    });

    console.log('Picklists formatted successfully with facility information');
    res.status(200).json(formatted);
    
  } catch (error) {
    console.error('Error fetching picklists:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch picklists.',
      error: error.message,
      details: error.stack
    });
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

const deletePdf = async (req, res) => {
  try {
    const { fileUrl, status } = req.body;
    const picklistId = req.params.id;

    // delete only PDF file
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../uploads', fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Picklist.update(
      { url: null, status: status || 'Completed' },
      { where: { id: picklistId } }
    );

    res.json({ message: 'Picklist marked as completed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to complete picklist' });
  }
}

module.exports = {
  retrievePicklists,
  deletePicklist, 
  deletePdf
};
