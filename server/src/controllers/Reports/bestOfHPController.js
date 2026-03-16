const db = require('../../models');

const getBestOfHP = async (req, res) => {
  try {
    let startDate, endDate;

    if (req.query.startDate && req.query.endDate) {
      startDate = req.query.startDate;
      endDate   = req.query.endDate;
    } else {
      // Default: last week
      const today = new Date();
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - diff - 7);
      lastMonday.setHours(0, 0, 0, 0);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);
      startDate = lastMonday.toISOString().split('T')[0];
      endDate   = lastSunday.toISOString().split('T')[0];
    }

    console.log('HP Best Of date range:', { startDate, endDate });

    // Query for a single service_unit
    const querySingle = (serviceUnit) => db.sequelize.query(`
      SELECT
        officer_name as full_name,
        COUNT(DISTINCT process_id) as process_count
      FROM service_time_hp
      WHERE service_unit = :serviceUnit
        AND DATE(end_time) >= :startDate
        AND DATE(end_time) <= :endDate
        AND officer_name IS NOT NULL
        AND officer_name != ''
        AND officer_name != 'Unknown Officer'
      GROUP BY officer_name
      ORDER BY process_count DESC
      LIMIT 1
    `, { replacements: { serviceUnit, startDate, endDate }, type: db.sequelize.QueryTypes.SELECT });

    // Query across multiple service_units (e.g. TM has two phases)
    const queryMultiple = (serviceUnits) => db.sequelize.query(`
      SELECT
        officer_name as full_name,
        COUNT(DISTINCT process_id) as process_count
      FROM service_time_hp
      WHERE service_unit IN (:serviceUnits)
        AND DATE(end_time) >= :startDate
        AND DATE(end_time) <= :endDate
        AND officer_name IS NOT NULL
        AND officer_name != ''
        AND officer_name != 'Unknown Officer'
      GROUP BY officer_name
      ORDER BY process_count DESC
      LIMIT 1
    `, { replacements: { serviceUnits, startDate, endDate }, type: db.sequelize.QueryTypes.SELECT });

    // Use the EXACT service_unit strings stored by each server controller
    const [o2cRes, ewmRes, billerRes, tmRes, piRes, dispatchRes, docRes, qualityRes] = await Promise.all([
      querySingle('O2C Officer - HP'),
      querySingle('EWM Officer - HP'),
      querySingle('Biller - Goods Received'),                                          // billerController.js
      queryMultiple(['TM - Vehicle Assignment', 'TM - Driver & Deliverer Assignment']), // tmController.js
      querySingle('PI Officer - Vehicle Requested'),                                   // piVehicleRequestController.js
      querySingle('Dispatcher - HP'),                                                  // dispatchController.js
      querySingle('Documentation - POD Confirmed'),                                    // documentationController.js
      querySingle('Quality Evaluator - Confirmed'),                                    // qualityEvaluationController.js
    ]);

    res.json({
      success: true,
      data: {
        dateRange: { start: startDate, end: endDate },
        employees: {
          o2c:           o2cRes.length      > 0 ? o2cRes[0]      : null,
          ewm:           ewmRes.length      > 0 ? ewmRes[0]      : null,
          biller:        billerRes.length   > 0 ? billerRes[0]   : null,
          tm:            tmRes.length       > 0 ? tmRes[0]       : null,
          pi:            piRes.length       > 0 ? piRes[0]       : null,
          dispatcher:    dispatchRes.length > 0 ? dispatchRes[0] : null,
          documentation: docRes.length      > 0 ? docRes[0]      : null,
          quality:       qualityRes.length  > 0 ? qualityRes[0]  : null,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching HP best of:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch HP best of', details: error.message });
  }
};

module.exports = { getBestOfHP };
