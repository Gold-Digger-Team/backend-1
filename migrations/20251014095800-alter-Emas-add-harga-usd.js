'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // ubah nama kolom lama dari harga_pergram -> harga_pergram_idr
    await queryInterface.renameColumn('Emas', 'harga_pergram', 'harga_pergram_idr')

    // ubah tipe ke NUMERIC(12,3)
    await queryInterface.changeColumn('Emas', 'harga_pergram_idr', {
      type: Sequelize.NUMERIC(12, 3),
      allowNull: false,
      comment: 'Harga emas per gram dalam IDR'
    })

    // tambahkan kolom baru untuk USD
    await queryInterface.addColumn('Emas', 'harga_pergram_usd', {
      type: Sequelize.NUMERIC(10, 4),
      allowNull: true,
      comment: 'Harga emas per gram dalam USD'
    })
  },

  async down(queryInterface, Sequelize) {
    // rollback: hapus kolom USD dan kembalikan nama + tipe lama
    await queryInterface.removeColumn('Emas', 'harga_pergram_usd')

    await queryInterface.changeColumn('Emas', 'harga_pergram_idr', {
      type: Sequelize.INTEGER,
      allowNull: false
    })

    await queryInterface.renameColumn('Emas', 'harga_pergram_idr', 'harga_pergram')
  }
}
