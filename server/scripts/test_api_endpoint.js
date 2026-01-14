const axios = require('axios');

async function testAPIEndpoint() {
  try {
    console.log('🔍 Testing Documentation Management API endpoint...\n');

    const baseURL = 'http://localhost:3001';
    
    // Test the dispatched ODNs endpoint
    const response = await axios.get(`${baseURL}/api/dispatched-odns`, {
      params: {
        month: 'Tahsas',
        year: '2018',
        page: 1,
        limit: 10,
        search: ''
      }
    });

    console.log('✅ API Response Status:', response.status);
    console.log('✅ Response Data:');
    console.log('   - Total ODNs:', response.data.totalCount);
    console.log('   - Current Page:', response.data.currentPage);
    console.log('   - Total Pages:', response.data.totalPages);
    console.log('   - ODNs Found:', response.data.odns.length);

    if (response.data.odns.length > 0) {
      console.log('\n📋 Sample ODNs:');
      response.data.odns.slice(0, 3).forEach((odn, index) => {
        console.log(`${index + 1}. ODN: ${odn.odn_number}`);
        console.log(`   Facility: ${odn.facility_name}`);
        console.log(`   POD Status: ${odn.pod_confirmed ? 'Confirmed' : 'Pending'}`);
        console.log('');
      });
    }

    // Test stats endpoint
    const statsResponse = await axios.get(`${baseURL}/api/documentation/stats`, {
      params: {
        month: 'Tahsas',
        year: '2018'
      }
    });

    console.log('📊 Statistics:');
    console.log('   - Total Dispatched:', statsResponse.data.totalDispatched);
    console.log('   - Confirmed PODs:', statsResponse.data.confirmedPODs);
    console.log('   - Pending PODs:', statsResponse.data.pendingPODs);

    console.log('\n🎉 API endpoints are working correctly!');

  } catch (error) {
    console.error('❌ API Test Failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   Network Error: Server not responding');
      console.error('   Make sure the server is running on http://localhost:3001');
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testAPIEndpoint();