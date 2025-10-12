const router = require('express').Router()
const ctrl = require('../controllers/formSubmissionController')

/**
 * @openapi
 * /api/form-submissions:
 *   post:
 *     tags: [FormSubmission]
 *     summary: Kirim form baru (dari user)
 *     description: Menerima data form dari frontend dan menyimpannya ke database.
 *     security:
 *       - csrfToken: []   # wajib untuk POST (karena pakai cookie CSRF)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_date
 *               - nama
 *               - email
 *             properties:
 *               order_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-10-12"
 *               nama:
 *                 type: string
 *                 example: "Budi Santoso"
 *               no_telepon:
 *                 type: string
 *                 example: "081234567890"
 *               email:
 *                 type: string
 *                 example: "budi@mail.com"
 *               gramase_diinginkan:
 *                 type: integer
 *                 example: 10
 *               tenor_diinginkan:
 *                 type: integer
 *                 example: 12
 *               kuantitas_diinginkan:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Berhasil membuat form submission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Form berhasil disimpan"
 *                 data:
 *                   $ref: '#/components/schemas/FormSubmission'
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', ctrl.createFormSubmission)

module.exports = router
