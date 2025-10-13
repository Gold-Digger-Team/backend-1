'use strict'

const bcrypt = require('bcryptjs')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password', 10)

    await queryInterface.bulkInsert('Admin', [
      {
        AdminID: Sequelize.literal('gen_random_uuid()'), // atau pakai UUIDV4 dari Postgres
        username: 'admin_utama',
        password: hashedPassword
      }
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Admin', { username: 'admin_utama' })
  }
}
