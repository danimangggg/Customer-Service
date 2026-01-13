const db = require('../src/models');

async function checkQualityEvaluationData() {
  try {
    console.log('🔍 Checking quality evaluation data...\n');
    
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check current Ethiopian date
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
        year: ethYear,
        monthIndex: ethMonthIndex
      };
    };

    const currentEthiopian = getCurrentEthiopianMonth();
    console.log('Current Ethiopian Date:', currentEthiopian);
    
    // Check all ODNs and their status
    const allODNsQuery = `
      SELECT 
        o.id,
        o.odn_number,
        o.status as odn_status,
        o.pod_confirmed,
        o.documents_signed,
        o.documents_handover,
        o.quality_confirmed,
        p.reporting_month,
        f.facility_name,
        f.route
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      ORDER BY p.reporting_month DESC, o.id
    `;
    
    const allODNs = await db.sequelize.query(allODNsQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`\nAll ODNs in database (${allODNs.length}):`);
    allODNs.forEach(odn => {
      console.log(`  ${odn.id}: ${odn.odn_number} - ${odn.facility_name} (${odn.reporting_month})`);
      console.log(`    Route: ${odn.route || 'None'}`);
      console.log(`    POD: ${odn.pod_confirmed ? 'Confirmed' : 'Pending'}, Docs Signed: ${odn.documents_signed ? 'Yes' : 'No'}, Handover: ${odn.documents_handover ? 'Yes' : 'No'}, Quality: ${odn.quality_confirmed ? 'Confirmed' : 'Pending'}`);
      console.log('');
    });
    
    // Check completed dispatches
    const completedDispatchesQuery = `
      SELECT 
        ra.id,
        ra.status,
        ra.ethiopian_month,
        ra.completed_at,
        r.route_name
      FROM route_assignments ra
      INNER JOIN routes r ON ra.route_id = r.id
      WHERE ra.status = 'Completed'
      ORDER BY ra.completed_at DESC
    `;
    
    const completedDispatches = await db.sequelize.query(completedDispatchesQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    console.log(`Completed dispatches (${completedDispatches.length}):`);
    completedDispatches.forEach(dispatch => {
      console.log(`  Route: ${dispatch.route_name}, Month: ${dispatch.ethiopian_month}, Completed: ${dispatch.completed_at}`);
    });
    
    // Check ODNs ready for quality evaluation with different month/year combinations
    const testCombinations = [
      { month: 'Tir', year: '2018' },
      { month: currentEthiopian.month, year: currentEthiopian.year.toString() },
      { month: 'Tir', year: '2017' },
      { month: 'Miyazya', year: '2018' }
    ];
    
    console.log('\nTesting different month/year combinations:');
    for (const combo of testCombinations) {
      const reportingMonth = `${combo.month} ${combo.year}`;
      
      const testQuery = `
        SELECT COUNT(DISTINCT o.id) as count
        FROM odns o
        INNER JOIN processes p ON o.process_id = p.id AND p.reporting_month = ?
        INNER JOIN facilities f ON p.facility_id = f.id
        INNER JOIN routes r ON f.route = r.route_name
        INNER JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
        WHERE ra.status = 'Completed'
          AND p.status = 'vehicle_requested'
          AND o.pod_confirmed = TRUE
          AND o.documents_signed = TRUE
          AND o.documents_handover = TRUE
      `;
      
      const result = await db.sequelize.query(testQuery, {
        replacements: [reportingMonth, combo.month],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log(`  ${combo.month} ${combo.year}: ${result[0].count} ODNs ready for quality evaluation`);
    }
    
    console.log('\n🎉 Quality evaluation data check completed!');
    
  } catch (error) {
    console.error('❌ Error checking quality evaluation data:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

checkQualityEvaluationData()
  .then(() => {
    console.log('\n✅ Data check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Data check failed:', error);
    process.exit(1);
  });