const express = require("express");
const cors = require('cors');
const app = express();
const db = require('./src/models');
const path = require('path');
const initRoutes = require("./src/routes/web");


app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.100:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json())
global.__basedir = __dirname;

app.use(express.urlencoded({ extended: true }));
initRoutes(app);

app.use(express.static("resources/static/assets/uploads"));
app.use(
  '/picklists',
  express.static(path.join(__dirname, '/resources/static/assets/picklists'))
);

// Run a simple model sync at startup (no automatic ALTERs)
db.sequelize.sync().then(() => {
  console.log('Database synchronized.');
}).catch(err => {
  console.error('DB sync error:', err);
});


let port = "3001";
app.listen(port, '0.0.0.0', () => {
  console.log(`Running at 0.0.0.0:${port}`);
  console.log(`Access via: http://localhost:${port} or http://[your-ip]:${port}`);
});
