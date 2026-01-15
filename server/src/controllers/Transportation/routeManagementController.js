const db = require('../../models');
const { Op } = require('sequelize');
const RouteAssignment = db.routeAssignment;
const Route = db.route;
const Vehicle = db.vehicle;
const Employee = db.employee;

// Get all routes
const getAllRoutes = async (req, res) => {
  try {
    console.log('Fetching all routes...');
    console.log('Route model available:', !!Route);
    console.log('Database connection available:', !!db.sequelize);
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('Database connection successful');
    
    const routes = await Route.findAll({
      attributes: ['id', 'route_name'],
      order: [['route_name', 'ASC']]
    });

    console.log('Routes found:', routes.length);
    console.log('Sample routes:', routes.slice(0, 3).map(r => ({ id: r.id, route_name: r.route_name })));
    
    if (routes.length === 0) {
      console.log('⚠️  No routes found in database. This might be why PI Officer HP is getting "Failed to load route data"');
    }
    
    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a database connection error
    if (error.name === 'ConnectionError' || error.name === 'SequelizeConnectionError') {
      console.error('❌ Database connection failed');
      return res.status(503).json({ 
        error: 'Database connection failed',
        details: 'Please check if the database server is running'
      });
    }
    
    // Check if it's a table not found error
    if (error.message.includes('Table') && error.message.includes("doesn't exist")) {
      console.error('❌ Routes table does not exist');
      return res.status(500).json({ 
        error: 'Routes table not found',
        details: 'Please run database migrations to create the routes table'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch routes',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    console.log('Fetching available vehicles...');
    console.log('Vehicle model available:', !!Vehicle);
    
    const vehicles = await Vehicle.findAll({
      where: { 
        status: 'Active'
      },
      attributes: ['id', 'vehicle_name', 'plate_number', 'vehicle_type', 'description'],
      order: [['vehicle_name', 'ASC']]
    });

    console.log('Available vehicles found:', vehicles.length);
    console.log('Sample vehicles:', vehicles.slice(0, 3).map(v => ({ 
      id: v.id, 
      vehicle_name: v.vehicle_name, 
      plate_number: v.plate_number 
    })));
    
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a table not found error
    if (error.message.includes('Table') && error.message.includes("doesn't exist")) {
      console.error('❌ Vehicles table does not exist');
      return res.status(500).json({ 
        error: 'Vehicles table not found',
        details: 'Please run database migrations to create the vehicles table'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch available vehicles',
      details: error.message
    });
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
      departure_kilometer,
      scheduled_date,
      ethiopian_month,
      priority,
      notes
    } = req.body;

    // Get assigned_by from user session/token (for now using a placeholder)
    const assigned_by = req.user?.id || 1; // You should get this from authentication

    // Function to get current Ethiopian month
    const getCurrentEthiopianMonth = (gDate = new Date()) => {
      const ethiopianMonths = [
        'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
      ];
      
      // Ethiopian New Year starts on September 11 (or 12 in leap years)
      const gy = gDate.getFullYear();
      const gm = gDate.getMonth(); // 0-based (0 = January, 8 = September)
      const gd = gDate.getDate();
      
      // Determine if current Gregorian year is a leap year
      const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
      
      // Ethiopian New Year date for current Gregorian year
      const newYearDay = isLeap ? 12 : 11; // September 12 in leap years, September 11 otherwise
      
      let ethYear, ethMonthIndex;
      
      // Check if we're before or after Ethiopian New Year
      if (gm > 8 || (gm === 8 && gd >= newYearDay)) {
        // After Ethiopian New Year - we're in the new Ethiopian year
        ethYear = gy - 7; // Ethiopian year is 7 years behind after New Year
        
        // Calculate days since Ethiopian New Year
        const newYearDate = new Date(gy, 8, newYearDay); // September 11/12
        const diffDays = Math.floor((gDate - newYearDate) / (24 * 60 * 60 * 1000));
        
        // Each Ethiopian month has 30 days (except Pagume which has 5/6 days)
        if (diffDays < 360) {
          ethMonthIndex = Math.floor(diffDays / 30);
        } else {
          ethMonthIndex = 12; // Pagume (13th month)
        }
      } else {
        // Before Ethiopian New Year - we're still in the previous Ethiopian year
        ethYear = gy - 8; // Ethiopian year is 8 years behind before New Year
        
        // Calculate from previous year's Ethiopian New Year
        const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
        const prevNewYearDay = prevIsLeap ? 12 : 11;
        const prevNewYearDate = new Date(gy - 1, 8, prevNewYearDay);
        const diffDays = Math.floor((gDate - prevNewYearDate) / (24 * 60 * 60 * 1000));
        
        if (diffDays < 360) {
          ethMonthIndex = Math.floor(diffDays / 30);
        } else {
          ethMonthIndex = 12; // Pagume
        }
      }
      
      // Ensure month index is within valid range
      ethMonthIndex = Math.max(0, Math.min(ethMonthIndex, 12));
      
      return ethiopianMonths[ethMonthIndex];
    };

    // Validation
    if (!route_id || !vehicle_id || !driver_id || !ethiopian_month) {
      return res.status(400).json({ 
        error: 'Route, vehicle, driver, and Ethiopian month are required' 
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
      departure_kilometer: departure_kilometer || null,
      assigned_by,
      scheduled_date: scheduled_date || null,
      ethiopian_month: ethiopian_month, // Use the provided month
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

// Update route assignment
const updateRouteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      route_id,
      vehicle_id,
      driver_id,
      deliverer_id,
      ethiopian_month,
      priority,
      notes
    } = req.body;

    // Validation
    if (!route_id || !vehicle_id || !driver_id || !ethiopian_month) {
      return res.status(400).json({ 
        error: 'Route, vehicle, driver, and Ethiopian month are required' 
      });
    }

    const assignment = await RouteAssignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Route assignment not found' });
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

    await assignment.update({
      route_id,
      vehicle_id,
      driver_id,
      deliverer_id: deliverer_id || null,
      ethiopian_month,
      priority: priority || 'Medium',
      notes: notes?.trim() || null
    });

    // Fetch the updated assignment with associations
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
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to update route assignment' });
  }
};

// Delete route assignment
const deleteRouteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await RouteAssignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Route assignment not found' });
    }

    // Check if assignment can be deleted (only if not completed)
    if (assignment.status === 'Completed') {
      return res.status(400).json({ 
        error: 'Cannot delete completed route assignments' 
      });
    }

    await assignment.destroy();

    res.json({
      message: 'Route assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting route assignment:', error);
    res.status(500).json({ error: 'Failed to delete route assignment' });
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

// Get ready routes (routes where all facilities have EWM completed status)
const getReadyRoutes = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    console.log('Ready Routes - Request params:', { month, year, page, limit, search, status });

    // Build the reporting month string
    const reportingMonth = `${month} ${year}`;
    console.log('Looking for reporting month:', reportingMonth);

    // Query to find routes that are ready for transportation assignment (vehicle requested)
    const query = `
      SELECT DISTINCT 
        r.id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as completed_facilities,
        ra.id as assignment_id,
        ra.vehicle_id as assigned_vehicle_id,
        ra.driver_id as assigned_driver_id,
        ra.deliverer_id as assigned_deliverer_id,
        ra.departure_kilometer,
        ra.notes,
        ra.status as assignment_status,
        v.vehicle_name,
        v.plate_number,
        d.full_name as driver_name,
        del.full_name as deliverer_name
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      LEFT JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      LEFT JOIN vehicles v ON ra.vehicle_id = v.id
      LEFT JOIN employees d ON ra.driver_id = d.id
      LEFT JOIN employees del ON ra.deliverer_id = del.id
      WHERE f.route IS NOT NULL 
        AND f.period IS NOT NULL
        AND p.status = 'vehicle_requested'
        ${search ? 'AND f.facility_name LIKE ?' : ''}
        ${status === 'Assigned' ? 'AND ra.status IS NOT NULL' : ''}
        ${status === 'Not Assigned' ? 'AND ra.status IS NULL' : ''}
      GROUP BY r.id, r.route_name, ra.id, ra.vehicle_id, ra.driver_id, ra.deliverer_id, ra.departure_kilometer, ra.notes, ra.status, v.vehicle_name, v.plate_number, d.full_name, del.full_name
      HAVING total_facilities > 0 AND total_facilities = completed_facilities
      ORDER BY r.route_name
      LIMIT ? OFFSET ?
    `;

    let queryParams = [reportingMonth, month];

    if (search) {
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern);
    }

    queryParams.push(parseInt(limit), parseInt(offset));

    console.log('Executing ready routes query with params:', queryParams);

    const routes = await db.sequelize.query(query, {
      replacements: queryParams,
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${routes.length} ready routes`);
    
    // For each route, get the detailed facility information
    const routesWithFacilities = await Promise.all(routes.map(async (route) => {
      const facilitiesQuery = `
        SELECT DISTINCT 
          f.id,
          f.facility_name
        FROM facilities f
        INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
        WHERE f.route = ? AND p.status = 'vehicle_requested'
        ORDER BY f.facility_name
      `;

      const facilities = await db.sequelize.query(facilitiesQuery, {
        replacements: [reportingMonth, route.route_name],
        type: db.sequelize.QueryTypes.SELECT
      });

      return {
        ...route,
        facilities: facilities
      };
    }));
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE f.route IS NOT NULL 
        AND f.period IS NOT NULL
        AND p.status = 'vehicle_requested'
        ${search ? 'AND f.facility_name LIKE ?' : ''}
      GROUP BY r.id
      HAVING COUNT(DISTINCT f.id) = COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END)
    `;

    let countParams = [reportingMonth];
    if (search) {
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern);
    }

    const countResult = await db.sequelize.query(countQuery, {
      replacements: countParams,
      type: db.sequelize.QueryTypes.SELECT
    });
    
    const totalCount = countResult.length;

    console.log(`Returning ${routesWithFacilities.length} routes with details, total count: ${totalCount}`);

    res.json({
      routes: routesWithFacilities,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error('Error fetching ready routes:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch ready routes',
      details: error.message
    });
  }
};

// Get stats for ready routes
const getReadyRoutesStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportingMonth = `${month} ${year}`;

    // Get expected routes (routes with vehicle requested status)
    const expectedQuery = `
      SELECT COUNT(DISTINCT r.id) as count
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE f.route IS NOT NULL AND f.period IS NOT NULL AND p.status = 'vehicle_requested'
      GROUP BY r.id
      HAVING COUNT(DISTINCT f.id) = COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END)
    `;

    // Get assigned routes (routes that have assignments)
    const assignedQuery = `
      SELECT COUNT(DISTINCT ra.route_id) as count
      FROM route_assignments ra
      WHERE ra.ethiopian_month = ?
    `;

    const expectedResult = await db.sequelize.query(expectedQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });
    const assignedResult = await db.sequelize.query(assignedQuery, {
      replacements: [month],
      type: db.sequelize.QueryTypes.SELECT
    });

    res.json({
      expectedCount: expectedResult.length,
      assignedCount: assignedResult[0]?.count || 0
    });

  } catch (error) {
    console.error('Error fetching ready routes stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = {
  getAllRoutes,
  getAvailableDrivers,
  getAvailableDeliverers,
  getAvailableVehicles,
  createRouteAssignment,
  getRouteAssignments,
  updateRouteAssignment,
  deleteRouteAssignment,
  updateAssignmentStatus,
  getAssignmentStats,
  getReadyRoutes,
  getReadyRoutesStats
};