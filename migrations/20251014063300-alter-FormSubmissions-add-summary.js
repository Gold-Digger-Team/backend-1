// migrations/XXXX-alter-FormSubmissions-add-summary.js
'use strict'
module.exports = {
  async up(qi, Sequelize) {
    const table = await qi.describeTable('FormSubmissions')

    if (!table.dp_pct_submit) {
      await qi.addColumn('FormSubmissions', 'dp_pct_submit', { type: Sequelize.FLOAT })
    }
    if (!table.total_gramase) {
      await qi.addColumn('FormSubmissions', 'total_gramase', { type: Sequelize.INTEGER })
    }
    if (!table.total_keping) {
      await qi.addColumn('FormSubmissions', 'total_keping', { type: Sequelize.INTEGER })
    }
    if (!table.total_angsuran) {
      await qi.addColumn('FormSubmissions', 'total_angsuran', { type: Sequelize.FLOAT })
    }
  },

  async down(qi) {
    const table = await qi.describeTable('FormSubmissions')

    if (table.dp_pct_submit) await qi.removeColumn('FormSubmissions', 'dp_pct_submit')
    if (table.total_gramase) await qi.removeColumn('FormSubmissions', 'total_gramase')
    if (table.total_keping) await qi.removeColumn('FormSubmissions', 'total_keping')
    if (table.total_angsuran) await qi.removeColumn('FormSubmissions', 'total_angsuran')
  }
}
