const db = require('../../models');
const Process = db.process;
const Facility = db.facility;
const { Op } = require('sequelize');

const READY_STATUSES = [
  'biller_completed','ewm_completed','tm_notified','tm_confirmed',
  'freight_order_sent_to_ewm','ewm_goods_issued','driver_assigned','dispatched','vehicle_requested'
];

const ETH_MONTHS = ['Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'];

// Get routes with all facilities (regular + vaccine combined) for TM Phase 1
exports.getTMRoutes = async (req, res) => {
  try {
    const { month, year } = req.query;
    const branchCode = req.headers['x-branch-code'] || null;
    const accountType = req.headers['x-account-type'] || null;
    const reportingMonth = `${month} ${year}`;
    const branchFilter = (accountType !== 'Super Admin' && branchCode) ? `AND f.branch_code = '${branchCode}'` : '';

    const monthIndex = ETH_MONTHS.indexOf(month);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';

    const routesQuery = `
      SELECT
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities,
        COUNT(DISTINCT CASE
          WHEN p.vehicle_id IS NULL AND (
            p.status IN (${READY_STATUSES.map(() => '?').join(',')})
            OR EXISTS (
              SELECT 1 FROM odns o JOIN processes op ON op.id = o.process_id
              WHERE op.facility_id = f.id AND op.reporting_month = ?
              AND (o.odn_number LIKE 'RRF not sent%' OR o.odn_number LIKE 'VRF not sent%')
            )
            OR EXISTS (
              SELECT 1 FROM odns o JOIN processes op ON op.id = o.process_id
              WHERE op.facility_id = f.id AND op.reporting_month = ?
              AND o.quality_confirmed = 1
            )
          )
          THEN f.id END) as ready_facilities
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
        AND (f.period = 'Monthly' OR f.period = ?)
        ${branchFilter}
      LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE f.route IS NOT NULL
      GROUP BY r.id, r.route_name
      HAVING total_facilities > 0 AND ready_facilities > 0
      ORDER BY (total_facilities = ready_facilities) DESC, r.route_name
    `;

    const params = [...READY_STATUSES, reportingMonth, reportingMonth, currentPeriod, reportingMonth];

    const routes = await db.sequelize.query(routesQuery, {
      replacements: params,
      type: db.sequelize.QueryTypes.SELECT
    });

    const routesWithFacilities = await Promise.all(routes.map(async (route) => {
      const facilitiesQuery = `
        SELECT
          f.id, f.facility_name,
          COALESCE(p_reg.status, p_vac.status, 'no_process') as process_status,
          CASE WHEN p_vac.id IS NOT NULL AND p_reg.id IS NULL THEN 'vaccine'
               WHEN p_reg.id IS NOT NULL THEN 'regular'
               ELSE NULL END as process_type,
          CASE WHEN EXISTS (
            SELECT 1 FROM odns o JOIN processes op ON op.id = o.process_id
            WHERE op.facility_id = f.id AND op.reporting_month = ?
            AND (o.odn_number LIKE 'RRF not sent%' OR o.odn_number LIKE 'VRF not sent%')
          ) THEN 1 ELSE 0 END as rrf_not_sent,
          CASE WHEN EXISTS (
            SELECT 1 FROM odns o JOIN processes op ON op.id = o.process_id
            WHERE op.facility_id = f.id AND op.reporting_month = ?
            AND o.quality_confirmed = 1
          ) THEN 1 ELSE 0 END as quality_confirmed
        FROM facilities f
        LEFT JOIN processes p_reg ON p_reg.facility_id = f.id AND p_reg.reporting_month = ? AND p_reg.process_type = 'regular'
        LEFT JOIN processes p_vac ON p_vac.facility_id = f.id AND p_vac.reporting_month = ? AND p_vac.process_type = 'vaccine'
        WHERE f.route = ? AND (f.period = 'Monthly' OR f.period = ?)
        ${branchFilter}
        ORDER BY f.facility_name
      `;
      const facilities = await db.sequelize.query(facilitiesQuery, {
        replacements: [reportingMonth, reportingMonth, reportingMonth, reportingMonth, route.route_name, currentPeriod],
        type: db.sequelize.QueryTypes.SELECT
      });

      return { ...route, facilities };
    }));

    res.json({ success: true, routes: routesWithFacilities });
  } catch (error) {
    console.error('getTMRoutes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get routes for Phase 2 (vehicle assigned, need driver) — all process types
exports.getTMPhase2Routes = async (req, res) => {
  try {
    const { month, year } = req.query;
    const branchCode = req.headers['x-branch-code'] || null;
    const accountType = req.headers['x-account-type'] || null;
    const reportingMonth = `${month} ${year}`;
    const branchFilter = (accountType !== 'Super Admin' && branchCode) ? `AND f.branch_code = '${branchCode}'` : '';

    const monthIndex = ETH_MONTHS.indexOf(month);
    const isEvenMonth = (monthIndex + 1) % 2 === 0;
    const currentPeriod = isEvenMonth ? 'Even' : 'Odd';

    const routesQuery = `
      SELECT
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities,
        COUNT(DISTINCT CASE
          WHEN p_rep.status = 'biller_completed' AND p_rep.vehicle_id IS NOT NULL
          THEN f.id END) as ready_facilities,
        MAX(p_rep.vehicle_name) as vehicle_name,
        MAX(p_rep.vehicle_id) as vehicle_id
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
        AND (f.period = 'Monthly' OR f.period = ?)
        ${branchFilter}
      LEFT JOIN processes p_rep ON p_rep.facility_id = f.id
        AND p_rep.reporting_month = ?
      WHERE f.route IS NOT NULL
      GROUP BY r.id, r.route_name
      HAVING ready_facilities > 0
      ORDER BY r.route_name
    `;

    const routes = await db.sequelize.query(routesQuery, {
      replacements: [currentPeriod, reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    const routesWithFacilities = await Promise.all(routes.map(async (route) => {
      const facilitiesQuery = `
        SELECT f.id, f.facility_name,
          COALESCE(p_reg.status, p_vac.status, 'no_process') as process_status,
          CASE WHEN p_vac.id IS NOT NULL AND p_reg.id IS NULL THEN 'vaccine'
               WHEN p_reg.id IS NOT NULL THEN 'regular'
               ELSE NULL END as process_type,
          COALESCE(p_reg.vehicle_id, p_vac.vehicle_id) as vehicle_id,
          COALESCE(p_reg.vehicle_name, p_vac.vehicle_name) as vehicle_name
        FROM facilities f
        LEFT JOIN processes p_reg ON p_reg.facility_id = f.id AND p_reg.reporting_month = ? AND p_reg.process_type = 'regular'
        LEFT JOIN processes p_vac ON p_vac.facility_id = f.id AND p_vac.reporting_month = ? AND p_vac.process_type = 'vaccine'
        WHERE f.route = ? AND (f.period = 'Monthly' OR f.period = ?)
          AND COALESCE(p_reg.status, p_vac.status) = 'biller_completed'
          AND COALESCE(p_reg.vehicle_id, p_vac.vehicle_id) IS NOT NULL
        ${branchFilter}
        ORDER BY f.facility_name
      `;
      const facilities = await db.sequelize.query(facilitiesQuery, {
        replacements: [reportingMonth, reportingMonth, route.route_name, currentPeriod],
        type: db.sequelize.QueryTypes.SELECT
      });

      return { ...route, facilities };
    }));

    res.json({ success: true, routes: routesWithFacilities });
  } catch (error) {
    console.error('getTMPhase2Routes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// TM Phase 1: Assign vehicles to processes in a route — supports multiple vehicles per route
exports.createFreightOrder = async (req, res) => {
  try {
    const { route_name, reporting_month, vehicle_assignments, tm_officer_id, tm_officer_name } = req.body;

    // vehicle_assignments: [{ vehicle_id, vehicle_name, facility_ids[] }]
    for (const assignment of vehicle_assignments) {
      const { vehicle_id, vehicle_name, facility_ids } = assignment;
      if (!facility_ids || facility_ids.length === 0) continue;

      await Process.update(
        { vehicle_id, vehicle_name, tm_confirmed_at: new Date(), tm_officer_id, tm_officer_name, status: 'freight_order_sent_to_ewm' },
        { where: { facility_id: { [Op.in]: facility_ids }, reporting_month, status: { [Op.in]: READY_STATUSES } } }
      );

      try {
        const procs = await Process.findAll({ where: { facility_id: { [Op.in]: facility_ids }, reporting_month, status: 'freight_order_sent_to_ewm', vehicle_id } });
        for (const p of procs) {
          await db.sequelize.query(
            `INSERT INTO service_time_hp (process_id, service_unit, end_time, officer_id, officer_name, status, notes) VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
            { replacements: [p.id, 'TM - Vehicle Assignment', tm_officer_id, tm_officer_name || 'TM Manager', 'completed', `Vehicle: ${vehicle_name}`], type: db.sequelize.QueryTypes.INSERT }
          );
        }
      } catch (e) { console.error('Service time error:', e); }
    }

    res.json({ success: true, message: 'Vehicles assigned to route processes' });
  } catch (error) {
    console.error('createFreightOrder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// TM Phase 2: Assign driver/deliverer per vehicle for a route — supports multiple vehicles
exports.assignVehicle = async (req, res) => {
  try {
    const { route_name, reporting_month, driver_assignments, tm_officer_id, tm_officer_name } = req.body;

    // driver_assignments: [{ vehicle_id, driver_id, driver_name, deliverer_id, deliverer_name, departure_kilometer, facility_ids[] }]
    for (const assignment of driver_assignments) {
      const { vehicle_id, driver_id, driver_name, deliverer_id, deliverer_name, departure_kilometer, facility_ids } = assignment;

      // If facility_ids provided, scope to those; otherwise scope to all facilities with this vehicle in the route
      let whereClause = { reporting_month, status: 'biller_completed', vehicle_id };
      if (facility_ids && facility_ids.length > 0) {
        whereClause.facility_id = { [Op.in]: facility_ids };
      } else {
        const facilitiesInRoute = await Facility.findAll({ where: { route: route_name }, attributes: ['id'] });
        whereClause.facility_id = { [Op.in]: facilitiesInRoute.map(f => f.id) };
      }

      await Process.update(
        { driver_id, driver_name, deliverer_id: deliverer_id || null, deliverer_name: deliverer_name || null,
          departure_kilometer: departure_kilometer ? parseFloat(departure_kilometer) : null,
          driver_assigned_at: new Date(), status: 'driver_assigned' },
        { where: whereClause }
      );

      try {
        const procs = await Process.findAll({ where: { ...whereClause, status: 'driver_assigned' } });
        for (const p of procs) {
          await db.sequelize.query(
            `INSERT INTO service_time_hp (process_id, service_unit, end_time, officer_id, officer_name, status, notes) VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
            { replacements: [p.id, 'TM - Driver & Deliverer Assignment', tm_officer_id, tm_officer_name || 'TM Manager', 'completed', `Driver: ${driver_name}`], type: db.sequelize.QueryTypes.INSERT }
          );
        }
      } catch (e) { console.error('Service time error:', e); }
    }

    res.json({ success: true, message: 'Drivers assigned to route vehicles' });
  } catch (error) {
    console.error('assignVehicle error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy stubs
exports.getTMProcesses = async (req, res) => res.json({ success: true, processes: [] });
exports.notifyTM = async (req, res) => res.json({ success: true });
exports.sendToEWM = async (req, res) => res.json({ success: true });
exports.getVehicleAssignmentProcesses = async (req, res) => res.json({ success: true, processes: [] });
