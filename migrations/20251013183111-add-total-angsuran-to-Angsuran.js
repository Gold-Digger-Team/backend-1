'use strict'
module.exports = {
  async up(qi, Sequelize) {
    await qi.addColumn('Angsuran', 'total_angsuran', { type: Sequelize.FLOAT, allowNull: true })
  },
  async down(qi) {
    await qi.removeColumn('Angsuran', 'total_angsuran')
  }
}
