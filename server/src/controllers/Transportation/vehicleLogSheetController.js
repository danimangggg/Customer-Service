const db = require('../../models');

const getAll = async (req, res) => {
  try {
    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const branchCode   = accountType !== 'Super Admin' ? headerBranch : null;
    const branchFilter = branchCode ? `AND vls.branch_code = '${branchCode}'` : '';

    const rows = await db.sequelize.query(`
      SELECT vls.*, (vls.arrival_km - vls.departure_km) as total_km
      FROM vehicle_log_sheets vls
      WHERE 1=1 ${branchFilter}
      ORDER BY vls.created_at DESC
    `, { type: db.sequelize.QueryTypes.SELECT });

    res.json({ success: true, logs: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

const create = async (req, res) => {
  try {
    const headerBranch = req.headers['x-branch-code'] || null;
    const {
      vehicle_id, vehicle_name, plate_number, driver_name, driver_id,
      departure_place, arrival_place, departure_km, arrival_km,
      departure_time, arrival_time, reason_of_travel, notes
    } = req.body;

    await db.sequelize.query(`
      INSERT INTO vehicle_log_sheets
        (vehicle_id, vehicle_name, plate_number, driver_name, driver_id,
         departure_place, arrival_place, departure_km, arrival_km,
         departure_time, arrival_time, reason_of_travel, notes, branch_code)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, {
      replacements: [
        vehicle_id, vehicle_name, plate_number, driver_name, driver_id || null,
        departure_place, arrival_place, departure_km, arrival_km,
        departure_time, arrival_time || null, reason_of_travel, notes || null, headerBranch
      ],
      type: db.sequelize.QueryTypes.INSERT
    });

    res.json({ success: true, message: 'Log sheet saved' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      departure_place, arrival_place, departure_km, arrival_km,
      departure_time, arrival_time, reason_of_travel, notes
    } = req.body;

    await db.sequelize.query(`
      UPDATE vehicle_log_sheets SET
        departure_place=?, arrival_place=?, departure_km=?, arrival_km=?,
        departure_time=?, arrival_time=?, reason_of_travel=?, notes=?
      WHERE id=?
    `, {
      replacements: [departure_place, arrival_place, departure_km, arrival_km,
        departure_time, arrival_time || null, reason_of_travel, notes || null, id],
      type: db.sequelize.QueryTypes.UPDATE
    });

    res.json({ success: true, message: 'Log sheet updated' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

const remove = async (req, res) => {
  try {
    await db.sequelize.query('DELETE FROM vehicle_log_sheets WHERE id=?', {
      replacements: [req.params.id],
      type: db.sequelize.QueryTypes.DELETE
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

module.exports = { getAll, create, update, remove };
