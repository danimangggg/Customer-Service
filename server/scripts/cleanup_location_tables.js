const db = require('../src/models');

const cleanupLocationTables = async () => {
  try {
    console.log('Starting location tables cleanup...');
    
    // Connect to database
    await db.sequelize.sync();
    
    // Clear existing data from regions, zones, and woredas tables
    console.log('Clearing existing regions...');
    await db.region.destroy({ where: {} });
    
    console.log('Clearing existing zones...');
    await db.zone.destroy({ where: {} });
    
    console.log('Clearing existing woredas...');
    await db.woreda.destroy({ where: {} });
    
    // Get unique regions from facilities
    console.log('Extracting unique regions from facilities...');
    const uniqueRegions = await db.sequelize.query(`
      SELECT DISTINCT region_name 
      FROM facilities 
      WHERE region_name IS NOT NULL 
        AND region_name != '' 
        AND region_name != ' '
      ORDER BY region_name
    `, { type: db.sequelize.QueryTypes.SELECT });
    
    // Insert unique regions
    for (const region of uniqueRegions) {
      await db.region.create({
        region_name: region.region_name
      });
    }
    console.log(`Inserted ${uniqueRegions.length} unique regions`);
    
    // Get unique zones from facilities
    console.log('Extracting unique zones from facilities...');
    const uniqueZones = await db.sequelize.query(`
      SELECT DISTINCT zone_name, region_name 
      FROM facilities 
      WHERE zone_name IS NOT NULL 
        AND zone_name != '' 
        AND zone_name != ' '
        AND region_name IS NOT NULL 
        AND region_name != '' 
        AND region_name != ' '
      ORDER BY region_name, zone_name
    `, { type: db.sequelize.QueryTypes.SELECT });
    
    // Insert unique zones
    for (const zone of uniqueZones) {
      await db.zone.create({
        zone_name: zone.zone_name,
        region_name: zone.region_name
      });
    }
    console.log(`Inserted ${uniqueZones.length} unique zones`);
    
    // Get unique woredas from facilities
    console.log('Extracting unique woredas from facilities...');
    const uniqueWoredas = await db.sequelize.query(`
      SELECT DISTINCT woreda_name, zone_name, region_name 
      FROM facilities 
      WHERE woreda_name IS NOT NULL 
        AND woreda_name != '' 
        AND woreda_name != ' '
        AND zone_name IS NOT NULL 
        AND zone_name != '' 
        AND zone_name != ' '
        AND region_name IS NOT NULL 
        AND region_name != '' 
        AND region_name != ' '
      ORDER BY region_name, zone_name, woreda_name
    `, { type: db.sequelize.QueryTypes.SELECT });
    
    // Insert unique woredas
    for (const woreda of uniqueWoredas) {
      await db.woreda.create({
        woreda_name: woreda.woreda_name,
        zone_name: woreda.zone_name,
        region_name: woreda.region_name
      });
    }
    console.log(`Inserted ${uniqueWoredas.length} unique woredas`);
    
    console.log('Location tables cleanup completed successfully!');
    console.log('Summary:');
    console.log(`- Regions: ${uniqueRegions.length}`);
    console.log(`- Zones: ${uniqueZones.length}`);
    console.log(`- Woredas: ${uniqueWoredas.length}`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await db.sequelize.close();
  }
};

cleanupLocationTables();