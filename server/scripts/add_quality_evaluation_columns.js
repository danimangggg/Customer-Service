require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'areacode',
  database: process.env.DB_NAME || 'customer-service'
};

async function addQualityEvaluationColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    // Check if columns already exist
    const [existingColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'odns' 
      AND COLUMN_NAME IN ('quality_confirmed', 'quality_feedback', 'quality_evaluated_by', 'quality_evaluated_at')
    `, [dbConfig.database]);

    const existing = existingColumns.map(col => col.COLUMN_NAME);
    
    // Add quality_confirmed column if it doesn't exist
    if (!existing.includes('quality_confirmed')) {
      await connection.execute(`
        ALTER TABLE odns 
        ADD COLUMN quality_confirmed BOOLEAN DEFAULT FALSE COMMENT 'Process quality confirmation status'
      `);
      console.log('✓ Added quality_confirmed column');
    } else {
      console.log('⚠ quality_confirmed column already exists');
    }

    // Add quality_feedback column if it doesn't exist
    if (!existing.includes('quality_feedback')) {
      await connection.execute(`
        ALTER TABLE odns 
        ADD COLUMN quality_feedback TEXT DEFAULT NULL COMMENT 'Quality evaluation feedback'
      `);
      console.log('✓ Added quality_feedback column');
    } else {
      console.log('⚠ quality_feedback column already exists');
    }

    // Add quality_evaluated_by column if it doesn't exist
    if (!existing.includes('quality_evaluated_by')) {
      await connection.execute(`
        ALTER TABLE odns 
        ADD COLUMN quality_evaluated_by INT DEFAULT NULL COMMENT 'User ID who performed quality evaluation'
      `);
      console.log('✓ Added quality_evaluated_by column');
    } else {
      console.log('⚠ quality_evaluated_by column already exists');
    }

    // Add quality_evaluated_at column if it doesn't exist
    if (!existing.includes('quality_evaluated_at')) {
      await connection.execute(`
        ALTER TABLE odns 
        ADD COLUMN quality_evaluated_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Quality evaluation timestamp'
      `);
      console.log('✓ Added quality_evaluated_at column');
    } else {
      console.log('⚠ quality_evaluated_at column already exists');
    }

    // Add foreign key constraint for quality_evaluated_by
    try {
      const fkQuery = `ALTER TABLE odns ADD CONSTRAINT fk_quality_evaluated_by 
                       FOREIGN KEY (quality_evaluated_by) REFERENCES users(id) 
                       ON DELETE SET NULL ON UPDATE CASCADE`;
      await connection.execute(fkQuery);
      console.log('✓ Added foreign key constraint for quality_evaluated_by');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠ Foreign key constraint already exists');
      } else {
        console.log('⚠ Could not add foreign key constraint:', error.message);
      }
    }

    // Verify the columns were added
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'odns' 
        AND COLUMN_NAME IN ('quality_confirmed', 'quality_feedback', 'quality_evaluated_by', 'quality_evaluated_at')
      ORDER BY COLUMN_NAME
    `, [dbConfig.database]);

    console.log('\n📋 Quality Evaluation Columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) - ${col.COLUMN_COMMENT}`);
    });

    console.log('\n✅ Quality evaluation columns setup completed successfully!');
    console.log('\nColumns added:');
    console.log('  - quality_confirmed: BOOLEAN - Process quality confirmation status');
    console.log('  - quality_feedback: TEXT - Quality evaluation feedback');
    console.log('  - quality_evaluated_by: INT - User ID who performed evaluation');
    console.log('  - quality_evaluated_at: TIMESTAMP - Quality evaluation timestamp');

  } catch (error) {
    console.error('❌ Error adding quality evaluation columns:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  addQualityEvaluationColumns()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addQualityEvaluationColumns;