const db = require('../src/models');

async function testTahsasQuery() {
  try {
    console.log('🔍 Testing Tahsas 2018 query...\n');

    const month = 'Tahsas';
    const year = '2018';
    const reportingMonth = `${month} ${year}`;

    // Test the exact query used in the API
    const query = `
      SELECT DISTINCT 
        o.id as odn_id,
        o.odn_number,
        o.status as odn_status,
        COALESCE(o.pod_confirmed, 0) as pod_confirmed,
        o.pod_reason,
        o.pod_number,
        o.pod_confirmed_by,
        o.pod_confirmed_at,
        o.created_at,
        COALESCE(f.facility_name, 'Unknown Facility') as facility_name,
        COALESCE(f.region_name, 'Unknown Region') as region_name,
        COALESCE(f.zone_name, 'Unknown Zone') as zone_name,
        COALESCE(f.woreda_name, 'Unknown Woreda') as woreda_name,
        COALESCE(r.route_name, 'Unknown Route') as route_name,
        r.id as route_id,
        p.reporting_month,
        COALESCE(ra.status, 'Unknown') as dispatch_status,
        ra.completed_at as dispatch_completed_at,
        ra.arrival_kilometer,
        ra.id as route_assignment_id
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id 
      LEFT JOIN facilities f ON p.facility_id = f.id
      LEFT JOIN routes r ON f.route = r.route_name
      LEFT JOIN route_assignments ra ON ra.route_id = r.id AND ra.ethiopian_month = ?
      WHERE p.reporting_month = ?
        AND p.status = 'vehicle_requested'
      ORDER BY dispatch_completed_at DESC, facility_name, o.odn_number
      LIMIT 10
    `;

    console.log(`Query parameters: month="${month}", reportingMonth="${reportingMonth}"`);
    
    const result = await db.sequelize.query(query, {
      replacements: [month, reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    console.log(`\n✅ Found ${result.length} ODNs for ${reportingMonth}:`);
    
    if (result.length > 0) {
      result.forEach((odn, index) => {
        console.log(`${index + 1}. ODN: ${odn.odn_number}`);
        console.log(`   Facility: ${odn.facility_name}`);
        console.log(`   Location: ${odn.region_name} > ${odn.zone_name} > ${odn.woreda_name}`);
        console.log(`   Route: ${odn.route_name} (ID: ${odn.route_id})`);
        console.log(`   POD Status: ${odn.pod_confirmed ? 'Confirmed' : 'Pending'}`);
        console.log(`   POD Number: ${odn.pod_number || 'Not set'}`);
        console.log(`   Dispatch Status: ${odn.dispatch_status}`);
        console.log(`   Route Assignment ID: ${odn.route_assignment_id || 'None'}`);
        console.log(`   Arrival KM: ${odn.arrival_kilometer || 'Not set'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No ODNs found. Let me check what processes exist...');
      
      const processCheck = await db.sequelize.query(`
        SELECT id, facility_id, status, reporting_month 
        FROM processes 
        WHERE reporting_month = ?
      `, {
        replacements: [reportingMonth],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log(`\nProcesses for ${reportingMonth}:`);
      processCheck.forEach(proc => {
        console.log(`- Process ID: ${proc.id}, Facility ID: ${proc.facility_id}, Status: ${proc.status}`);
      });
      
      // Check ODNs for these processes
      if (processCheck.length > 0) {
        const processIds = processCheck.map(p => p.id);
        const odnCheck = await db.sequelize.query(`
          SELECT process_id, odn_number, status 
          FROM odns 
          WHERE process_id IN (${processIds.join(',')})
        `, {
          type: db.sequelize.QueryTypes.SELECT
        });
        
        console.log(`\nODNs for these processes:`);
        odnCheck.forEach(odn => {
          console.log(`- ODN: ${odn.odn_number}, Process ID: ${odn.process_id}, Status: ${odn.status}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error testing query:', error);
  } finally {
    await db.sequelize.close();
  }
}

testTahsasQuery();