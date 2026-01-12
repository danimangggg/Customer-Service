const db = require('../../models');
const ODN = db.odn;
const Process = db.process;

// Helper function to check and update process status based on ODN completion
const checkAndUpdateProcessStatus = async (processId) => {
  try {
    const allODNs = await ODN.findAll({
      where: { process_id: processId }
    });

    const process = await Process.findByPk(processId);
    if (!process) {
      return false;
    }

    if (allODNs.length === 0) {
      // No ODNs, revert to o2c_completed if currently ewm_completed
      if (process.status === 'ewm_completed') {
        await process.update({ status: 'o2c_completed' });
        console.log(`Process ${processId} reverted from ewm_completed - no ODNs remaining`);
      }
      return false;
    }

    const allCompleted = allODNs.every(odnItem => odnItem.status === 'ewm_completed');

    if (allCompleted && process.status !== 'ewm_completed') {
      // All ODNs completed, update process to ewm_completed
      await process.update({ status: 'ewm_completed' });
      console.log(`Process ${processId} automatically updated to ewm_completed - all ODNs completed`);
      return true;
    } else if (!allCompleted && process.status === 'ewm_completed') {
      // Not all ODNs completed, revert process from ewm_completed
      await process.update({ status: 'o2c_completed' });
      console.log(`Process ${processId} reverted from ewm_completed - not all ODNs completed`);
      return false;
    }

    return allCompleted;
  } catch (error) {
    console.error('Error checking and updating process status:', error);
    return false;
  }
};

const saveODN = async (req, res) => {
  try {
    const { process_id, odn_number } = req.body;
    
    if (!process_id || !odn_number) {
      return res.status(400).send({ 
        message: 'process_id and odn_number are required' 
      });
    }

    // Verify that the process exists
    const process = await Process.findByPk(process_id);
    if (!process) {
      return res.status(404).send({ 
        message: 'Process not found' 
      });
    }

    // Check if ODN number already exists
    const existingODN = await ODN.findOne({
      where: { odn_number: odn_number.trim() },
      include: [{
        model: Process,
        as: 'process',
        include: [{
          model: db.facility,
          as: 'facility',
          attributes: ['facility_name']
        }]
      }]
    });

    if (existingODN) {
      const facilityName = existingODN.process?.facility?.facility_name || 'Unknown Facility';
      
      return res.status(409).send({ 
        message: `ODN number "${odn_number.trim()}" already exists for ${facilityName}. Please use a unique ODN number.`,
        existingFacility: facilityName,
        existingProcessId: existingODN.process_id
      });
    }

    // Save the ODN
    const savedODN = await ODN.create({
      process_id,
      odn_number: odn_number.trim()
    });

    return res.status(201).send({ 
      message: 'ODN saved successfully',
      data: savedODN 
    });

  } catch (err) {
    console.error('saveODN error:', err);
    
    // Handle unique constraint violation
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({ 
        message: `ODN number "${req.body.odn_number}" already exists. Please use a unique ODN number.`
      });
    }
    
    return res.status(500).send({ 
      message: 'Internal server error', 
      error: err.message 
    });
  }
};

const getODNsByProcess = async (req, res) => {
  try {
    const { process_id } = req.params;
    
    if (!process_id) {
      return res.status(400).send({ 
        message: 'process_id is required' 
      });
    }

    const odns = await ODN.findAll({
      where: { process_id },
      order: [['created_at', 'ASC']]
    });

    return res.status(200).send({ 
      data: odns 
    });

  } catch (err) {
    console.error('getODNsByProcess error:', err);
    return res.status(500).send({ 
      message: 'Internal server error', 
      error: err.message 
    });
  }
};

const updateODN = async (req, res) => {
  try {
    const { id } = req.params;
    const { odn_number, status } = req.body;
    
    if (!id || !odn_number) {
      return res.status(400).send({ 
        message: 'ODN id and odn_number are required' 
      });
    }

    const odn = await ODN.findByPk(id);
    if (!odn) {
      return res.status(404).send({ 
        message: 'ODN not found' 
      });
    }

    const updateData = { odn_number: odn_number.trim() };
    if (status !== undefined) {
      updateData.status = status;
    }

    await odn.update(updateData);

    // If status was updated, check and update process status
    if (status !== undefined) {
      await checkAndUpdateProcessStatus(odn.process_id);
    }

    return res.status(200).send({ 
      message: 'ODN updated successfully',
      data: odn 
    });

  } catch (err) {
    console.error('updateODN error:', err);
    return res.status(500).send({ 
      message: 'Internal server error', 
      error: err.message 
    });
  }
};

const deleteODN = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).send({ 
        message: 'ODN id is required' 
      });
    }

    // Get the ODN before deleting to know which process it belongs to
    const odn = await ODN.findByPk(id);
    if (!odn) {
      return res.status(404).send({ 
        message: 'ODN not found' 
      });
    }

    const processId = odn.process_id;
    
    const deleted = await ODN.destroy({ where: { id } });
    
    if (deleted) {
      // Check and update process status after deletion
      await checkAndUpdateProcessStatus(processId);

      return res.status(200).send({ 
        message: 'ODN deleted successfully',
        odn_id: id 
      });
    } else {
      return res.status(404).send({ 
        message: 'ODN not found' 
      });
    }

  } catch (err) {
    console.error('deleteODN error:', err);
    return res.status(500).send({ 
      message: 'Internal server error', 
      error: err.message 
    });
  }
};

const completeProcess = async (req, res) => {
  try {
    const { process_id } = req.body;
    
    if (!process_id) {
      return res.status(400).send({ 
        message: 'process_id is required' 
      });
    }

    // Verify that the process exists
    const process = await Process.findByPk(process_id);
    if (!process) {
      return res.status(404).send({ 
        message: 'Process not found' 
      });
    }

    // Update process status to completed
    await process.update({ status: 'o2c_completed' });

    return res.status(200).send({ 
      message: 'Process completed successfully',
      data: process 
    });

  } catch (err) {
    console.error('completeProcess error:', err);
    return res.status(500).send({ 
      message: 'Internal server error', 
      error: err.message 
    });
  }
};

const ewmCompleteProcess = async (req, res) => {
  try {
    const { process_id } = req.body;
    
    if (!process_id) {
      return res.status(400).send({ 
        message: 'process_id is required' 
      });
    }

    // Verify that the process exists and is o2c_completed
    const process = await Process.findByPk(process_id);
    if (!process) {
      return res.status(404).send({ 
        message: 'Process not found' 
      });
    }

    if (process.status !== 'o2c_completed') {
      return res.status(400).send({ 
        message: 'Process must be O2C completed before EWM completion' 
      });
    }

    // Update process status to EWM completed
    await process.update({ status: 'ewm_completed' });

    return res.status(200).send({ 
      message: 'EWM Process completed successfully',
      data: process 
    });

  } catch (err) {
    console.error('ewmCompleteProcess error:', err);
    return res.status(500).send({ 
      message: 'Internal server error', 
      error: err.message 
    });
  }
};

const ewmRevertProcess = async (req, res) => {
  try {
    const { process_id } = req.body;
    
    if (!process_id) {
      return res.status(400).send({ 
        message: 'process_id is required' 
      });
    }

    // Verify that the process exists
    const process = await Process.findByPk(process_id);
    if (!process) {
      return res.status(404).send({ 
        message: 'Process not found' 
      });
    }

    // Revert process status back to o2c_started
    await process.update({ status: 'o2c_started' });

    return res.status(200).send({ 
      message: 'Process reverted to O2C started',
      data: process 
    });

  } catch (err) {
    console.error('ewmRevertProcess error:', err);
    return res.status(500).send({ 
      message: 'Internal server error', 
      error: err.message 
    });
  }
};

const completeODN = async (req, res) => {
  try {
    const { odn_id } = req.body;
    
    if (!odn_id) {
      return res.status(400).send({ 
        message: 'odn_id is required' 
      });
    }

    const odn = await ODN.findByPk(odn_id);
    if (!odn) {
      return res.status(404).send({ 
        message: 'ODN not found' 
      });
    }

    // Update ODN status to ewm_completed
    await odn.update({ status: 'ewm_completed' });

    // Check and update process status if needed
    const processAutoCompleted = await checkAndUpdateProcessStatus(odn.process_id);

    return res.status(200).send({ 
      message: 'ODN completed successfully',
      data: odn,
      processAutoCompleted
    });

  } catch (err) {
    console.error('completeODN error:', err);
    return res.status(500).send({ 
      message: 'Internal server error', 
      error: err.message 
    });
  }
};

module.exports = { 
  saveODN, 
  getODNsByProcess,
  updateODN,
  deleteODN,
  completeProcess,
  ewmCompleteProcess,
  ewmRevertProcess,
  completeODN
};