const router = require('express').Router()
const requireAuth = require('../middlewares/requireAuth')
const emasCtrl = require('../controllers/emasController')
const { bulkUpsertEmas } = require('../controllers/emasController')
const multer = require('multer')

// simpan di memory (nggak ke disk), batasi 2MB & hanya .xlsx
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.toLowerCase().endsWith('.xlsx')
    cb(ok ? null : new Error('File harus .xlsx'), ok)
  }
})

/**
 * @openapi
 * /api/admin/emas/upload:
 *   post:
 *     tags: [Admin]
 *     summary: Upload harga emas harian via file XLSX (upsert by tanggal)
 *     description: File harus memiliki kolom header `tanggal` (YYYY-MM-DD) dan `harga_pergram` (number).
 *     security: [{ cookieAuth: [] }, { csrfToken: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Ringkasan hasil import
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inserted: { type: integer, example: 25 }
 *                 updated: { type: integer, example: 5 }
 *                 totalRows: { type: integer, example: 30 }
 *                 errors:
 *                   type: array
 *                   items: { type: string }
 */
router.post('/upload', requireAuth, upload.single('file'), bulkUpsertEmas)

/**
 * @openapi
 * /api/emas:
 *   get:
 *     tags: [Emas]
 *     summary: Ambil daftar harga emas
 *     description: Endpoint publik untuk mengambil harga emas harian. GET tidak membutuhkan CSRF.
 *     parameters:
 *       - in: query
 *         name: from
 *         description: Filter tanggal mulai (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         description: Filter tanggal sampai (YYYY-MM-DD)
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
 *           default: 100
 *       - in: query
 *         name: sortBy
 *         description: Kolom sortir
 *         schema:
 *           type: string
 *           enum: [tanggal, harga_pergram, input_date]
 *           default: tanggal
 *       - in: query
 *         name: sortDir
 *         description: Arah sortir
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmasRecord'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/', emasCtrl.getAllEmas)

module.exports = router
