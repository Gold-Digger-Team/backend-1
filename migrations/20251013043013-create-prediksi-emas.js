'use strict'

module.exports = {
  async up(qi, Sequelize) {
    await qi.createTable('PrediksiEmas', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'), // untuk Postgres
        primaryKey: true
      },
      tanggal_prediksi: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      tahun_ke: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      harga_prediksi: {
        type: Sequelize.FLOAT,
        allowNull: false
      }
    })

    await qi.addIndex('PrediksiEmas', ['tanggal_prediksi', 'tahun_ke'], {
      unique: true,
      name: 'uq_prediksi_tanggal_tahun'
    })
  },

  async down(qi) {
    await qi.dropTable('PrediksiEmas')
  }
}
