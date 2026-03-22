const db = require('../../models');
const Region = db.region;
const Zone = db.zone;
const Woreda = db.woreda;
const Facility = db.facility;
const { Op } = require('sequelize');

const getBranchCode = (req) => {
  const accountType = req.headers['x-account-type'] || null;
  const queryBranch = req.query.branch_code || null;
  const headerBranch = req.headers['x-branch-code'] || null;
  return queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);
};

// Get all regions — scoped to branch via facilities
const getRegions = async (req, res) => {
  try {
    const branchCode = getBranchCode(req);
    let sql = `SELECT DISTINCT TRIM(region_name) as region_name FROM facilities WHERE region_name IS NOT NULL AND TRIM(region_name) != ''`;
    const replacements = [];
    if (branchCode) { sql += ` AND branch_code = ?`; replacements.push(branchCode); }
    sql += ` ORDER BY region_name ASC`;
    const rows = await db.sequelize.query(sql, { replacements, type: db.sequelize.QueryTypes.SELECT });
    res.json(rows.map(r => ({ region_name: r.region_name })));
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ message: 'Failed to fetch regions', error: error.message });
  }
};

// Get zones — scoped to branch + region via facilities
const getZones = async (req, res) => {
  try {
    const branchCode = getBranchCode(req);
    const { region } = req.query;
    let sql = `SELECT DISTINCT TRIM(zone_name) as zone_name FROM facilities WHERE zone_name IS NOT NULL AND TRIM(zone_name) != ''`;
    const replacements = [];
    if (branchCode) { sql += ` AND branch_code = ?`; replacements.push(branchCode); }
    if (region) { sql += ` AND region_name = ?`; replacements.push(region); }
    sql += ` ORDER BY zone_name ASC`;
    const rows = await db.sequelize.query(sql, { replacements, type: db.sequelize.QueryTypes.SELECT });
    res.json(rows.map(r => ({ zone_name: r.zone_name })));
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ message: 'Failed to fetch zones', error: error.message });
  }
};

// Get woredas — scoped to branch + zone via facilities
const getWoredas = async (req, res) => {
  try {
    const branchCode = getBranchCode(req);
    const { zone } = req.query;
    let sql = `SELECT DISTINCT TRIM(woreda_name) as woreda_name FROM facilities WHERE woreda_name IS NOT NULL AND TRIM(woreda_name) != ''`;
    const replacements = [];
    if (branchCode) { sql += ` AND branch_code = ?`; replacements.push(branchCode); }
    if (zone) { sql += ` AND zone_name = ?`; replacements.push(zone); }
    sql += ` ORDER BY woreda_name ASC`;
    const rows = await db.sequelize.query(sql, { replacements, type: db.sequelize.QueryTypes.SELECT });
    res.json(rows.map(r => ({ woreda_name: r.woreda_name })));
  } catch (error) {
    console.error('Error fetching woredas:', error);
    res.status(500).json({ message: 'Failed to fetch woredas', error: error.message });
  }
};

// Create region
const createRegion = async (req, res) => {
  try {
    const region = await Region.create(req.body);
    res.status(201).json(region);
  } catch (error) {
    console.error('Error creating region:', error);
    res.status(500).json({ message: 'Failed to create region', error: error.message });
  }
};

// Create zone
const createZone = async (req, res) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json(zone);
  } catch (error) {
    console.error('Error creating zone:', error);
    res.status(500).json({ message: 'Failed to create zone', error: error.message });
  }
};

// Create woreda
const createWoreda = async (req, res) => {
  try {
    const woreda = await Woreda.create(req.body);
    res.status(201).json(woreda);
  } catch (error) {
    console.error('Error creating woreda:', error);
    res.status(500).json({ message: 'Failed to create woreda', error: error.message });
  }
};

// Get facilities (optionally filtered by woreda)
const getFacilities = async (req, res) => {
  try {
    const { woreda } = req.query;
    const accountType = req.headers['x-account-type'] || null;
    const queryBranch = req.query.branch_code || null;
    const headerBranch = req.headers['x-branch-code'] || null;
    const branchCode = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);

    let sql = `SELECT id, facility_name, woreda_name, zone_name, region_name, branch_code FROM facilities WHERE 1=1`;
    const replacements = [];
    if (woreda) { sql += ` AND TRIM(woreda_name) = TRIM(?)`; replacements.push(woreda); }
    if (branchCode) { sql += ` AND branch_code = ?`; replacements.push(branchCode); }
    sql += ` ORDER BY facility_name ASC`;
    const facilities = await db.sequelize.query(sql, { replacements, type: db.sequelize.QueryTypes.SELECT });
    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ message: 'Failed to fetch facilities', error: error.message });
  }
};

module.exports = {
  getRegions,
  getZones,
  getWoredas,
  getFacilities,
  createRegion,
  createZone,
  createWoreda
};