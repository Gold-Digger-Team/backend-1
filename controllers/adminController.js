const bcrypt = require('bcryptjs')
const { sequelize, Admin } = require('../models')
const jwt = require('jsonwebtoken')

const isProd = process.env.NODE_ENV === 'production'

exports.create = async (req, res) => {
  try {
    const { id_admin, password } = req.body

    // validasi sederhana
    if (!id_admin || !password) {
      return res.status(400).json({ error: 'id dan password wajib diisi' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password minimal 6 karakter' })
    }

    // hash password
    const hashed = await bcrypt.hash(password, 10)

    // simpan
    const admin = await Admin.create({
      id: id_admin, // kolom di model kamu: "id"
      password: hashed // AdminID auto-UUID dari model
    })

    // jangan kirim hash ke client
    const { AdminID, id } = admin
    return res.status(201).json({
      message: 'Admin created',
      data: { AdminID, id: id_admin }
    })
  } catch (err) {
    // unique constraint
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'id sudah dipakai' })
    }
    console.error(err)
    return res.status(500).json({ error: 'internal server error' })
  }
}

exports.list = async (_req, res) => {
  const rows = await Admin.findAll({ attributes: ['AdminID', ['id', 'id_admin']] })
  res.json(rows)
}

exports.login = async (req, res) => {
  try {
    const { id_admin, password } = req.body
    if (!id_admin || !password) {
      return res.status(400).json({ error: 'id & password wajib diisi' })
    }

    const admin = await Admin.findOne({ where: { id: id_admin } })
    if (!admin) return res.status(401).json({ error: 'ID atau password salah' })

    const ok = await bcrypt.compare(password, admin.password || '')
    if (!ok) return res.status(401).json({ error: 'ID atau password salah' })

    const payload = { sub: admin.AdminID, id_admin: admin.id, role: 'admin' }
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

    return res.json({ message: 'Login sukses', user: { id: admin.AdminID, id_admin: admin.id } })
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
