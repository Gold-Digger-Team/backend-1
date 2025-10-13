'use strict'
module.exports = (sequelize, DataTypes) => {
  const PrediksiEmas = sequelize.define(
    'PrediksiEmas',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      tanggal_prediksi: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      tahun_ke: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      harga_prediksi: {
        type: DataTypes.FLOAT,
        allowNull: false
      }
    },
    {
      tableName: 'PrediksiEmas',
      timestamps: false,
      indexes: [
        { unique: true, fields: ['tanggal_prediksi', 'tahun_ke'] } // tiap tanggal punya prediksi unik per tahun_ke
      ]
    }
  )

  return PrediksiEmas
}