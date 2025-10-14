// migrations/XXXX-create-FormSubmissionItems.js
'use strict'
module.exports = {
  async up(qi, Sequelize) {
    // Pastikan ekstensi uuid/pgcrypto sudah ada di migrasi awal project (kalau perlu)
    await qi.createTable('FormSubmissionItems', {
      ItemID: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      SubmissionID: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'FormSubmissions', // <- nama tabel target
          key: 'SubmissionsID'
        },
        onDelete: 'CASCADE', // hapus items saat master dihapus
        onUpdate: 'CASCADE'
      },
      gramase: { type: Sequelize.INTEGER, allowNull: false },
      qty: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 }
    })

    await qi.addIndex('FormSubmissionItems', ['SubmissionID'])
  },

  async down(qi) {
    await qi.dropTable('FormSubmissionItems')
  }
}
