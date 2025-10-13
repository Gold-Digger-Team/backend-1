'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambah kolom nominal_pembiayaan
    await queryInterface.addColumn('FormSubmissions', 'nominal_pembiayaan', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Nominal pembiayaan dalam rupiah'
    })

    // Tambah kolom total_angsuran
    await queryInterface.addColumn('FormSubmissions', 'total_angsuran', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Total seluruh angsuran dalam rupiah'
    })
  },

  async down(queryInterface) {
    // rollback: hapus kolom
    await queryInterface.removeColumn('FormSubmissions', 'nominal_pembiayaan')
    await queryInterface.removeColumn('FormSubmissions', 'total_angsuran')
  }
}
