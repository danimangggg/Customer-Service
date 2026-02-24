const db = require('../../models');

// Get ODNs for a specific RDF process
const getOdnsByProcess = async (req, res) => {
  try {
    const { processId } = req.params;

    console.log('Fetching ODNs for process:', processId);

    // Use raw SQL to avoid Sequelize model validation issues
    const query = `
      SELECT * FROM odns_rdf
      WHERE process_id = ?
      ORDER BY created_at DESC
    `;

    const odns = await db.sequelize.query(query, {
      replacements: [processId],
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${odns.length} ODNs`);

    res.json({
      success: true,
      odns: odns
    });
  } catch (error) {
    console.error('Error fetching ODNs:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ODNs',
      details: error.message
    });
  }
};

// Add new ODN for RDF process
const addOdn = async (req, res) => {
  try {
    const { processId, odnNumber, store, addedById, addedByName } = req.body;

    console.log('Adding ODN:', { processId, odnNumber, store });

    if (!processId || !odnNumber || !store) {
      return res.status(400).json({
        success: false,
        error: 'Process ID, ODN number, and store are required'
      });
    }

    // Check if ODN already exists
    const checkQuery = `
      SELECT * FROM odns_rdf
      WHERE process_id = ? AND odn_number = ? AND store = ?
    `;

    const existing = await db.sequelize.query(checkQuery, {
      replacements: [processId, odnNumber, store],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This ODN already exists for this process and store'
      });
    }

    // Insert new ODN with default status values
    const insertQuery = `
      INSERT INTO odns_rdf 
      (process_id, odn_number, store, status, next_service_point, added_by_id, added_by_name, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', 'ewm', ?, ?, NOW(), NOW())
    `;

    await db.sequelize.query(insertQuery, {
      replacements: [processId, odnNumber, store, addedById, addedByName],
      type: db.sequelize.QueryTypes.INSERT
    });

    console.log('ODN added successfully');

    res.json({
      success: true,
      message: 'ODN added successfully'
    });
  } catch (error) {
    console.error('Error adding ODN:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to add ODN',
      details: error.message
    });
  }
};

// Delete ODN
const deleteOdn = async (req, res) => {
  try {
    const { odnId } = req.params;

    const deleteQuery = `
      DELETE FROM odns_rdf WHERE id = ?
    `;

    await db.sequelize.query(deleteQuery, {
      replacements: [odnId],
      type: db.sequelize.QueryTypes.DELETE
    });

    res.json({
      success: true,
      message: 'ODN deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ODN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ODN',
      details: error.message
    });
  }
};

// Update ODN
const updateOdn = async (req, res) => {
  try {
    const { odnId } = req.params;
    const { odnNumber, store } = req.body;

    // Check if ODN exists
    const checkQuery = `SELECT * FROM odns_rdf WHERE id = ?`;
    const odn = await db.sequelize.query(checkQuery, {
      replacements: [odnId],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (!odn || odn.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'ODN not found'
      });
    }

    // Check for duplicates
    const dupQuery = `
      SELECT * FROM odns_rdf
      WHERE process_id = ? AND odn_number = ? AND store = ? AND id != ?
    `;

    const duplicate = await db.sequelize.query(dupQuery, {
      replacements: [odn[0].process_id, odnNumber, store, odnId],
      type: db.sequelize.QueryTypes.SELECT
    });

    if (duplicate && duplicate.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This ODN already exists for this process and store'
      });
    }

    // Update ODN
    const updateQuery = `
      UPDATE odns_rdf
      SET odn_number = ?, store = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.sequelize.query(updateQuery, {
      replacements: [odnNumber, store, odnId],
      type: db.sequelize.QueryTypes.UPDATE
    });

    res.json({
      success: true,
      message: 'ODN updated successfully'
    });
  } catch (error) {
    console.error('Error updating ODN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ODN',
      details: error.message
    });
  }
};

// Start EWM process for ODNs
const startEwm = async (req, res) => {
  try {
    const { process_id, store, officer_id, officer_name } = req.body;

    console.log('Starting EWM for ODNs:', { process_id, store });

    const result = await db.sequelize.query(
      `UPDATE odns_rdf 
       SET ewm_status = 'started',
           ewm_started_at = NOW(),
           ewm_officer_id = ?,
           ewm_officer_name = ?,
           updated_at = NOW()
       WHERE process_id = ? AND store = ? AND (ewm_status IS NULL OR ewm_status = 'pending')`,
      {
        replacements: [officer_id, officer_name, process_id, store],
        type: db.sequelize.QueryTypes.UPDATE
      }
    );

    console.log('EWM started successfully');

    res.json({
      success: true,
      message: 'EWM process started'
    });
  } catch (error) {
    console.error('Error starting EWM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start EWM',
      details: error.message
    });
  }
};

// Complete EWM process for ODNs
const completeEwm = async (req, res) => {
  try {
    const { process_id, store, officer_id, officer_name } = req.body;

    console.log('Completing EWM for ODNs:', { process_id, store });

    const result = await db.sequelize.query(
      `UPDATE odns_rdf 
       SET ewm_status = 'completed',
           ewm_completed_at = NOW(),
           ewm_officer_id = ?,
           ewm_officer_name = ?,
           updated_at = NOW()
       WHERE process_id = ? AND store = ? AND ewm_status = 'started'`,
      {
        replacements: [officer_id, officer_name, process_id, store],
        type: db.sequelize.QueryTypes.UPDATE
      }
    );

    console.log('EWM completed successfully');

    res.json({
      success: true,
      message: 'EWM process completed'
    });
  } catch (error) {
    console.error('Error completing EWM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete EWM',
      details: error.message
    });
  }
};

// Revert EWM process for ODNs
const revertEwm = async (req, res) => {
  try {
    const { process_id, store } = req.body;

    console.log('Reverting EWM for ODNs:', { process_id, store });

    const result = await db.sequelize.query(
      `UPDATE odns_rdf 
       SET ewm_status = 'pending',
           ewm_started_at = NULL,
           ewm_completed_at = NULL,
           updated_at = NOW()
       WHERE process_id = ? AND store = ?`,
      {
        replacements: [process_id, store],
        type: db.sequelize.QueryTypes.UPDATE
      }
    );

    console.log('EWM reverted successfully');

    res.json({
      success: true,
      message: 'EWM process reverted'
    });
  } catch (error) {
    console.error('Error reverting EWM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revert EWM',
      details: error.message
    });
  }
};

// Update dispatch status for ODNs
const updateDispatchStatus = async (req, res) => {
  try {
    const { process_id, store, dispatch_status, dispatcher_id, dispatcher_name } = req.body;

    if (!process_id || !store || !dispatch_status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: process_id, store, dispatch_status'
      });
    }

    const now = new Date();
    const updateData = {
      dispatch_status: dispatch_status
    };

    // Add timestamps and dispatcher info based on status
    if (dispatch_status === 'started' || dispatch_status === 'notifying') {
      if (!updateData.dispatch_started_at) {
        updateData.dispatch_started_at = now;
      }
      if (dispatcher_id) {
        updateData.dispatcher_id = dispatcher_id;
        updateData.dispatcher_name = dispatcher_name;
      }
    } else if (dispatch_status === 'completed') {
      updateData.dispatch_completed_at = now;
      if (dispatcher_id) {
        updateData.dispatcher_id = dispatcher_id;
        updateData.dispatcher_name = dispatcher_name;
      }
    }

    // Update all ODNs for this process and store
    const query = `
      UPDATE odns_rdf 
      SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}
      WHERE process_id = ? AND store = ?
    `;

    const values = [...Object.values(updateData), process_id, store];
    await db.sequelize.query(query, {
      replacements: values,
      type: db.Sequelize.QueryTypes.UPDATE
    });

    res.status(200).json({
      success: true,
      message: `Dispatch status updated to ${dispatch_status}`
    });
  } catch (error) {
    console.error('Error updating dispatch status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update dispatch status',
      details: error.message
    });
  }
};

// Update exit permit status for ODNs
const updateExitPermitStatus = async (req, res) => {
  try {
    const { process_id, store, exit_permit_status, officer_id, officer_name } = req.body;

    if (!process_id || !store || !exit_permit_status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: process_id, store, exit_permit_status'
      });
    }

    const now = new Date();
    const updateData = {
      exit_permit_status: exit_permit_status
    };

    // Add timestamps and officer info based on status
    if (exit_permit_status === 'started') {
      if (!updateData.exit_permit_started_at) {
        updateData.exit_permit_started_at = now;
      }
      if (officer_id) {
        updateData.exit_permit_officer_id = officer_id;
        updateData.exit_permit_officer_name = officer_name;
      }
    } else if (exit_permit_status === 'completed') {
      updateData.exit_permit_completed_at = now;
      if (officer_id) {
        updateData.exit_permit_officer_id = officer_id;
        updateData.exit_permit_officer_name = officer_name;
      }
    }

    // Update all ODNs for this process and store
    const query = `
      UPDATE odns_rdf 
      SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}
      WHERE process_id = ? AND store = ?
    `;

    const values = [...Object.values(updateData), process_id, store];
    await db.sequelize.query(query, {
      replacements: values,
      type: db.Sequelize.QueryTypes.UPDATE
    });

    res.status(200).json({
      success: true,
      message: `Exit permit status updated to ${exit_permit_status}`
    });
  } catch (error) {
    console.error('Error updating exit permit status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update exit permit status',
      details: error.message
    });
  }
};

// Update gate status for ODNs
const updateGateStatus = async (req, res) => {
  try {
    const { process_id, store, gate_status, officer_id, officer_name } = req.body;

    if (!process_id || !store || !gate_status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: process_id, store, gate_status'
      });
    }

    const now = new Date();
    const updateData = {
      gate_status: gate_status,
      gate_processed_at: now,
      gate_processed_by_id: officer_id,
      gate_processed_by_name: officer_name
    };

    // Update all ODNs for this process and store
    const query = `
      UPDATE odns_rdf 
      SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}
      WHERE process_id = ? AND store = ?
    `;

    const values = [...Object.values(updateData), process_id, store];
    await db.sequelize.query(query, {
      replacements: values,
      type: db.Sequelize.QueryTypes.UPDATE
    });

    res.status(200).json({
      success: true,
      message: `Gate status updated to ${gate_status}`
    });
  } catch (error) {
    console.error('Error updating gate status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update gate status',
      details: error.message
    });
  }
};

module.exports = {
  getOdnsByProcess,
  addOdn,
  deleteOdn,
  updateOdn,
  startEwm,
  completeEwm,
  revertEwm,
  updateDispatchStatus,
  updateExitPermitStatus,
  updateGateStatus
};