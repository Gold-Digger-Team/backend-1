'use strict'
module.exports = (sequelize, DataTypes) => {
  const FormSubmission = sequelize.define(
    'FormSubmission',
    {
      SubmissionsID: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      submit_date: { type: DataTypes.DATEONLY, allowNull: false },
      nama: { type: DataTypes.STRING(255) },
      no_telepon: { type: DataTypes.STRING(20) },
      email: { type: DataTypes.STRING(255) },
      gramase_diinginkan: { type: DataTypes.INTEGER },
      tenor_diinginkan: { type: DataTypes.INTEGER },
      kuantitas_diinginkan: { type: DataTypes.INTEGER },

      // baru:
      dp_rupiah: { type: DataTypes.FLOAT },
      angsuran_bulanan: { type: DataTypes.FLOAT },
      harga_pergram_submit: { type: DataTypes.FLOAT }
      // dp_pct_submit: { type: DataTypes.FLOAT },
    },
    {
      tableName: 'FormSubmissions',
      timestamps: false
    }
  )
  return FormSubmission
}
