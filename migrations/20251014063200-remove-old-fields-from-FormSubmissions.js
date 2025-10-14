'use strict'

module.exports = {
  async up(qi) {
    await qi.removeColumn('FormSubmissions', 'gramase_diinginkan')
    await qi.removeColumn('FormSubmissions', 'kuantitas_diinginkan')
    await qi.removeColumn('FormSubmissions', 'nominal_pembiayaan')
  },

  async down(qi, Sequelize) {
    await qi.addColumn('FormSubmissions', 'gramase_diinginkan', { type: Sequelize.INTEGER })
    await qi.addColumn('FormSubmissions', 'kuantitas_diinginkan', { type: Sequelize.INTEGER })
    await qi.addColumn('FormSubmissions', 'nominal_pembiayaan', { type: Sequelize.FLOAT })
  }
}
