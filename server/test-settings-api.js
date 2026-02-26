const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testSettingsAPI() {
  console.log('🧪 Testing App Settings API\n');

  try {
    // Test 1: Get YouTube playlist setting
    console.log('1️⃣ Testing GET /api/settings/youtube_playlist');
    const getResponse = await axios.get(`${API_URL}/api/settings/youtube_playlist`);
    console.log('✅ Response:', JSON.stringify(getResponse.data, null, 2));
    console.log('');

    // Test 2: Update YouTube playlist
    console.log('2️⃣ Testing PUT /api/settings/youtube_playlist');
    const testVideos = [
      { id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      { id: 'jNQXAC9IVRw', url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' }
    ];
    
    const updateResponse = await axios.put(`${API_URL}/api/settings/youtube_playlist`, {
      value: testVideos,
      description: 'Test YouTube playlist'
    });
    console.log('✅ Response:', JSON.stringify(updateResponse.data, null, 2));
    console.log('');

    // Test 3: Verify the update
    console.log('3️⃣ Verifying the update');
    const verifyResponse = await axios.get(`${API_URL}/api/settings/youtube_playlist`);
    console.log('✅ Updated value:', JSON.stringify(verifyResponse.data.value, null, 2));
    console.log('');

    // Test 4: Get all settings
    console.log('4️⃣ Testing GET /api/settings (all settings)');
    const allSettingsResponse = await axios.get(`${API_URL}/api/settings`);
    console.log('✅ All settings:', JSON.stringify(allSettingsResponse.data, null, 2));
    console.log('');

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testSettingsAPI();
