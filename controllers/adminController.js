const bcrypt = require('bcryptjs')
const { sequelize, Admin } = require('../models')

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
