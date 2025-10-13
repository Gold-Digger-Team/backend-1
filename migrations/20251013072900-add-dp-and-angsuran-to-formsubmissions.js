'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(qi, Sequelize) {
    await qi.addColumn('FormSubmissions', 'dp_rupiah', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'DP yang diinput user (rupiah)'
    })
    await qi.addColumn('FormSubmissions', 'angsuran_bulanan', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Cicilan per bulan (sudah termasuk kuantitas)'
    })
    await qi.addColumn('FormSubmissions', 'harga_pergram_submit', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Harga emas per gram pada saat submit'
    })
    // opsional:
    // await qi.addColumn('FormSubmissions', 'dp_pct_submit', {
    //   type: Sequelize.FLOAT,
    //   allowNull: true,
    //   comment: 'Persentase DP pada saat submit'
    // })
  },

  async down(qi) {
    await qi.removeColumn('FormSubmissions', 'harga_pergram_submit')
    await qi.removeColumn('FormSubmissions', 'angsuran_bulanan')
    await qi.removeColumn('FormSubmissions', 'dp_rupiah')
    // await qi.removeColumn('FormSubmissions', 'dp_pct_submit')
  }
}
