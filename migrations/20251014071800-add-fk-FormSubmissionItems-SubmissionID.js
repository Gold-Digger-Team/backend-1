'use strict'
module.exports = {
  async up(qi) {
    await qi.addConstraint('FormSubmissionItems', {
      fields: ['SubmissionID'],
      type: 'foreign key',
      name: 'fk_items_submission',
      references: { table: 'FormSubmissions', field: 'SubmissionsID' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })
  },
  async down(qi) {
    await qi.removeConstraint('FormSubmissionItems', 'fk_items_submission')
  }
}
