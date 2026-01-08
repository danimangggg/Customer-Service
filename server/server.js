const express = require("express");
const cors = require('cors');
const app = express();
const db = require('./src/models');
const path = require('path');
const initRoutes = require("./src/routes/web");


app.use(cors())
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


let port = "3003";
app.listen(port, 'localhost', () => {
  console.log(`Running at localhost:${port}`);
});
