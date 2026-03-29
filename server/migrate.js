#!/usr/bin/env node
// Wrapper so db-migrate picks up .env variables automatically
require('dotenv').config();
const { execSync } = require('child_process');

const args = process.argv.slice(2).join(' ') || 'up';
const env = process.env.NODE_ENV === 'production' ? 'production' : 'dev';

console.log(`Running: db-migrate ${args} --env ${env}`);
execSync(`npx db-migrate ${args} --env ${env} --migrations-dir migrations`, {
  stdio: 'inherit',
  cwd: __dirname
});
