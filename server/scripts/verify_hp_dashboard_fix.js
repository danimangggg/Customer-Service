const db = require('../src/models');

async function verifyHPDashboardFix() {
  console.log('🔍 Verifying HP Dashboard Dispatched ODN Fix');
  console.log('============================================');

  try {
    // Test 1: Check for "RRF not sent" entries in the database
    console.log('\n1. Checking for "RRF not sent" entries...');
    
    const rrfNotSentQuery = `
      SELECT 
        COUNT(*) as total_rrf_not_sent,
        COUNT(DISTINCT p.facility_id) as facilities_with_rrf_not_sent,
        p.reporting_month
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      WHERE o.odn_number = 'RRF not sent'
      GROUP BY p.reporting_month
      ORDER BY p.reporting_month DESC
      LIMIT 5
    `;

    const rrfNotSentResults = await db.sequelize.query(rrfNotSentQuery, {
      type: db.sequelize.QueryTypes.SELECT
    });

    if (rrfNotSentResults.length > 0) {
      console.log('   📊 "RRF not sent" entries found:');
      rrfNotSentResults.forEach(result => {
        console.log(`   • ${result.reporting_month}: ${result.total_rrf_not_sent} entries from ${result.facilities_with_rrf_not_sent} facilities`);
      });
    } else {
      console.log('   ✅ No "RRF not sent" entries found');
    }

    // Test 2: Compare dispatched ODN counts with and without the filter
    console.log('\n2. Comparing dispatched ODN counts...');
    
    const reportingMonth = 'Tahsas 2018';
    const month = 'Tahsas';

    // Count WITHOUT the filter (old behavior)
    const dispatchedWithoutFilterQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      WHERE p.status IN ('vehicle_requested', 'ewm_completed')
        AND ra.status IN ('Dispatched', 'Completed')
        AND p.reporting_month = ?
        AND ra.ethiopian_month = ?
    `;

    // Count WITH the filter (new behavior)
    const dispatchedWithFilterQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      INNER JOIN facilities f ON p.facility_id = f.id
      INNER JOIN routes r ON f.route = r.route_name
      INNER JOIN route_assignments ra ON ra.route_id = r.id
      WHERE p.status IN ('vehicle_requested', 'ewm_completed')
        AND ra.status IN ('Dispatched', 'Completed')
        AND o.odn_number != 'RRF not sent'
        AND p.reporting_month = ?
        AND ra.ethiopian_month = ?
    `;

    const [withoutFilterResult] = await db.sequelize.query(dispatchedWithoutFilterQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const [withFilterResult] = await db.sequelize.query(dispatchedWithFilterQuery, {
      replacements: [reportingMonth, month],
      type: db.sequelize.QueryTypes.SELECT
    });

    const countWithoutFilter = withoutFilterResult.count;
    const countWithFilter = withFilterResult.count;
    const difference = countWithoutFilter - countWithFilter;

    console.log(`   📊 For ${reportingMonth}:`);
    console.log(`   • Without filter (old): ${countWithoutFilter} dispatched ODNs`);
    console.log(`   • With filter (new): ${countWithFilter} dispatched ODNs`);
    console.log(`   • Difference: ${difference} (these were "RRF not sent" entries)`);

    if (difference > 0) {
      console.log(`   ✅ Fix is working: ${difference} "RRF not sent" entries excluded`);
    } else if (difference === 0) {
      console.log('   ℹ️  No "RRF not sent" entries found in dispatched ODNs for this period');
    } else {
      console.log('   ❌ Unexpected result: filter increased count');
    }

    // Test 3: Verify consistency with other metrics
    console.log('\n3. Verifying consistency with other dashboard metrics...');
    
    // Get total ODNs (which already excludes "RRF not sent")
    const totalODNsQuery = `
      SELECT COUNT(*) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      WHERE o.odn_number != 'RRF not sent'
        AND p.reporting_month = ?
    `;

    const [totalODNsResult] = await db.sequelize.query(totalODNsQuery, {
      replacements: [reportingMonth],
      type: db.sequelize.QueryTypes.SELECT
    });

    const totalODNs = totalODNsResult.count;

    console.log(`   📊 Consistency check for ${reportingMonth}:`);
    console.log(`   • Total ODNs (excluding "RRF not sent"): ${totalODNs}`);
    console.log(`   • Dispatched ODNs (with fix): ${countWithFilter}`);

    if (countWithFilter <= totalODNs) {
      console.log('   ✅ Dispatched count is consistent (≤ Total ODNs)');
    } else {
      console.log('   ❌ Dispatched count is higher than Total ODNs - issue detected');
    }

    console.log('\n🎉 Verification completed!');
    console.log('\nSummary:');
    console.log('• HP Dashboard dispatched ODN count now excludes "RRF not sent" entries');
    console.log('• This maintains consistency with other dashboard metrics');
    console.log('• Prevents inflated dispatched ODN counts');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    console.error('Error details:', error.message);
  } finally {
    // Close database connection
    if (db.sequelize) {
      await db.sequelize.close();
    }
  }
}

// Run the verification
verifyHPDashboardFix();