const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testEndpoints() {
  console.log('🧪 Testing API endpoints...\n');
  
  const tests = [
    {
      name: 'Available Vehicles',
      url: `${API_BASE}/vehicles/available`,
      method: 'GET'
    },
    {
      name: 'Available Drivers',
      url: `${API_BASE}/drivers/available`,
      method: 'GET'
    },
    {
      name: 'Available Deliverers',
      url: `${API_BASE}/deliverers/available`,
      method: 'GET'
    },
    {
      name: 'PI Vehicle Requests',
      url: `${API_BASE}/pi-vehicle-requests?month=Tir&year=2018`,
      method: 'GET'
    },
    {
      name: 'PI Vehicle Request Stats',
      url: `${API_BASE}/pi-vehicle-requests/stats?month=Tir&year=2018`,
      method: 'GET'
    },
    {
      name: 'All Routes',
      url: `${API_BASE}/routes`,
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000
      });
      
      console.log(`✅ ${test.name}: Status ${response.status}`);
      if (Array.isArray(response.data)) {
        console.log(`   Data: Array with ${response.data.length} items`);
      } else if (typeof response.data === 'object') {
        console.log(`   Data: Object with keys: ${Object.keys(response.data).join(', ')}`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.response?.status || 'Network Error'}`);
      if (error.response?.data) {
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      console.log('');
    }
  }
}

testEndpoints()
  .then(() => {
    console.log('🎉 API endpoint testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });