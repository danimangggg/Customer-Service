const db = require('../src/models');

async function addPODTrackingColumns() {
  try {
    console.log('🔧 Adding POD tracking columns...\n');

    // Add pod_number column to ODNs table
    console.log('1. Adding pod_number column to ODNs table...');
    try {
      await db.sequelize.query(`
        ALTER TABLE odns 
        ADD COLUMN pod_number VARCHAR(100) NULL 
        COMMENT 'POD number for documentation'
      `);
      console.log('✅ pod_number column added to ODNs table');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  pod_number column already exists in ODNs table');
      } else {
        throw error;
      }
    }

    // Add arrival_kilometer column to route_assignments table
    console.log('2. Adding arrival_kilometer column to route_assignments table...');
    try {
      await db.sequelize.query(`
        ALTER TABLE route_assignments 
        ADD COLUMN arrival_kilometer DECIMAL(10, 2) NULL 
        COMMENT 'Arrival kilometer reading for the route'
      `);
      console.log('✅ arrival_kilometer column added to route_assignments table');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  arrival_kilometer column already exists in route_assignments table');
      } else {
        throw error;
      }
    }

    // Verify the columns were added
    console.log('\n3. Verifying column additions...');
    
    const [odnColumns] = await db.sequelize.query("DESCRIBE odns");
    const hasPodNumber = odnColumns.some(col => col.Field === 'pod_number');
    console.log(`✅ ODNs table pod_number column: ${hasPodNumber ? 'EXISTS' : 'MISSING'}`);

    const [raColumns] = await db.sequelize.query("DESCRIBE route_assignments");
    const hasArrivalKm = raColumns.some(col => col.Field === 'arrival_kilometer');
    console.log(`✅ Route assignments arrival_kilometer column: ${hasArrivalKm ? 'EXISTS' : 'MISSING'}`);

    console.log('\n🎉 POD tracking columns setup completed!');

  } catch (error) {
    console.error('❌ Error adding POD tracking columns:', error);
  } finally {
    await db.sequelize.close();
  }
}

addPODTrackingColumns();