const db = require('../../models');
const { Op } = require('sequelize');
const RouteAssignment = db.routeAssignment;
const Route = db.route;
const Vehicle = db.vehicle;
const Employee = db.employee;

// Get all routes
const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.findAll({
      attributes: ['id', 'route_name'],
      order: [['route_name', 'ASC']]
    });

    console.log('Routes found:', routes.length);
    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
};

// Get all available drivers
const getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await Employee.findAll({
      where: { 
        jobTitle: 'Driver',
        account_status: 'Active'
      },
      attributes: ['id', 'full_name', 'user_name'],
      order: [['full_name', 'ASC']]
    });

    console.log('Drivers found:', drivers.length);
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

// Get all available deliverers
const getAvailableDeliverers = async (req, res) => {
  try {
    const deliverers = await Employee.findAll({
      where: { 
        jobTitle: 'Deliverer',
        account_status: 'Active'
      },
      attributes: ['id', 'full_name', 'user_name'],
      order: [['full_name', 'ASC']]
    });

    console.log('Deliverers found:', deliverers.length);
    res.json(deliverers);
  } catch (error) {
    console.error('Error fetching deliverers:', error);
    res.status(500).json({ error: 'Failed to fetch deliverers' });
  }
};

// Get all available vehicles
const getAvailableVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { 
        status: 'Active'
      },
      attributes: ['id', 'vehicle_name', 'plate_number', 'vehicle_type', 'description'],
      order: [['vehicle_name', 'ASC']]
    });

    console.log('Vehicles found:', vehicles.length);
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// Create route assignment
const createRouteAssignment = async (req, res) => {
  try {
    const {
      route_id,
      vehicle_id,
      driver_id,
      deliverer_id,
      scheduled_date,
      priority,
      notes
    } = req.body;

    // Get assigned_by from user session/token (for now using a placeholder)
    const assigned_by = req.user?.id || 1; // You should get this from authentication

    // Validation
    if (!route_id || !vehicle_id || !driver_id) {
      return res.status(400).json({ 
        error: 'Route, vehicle, and driver are required' 
      });
    }

    // Check if route exists
    const route = await Route.findByPk(route_id);
    if (!route) {
      return res.status(400).json({ error: 'Selected route is not available' });
    }

    // Check if vehicle is available
    const vehicle = await Vehicle.findByPk(vehicle_id);
    if (!vehicle || vehicle.status !== 'Active') {
      return res.status(400).json({ error: 'Selected vehicle is not available' });
    }

    // Check if driver is available
    const driver = await Employee.findByPk(driver_id);
    if (!driver || driver.jobTitle !== 'Driver' || driver.account_status !== 'Active') {
      return res.status(400).json({ error: 'Selected driver is not available' });
    }

    // Check if deliverer is available (if provided)
    if (deliverer_id) {
      const deliverer = await Employee.findByPk(deliverer_id);
      if (!deliverer || deliverer.jobTitle !== 'Deliverer' || deliverer.account_status !== 'Active') {
        return res.status(400).json({ error: 'Selected deliverer is not available' });
      }
    }

    const routeAssignment = await RouteAssignment.create({
      route_id,
      vehicle_id,
      driver_id,
      deliverer_id: deliverer_id || null,
      assigned_by,
      scheduled_date: scheduled_date || null,
      priority: priority || 'Medium',
      notes: notes?.trim() || null
    });

    // Fetch the created assignment with associations
    const createdAssignment = await RouteAssignment.findByPk(routeAssignment.id, {
      include: [
        {
          model: Route,
          as: 'route',
          attributes: ['id', 'route_name']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'vehicle_name', 'plate_number', 'vehicle_type']
        },
        {
          model: Employee,
          as: 'driver',
          attributes: ['id', 'full_name']
        },
        {
          model: Employee,
          as: 'deliverer',
          attributes: ['id', 'full_name']
        },
        {
          model: Employee,
          as: 'assignedBy',
          attributes: ['id', 'full_name']
        }
      ]
    });

    res.status(201).json({
      message: 'Route assignment created successfully',
      assignment: createdAssignment
    });
  } catch (error) {
    console.error('Error creating route assignment:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to create route assignment' });
  }
};

// Get all route assignments with pagination and filtering
const getRouteAssignments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      driver_id = '', 
      vehicle_id = '',
      priority = '',
      search = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = {};
    
    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { '$route.route_name$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by driver
    if (driver_id) {
      whereClause.driver_id = driver_id;
    }

    // Filter by vehicle
    if (vehicle_id) {
      whereClause.vehicle_id = vehicle_id;
    }

    // Filter by priority
    if (priority) {
      whereClause.priority = priority;
    }

    const { count, rows } = await RouteAssignment.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Route,
          as: 'route',
          attributes: ['id', 'route_name', 'start_location', 'end_location']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'vehicle_name', 'plate_number', 'vehicle_type']
        },
        {
          model: Employee,
          as: 'driver',
          attributes: ['id', 'full_name', 'phone']
        },
        {
          model: Employee,
          as: 'deliverer',
          attributes: ['id', 'full_name', 'phone']
        },
        {
          model: Employee,
          as: 'assignedBy',
          attributes: ['id', 'full_name']
        }
      ]
    });

    res.json({
      assignments: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching route assignments:', error);
    res.status(500).json({ error: 'Failed to fetch route assignments' });
  }
};

// Update route assignment status
const updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, actual_start_time, actual_end_time, actual_distance_km, fuel_consumed_liters } = req.body;

    const assignment = await RouteAssignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Route assignment not found' });
    }

    const updateData = { status };
    
    if (notes !== undefined) updateData.notes = notes;
    if (actual_start_time) updateData.actual_start_time = actual_start_time;
    if (actual_end_time) updateData.actual_end_time = actual_end_time;
    if (actual_distance_km) updateData.actual_distance_km = actual_distance_km;
    if (fuel_consumed_liters) updateData.fuel_consumed_liters = fuel_consumed_liters;

    await assignment.update(updateData);

    const updatedAssignment = await RouteAssignment.findByPk(id, {
      include: [
        {
          model: Route,
          as: 'route',
          attributes: ['id', 'route_name']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'vehicle_name', 'plate_number', 'vehicle_type']
        },
        {
          model: Employee,
          as: 'driver',
          attributes: ['id', 'full_name']
        },
        {
          model: Employee,
          as: 'deliverer',
          attributes: ['id', 'full_name']
        },
        {
          model: Employee,
          as: 'assignedBy',
          attributes: ['id', 'full_name']
        }
      ]
    });

    res.json({
      message: 'Route assignment updated successfully',
      assignment: updatedAssignment
    });
  } catch (error) {
    console.error('Error updating route assignment:', error);
    res.status(500).json({ error: 'Failed to update route assignment' });
  }
};

// Get route assignment statistics
const getAssignmentStats = async (req, res) => {
  try {
    const totalAssignments = await RouteAssignment.count();
    const assignedCount = await RouteAssignment.count({ where: { status: 'Assigned' } });
    const inProgressCount = await RouteAssignment.count({ where: { status: 'In Progress' } });
    const completedCount = await RouteAssignment.count({ where: { status: 'Completed' } });
    const cancelledCount = await RouteAssignment.count({ where: { status: 'Cancelled' } });

    const assignmentsByPriority = await RouteAssignment.findAll({
      attributes: [
        'priority',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    const assignmentsByVehicle = await RouteAssignment.findAll({
      attributes: [
        'vehicle_id',
        [db.sequelize.fn('COUNT', db.sequelize.col('RouteAssignment.id')), 'count']
      ],
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['vehicle_name', 'plate_number']
        }
      ],
      group: ['vehicle_id', 'vehicle.id'],
      raw: false
    });

    res.json({
      totalAssignments,
      assignedCount,
      inProgressCount,
      completedCount,
      cancelledCount,
      assignmentsByPriority,
      assignmentsByVehicle
    });
  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    res.status(500).json({ error: 'Failed to fetch assignment statistics' });
  }
};

module.exports = {
  getAllRoutes,
  getAvailableDrivers,
  getAvailableDeliverers,
  getAvailableVehicles,
  createRouteAssignment,
  getRouteAssignments,
  updateAssignmentStatus,
  getAssignmentStats
};