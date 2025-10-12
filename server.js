const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
require('dotenv').config()

const adminRoutes = require('./routes/adminRoute')
const formSubmissionRoutes = require('./routes/formSubmissionRoute')
const emasRoutes = require('./routes/emasRoute')
const rekomendasiRoutes = require('./routes/rekomendasiRoute')

const { startAngsuranCron } = require('./cron/angsuranCron')

const swaggerUi = require('swagger-ui-express') // ESM: import swaggerUi from 'swagger-ui-express';
const { specs } = require('./docs/swagger') // ESM: import { specs } from './swagger.js';

const isProd = process.env.NODE_ENV === 'production'
const app = express()

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:8000'],
    credentials: true
  })
)

app.use(cookieParser())
app.use(express.json())

// CSRF cookie (double-submit) — cookie diset, token diambil via /csrf-token
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd
  }
})

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
// Endpoint ambil token (GET aman)
app.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

// Proteksi semua endpoint write di bawah /api (POST/PUT/PATCH/DELETE)
app.use('/api', csrfProtection)

// Routes
app.use('/api/admin', adminRoutes) // contoh: crud admin milik kamu

app.use('/api/forms', formSubmissionRoutes)

app.use('/api/emas', emasRoutes)

app.use('/api/rekomendasi', rekomendasiRoutes)

app.use
// CSRF error handler rapi
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
  next(err)
})
startAngsuranCron()

// Endpoint JSON OpenAPI (opsional, berguna buat tooling/CI)
app.get('/docs.json', (_req, res) => res.json(specs))

// Swagger UI
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true
  })
)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API running on :${PORT}`))
