const axios = require('axios');

async function testStoresAPI() {
  try {
    console.log('Testing /api/stores endpoint...\n');
    
    const response = await axios.get('http://localhost:3001/api/stores');
    
    console.log('✓ API call successful!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API call failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error('Make sure the backend is running on http://localhost:3001');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testStoresAPI();
