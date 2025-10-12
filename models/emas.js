'use strict'
module.exports = (sequelize, DataTypes) => {
  const Emas = sequelize.define(
    'Emas',
    {
      tanggal: { type: DataTypes.DATEONLY, primaryKey: true },
      harga_pergram: { type: DataTypes.INTEGER, allowNull: false },
      input_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW // otomatis waktu data diinput
      }
    },
    {
      tableName: 'Emas',
      timestamps: false
    }
  )
  return Emas
}
