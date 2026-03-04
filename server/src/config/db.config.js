module.exports = {
  // Parse host and port from DB_HOST (format: host:port or just host)
  // Also check for separate DB_PORT environment variable
  HOST: process.env.DB_HOST ? process.env.DB_HOST.split(':')[0] : 'localhost',
  PORT: process.env.DB_PORT 
    ? parseInt(process.env.DB_PORT)
    : (process.env.DB_HOST && process.env.DB_HOST.includes(':') 
      ? parseInt(process.env.DB_HOST.split(':')[1]) 
      : 3306),
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
    acquire: 120000,  // 2 minutes timeout for remote database
    idle: 10000,
    connectTimeout: 120000
  }
};
