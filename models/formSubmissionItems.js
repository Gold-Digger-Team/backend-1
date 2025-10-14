'use strict'
module.exports = (sequelize, DataTypes) => {
  const FormSubmissionItem = sequelize.define(
    'FormSubmissionItem',
    {
      ItemID: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      SubmissionID: {
        type: DataTypes.UUID,
        allowNull: false
      },
      gramase: { type: DataTypes.INTEGER, allowNull: false },
      qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
    },
    {
      tableName: 'FormSubmissionItems',
      timestamps: false
    }
  )

  FormSubmissionItem.associate = (models) => {
    FormSubmissionItem.belongsTo(models.FormSubmission, {
      foreignKey: 'SubmissionID',
      as: 'submission'
    })
  }

  return FormSubmissionItem
}
