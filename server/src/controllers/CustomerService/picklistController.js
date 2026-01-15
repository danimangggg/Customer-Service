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
    
    const baseUrl = `${req.protocol}://${req.get('host')}/picklists`;
    
    // Use raw SQL query with proper JOINs to get facility information
    // HP picklists use 'processes' table, AA picklists use 'customer_queue' table
    const query = `
      SELECT 
        p.id,
        p.odn,
        p.url,
        p.process_id,
        p.operator_id,
        p.store,
        p.status,
        e.id as operator_id_ref,
        e.fullName as operator_name,
        COALESCE(f_hp.id, f_aa.id) as facility_id,
        COALESCE(f_hp.facility_name, f_aa.facility_name) as facility_name,
        COALESCE(f_hp.woreda_name, f_aa.woreda_name) as woreda_name,
        COALESCE(f_hp.zone_name, f_aa.zone_name) as zone_name,
        COALESCE(f_hp.region_name, f_aa.region_name) as region_name
      FROM picklist p
      LEFT JOIN employee e ON p.operator_id = e.id
      LEFT JOIN processes pr ON CAST(p.process_id AS UNSIGNED) = pr.id AND p.store = 'HP'
      LEFT JOIN facilities f_hp ON pr.facility_id = f_hp.id
      LEFT JOIN customer_queue cq ON CAST(p.process_id AS UNSIGNED) = cq.id AND p.store != 'HP'
      LEFT JOIN facilities f_aa ON cq.facility_id = f_aa.id
      ORDER BY p.id DESC
    `;

    const [results] = await db.sequelize.query(query);
    
    console.log(`Found ${results.length} picklists`);

    // Format the results
    const formatted = results.map(row => ({
      id: row.id,
      odn: row.odn,
      url: row.url ? `${baseUrl}/${row.url}` : null,
      process_id: row.process_id,
      operator_id: row.operator_id,
      store: row.store,
      status: row.status,
      operator: row.operator_id_ref ? {
        id: row.operator_id_ref,
        full_name: row.operator_name
      } : null,
      facility: row.facility_id ? {
        id: row.facility_id,
        facility_name: row.facility_name,
        woreda_name: row.woreda_name,
        zone_name: row.zone_name,
        region_name: row.region_name
      } : null
    }));

    console.log('Sample picklist with facility:', formatted[0]);
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
