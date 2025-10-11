const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
require('dotenv').config()

const adminRoutes = require('./routes/adminRoute')
const authRoutes = require('./routes/formSubmission') // <-- abaikan ini, hanya contoh placeholder
const authRouter = require('./routes/authRoute') // <-- kita tambahkan di langkah 4

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

// Endpoint ambil token (GET aman)
app.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

// Proteksi semua endpoint write di bawah /api (POST/PUT/PATCH/DELETE)
app.use('/api', csrfProtection)

// Routes
app.use('/api/auth', authRouter) // <-- login/logout/me
app.use('/api/admins', adminRoutes) // contoh: crud admin milik kamu
// app.use('/api/emas', emasRoutes)    // dst.

// CSRF error handler rapi
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
  next(err)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API running on :${PORT}`))
