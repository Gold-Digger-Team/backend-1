const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { Admin } = require('../models')

const isProd = process.env.NODE_ENV === 'production'

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
