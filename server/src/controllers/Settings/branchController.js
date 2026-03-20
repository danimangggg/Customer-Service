const db = require('../../models');
const Branch = db.epssBranch;

const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({ order: [['branch_name', 'ASC']] });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch branches', error: err.message });
  }
};

const createBranch = async (req, res) => {
  try {
    const { branch_name, branch_code, status } = req.body;
    if (!branch_name || !branch_code) {
      return res.status(400).json({ message: 'branch_name and branch_code are required' });
    }
    const branch = await Branch.create({ branch_name, branch_code: branch_code.toUpperCase(), status: status || 'Active' });
    res.status(201).json(branch);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Branch code already exists' });
    }
    res.status(500).json({ message: 'Failed to create branch', error: err.message });
  }
};

const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    const { branch_name, branch_code, status } = req.body;
    await branch.update({ branch_name, branch_code: branch_code?.toUpperCase(), status });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update branch', error: err.message });
  }
};

const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    await branch.destroy();
    res.json({ message: 'Branch deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete branch', error: err.message });
  }
};

module.exports = { getAllBranches, createBranch, updateBranch, deleteBranch };
