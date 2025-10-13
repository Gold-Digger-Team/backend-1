const router = require('express').Router()
const ctrl = require('../controllers/formSubmissionController')
const requireAuth = require('../middlewares/requireAuth')

/**
 * @openapi
 * /api/form-submissions:
 *   post:
 *     tags: [FormSubmission]
 *     summary: Kirim form baru (dari user)
 *     description: Server akan mengisi submit_date otomatis saat tersimpan.
 *     security:
 *       - csrfToken: []   # wajib untuk POST (karena pakai cookie CSRF)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nama, email]
 *             properties:
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
 *                 email_sent: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/FormSubmission'
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', ctrl.createFormSubmission)

/**
 * @openapi
 * /api/forms:
 *   get:
 *     tags: [FormSubmission]
 *     summary: Ambil semua form submission (admin only)
 *     description: GET tidak memerlukan CSRF. Wajib login admin via cookie JWT.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         description: Filter tanggal submit mulai (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         description: Filter tanggal submit sampai (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 50
 *       - in: query
 *         name: sortBy
 *         description: Kolom sortir
 *         schema:
 *           type: string
 *           enum: [submit_date, nama, email, gramase_diinginkan, tenor_diinginkan]
 *           default: submit_date
 *       - in: query
 *         name: sortDir
 *         description: Arah sortir
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Daftar form submission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FormSubmission'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized (belum login / token hilang/invalid)
 *       403:
 *         description: Forbidden (bukan admin)
 */
router.get('/', requireAuth, ctrl.getFormSubmissions)

/**
 * @openapi
 * /api/forms/export.csv:
 *   get:
 *     tags: [FormSubmission]
 *     summary: Export semua form submission ke CSV (admin only)
 *     description: Mengembalikan file CSV berisi semua FormSubmissions. GET tidak butuh CSRF.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         description: Filter mulai tanggal (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         description: Filter sampai tanggal (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Berhasil mengunduh CSV
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: "SubmissionsID,submit_date,nama,no_telepon,email,gramase_diinginkan,tenor_diinginkan,kuantitas_diinginkan\n..."
 *       403:
 *         description: Forbidden (bukan admin)
 */
router.get('/export.csv', requireAuth, ctrl.exportFormSubmissionsCsv)

/**
 * @openapi
 * /api/forms/preview:
 *   post:
 *     tags: [Emas]
 *     summary: Preview angsuran real-time berdasarkan dp_rupiah
 *     description: POST butuh CSRF. Mengembalikan angsuran_bulanan, nominal_pembiayaan, total_angsuran.
 *     security: [ { csrfToken: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [gramase, tenor, dp_rupiah]
 *             properties:
 *               gramase: { type: integer, example: 10 }
 *               tenor: { type: integer, example: 24 }
 *               kuantitas: { type: integer, example: 2 }
 *               dp_rupiah: { type: number, example: 1500000 }
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Request invalid
 *       503:
 *         description: Harga emas hari ini belum tersedia
 */
router.post('/preview', ctrl.previewAngsuran)

module.exports = router
