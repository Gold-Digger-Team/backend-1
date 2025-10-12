// models/Angsuran.js
'use strict'
module.exports = (sequelize, DataTypes) => {
  const Angsuran = sequelize.define(
    'Angsuran',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gramase: { type: DataTypes.INTEGER, allowNull: false },
      tenor: { type: DataTypes.INTEGER, allowNull: false },
      dp_pct: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 }, // selalu 10%
      nominal: { type: DataTypes.FLOAT, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    {
      tableName: 'Angsuran',
      timestamps: false,
      indexes: [{ unique: true, fields: ['gramase', 'tenor', 'dp_pct'] }]
    }
  )
  return Angsuran
}
