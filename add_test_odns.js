const axios = require('axios');

const api_url = 'http://localhost:3001';

async function addTestODNs() {
  try {
    console.log('Adding test ODNs to completed processes...');
    
    // Add ODNs to process 11 (facility 4)
    await axios.post(`${api_url}/api/save-odn`, {
      process_id: 11,
      odn_number: 'ODN11001'
    });
    
    await axios.post(`${api_url}/api/save-odn`, {
      process_id: 11,
      odn_number: 'ODN11002'
    });
    
    // Add ODNs to process 13 (facility 9)
    await axios.post(`${api_url}/api/save-odn`, {
      process_id: 13,
      odn_number: 'ODN13001'
    });
    
    await axios.post(`${api_url}/api/save-odn`, {
      process_id: 13,
      odn_number: 'ODN13002'
    });
    
    await axios.post(`${api_url}/api/save-odn`, {
      process_id: 13,
      odn_number: 'ODN13003'
    });
    
    console.log('Test ODNs added successfully!');
    console.log('Process 11: 2 ODNs added');
    console.log('Process 13: 3 ODNs added');
    console.log('Now refresh your EWM officer page to see the facilities.');
    
  } catch (err) {
    console.error('Error adding test ODNs:', err.response?.data || err.message);
  }
}

addTestODNs();