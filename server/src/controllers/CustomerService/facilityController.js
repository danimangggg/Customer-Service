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

    const updateData = { ...req.body };

    // If neither HP nor vaccine site, clear route and period
    const isHp = updateData.is_hp_site === 1 || updateData.is_hp_site === true || updateData.is_hp_site === '1';
    const isVaccine = updateData.is_vaccine_site === 1 || updateData.is_vaccine_site === true || updateData.is_vaccine_site === '1';
    if (!isHp && !isVaccine) {
      updateData.route = null;
      updateData.route2 = null;
      updateData.period = null;
    }

    await facility.update(updateData);
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

// Clear route and period for non-HP, non-vaccine facilities
const clearNonHpRoutesPeriods = async (req, res) => {
  try {
    const [affectedRows] = await db.sequelize.query(
      `UPDATE facility SET route = NULL, route2 = NULL, period = NULL
       WHERE (is_hp_site = 0 OR is_hp_site IS NULL)
         AND (is_vaccine_site = 0 OR is_vaccine_site IS NULL)
         AND (route IS NOT NULL OR route2 IS NOT NULL OR period IS NOT NULL)`
    );
    res.json({ message: 'Cleared successfully', affected: affectedRows });
  } catch (error) {
    console.error('Error clearing non-HP routes/periods:', error);
    res.status(500).json({ message: 'Failed to clear', error: error.message });
  }
};

module.exports = {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  clearNonHpRoutesPeriods
};