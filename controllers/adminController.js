const bcrypt = require('bcryptjs')
const { Admin } = require('../models')
const jwt = require('jsonwebtoken')
const isProd = process.env.NODE_ENV === 'production'

exports.create = async (req, res) => {
  try {
    const { username, password } = req.body

    // validasi sederhana
    if (!username || !password) {
      return res.status(400).json({ error: 'username dan password wajib diisi' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password minimal 6 karakter' })
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10)

    // simpan
    const admin = await Admin.create({
      username: username, // kolom di model kamu: "username"
      password: hashed // AdminID auto-UUID dari model
    })

    // jangan kirim hash ke client
    const { AdminID } = admin
    return res.status(201).json({
      message: 'Admin created',
      data: { AdminID, username: username }
    })
  } catch (err) {
    // unique constraint
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'username sudah dipakai' })
    }
    console.error(err)
    return res.status(500).json({ error: 'internal server error' })
  }
}

exports.list = async (_req, res) => {
  const rows = await Admin.findAll({ attributes: ['AdminID', ['username', 'username']] })
  res.json(rows)
}

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'username & password wajib diisi' })
    }

    const admin = await Admin.findOne({ where: { username: username } })
    if (!admin) return res.status(401).json({ error: 'username atau password salah' })

    const ok = await bcrypt.compare(password, admin.password || '')
    if (!ok) return res.status(401).json({ error: 'username atau password salah' })

    const payload = { sub: admin.AdminID, username: admin.username, role: 'admin' }
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || '1d'
    })

    // Set cookie HttpOnly (penting untuk CSRF pattern)
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000, // 1 hari
      path: '/'
    })

    return res.json({
      message: 'Login sukses',
      user: { AdminID: admin.AdminID, username: admin.username }
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'internal server error' })
  }
}

exports.logout = async (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/'
  })
  return res.json({ message: 'Logged out' })
}

exports.me = async (req, res) => {
  // req.user diset oleh middleware requireAuth
  return res.json({ user: req.user })
}
