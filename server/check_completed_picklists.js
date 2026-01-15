const mysql = require('mysql2/promise');

async function checkCompletedPicklists() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'areacode',
    database: 'customer-service'
  });

  try {
    console.log('=== Checking Operator Data ===\n');

    // Check operator_id from completed picklists
    const [picklists] = await connection.query(`
      SELECT id, odn, operator_id, status
      FROM picklist
      WHERE LOWER(status) = 'completed'
    `);
    
    console.log('Completed picklists with operator_id:');
    console.table(picklists);

    // Check if those operators exist
    const [operators] = await connection.query(`
      SELECT id, fullName, jobTitle
      FROM employee
      WHERE id IN (20000077, 10000652)
    `);
    
    console.log('\nOperators in employee table:');
    console.table(operators);

    // Test the full query with operator
    const [fullQuery] = await connection.query(`
      SELECT 
        p.id,
        p.odn,
        p.operator_id,
        e.id as emp_id,
        e.fullName,
        f.facility_name
      FROM picklist p
      LEFT JOIN employee e ON p.operator_id = e.id
      LEFT JOIN processes pr ON CAST(p.process_id AS UNSIGNED) = pr.id
      LEFT JOIN facilities f ON pr.facility_id = f.id
      WHERE LOWER(p.status) = 'completed'
    `);
    
    console.log('\nFull query with operator JOIN:');
    console.table(fullQuery);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkCompletedPicklists();
