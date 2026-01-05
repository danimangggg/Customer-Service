const db = require('../src/models');

const addTestData = async () => {
  try {
    console.log('Test data script available but not inserting data as requested.');
    console.log('Mock data insertion has been disabled.');
    console.log('Use the User Management and Vehicle Management interfaces to add data manually.');
    
  } catch (error) {
    console.error('❌ Error in test data script:', error.message);
  }
};

// Run the script
addTestData()
  .then(() => {
    console.log('🎉 Test data script completed (no data inserted)');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });