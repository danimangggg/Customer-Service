const db = require('../../models');
const { Op } = require('sequelize');
const Route = db.route;

// Get all routes with pagination and search
const getAllRoutes = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = {};
    
    // Search functionality
    if (search) {
      whereClause.route_name = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Route.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['route_name', 'ASC']]
    });

    res.json({
      routes: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
};

// Get route by ID
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const route = await Route.findByPk(id);
    
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    res.json(route);
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
};

// Create new route
const createRoute = async (req, res) => {
  try {
    const { route_name } = req.body;

    // Validation
    if (!route_name || route_name.trim().length === 0) {
      return res.status(400).json({ error: 'Route name is required' });
    }

    // Check if route name already exists
    const existingRoute = await Route.findOne({
      where: { route_name: route_name.trim() }
    });

    if (existingRoute) {
      return res.status(400).json({ error: 'Route name already exists' });
    }

    const route = await Route.create({
      route_name: route_name.trim()
    });

    res.status(201).json({
      message: 'Route created successfully',
      route
    });
  } catch (error) {
    console.error('Error creating route:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Route name already exists' });
    }
    res.status(500).json({ error: 'Failed to create route' });
  }
};

// Update route
const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { route_name } = req.body;

    // Validation
    if (!route_name || route_name.trim().length === 0) {
      return res.status(400).json({ error: 'Route name is required' });
    }

    const route = await Route.findByPk(id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Check if route name already exists (excluding current route)
    const existingRoute = await Route.findOne({
      where: { 
        route_name: route_name.trim(),
        id: { [Op.ne]: id }
      }
    });

    if (existingRoute) {
      return res.status(400).json({ error: 'Route name already exists' });
    }

    await route.update({
      route_name: route_name.trim()
    });

    res.json({
      message: 'Route updated successfully',
      route
    });
  } catch (error) {
    console.error('Error updating route:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Route name already exists' });
    }
    res.status(500).json({ error: 'Failed to update route' });
  }
};

// Delete route
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await Route.findByPk(id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Check if route is being used in any assignments
    const assignmentCount = await db.routeAssignment.count({
      where: { route_id: id }
    });

    if (assignmentCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete route. It is currently used in ${assignmentCount} assignment(s)` 
      });
    }

    await route.destroy();

    res.json({
      message: 'Route deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
};

// Get route statistics
const getRouteStats = async (req, res) => {
  try {
    const totalRoutes = await Route.count();
    
    const routesWithAssignments = await db.sequelize.query(`
      SELECT r.id, r.route_name, COUNT(ra.id) as assignment_count
      FROM routes r
      LEFT JOIN route_assignments ra ON r.id = ra.route_id
      GROUP BY r.id, r.route_name
      ORDER BY assignment_count DESC
      LIMIT 5
    `, {
      type: db.sequelize.QueryTypes.SELECT
    });

    const recentRoutes = await Route.findAll({
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    res.json({
      totalRoutes,
      routesWithAssignments,
      recentRoutes
    });
  } catch (error) {
    console.error('Error fetching route statistics:', error);
    res.status(500).json({ error: 'Failed to fetch route statistics' });
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteStats
};