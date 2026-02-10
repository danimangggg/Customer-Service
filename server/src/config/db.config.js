module.exports = {
  // Prefer explicit DB_HOST env var; fall back to localhost for local dev
  HOST: process.env.DB_HOST || process.env.REACT_APP_API_URL || 'localhost',
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || 'areacode',
  DB: process.env.DB_NAME || 'customer-service',
  dialect: 'mysql',
  timezone: '+03:00', // East Africa Time (GMT+3)
  dialectOptions: {
    timezone: '+03:00'
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
