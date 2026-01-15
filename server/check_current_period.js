const db = require('./src/models');

// Ethiopian calendar function
const getCurrentEthiopianMonth = () => {
  const ethiopianMonths = [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagume'
  ];
  
  const gDate = new Date();
  const gy = gDate.getFullYear();
  const gm = gDate.getMonth();
  const gd = gDate.getDate();
  
  const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
  const newYearDay = isLeap ? 12 : 11;
  
  let ethYear, ethMonthIndex;
  
  if (gm > 8 || (gm === 8 && gd >= newYearDay)) {
    ethYear = gy - 7;
    const newYearDate = new Date(gy, 8, newYearDay);
    const diffDays = Math.floor((gDate - newYearDate) / (24 * 60 * 60 * 1000));
    
    if (diffDays < 360) {
      ethMonthIndex = Math.floor(diffDays / 30);
    } else {
      ethMonthIndex = 12;
    }
  } else {
    ethYear = gy - 8;
    const prevIsLeap = ((gy - 1) % 4 === 0 && (gy - 1) % 100 !== 0) || ((gy - 1) % 400 === 0);
    const prevNewYearDay = prevIsLeap ? 12 : 11;
    const prevNewYearDate = new Date(gy - 1, 8, prevNewYearDay);
    const diffDays = Math.floor((gDate - prevNewYearDate) / (24 * 60 * 60 * 1000));
    
    if (diffDays < 360) {
      ethMonthIndex = Math.floor(diffDays / 30);
    } else {
      ethMonthIndex = 12;
    }
  }
  
  ethMonthIndex = Math.max(0, Math.min(ethMonthIndex, 12));
  
  return {
    month: ethiopianMonths[ethMonthIndex],
    year: ethYear
  };
};

async function checkCurrentPeriod() {
  try {
    const current = getCurrentEthiopianMonth();
    const reportingMonth = `${current.month} ${current.year}`;
    
    console.log('=== CURRENT ETHIOPIAN DATE ===');
    console.log('Month:', current.month);
    console.log('Year:', current.year);
    console.log('Reporting Month:', reportingMonth);
    
    // Check Abuye for current period
    console.log('\n=== ABUYE HEALTH CENTER FOR CURRENT PERIOD ===');
    const abuye = await db.sequelize.query(
      `SELECT f.id, f.facility_name, f.route, p.status, p.reporting_month
       FROM facilities f
       LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
       WHERE f.facility_name LIKE '%Abuye%'`,
      { 
        replacements: [reportingMonth],
        type: db.sequelize.QueryTypes.SELECT 
      }
    );
    
    console.log(JSON.stringify(abuye, null, 2));
    
    // Check route AD-R-9 for current period
    console.log('\n=== ROUTE AD-R-9 FOR CURRENT PERIOD ===');
    const routeFacilities = await db.sequelize.query(
      `SELECT f.id, f.facility_name, p.status, p.reporting_month
       FROM facilities f
       LEFT JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
       WHERE f.route = 'AD-R-9'
       ORDER BY f.facility_name`,
      { 
        replacements: [reportingMonth],
        type: db.sequelize.QueryTypes.SELECT 
      }
    );
    
    console.log(JSON.stringify(routeFacilities, null, 2));
    
    // Run the PI query for current period
    console.log('\n=== PI QUERY FOR CURRENT PERIOD ===');
    const query = `
      SELECT 
        r.id as route_id,
        r.route_name,
        COUNT(DISTINCT f.id) as total_facilities_in_route,
        COUNT(DISTINCT CASE WHEN p.status = 'ewm_completed' THEN f.id END) as ewm_completed_facilities,
        COUNT(DISTINCT CASE WHEN p.status = 'vehicle_requested' THEN f.id END) as vehicle_requested_facilities
      FROM routes r
      INNER JOIN facilities f ON f.route = r.route_name
      INNER JOIN processes p ON p.facility_id = f.id AND p.reporting_month = ?
      WHERE f.route IS NOT NULL 
        AND f.period IS NOT NULL
        AND r.route_name = 'AD-R-9'
      GROUP BY r.id, r.route_name
    `;
    
    const result = await db.sequelize.query(query, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });
    
    if (result.length > 0) {
      console.log('Route AD-R-9 APPEARS in PI query:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('Route AD-R-9 does NOT appear in PI query (correct if no processes or not all ewm_completed)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

checkCurrentPeriod();
