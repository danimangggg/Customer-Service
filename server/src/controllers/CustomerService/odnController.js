const db = require('../../models');
const ODN = db.odn;
const Process = db.process;

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
    const { odn_number } = req.body;
    
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

    await odn.update({ odn_number: odn_number.trim() });

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

    const deleted = await ODN.destroy({ where: { id } });
    
    if (deleted) {
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

    return res.status(200).send({ 
      message: 'ODN completed successfully',
      data: odn 
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