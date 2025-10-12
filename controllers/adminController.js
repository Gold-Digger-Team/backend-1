const bcrypt = require('bcryptjs')
const { sequelize, Admin, FormSubmission } = require('../models')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')
const isProd = process.env.NODE_ENV === 'production'

function csvEscape(val) {
  if (val === null || val === undefined) return ''
  const s = String(val).replace(/"/g, '""')
  // jika ada koma/kutip/linebreak → bungkus dengan kutip ganda
  return /[",\n]/.test(s) ? `"${s}"` : s
}

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

exports.getFormSubmissions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const rows = await FormSubmission.findAll({ order: [['order_date', 'DESC']] })
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'internal server error' })
  }
}

exports.exportFormSubmissionsCsv = async (req, res) => {
  try {
    // pastikan admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // (opsional) filter tanggal via query ?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
    const { dateFrom, dateTo } = req.query
    const where = {}
    if (dateFrom || dateTo) {
      where.submit_date = {}
      if (dateFrom) where.submit_date[Op.gte] = dateFrom
      if (dateTo) where.submit_date[Op.lte] = dateTo
    }

    const rows = await FormSubmission.findAll({
      where,
      order: [['submit_date', 'DESC']],
      raw: true
    })

    // header kolom (urut sesuai kebutuhan)
    const header = [
      'SubmissionsID',
      'submit_date',
      'nama',
      'no_telepon',
      'email',
      'gramase_diinginkan',
      'tenor_diinginkan',
      'kuantitas_diinginkan'
    ]

    const lines = []
    lines.push(header.join(','))

    for (const r of rows) {
      lines.push(
        [
          csvEscape(r.SubmissionsID),
          csvEscape(r.submit_date), // DATEONLY
          csvEscape(r.nama),
          csvEscape(r.no_telepon),
          csvEscape(r.email),
          csvEscape(r.gramase_diinginkan),
          csvEscape(r.tenor_diinginkan),
          csvEscape(r.kuantitas_diinginkan)
        ].join(',')
      )
    }

    // BOM untuk kompatibilitas Excel
    const csv = '\uFEFF' + lines.join('\n')
    const filename = `form_submissions-${new Date().toISOString().slice(0, 10)}.csv`

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    })
    return res.send(csv)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'internal server error' })
  }
}
