const db = require('../../models');
const Vehicle = db.vehicle;
const { Op } = require('sequelize');

// Get all vehicles
const getAllVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '', type = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { vehicle_name: { [Op.iLike]: `%${search}%` } },
        { plate_number: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by type
    if (type) {
      whereClause.vehicle_type = type;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Vehicle.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      vehicles: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// Get vehicle by ID
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
};

// Create new vehicle
const createVehicle = async (req, res) => {
  try {
    const { vehicle_name, plate_number, vehicle_type, status, description } = req.body;

    // Validation
    if (!vehicle_name || !plate_number) {
      return res.status(400).json({ error: 'Vehicle name and plate number are required' });
    }

    // Check if plate number already exists
    const existingVehicle = await Vehicle.findOne({ where: { plate_number } });
    if (existingVehicle) {
      return res.status(400).json({ error: 'Plate number already exists' });
    }

    const vehicle = await Vehicle.create({
      vehicle_name: vehicle_name.trim(),
      plate_number: plate_number.trim().toUpperCase(),
      vehicle_type: vehicle_type || 'Truck',
      status: status || 'Active',
      description: description?.trim() || null
    });

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Plate number already exists' });
    }
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_name, plate_number, vehicle_type, status, description } = req.body;

    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if plate number already exists (excluding current vehicle)
    if (plate_number && plate_number !== vehicle.plate_number) {
      const existingVehicle = await Vehicle.findOne({ 
        where: { 
          plate_number: plate_number.trim().toUpperCase(),
          id: { [Op.ne]: id }
        } 
      });
      if (existingVehicle) {
        return res.status(400).json({ error: 'Plate number already exists' });
      }
    }

    await vehicle.update({
      vehicle_name: vehicle_name?.trim() || vehicle.vehicle_name,
      plate_number: plate_number?.trim().toUpperCase() || vehicle.plate_number,
      vehicle_type: vehicle_type || vehicle.vehicle_type,
      status: status || vehicle.status,
      description: description?.trim() || vehicle.description
    });

    res.json({
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Plate number already exists' });
    }
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await vehicle.destroy();

    res.json({
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
};

// Get vehicle statistics
const getVehicleStats = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.count();
    const activeVehicles = await Vehicle.count({ where: { status: 'Active' } });
    const inactiveVehicles = await Vehicle.count({ where: { status: 'Inactive' } });
    const maintenanceVehicles = await Vehicle.count({ where: { status: 'Maintenance' } });

    const vehiclesByType = await Vehicle.findAll({
      attributes: [
        'vehicle_type',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['vehicle_type'],
      raw: true
    });

    res.json({
      totalVehicles,
      activeVehicles,
      inactiveVehicles,
      maintenanceVehicles,
      vehiclesByType
    });
  } catch (error) {
    console.error('Error fetching vehicle statistics:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle statistics' });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleStats
};