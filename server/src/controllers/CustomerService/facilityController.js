const db = require('../../models');
const Facility = db.facility;

// Get all facilities
const getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.findAll({
      order: [['facility_name', 'ASC']]
    });
    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ message: 'Failed to fetch facilities', error: error.message });
  }
};

// Get facility by ID
const getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json(facility);
  } catch (error) {
    console.error('Error fetching facility:', error);
    res.status(500).json({ message: 'Failed to fetch facility', error: error.message });
  }
};

// Create new facility
const createFacility = async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
    res.status(201).json(facility);
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({ message: 'Failed to create facility', error: error.message });
  }
};

// Update facility
const updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    
    await facility.update(req.body);
    res.json(facility);
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({ message: 'Failed to update facility', error: error.message });
  }
};

// Delete facility
const deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    
    await facility.destroy();
    res.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ message: 'Failed to delete facility', error: error.message });
  }
};

module.exports = {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility
};