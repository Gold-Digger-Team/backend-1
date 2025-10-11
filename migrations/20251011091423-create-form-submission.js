'use strict'
module.exports = {
  async up(qi, Sequelize) {
    await qi.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

    await qi.createTable('FormSubmissions', {
      SubmissionsID: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      order_date: { type: Sequelize.DATEONLY, allowNull: false },
      nama: { type: Sequelize.STRING(255) },
      no_telepon: { type: Sequelize.STRING(20) }, // phone → string aman
      email: { type: Sequelize.STRING(255) },
      gramase_diinginkan: { type: Sequelize.INTEGER },
      tenor_diinginkan: { type: Sequelize.INTEGER },
      kuantitas_diinginkan: { type: Sequelize.INTEGER }
    })
  },
  async down(qi) {
    await qi.dropTable('FormSubmissions')
  }
}
