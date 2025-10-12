'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Emas', 'input_date', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Emas', 'input_date')
  }
}
