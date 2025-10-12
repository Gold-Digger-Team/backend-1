// routes/rekomendasiRoute.js
const router = require('express').Router()
const ctrl = require('../controllers/rekomendasiController')
const requireAuth = require('../middlewares/requireAuth')
const {
  isTodayPriceReady,
  refreshAngsuranToday,
  todayYMDJakarta
} = require('../services/angsuranService')

/**
 * @openapi
 * /api/rekomendasi:
 *   post:
 *     tags: [Emas]
 *     summary: Rekomendasi cicil emas (DP 10%) – 3 risk level × 3 nearest
 *     security: [ { csrfToken: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [penghasilan, pengeluaran]
 *             properties:
 *               penghasilan: { type: number, example: 7000000 }
 *               pengeluaran: { type: number, example: 4000000 }
 *     responses:
 *       200: { description: OK }
 *       503: { description: Cache belum tersedia (harus refresh harian) }
 */
router.post('/', ctrl.rekomendasiCicilEmas)

/**
 * @openapi
 * /api/rekomendasi/angsuran/refresh-today:
 *   post:
 *     tags: [Angsuran]
 *     summary: Paksa refresh cache angsuran DP 10% (hari ini)
 *     security: [ { cookieAuth: [] }, { csrfToken: [] } ]
 *     responses:
 *       200: { description: OK }
 *       400: { description: Harga emas hari ini belum ada }
 */
router.post('/angsuran/refresh-today', requireAuth, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  const today = todayYMDJakarta()
  if (!(await isTodayPriceReady())) {
    return res.status(400).json({ error: `Harga emas untuk ${today} belum diinput` })
  }
  const rows = await refreshAngsuranToday()
  res.json({ message: 'Refreshed', count: rows.length, dp_pct: 10, date: today })
})

module.exports = router
