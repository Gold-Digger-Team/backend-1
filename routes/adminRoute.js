const router = require('express').Router()
const ctrl = require('../controllers/adminController')
const requireAuth = require('../middlewares/requireAuth')

/**
 * @openapi
 * /api/admin/signup:
 *   post:
 *     tags: [Admin]
 *     summary: Buat admin baru
 *     security:
 *       - csrfToken: []   # karena semua POST di bawah /api diproteksi CSRF
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AdminCreateRequest' }
 *     responses:
 *       201:
 *         description: Berhasil membuat admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AdminCreateResponse' }
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: username sudah dipakai
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Error server
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/signup', ctrl.create)

/**
 * @openapi
 * /api/admin:
 *   get:
 *     tags: [Admin]
 *     summary: List admin (AdminID, username)
 *     responses:
 *       200:
 *         description: Daftar admin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/AdminListItem' }
 */
router.get('/', ctrl.list)

/**
 * @openapi
 * /api/admin/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login admin (set-cookie HttpOnly `token`)
 *     security:
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Login sukses (cookie `token` diset)
 *         headers:
 *           Set-Cookie:
 *             description: JWT HttpOnly cookie bernama `token`
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       400:
 *         description: Body tidak lengkap
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Kredensial salah
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Error server
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login', ctrl.login)

/**
 * @openapi
 * /api/admin/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (clear cookie `token`)
 *     security:
 *       - csrfToken: []
 *     responses:
 *       200:
 *         description: Berhasil logout
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
 */
router.post('/logout', ctrl.logout)

/**
 * @openapi
 * /api/admin/me:
 *   get:
 *     tags: [Auth]
 *     summary: Info user saat ini
 *     description: Mengembalikan `req.user` yang diisi oleh middleware `requireAuth`.
 *     security:
 *       - cookieAuth: []   # GET tidak perlu CSRF
 *     responses:
 *       200:
 *         description: Profil user dari req.user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MeResponse' }
 *       401:
 *         description: Tidak terautentik (token hilang/invalid)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/me', requireAuth, ctrl.me)

/**
 * @openapi
 * /api/admin/forms:
 *   get:
 *     tags: [Admin]
 *     summary: Ambil semua form submission
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/forms', requireAuth, ctrl.getFormSubmissions)

/**
 * @openapi
 * /api/admin/forms/export.csv:
 *   get:
 *     tags: [Admin]
 *     summary: Export semua form submission ke CSV (admin only)
 *     description: Mengembalikan file CSV berisi semua FormSubmissions. GET **tidak** butuh CSRF.
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         description: Filter mulai tanggal (YYYY-MM-DD)
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         description: Filter sampai tanggal (YYYY-MM-DD)
 *         schema: { type: string, format: date }
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
router.get('/forms/export.csv', requireAuth, ctrl.exportFormSubmissionsCsv)

module.exports = router
