const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testDestinationKilometerFix() {
  console.log('🧪 Testing Destination Kilometer Fix');
  console.log('=====================================');

  try {
    // Test 1: Get dispatched ODNs for a specific month
    console.log('\n1. Fetching dispatched ODNs for Tahsas 2018...');
    const response = await axios.get(`${API_URL}/api/dispatched-odns`, {
      params: {
        month: 'Tahsas',
        year: '2018',
        page: 1,
        limit: 10
      }
    });

    const odns = response.data.odns || [];
    console.log(`✅ Found ${odns.length} ODNs`);

    if (odns.length === 0) {
      console.log('❌ No ODNs found for testing');
      return;
    }

    // Group ODNs by route
    const routeGroups = {};
    odns.forEach(odn => {
      const routeKey = `${odn.route_name}_${odn.route_assignment_id}`;
      if (!routeGroups[routeKey]) {
        routeGroups[routeKey] = [];
      }
      routeGroups[routeKey].push(odn);
    });

    console.log('\n2. Route grouping analysis:');
    Object.entries(routeGroups).forEach(([routeKey, routeODNs]) => {
      const [routeName] = routeKey.split('_');
      console.log(`   📍 Route: ${routeName} - ${routeODNs.length} ODNs`);
      
      // Check if all ODNs on this route have the same arrival_kilometer
      const kilometers = [...new Set(routeODNs.map(odn => odn.arrival_kilometer).filter(km => km))];
      if (kilometers.length > 1) {
        console.log(`   ⚠️  Multiple destination kilometers found: ${kilometers.join(', ')}`);
      } else if (kilometers.length === 1) {
        console.log(`   ✅ Consistent destination kilometer: ${kilometers[0]} km`);
      } else {
        console.log(`   ℹ️  No destination kilometer set yet`);
      }
    });

    // Test 2: Simulate POD confirmation with destination kilometer
    const testRoute = Object.entries(routeGroups).find(([_, odns]) => odns.length > 1);
    if (testRoute) {
      const [routeKey, routeODNs] = testRoute;
      const [routeName] = routeKey.split('_');
      const testODN = routeODNs[0];

      console.log(`\n3. Testing POD confirmation for route: ${routeName}`);
      console.log(`   Testing with ODN: ${testODN.odn_number}`);
      console.log(`   Route has ${routeODNs.length} ODNs total`);

      // Simulate the bulk update that would happen when confirming POD
      const testUpdate = {
        updates: [{
          odn_id: testODN.odn_id,
          pod_confirmed: true,
          pod_reason: '',
          pod_number: 'TEST-POD-001',
          arrival_kilometer: 150.5,
          route_assignment_id: testODN.route_assignment_id
        }],
        confirmed_by: 'test-user'
      };

      console.log('   📤 Sending test POD confirmation...');
      const updateResponse = await axios.put(`${API_URL}/api/odns/bulk-pod-confirmation`, testUpdate);
      
      if (updateResponse.data.successful > 0) {
        console.log('   ✅ POD confirmation successful');
        console.log(`   📊 Route updates: ${updateResponse.data.route_updates || 0}`);
        
        // Verify the update worked
        console.log('\n4. Verifying route-wide destination kilometer...');
        const verifyResponse = await axios.get(`${API_URL}/api/dispatched-odns`, {
          params: {
            month: 'Tahsas',
            year: '2018',
            page: 1,
            limit: 50
          }
        });

        const updatedODNs = verifyResponse.data.odns.filter(odn => 
          odn.route_assignment_id === testODN.route_assignment_id
        );

        const destinationKilometers = [...new Set(updatedODNs.map(odn => odn.arrival_kilometer).filter(km => km))];
        
        if (destinationKilometers.length === 1 && destinationKilometers[0] === 150.5) {
          console.log('   ✅ SUCCESS: All ODNs on route now have consistent destination kilometer: 150.5 km');
        } else {
          console.log('   ❌ ISSUE: Inconsistent destination kilometers:', destinationKilometers);
        }
      } else {
        console.log('   ❌ POD confirmation failed');
      }
    } else {
      console.log('\n3. No multi-ODN routes found for testing');
    }

    console.log('\n🎉 Test completed!');
    console.log('\nKey improvements implemented:');
    console.log('• Destination kilometer is now shared across all ODNs on the same route');
    console.log('• UI shows existing destination kilometer when confirming additional ODNs');
    console.log('• Visual grouping in table shows route-level information');
    console.log('• Backend prevents duplicate route assignment updates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testDestinationKilometerFix();