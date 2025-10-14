'use strict'
module.exports = (sequelize, DataTypes) => {
  const Emas = sequelize.define(
    'Emas',
    {
      tanggal: { type: DataTypes.DATEONLY, primaryKey: true },
      harga_pergram_idr: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
      harga_pergram_usd: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
      input_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'Emas',
      timestamps: false
    }
  )
  return Emas
}
