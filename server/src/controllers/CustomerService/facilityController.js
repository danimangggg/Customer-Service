const db = require('../../models');
const Facility = db.facility;

// Get all facilities
const getFacilities = async (req, res) => {
  try {
    const accountType = req.headers['x-account-type'] || null;
    const queryBranch = req.query.branch_code || null;
    const headerBranch = req.headers['x-branch-code'] || null;
    const branchCode = queryBranch || (accountType !== 'Super Admin' ? headerBranch : null);

    const where = {};
    if (branchCode) {
      where.branch_code = branchCode;
    }

    const facilities = await Facility.findAll({
      where,
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

// Bulk import facilities from Excel
const bulkImportFacilities = async (req, res) => {
  const rows = req.body; // array of facility objects
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: 'No data provided' });
  }

  const results = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.facility_name) {
      results.errors.push({ row: i + 1, message: 'facility_name is required' });
      continue;
    }
    try {
      const existing = await Facility.findOne({ where: { facility_name: row.facility_name } });
      if (existing) {
        await existing.update({
          facility_type: row.facility_type || existing.facility_type,
          region_name: row.region_name || existing.region_name,
          zone_name: row.zone_name || existing.zone_name,
          woreda_name: row.woreda_name || existing.woreda_name,
          route: row.route || existing.route,
          route2: row.route2 || existing.route2,
          period: row.period || existing.period,
          is_hp_site: row.is_hp_site !== undefined ? row.is_hp_site : existing.is_hp_site,
          is_vaccine_site: row.is_vaccine_site !== undefined ? row.is_vaccine_site : existing.is_vaccine_site,
        });
        results.updated++;
      } else {
        await Facility.create({
          facility_name: row.facility_name,
          facility_type: row.facility_type || null,
          region_name: row.region_name || null,
          zone_name: row.zone_name || null,
          woreda_name: row.woreda_name || null,
          route: row.route || null,
          route2: row.route2 || null,
          period: row.period || null,
          is_hp_site: row.is_hp_site ? 1 : 0,
          is_vaccine_site: row.is_vaccine_site ? 1 : 0,
        });
        results.created++;
      }
    } catch (err) {
      results.errors.push({ row: i + 1, facility_name: row.facility_name, message: err.message });
    }
  }

  res.json(results);
};

module.exports = {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  clearNonHpRoutesPeriods,
  bulkImportFacilities
};