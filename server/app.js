#!/usr/bin/env node

// Passenger-compatible entry point
const express = require("express");
const cors = require('cors');
const path = require('path');

const app = express();

console.log('=== APP STARTING ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'https://epss-mt.et',
    'https://www.epss-mt.et',
    'http://epss-mt.et',
    'http://www.epss-mt.et'
  ]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes MUST come before static file serving and catch-all
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend is alive!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'build');
  console.log('Serving static files from:', buildPath);
  app.use(express.static(buildPath));
  
  // Handle React routing - return all requests to React app
  // This MUST be last so API routes work
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

console.log('=== APP READY ===');

// Always start listening - Passenger will proxy to this
const port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
  console.log('Passenger should proxy requests to this port');
});
