// Quick script to add test ODNs to completed processes
const axios = require('axios');

const api_url = 'http://localhost:3001';

async function addTestODNs() {
  try {
    // Get all processes
    const processRes = await axios.get(`${api_url}/api/active-processes`);
    const processes = processRes.data || [];
    
    console.log('All processes:', processes);
    
    // Find o2c_completed processes
    const completedProcesses = processes.filter(p => p.status === 'o2c_completed');
    console.log('O2C Completed processes:', completedProcesses);
    
    // Add test ODNs to each completed process if they don't have any
    for (const proc of completedProcesses) {
      try {
        // Check if process already has ODNs
        const odnRes = await axios.get(`${api_url}/api/odns/${proc.id}`);
        const existingODNs = odnRes.data.data || [];
        
        if (existingODNs.length === 0) {
          console.log(`Adding test ODNs to process ${proc.id}`);
          
          // Add 2-3 test ODNs
          const testODNs = [
            `ODN${proc.id}001`,
            `ODN${proc.id}002`,
            `ODN${proc.id}003`
          ];
          
          for (const odnNumber of testODNs) {
            await axios.post(`${api_url}/api/save-odn`, {
              process_id: proc.id,
              odn_number: odnNumber
            });
            console.log(`Added ODN: ${odnNumber} to process ${proc.id}`);
          }
        } else {
          console.log(`Process ${proc.id} already has ${existingODNs.length} ODNs`);
        }
      } catch (err) {
        console.error(`Error processing process ${proc.id}:`, err.message);
      }
    }
    
    console.log('Test ODN addition completed');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

addTestODNs();