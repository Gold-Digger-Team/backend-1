'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    // cek deskripsi tabel dulu
    const table = await queryInterface.describeTable('Emas')

    // kalau kolom lama masih ada → rename ke idr
    if (table.harga_pergram) {
      await queryInterface.renameColumn('Emas', 'harga_pergram', 'harga_pergram_idr')
      console.log('renamed harga_pergram → harga_pergram_idr')
    } else {
      console.log('kolom harga_pergram sudah tidak ada, lewati rename')
    }

    // pastikan kolom harga_pergram_idr ada → ubah tipe ke NUMERIC(12,3)
    const tableAfter = await queryInterface.describeTable('Emas')
    if (tableAfter.harga_pergram_idr) {
      await queryInterface.changeColumn('Emas', 'harga_pergram_idr', {
        type: Sequelize.NUMERIC(12, 3),
        allowNull: false,
        comment: 'Harga emas per gram dalam IDR'
      })
      console.log('updated tipe harga_pergram_idr ke NUMERIC(12,3)')
    }

    // tambahkan kolom harga_pergram_usd kalau belum ada
    const hasUsd = !!tableAfter.harga_pergram_usd
    if (!hasUsd) {
      await queryInterface.addColumn('Emas', 'harga_pergram_usd', {
        type: Sequelize.NUMERIC(10, 4),
        allowNull: true,
        comment: 'Harga emas per gram dalam USD'
      })
      console.log('menambahkan kolom harga_pergram_usd')
    } else {
      console.log('kolom harga_pergram_usd sudah ada, lewati')
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Emas')

    // hapus kolom USD jika ada
    if (table.harga_pergram_usd) {
      await queryInterface.removeColumn('Emas', 'harga_pergram_usd')
      console.log('kolom harga_pergram_usd dihapus')
    }

    // ubah kembali tipe idr ke integer
    if (table.harga_pergram_idr) {
      await queryInterface.changeColumn('Emas', 'harga_pergram_idr', {
        type: Sequelize.INTEGER,
        allowNull: false
      })
      console.log('ubah kembali tipe harga_pergram_idr ke INTEGER')

      await queryInterface.renameColumn('Emas', 'harga_pergram_idr', 'harga_pergram')
      console.log('rename harga_pergram_idr → harga_pergram')
    }
  }
}
