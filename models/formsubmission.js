'use strict'
module.exports = (sequelize, DataTypes) => {
  const FormSubmission = sequelize.define(
    'FormSubmission',
    {
      SubmissionsID: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },

      // data diri
      submit_date: { type: DataTypes.DATEONLY, allowNull: false },
      nama: { type: DataTypes.STRING(255) },
      no_telepon: { type: DataTypes.STRING(20) },
      email: { type: DataTypes.STRING(255) },

      // prefer: simpan tenor + dp yg dipakai saat submit
      tenor_diinginkan: { type: DataTypes.INTEGER }, // bulan
      dp_pct_submit: { type: DataTypes.FLOAT }, // 10..40

      // ringkasan total
      total_gramase: { type: DataTypes.INTEGER }, // sum(gramase * qty)
      total_keping: { type: DataTypes.INTEGER }, // sum(qty)
      harga_pergram_submit: { type: DataTypes.FLOAT },

      // hasil simulasi (total, bukan per-item)
      dp_rupiah: { type: DataTypes.FLOAT },
      angsuran_bulanan: { type: DataTypes.FLOAT },
      total_angsuran: { type: DataTypes.FLOAT }
    },
    {
      tableName: 'FormSubmissions',
      timestamps: false
    }
  )

  FormSubmission.associate = (models) => {
    FormSubmission.Items = FormSubmission.hasMany(models.FormSubmissionItem, {
      foreignKey: 'SubmissionID',
      as: 'items',
      onDelete: 'CASCADE'
    })
  }

  return FormSubmission
}
