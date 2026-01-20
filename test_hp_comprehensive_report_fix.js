const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testHPComprehensiveReportFix() {
  console.log('🧪 Testing HP Comprehensive Report "RRF not sent" Fix');
  console.log('===================================================');

  try {
    // Test 1: Get comprehensive HP report for a specific month
    console.log('\n1. Testing comprehensive HP report for Tir 2018...');
    const response = await axios.get(`${API_URL}/api/hp-comprehensive-report`, {
      params: {
        month: 'Tir',
        year: '2018'
      }
    });

    const reportData = response.data;
    console.log('✅ Comprehensive report retrieved successfully');
    console.log('📊 Summary metrics:');
    console.log(`   Total Facilities: ${reportData.summary.totalFacilities}`);
    console.log(`   RRF Sent: ${reportData.summary.rrfSent}`);
    console.log(`   RRF Not Sent: ${reportData.summary.rrfNotSent}`);
    console.log(`   Total ODNs: ${reportData.summary.totalODNs}`);
    console.log(`   Dispatched ODNs: ${reportData.summary.dispatchedODNs}`);
    console.log(`   POD Confirmed: ${reportData.summary.podConfirmed}`);
    console.log(`   Quality Evaluated: ${reportData.summary.qualityEvaluated}`);

    // Test 2: Check route statistics
    console.log('\n2. Checking route statistics...');
    if (reportData.routeStats && reportData.routeStats.length > 0) {
      console.log('📊 Route statistics:');
      reportData.routeStats.forEach(route => {
        console.log(`   • ${route.route_name}: ${route.odns_count} ODNs, ${route.dispatched_count} dispatched, ${route.pod_confirmed_count} POD confirmed`);
      });
    } else {
      console.log('   ℹ️  No route statistics found for this period');
    }

    // Test 3: Check POD details
    console.log('\n3. Checking POD details...');
    if (reportData.podDetails && reportData.podDetails.length > 0) {
      console.log(`📊 POD details: ${reportData.podDetails.length} confirmed PODs`);
      reportData.podDetails.slice(0, 3).forEach(pod => {
        console.log(`   • ODN: ${pod.odn_number}, Facility: ${pod.facility_name}, Route: ${pod.route}`);
      });
      if (reportData.podDetails.length > 3) {
        console.log(`   ... and ${reportData.podDetails.length - 3} more`);
      }
    } else {
      console.log('   ℹ️  No POD details found for this period');
    }

    // Test 4: Test ODN details endpoint
    console.log('\n4. Testing ODN details endpoint...');
    const odnDetailsResponse = await axios.get(`${API_URL}/api/odn-pod-details`, {
      params: {
        reporting_month: 'Tir 2018'
      }
    });

    const odnDetails = odnDetailsResponse.data.odnDetails || [];
    console.log(`✅ ODN details retrieved: ${odnDetails.length} ODNs`);
    
    // Check if any "RRF not sent" entries are included
    const rrfNotSentEntries = odnDetails.filter(odn => odn.odn_number === 'RRF not sent');
    if (rrfNotSentEntries.length > 0) {
      console.log(`   ❌ ISSUE: Found ${rrfNotSentEntries.length} "RRF not sent" entries in ODN details`);
    } else {
      console.log('   ✅ SUCCESS: No "RRF not sent" entries found in ODN details');
    }

    // Test 5: Test time trend data
    console.log('\n5. Testing time trend data...');
    const trendResponse = await axios.get(`${API_URL}/api/hp-time-trend`);
    const trendData = trendResponse.data.trendData || [];
    
    console.log(`✅ Time trend data retrieved: ${trendData.length} periods`);
    if (trendData.length > 0) {
      console.log('📊 Recent trend data:');
      trendData.slice(-3).forEach(trend => {
        console.log(`   • ${trend.reporting_month}: ${trend.total_odns} ODNs, ${trend.dispatched_odns} dispatched, ${trend.pod_confirmed} POD confirmed`);
      });
    }

    // Test 6: Verify consistency
    console.log('\n6. Verifying data consistency...');
    
    // Check if dispatched <= total ODNs
    if (reportData.summary.dispatchedODNs <= reportData.summary.totalODNs) {
      console.log('   ✅ Dispatched ODNs ≤ Total ODNs (consistent)');
    } else {
      console.log('   ❌ Dispatched ODNs > Total ODNs (inconsistent)');
    }

    // Check if POD confirmed <= dispatched ODNs
    if (reportData.summary.podConfirmed <= reportData.summary.dispatchedODNs) {
      console.log('   ✅ POD Confirmed ≤ Dispatched ODNs (consistent)');
    } else {
      console.log('   ❌ POD Confirmed > Dispatched ODNs (inconsistent)');
    }

    // Check if quality evaluated <= POD confirmed
    if (reportData.summary.qualityEvaluated <= reportData.summary.podConfirmed) {
      console.log('   ✅ Quality Evaluated ≤ POD Confirmed (consistent)');
    } else {
      console.log('   ❌ Quality Evaluated > POD Confirmed (inconsistent)');
    }

    console.log('\n🎉 Test completed!');
    console.log('\nFixes implemented:');
    console.log('• Added "AND o.odn_number != \'RRF not sent\'" filter to all ODN-related queries');
    console.log('• Fixed ODN statistics, route statistics, POD details, workflow progress queries');
    console.log('• Fixed time trend data and ODN details endpoints');
    console.log('• Ensures consistent exclusion of "RRF not sent" entries across all report sections');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testHPComprehensiveReportFix();