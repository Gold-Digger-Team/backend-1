const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const path = require('path')
require('dotenv').config()

const adminRoutes = require('./routes/adminRoute')
const formSubmissionRoutes = require('./routes/formSubmissionRoute')
const emasRoutes = require('./routes/emasRoute')
const rekomendasiRoutes = require('./routes/rekomendasiRoute')
const simulasiCilemRoutes = require('./routes/simulasiCilemRoute')
const cookieOptions = require('./config/cookie')

const csrfDisabled = process.env.CSRF_DISABLED === 'true'

const { startAngsuranCron } = require('./cron/angsuranCron')
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const swaggerUi = require('swagger-ui-express')
let specs = {}
try {
  specs = require(path.join(__dirname, 'docs', 'swagger')).specs
} catch (e) {
  console.warn('[WARN] Swagger spec not loaded:', e.message)
}

const app = express()

console.log('[BOOT] Allowed CORS origins:', allowed.length ? allowed.join(', ') : '(empty)')
console.log(`[BOOT] Cookie options: secure=${cookieOptions.secure} sameSite=${cookieOptions.sameSite}`)

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true)
      return cb(new Error('Not allowed by CORS'))
    },
    credentials: true
  })
)

app.set('trust proxy', 1)
app.use(cookieParser())
app.use(express.json())

// === CSRF setup (toggle by ENV) ===
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure
  }
})

// No-op middleware saat CSRF dimatikan
const csrfBypass = (req, _res, next) => {
  // sediakan fungsi supaya FE tetap bisa panggil req.csrfToken()
  req.csrfToken = () => 'csrf-disabled'
  next()
}

/**
 * @openapi
 * /csrf-token:
 *   get:
 *     tags: [Auth]
 *     summary: Ambil CSRF token (double-submit cookie pattern)
 *     description: Mengembalikan token untuk dikirim pada header `X-CSRF-Token` saat request write ke /api.
 *     responses:
 *       200:
 *         description: CSRF token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 *                   example: "abc123csrf..."
 */
app.get('/csrf-token', csrfDisabled ? csrfBypass : csrfProtection, (req, res) => {
  const token = req.csrfToken()
  console.log('[CSRF] Token generated:', token.substring(0, 10) + '...', 'Origin:', req.get('origin'))
  res.json({ csrfToken: token })
})

// Proteksi semua endpoint write di bawah /api hanya jika CSRF aktif
if (!csrfDisabled) {
  app.use('/api', csrfProtection)
} else {
  console.warn('CSRF protection DISABLED via env (CSRF_DISABLED=true)')
}

// Routes
app.use('/api/admin', adminRoutes)
app.use('/api/forms', formSubmissionRoutes)
app.use('/api/emas', emasRoutes)
app.use('/api/rekomendasi', rekomendasiRoutes)
app.use('/api/simulasi', simulasiCilemRoutes)

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('[CSRF] Invalid token:', {
      method: req.method,
      path: req.path,
      origin: req.get('origin'),
      csrfHeader: req.get('x-csrf-token') || req.get('csrf-token'),
      hasCookie: !!req.cookies._csrf
    })
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
  next(err)
})

startAngsuranCron()

if (specs && Object.keys(specs).length) {
  app.get('/docs.json', (_req, res) => res.json(specs))
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }))
} else {
  app.get('/docs', (_req, res) => res.status(503).send('Docs not available'))
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API running on :${PORT}`))
