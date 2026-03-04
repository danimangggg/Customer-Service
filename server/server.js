const express = require("express");
const cors = require('cors');
const app = express();
const db = require('./src/models');
const path = require('path');
const initRoutes = require("./src/routes/web");


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
  // Removed credentials: true since we're using JWT in localStorage, not cookies
}));
app.use(express.json())
global.__basedir = __dirname;

app.use(express.urlencoded({ extended: true }));

// Serve static assets BEFORE routes
app.use(express.static("resources/static/assets/uploads"));
app.use(
  '/picklists',
  express.static(path.join(__dirname, '/resources/static/assets/picklists'))
);

// Initialize API routes
initRoutes(app);

// Serve React build files in production (AFTER API routes)
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, 'build')));
  
  // Handle React routing - return all requests to React app
  // This MUST be last so API routes are not caught
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Run a simple model sync at startup (no automatic ALTERs)
db.sequelize.sync().then(() => {
  console.log('Database synchronized.');
}).catch(err => {
  console.error('DB sync error:', err);
});


let port = process.env.PORT || "3001";
console.log('Starting server on port:', port);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Database host:', process.env.DB_HOST || 'localhost');

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
