#!/usr/bin/env node
// Run this ONCE on your existing production DB to mark the baseline
// migration as already applied, so db-migrate doesn't try to re-run it.
//
// Usage: node mark-baseline-done.js
//
// After running this, use `npm run migrate` for all future changes.

require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const host = process.env.DB_HOST ? process.env.DB_HOST.split(':')[0] : 'localhost';
  const port = process.env.DB_PORT
    ? parseInt(process.env.DB_PORT)
    : (process.env.DB_HOST && process.env.DB_HOST.includes(':')
      ? parseInt(process.env.DB_HOST.split(':')[1])
      : 3306);

  const conn = await mysql.createConnection({
    host,
    port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // db-migrate creates this table automatically on first run,
  // but we create it here manually so we can insert the baseline record.
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      run_on DATETIME NOT NULL
    )
  `);

  const [rows] = await conn.execute(
    `SELECT id FROM migrations WHERE name = '20260101000000-baseline'`
  );

  if (rows.length > 0) {
    console.log('Baseline already marked as done. Nothing to do.');
  } else {
    await conn.execute(
      `INSERT INTO migrations (name, run_on) VALUES ('20260101000000-baseline', NOW())`
    );
    console.log('Done. Baseline migration marked as applied.');
  }

  await conn.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
