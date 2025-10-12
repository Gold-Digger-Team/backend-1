'use strict'
const { v4: uuidv4 } = require('uuid')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date()

    // contoh dummy data
    const data = [
      {
        SubmissionsID: uuidv4(),
        order_date: '2025-10-01',
        nama: 'Budi Santoso',
        no_telepon: '081234567890',
        email: 'budi@mail.com',
        gramase_diinginkan: 10,
        tenor_diinginkan: 12,
        kuantitas_diinginkan: 2
      },
      {
        SubmissionsID: uuidv4(),
        order_date: '2025-10-05',
        nama: 'Siti Rahma',
        no_telepon: '082198765432',
        email: 'siti@mail.com',
        gramase_diinginkan: 5,
        tenor_diinginkan: 6,
        kuantitas_diinginkan: 1
      },
      {
        SubmissionsID: uuidv4(),
        order_date: '2025-10-07',
        nama: 'Andi Wijaya',
        no_telepon: '08311112222',
        email: 'andi@mail.com',
        gramase_diinginkan: 15,
        tenor_diinginkan: 18,
        kuantitas_diinginkan: 3
      },
      {
        SubmissionsID: uuidv4(),
        order_date: '2025-10-10',
        nama: 'Dewi Lestari',
        no_telepon: '08155567788',
        email: 'dewi@mail.com',
        gramase_diinginkan: 7,
        tenor_diinginkan: 9,
        kuantitas_diinginkan: 4
      }
    ]

    await queryInterface.bulkInsert('FormSubmissions', data, {})
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FormSubmissions', null, {})
  }
}
