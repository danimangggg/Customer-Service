const db = require('../src/models');

async function diagnoseDatabaseIssues() {
  try {
    console.log('🔍 Starting database diagnosis for Documentation Management...\n');

    // Test database connection
    console.log('1. Testing database connection...');
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Check if required tables exist
    console.log('2. Checking required tables...');
    const tables = ['odns', 'processes', 'facilities', 'routes', 'route_assignments'];
    
    for (const table of tables) {
      try {
        const result = await db.sequelize.query(`SELECT COUNT(*) as count FROM ${table}`, {
          type: db.sequelize.QueryTypes.SELECT
        });
        console.log(`✅ Table '${table}': ${result[0].count} records`);
      } catch (error) {
        console.log(`❌ Table '${table}': ERROR - ${error.message}`);
      }
    }
    console.log('');

    // Check for sample data in processes table
    console.log('3. Checking processes table structure and sample data...');
    try {
      const processesData = await db.sequelize.query(`
        SELECT reporting_month, status, COUNT(*) as count 
        FROM processes 
        GROUP BY reporting_month, status 
        ORDER BY reporting_month DESC 
        LIMIT 10
      `, {
        type: db.sequelize.QueryTypes.SELECT
      });
      
      if (processesData.length > 0) {
        console.log('✅ Processes data found:');
        processesData.forEach(row => {
          console.log(`   - ${row.reporting_month}: ${row.count} processes (status: ${row.status})`);
        });
      } else {
        console.log('⚠️  No processes data found');
      }
    } catch (error) {
      console.log(`❌ Error checking processes: ${error.message}`);
    }
    console.log('');

    // Check ODNs table
    console.log('4. Checking ODNs table...');
    try {
      const odnData = await db.sequelize.query(`
        SELECT 
          COUNT(*) as total_odns,
          COUNT(CASE WHEN pod_confirmed = 1 THEN 1 END) as confirmed_pods,
          COUNT(CASE WHEN pod_confirmed = 0 OR pod_confirmed IS NULL THEN 1 END) as pending_pods
        FROM odns
      `, {
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log('✅ ODNs summary:');
      console.log(`   - Total ODNs: ${odnData[0].total_odns}`);
      console.log(`   - Confirmed PODs: ${odnData[0].confirmed_pods}`);
      console.log(`   - Pending PODs: ${odnData[0].pending_pods}`);
    } catch (error) {
      console.log(`❌ Error checking ODNs: ${error.message}`);
    }
    console.log('');

    // Test the actual query used in the API
    console.log('5. Testing the API query with sample parameters...');
    const testMonth = 'Meskerem';
    const testYear = '2017';
    const reportingMonth = `${testMonth} ${testYear}`;
    
    try {
      const testQuery = `
        SELECT COUNT(DISTINCT o.id) as total_odns 
        FROM odns o
        INNER JOIN processes p ON o.process_id = p.id
        WHERE p.reporting_month = ?
      `;
      
      const testResult = await db.sequelize.query(testQuery, {
        replacements: [reportingMonth],
        type: db.sequelize.QueryTypes.SELECT
      });
      
      console.log(`✅ Test query for "${reportingMonth}": ${testResult[0].total_odns} ODNs found`);
      
      // If ODNs found, test the full query
      if (testResult[0].total_odns > 0) {
        const fullQuery = `
          SELECT DISTINCT 
            o.id as odn_id,
            o.odn_number,
            COALESCE(o.pod_confirmed, 0) as pod_confirmed,
            COALESCE(f.facility_name, 'Unknown Facility') as facility_name,
            p.reporting_month
          FROM odns o
          INNER JOIN processes p ON o.process_id = p.id 
          LEFT JOIN facilities f ON p.facility_id = f.id
          WHERE p.reporting_month = ?
            AND p.status = 'vehicle_requested'
          LIMIT 5
        `;
        
        const fullResult = await db.sequelize.query(fullQuery, {
          replacements: [reportingMonth],
          type: db.sequelize.QueryTypes.SELECT
        });
        
        console.log('✅ Sample ODNs:');
        fullResult.forEach(odn => {
          console.log(`   - ODN ${odn.odn_number}: ${odn.facility_name} (POD: ${odn.pod_confirmed ? 'Confirmed' : 'Pending'})`);
        });
      }
    } catch (error) {
      console.log(`❌ Error testing API query: ${error.message}`);
    }
    console.log('');

    // Check for recent reporting months
    console.log('6. Available reporting months...');
    try {
      const monthsQuery = `
        SELECT DISTINCT reporting_month, COUNT(*) as process_count
        FROM processes 
        WHERE reporting_month IS NOT NULL
        GROUP BY reporting_month 
        ORDER BY reporting_month DESC 
        LIMIT 10
      `;
      
      const months = await db.sequelize.query(monthsQuery, {
        type: db.sequelize.QueryTypes.SELECT
      });
      
      if (months.length > 0) {
        console.log('✅ Available reporting months:');
        months.forEach(month => {
          console.log(`   - ${month.reporting_month}: ${month.process_count} processes`);
        });
      } else {
        console.log('⚠️  No reporting months found in processes table');
      }
    } catch (error) {
      console.log(`❌ Error checking reporting months: ${error.message}`);
    }

    console.log('\n🎉 Database diagnosis completed!');
    console.log('\n💡 Recommendations:');
    console.log('   1. Make sure you have data in the processes table with valid reporting_month values');
    console.log('   2. Ensure ODNs are linked to processes via process_id');
    console.log('   3. Check that facilities are properly linked to processes');
    console.log('   4. Verify that the Ethiopian month/year format matches your data');

  } catch (error) {
    console.error('❌ Database diagnosis failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the diagnosis
diagnoseDatabaseIssues();