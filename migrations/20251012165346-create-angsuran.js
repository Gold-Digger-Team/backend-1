'use strict'

module.exports = {
  async up(qi, Sequelize) {
    await qi.createTable('Angsuran', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'), // untuk Postgres
        primaryKey: true
      },
      gramase: { type: Sequelize.INTEGER, allowNull: false },
      tenor: { type: Sequelize.INTEGER, allowNull: false },
      dp_pct: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      nominal: { type: Sequelize.FLOAT, allowNull: false },
      dp_rupiah: { type: DataTypes.FLOAT, allowNull: false },
      angsuran_kompetitor: { type: DataTypes.FLOAT, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    })

    // tambahkan unique index
    await qi.addIndex('Angsuran', ['gramase', 'tenor', 'dp_pct'], {
      unique: true,
      name: 'uq_angsuran_combo'
    })
  },

  async down(qi) {
    await qi.dropTable('Angsuran')
  }
}
