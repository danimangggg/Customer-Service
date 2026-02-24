const express = require('express');
const router = express.Router();
const db = require('../../models');
const path = require("path");
const fs = require('fs');
const Picklist = db.picklist; 

// Verify Picklist model is loaded
if (!Picklist) {
  console.error('❌ CRITICAL: Picklist model is undefined!');
  console.error('Available db models:', Object.keys(db));
} else {
  console.log('✅ Picklist model loaded successfully');
}

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
        e.full_name as operator_name,
        COALESCE(f_hp.id, f_aa.id) as facility_id,
        COALESCE(f_hp.facility_name, f_aa.facility_name) as facility_name,
        COALESCE(f_hp.woreda_name, f_aa.woreda_name) as woreda_name,
        COALESCE(f_hp.zone_name, f_aa.zone_name) as zone_name,
        COALESCE(f_hp.region_name, f_aa.region_name) as region_name
      FROM picklist p
      LEFT JOIN Employees e ON p.operator_id = e.id
      LEFT JOIN processes pr ON CAST(p.process_id AS UNSIGNED) = pr.id AND p.store = 'HP'
      LEFT JOIN facilities f_hp ON pr.facility_id = f_hp.id
      LEFT JOIN customer_queue cq ON CAST(p.process_id AS UNSIGNED) = cq.id AND p.store != 'HP'
      LEFT JOIN facilities f_aa ON cq.facility_id = f_aa.id
      ORDER BY p.id DESC
    `;

    const [results] = await db.sequelize.query(query);
    
    console.log(`Found ${results.length} picklists`);
    
    // Debug: Log first few results to see actual data
    if (results.length > 0) {
      console.log('=== PICKLIST RAW DATA DEBUG ===');
      console.log('First picklist raw data:', {
        id: results[0].id,
        odn: results[0].odn,
        operator_id: results[0].operator_id,
        operator_id_ref: results[0].operator_id_ref,
        operator_name: results[0].operator_name,
        store: results[0].store
      });
      
      // Check if any have operator data
      const withOperator = results.filter(r => r.operator_id && r.operator_name);
      const withoutOperator = results.filter(r => r.operator_id && !r.operator_name);
      console.log(`Picklists with operator data: ${withOperator.length}`);
      console.log(`Picklists with operator_id but no name: ${withoutOperator.length}`);
      
      if (withoutOperator.length > 0) {
        console.log('Sample picklist with operator_id but no name:', {
          id: withoutOperator[0].id,
          operator_id: withoutOperator[0].operator_id,
          operator_name: withoutOperator[0].operator_name
        });
      }
    }

    // Format the results
    const formatted = results.map(row => {
      const picklist = {
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
        operator_name: row.operator_name || null, // Add operator_name at top level
        facility: row.facility_id ? {
          id: row.facility_id,
          facility_name: row.facility_name,
          woreda_name: row.woreda_name,
          zone_name: row.zone_name,
          region_name: row.region_name
        } : null
      };
      
      // Log sample for debugging
      if (row.id === results[0].id) {
        console.log('Sample formatted picklist:', JSON.stringify(picklist, null, 2));
      }
      
      return picklist;
    });

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
  console.log('🔥🔥🔥 deletePdf FUNCTION CALLED 🔥🔥🔥');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  
  try {
    const picklistId = req.params.id;
    const { status } = req.body;

    console.log('=== COMPLETE PICKLIST DEBUG ===');
    console.log('Picklist ID:', picklistId);
    console.log('Status from body:', status);

    // Use raw SQL query to avoid Sequelize table name issues
    const [picklists] = await db.sequelize.query(
      'SELECT * FROM picklist WHERE id = ?',
      {
        replacements: [picklistId],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (!picklists) {
      console.log('❌ Picklist not found');
      return res.status(404).json({ message: 'Picklist not found' });
    }

    console.log('Found picklist:', picklists.id, picklists.odn);

    // Update using raw SQL
    await db.sequelize.query(
      'UPDATE picklist SET status = ? WHERE id = ?',
      {
        replacements: ['completed', picklistId],
        type: db.sequelize.QueryTypes.UPDATE
      }
    );

    console.log('✅ Picklist marked as completed');
    
    res.json({ 
      success: true,
      message: 'Picklist marked as completed' 
    });
  } catch (err) {
    console.error('=== COMPLETE PICKLIST ERROR ===');
    console.error('Error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to complete picklist',
      error: err.message 
    });
  }
}

module.exports = {
  retrievePicklists,
  deletePicklist, 
  deletePdf
};
