'use strict'

module.exports = {
  async up(qi, Sequelize) {
    // rename kolom
    await qi.renameColumn('Admin', 'id', 'username')

    // (opsional) kalau mau pastikan unique index bernama jelas:
    // await qi.addConstraint('Admin', {
    //   fields: ['username'],
    //   type: 'unique',
    //   name: 'uq_admin_username'
    // });
  },

  async down(qi, Sequelize) {
    // balikkan nama kolom
    // (opsional) hapus constraint kalau kamu tambahkan di up()
    // await qi.removeConstraint('Admin', 'uq_admin_username');
    await qi.renameColumn('Admin', 'username', 'id')
  }
}
