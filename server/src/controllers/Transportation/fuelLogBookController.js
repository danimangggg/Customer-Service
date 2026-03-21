const db = require('../../models');

const getAll = async (req, res) => {
  try {
    const headerBranch = req.headers['x-branch-code'] || null;
    const accountType  = req.headers['x-account-type'] || null;
    const branchCode   = accountType !== 'Super Admin' ? headerBranch : null;
    const branchFilter = branchCode ? `AND f.branch_code = '${branchCode}'` : '';

    const rows = await db.sequelize.query(`
      SELECT f.*
      FROM fuel_log_books f
      WHERE 1=1 ${branchFilter}
      ORDER BY f.fuel_date DESC, f.created_at DESC
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
      vehicle_id, vehicle_name, plate_number, vehicle_km, driver_name,
      fuel_date, amount_liters, daily_rate, gas_station_location, notes
    } = req.body;

    await db.sequelize.query(`
      INSERT INTO fuel_log_books
        (vehicle_id, vehicle_name, plate_number, vehicle_km, driver_name,
         fuel_date, amount_liters, daily_rate, gas_station_location, notes, branch_code)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `, {
      replacements: [
        vehicle_id || null, vehicle_name, plate_number, vehicle_km || null, driver_name,
        fuel_date, amount_liters, daily_rate, gas_station_location, notes || null, headerBranch
      ],
      type: db.sequelize.QueryTypes.INSERT
    });

    res.json({ success: true, message: 'Fuel log saved' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fuel_date, amount_liters, daily_rate, gas_station_location, notes
    } = req.body;

    await db.sequelize.query(`
      UPDATE fuel_log_books SET
        fuel_date=?, amount_liters=?, daily_rate=?, gas_station_location=?, notes=?
      WHERE id=?
    `, {
      replacements: [fuel_date, amount_liters, daily_rate, gas_station_location, notes || null, id],
      type: db.sequelize.QueryTypes.UPDATE
    });

    res.json({ success: true, message: 'Fuel log updated' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

const remove = async (req, res) => {
  try {
    await db.sequelize.query('DELETE FROM fuel_log_books WHERE id=?', {
      replacements: [req.params.id],
      type: db.sequelize.QueryTypes.DELETE
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

module.exports = { getAll, create, update, remove };
