'use strict'

module.exports = {
  async up(qi, Sequelize) {
    await qi.addColumn('Angsuran', 'dp_rupiah', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Nominal DP dalam rupiah'
    })

    await qi.addColumn('Angsuran', 'angsuran_kompetitor', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Perbandingan angsuran kompetitor'
    })

    // 🔍 tampilkan struktur tabel setelah perubahan
    const table = await qi.describeTable('Angsuran')
    console.log('=== Struktur tabel Angsuran setelah migrasi ===')
    console.table(table)
  },

  async down(qi) {
    await qi.removeColumn('Angsuran', 'dp_rupiah')
    await qi.removeColumn('Angsuran', 'angsuran_kompetitor')
  }
}
