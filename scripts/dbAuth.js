// scripts/dbAuth.js
const path = require('path')
const envFile = process.argv[2] || '.env'
require('dotenv').config({ path: path.resolve(envFile) })

const { sequelize } = require('../models')

;(async () => {
  try {
    console.log(
      '[TRY]',
      process.env.DB_HOST,
      process.env.DB_PORT,
      process.env.DB_NAME,
      process.env.DB_USER
    )
    await sequelize.authenticate()
    console.log('✅ DB OK')
    process.exit(0)
  } catch (e) {
    console.error('❌ DB connection failed:\n', e) // <== print object, bukan cuma message
    process.exit(1)
  }
})()
