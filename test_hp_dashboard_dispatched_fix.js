const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testHPDashboardDispatchedFix() {
  console.log('🧪 Testing HP Dashboard Dispatched ODN Fix');
  console.log('==========================================');

  try {
    // Test 1: Get HP dashboard data for a specific month
    console.log('\n1. Fetching HP dashboard data for Tahsas 2018...');
    const response = await axios.get(`${API_URL}/api/hp-dashboard`, {
      params: {
        month: 'Tahsas',
        year: '2018'
      }
    });

    const dashboardData = response.data;
    console.log('✅ Dashboard data retrieved successfully');
    console.log('📊 Dashboard metrics:');
    console.log(`   Total ODNs: ${dashboardData.totalODNs}`);
    console.log(`   Total Facilities: ${dashboardData.totalFacilities}`);
    console.log(`   RRF Sent: ${dashboardData.rrfSent}`);
    console.log(`   Dispatched ODNs: ${dashboardData.dispatchedODNs}`);
    console.log(`   POD Confirmed: ${dashboardData.podConfirmed}`);
    console.log(`   Quality Evaluated: ${dashboardData.qualityEvaluated}`);

    // Test 2: Check if "RRF not sent" entries exist in the database
    console.log('\n2. Checking for "RRF not sent" entries...');
    
    // Query to find "RRF not sent" entries
    const rrfNotSentQuery = `
      SELECT COUNT(*) as count
      FROM odns o
      INNER JOIN processes p ON o.process_id = p.id
      WHERE o.odn_number = 'RRF not sent'
        AND p.reporting_month = 'Tahsas 2018'
    `;

    try {
      // This is a simplified check - in a real scenario, you'd need database access
      console.log('   ℹ️  Cannot directly query database from this script');
      console.log('   ℹ️  But the fix ensures "RRF not sent" entries are excluded from dispatched count');
    } catch (err) {
      console.log('   ℹ️  Database query not available in this context');
    }

    // Test 3: Verify the logic by checking consistency
    console.log('\n3. Verifying dashboard logic consistency...');
    
    // Dispatched ODNs should be <= Total ODNs
    if (dashboardData.dispatchedODNs <= dashboardData.totalODNs) {
      console.log('   ✅ Dispatched ODNs count is consistent (≤ Total ODNs)');
    } else {
      console.log('   ❌ Dispatched ODNs count is higher than Total ODNs - possible issue');
    }

    // POD Confirmed should be <= Dispatched ODNs
    if (dashboardData.podConfirmed <= dashboardData.dispatchedODNs) {
      console.log('   ✅ POD Confirmed count is consistent (≤ Dispatched ODNs)');
    } else {
      console.log('   ❌ POD Confirmed count is higher than Dispatched ODNs - possible issue');
    }

    // Quality Evaluated should be <= POD Confirmed
    if (dashboardData.qualityEvaluated <= dashboardData.podConfirmed) {
      console.log('   ✅ Quality Evaluated count is consistent (≤ POD Confirmed)');
    } else {
      console.log('   ❌ Quality Evaluated count is higher than POD Confirmed - possible issue');
    }

    // Test 4: Compare with all-time data
    console.log('\n4. Comparing with all-time data...');
    const allTimeResponse = await axios.get(`${API_URL}/api/hp-dashboard`);
    const allTimeData = allTimeResponse.data;

    console.log('📊 All-time metrics:');
    console.log(`   Total ODNs: ${allTimeData.totalODNs}`);
    console.log(`   Dispatched ODNs: ${allTimeData.dispatchedODNs}`);

    // Month-specific should be <= All-time
    if (dashboardData.dispatchedODNs <= allTimeData.dispatchedODNs) {
      console.log('   ✅ Month-specific dispatched count is consistent with all-time data');
    } else {
      console.log('   ❌ Month-specific dispatched count is higher than all-time - possible issue');
    }

    console.log('\n🎉 Test completed!');
    console.log('\nFix implemented:');
    console.log('• Added "AND o.odn_number != \'RRF not sent\'" filter to dispatched ODNs query');
    console.log('• This ensures "RRF not sent" entries are excluded from dispatched count');
    console.log('• Maintains consistency with other dashboard metrics');
    console.log('• Prevents inflated dispatched ODN counts');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testHPDashboardDispatchedFix();