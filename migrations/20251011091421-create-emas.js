'use strict'
module.exports = {
  async up(qi, Sequelize) {
    await qi.createTable('Emas', {
      tanggal: { type: Sequelize.DATEONLY, allowNull: false, primaryKey: true },
      harga_pergram: { type: Sequelize.INTEGER, allowNull: false }
    })
  },
  async down(qi) {
    await qi.dropTable('Emas')
  }
}
