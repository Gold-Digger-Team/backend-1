'use strict'
module.exports = {
  async up(qi, Sequelize) {
    // Supabase: gen_random_uuid() ada dari pgcrypto
    await qi.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

    await qi.createTable('Admin', {
      AdminID: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      username: { type: Sequelize.STRING, unique: true }, // username
      password: { type: Sequelize.STRING, allowNull: false }
    })
  },
  async down(qi) {
    await qi.dropTable('Admin')
  }
}
