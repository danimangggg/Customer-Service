const db = require('../../models');
const Region = db.region;
const Zone = db.zone;
const Woreda = db.woreda;

// Get all regions
const getRegions = async (req, res) => {
  try {
    const regions = await Region.findAll({
      order: [['region_name', 'ASC']]
    });
    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ message: 'Failed to fetch regions', error: error.message });
  }
};

// Get all zones
const getZones = async (req, res) => {
  try {
    const zones = await Zone.findAll({
      order: [['zone_name', 'ASC']]
    });
    res.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ message: 'Failed to fetch zones', error: error.message });
  }
};

// Get all woredas
const getWoredas = async (req, res) => {
  try {
    const woredas = await Woreda.findAll({
      order: [['woreda_name', 'ASC']]
    });
    res.json(woredas);
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

module.exports = {
  getRegions,
  getZones,
  getWoredas,
  createRegion,
  createZone,
  createWoreda
};