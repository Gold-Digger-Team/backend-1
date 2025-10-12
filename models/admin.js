'use strict'
module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define(
    'Admin',
    {
      AdminID: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      username: { type: DataTypes.STRING, unique: true }, // username
      password: { type: DataTypes.STRING, allowNull: false }
    },
    {
      tableName: 'Admin',
      timestamps: false
    }
  )
  return Admin
}
