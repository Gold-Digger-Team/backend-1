'use strict'
module.exports = (sequelize, DataTypes) => {
  const FormSubmission = sequelize.define(
    'FormSubmission',
    {
      SubmissionsID: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      order_date: { type: DataTypes.DATEONLY, allowNull: false },
      nama: { type: DataTypes.STRING(255) },
      no_telepon: { type: DataTypes.STRING(20) },
      email: { type: DataTypes.STRING(255) },
      gramase_diinginkan: { type: DataTypes.INTEGER },
      tenor_diinginkan: { type: DataTypes.INTEGER },
      kuantitas_diinginkan: { type: DataTypes.INTEGER }
    },
    {
      tableName: 'FormSubmissions',
      timestamps: false
    }
  )
  return FormSubmission
}
