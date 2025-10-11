require('dotenv').config() // kita akan load file spesifik via npm script

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
  logging: process.env.NODE_ENV !== 'production',
  dialectOptions:
    process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  pool: { max: 10, min: 0, idle: 10000 }
}

module.exports = {
  development: base,
  production: base
}
