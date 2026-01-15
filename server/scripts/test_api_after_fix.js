const axios = require('axios');

async function testAPIAfterFix() {
  try {
    console.log('=== Testing PI Vehicle Request API After Fix ===\n');
    
    const api_url = 'http://localhost:3001';
    const month = 'Tahsas';
    const year = '2018';
    
    console.log(`Testing API endpoint: ${api_url}/api/pi-vehicle-requests`);
    console.log(`Parameters: month=${month}, year=${year}\n`);
    
    // Make API request
    const response = await axios.get(`${api_url}/api/pi-vehicle-requests`, {
      params: { month, year }
    });
    
    console.log('✓ API Response received\n');
    console.log(`Total routes: ${response.data.routes.length}`);
    console.log(`Total count: ${response.data.totalCount}`);
    console.log(`Current page: ${response.data.currentPage}`);
    console.log(`Total pages: ${response.data.totalPages}\n`);
    
    // Find AD-R-2 route
    const adR2 = response.data.routes.find(r => r.route_name === 'AD-R-2');
    
    if (adR2) {
      console.log('✓ Route AD-R-2 FOUND in results:');
      console.log(`  Route ID: ${adR2.route_id}`);
      console.log(`  Total facilities: ${adR2.total_facilities_in_route}`);
      console.log(`  EWM completed: ${adR2.ewm_completed_facilities}`);
      console.log(`  Vehicle requested: ${adR2.vehicle_requested_facilities}`);
      console.log(`  vehicle_requested flag: ${adR2.vehicle_requested}`);
      console.log(`\n  Facilities:`);
      adR2.facilities.forEach(f => {
        console.log(`    - ${f.facility_name} (${f.process_status})`);
        if (f.odns && f.odns.length > 0) {
          console.log(`      ODNs: ${f.odns.map(o => o.odn_number).join(', ')}`);
        }
      });
      
      if (adR2.total_facilities_in_route === adR2.ewm_completed_facilities) {
        console.log('\n✓ ALL facilities have completed EWM - Button should be ACTIVE');
      } else {
        console.log('\n✗ Not all facilities have completed EWM - Button should be DISABLED');
      }
    } else {
      console.log('✗ Route AD-R-2 NOT FOUND in results');
      console.log('  This means not all facilities have completed EWM');
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('✗ Server is not running!');
      console.error('  Please start the server with: cd server && npm start');
    } else {
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  }
}

testAPIAfterFix();
