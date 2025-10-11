'use strict'
module.exports = (sequelize, DataTypes) => {
  const Emas = sequelize.define(
    'Emas',
    {
      tanggal: { type: DataTypes.DATEONLY, primaryKey: true },
      harga_pergram: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      tableName: 'Emas',
      timestamps: false
    }
  )
  return Emas
}
