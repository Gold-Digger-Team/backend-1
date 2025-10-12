'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('FormSubmissions', 'order_date', 'submit_date')
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('FormSubmissions', 'submit_date', 'order_date')
  }
}
