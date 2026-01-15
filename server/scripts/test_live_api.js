const axios = require('axios');

async function testLiveAPI() {
  try {
    console.log('🔍 Testing Live API Response...\n');

    const API_URL = 'http://localhost:3001';
    const month = 'Tahsas';
    const year = '2018';

    console.log(`Calling: GET ${API_URL}/api/pi-vehicle-requests?month=${month}&year=${year}\n`);

    const response = await axios.get(`${API_URL}/api/pi-vehicle-requests`, {
      params: { month, year }
    });

    console.log('API Response:');
    console.log('='.repeat(80));
    console.log(`Total routes returned: ${response.data.routes?.length || 0}`);
    console.log('');

    if (response.data.routes && response.data.routes.length > 0) {
      response.data.routes.forEach((route, index) => {
        console.log(`${index + 1}. Route: ${route.route_name}`);
        console.log(`   Total Facilities: ${route.total_facilities_in_route}`);
        console.log(`   EWM Completed: ${route.ewm_completed_facilities}`);
        console.log(`   Vehicle Requested: ${route.vehicle_requested_facilities}`);
        console.log(`   Button Status: ${route.vehicle_requested ? 'REQUESTED (disabled)' : 'REQUEST VEHICLE (active)'}`);
        console.log(`   Facilities:`);
        route.facilities?.forEach(fac => {
          console.log(`     - ${fac.facility_name} (${fac.process_status})`);
        });
        console.log('');
      });
    } else {
      console.log('✅ No routes returned (correct if no routes have all facilities completed)');
    }

    console.log('\n💡 If AD-R-2 appears above with "REQUEST VEHICLE (active)" button:');
    console.log('   → The server needs to be restarted to apply the code changes');
    console.log('   → Run: Restart the Node.js server');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to server at http://localhost:3001');
      console.error('   → Make sure the server is running');
    } else {
      console.error('❌ API call failed:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
    }
  }
}

testLiveAPI();