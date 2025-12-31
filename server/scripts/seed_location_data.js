const db = require('../src/models');

const seedLocationData = async () => {
  try {
    // Sync database
    await db.sequelize.sync();

    // Sample regions
    const regions = [
      { region_name: 'Addis Ababa' },
      { region_name: 'Oromia' },
      { region_name: 'Amhara' },
      { region_name: 'Tigray' },
      { region_name: 'SNNP' }
    ];

    // Sample zones
    const zones = [
      { zone_name: 'Addis Ababa Zone', region_name: 'Addis Ababa' },
      { zone_name: 'West Shewa', region_name: 'Oromia' },
      { zone_name: 'East Shewa', region_name: 'Oromia' },
      { zone_name: 'North Shewa', region_name: 'Amhara' },
      { zone_name: 'South Gondar', region_name: 'Amhara' }
    ];

    // Sample woredas
    const woredas = [
      { woreda_name: 'Kirkos', zone_name: 'Addis Ababa Zone', region_name: 'Addis Ababa' },
      { woreda_name: 'Bole', zone_name: 'Addis Ababa Zone', region_name: 'Addis Ababa' },
      { woreda_name: 'Holeta', zone_name: 'West Shewa', region_name: 'Oromia' },
      { woreda_name: 'Sebeta', zone_name: 'West Shewa', region_name: 'Oromia' },
      { woreda_name: 'Adama', zone_name: 'East Shewa', region_name: 'Oromia' }
    ];

    // Sample facilities
    const facilities = [
      { 
        facility_name: 'Kirkos Health Center', 
        facility_type: 'Health Center',
        region_name: 'Addis Ababa',
        zone_name: 'Addis Ababa Zone',
        woreda_name: 'Kirkos',
        route: 'Route A'
      },
      { 
        facility_name: 'Bole Hospital', 
        facility_type: 'Hospital',
        region_name: 'Addis Ababa',
        zone_name: 'Addis Ababa Zone',
        woreda_name: 'Bole',
        route: 'Route B'
      },
      { 
        facility_name: 'Holeta Clinic', 
        facility_type: 'Clinic',
        region_name: 'Oromia',
        zone_name: 'West Shewa',
        woreda_name: 'Holeta',
        route: 'Route C'
      }
    ];

    // Insert data
    await db.region.bulkCreate(regions, { ignoreDuplicates: true });
    console.log('Regions seeded successfully');

    await db.zone.bulkCreate(zones, { ignoreDuplicates: true });
    console.log('Zones seeded successfully');

    await db.woreda.bulkCreate(woredas, { ignoreDuplicates: true });
    console.log('Woredas seeded successfully');

    await db.facility.bulkCreate(facilities, { ignoreDuplicates: true });
    console.log('Facilities seeded successfully');

    console.log('All location data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedLocationData();