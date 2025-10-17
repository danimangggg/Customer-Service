module.exports = {
  HOST: process.env.REACT_APP_API_URL,
  USER: "root",
  PASSWORD: "areacode",
  DB: "cmmis-new",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
