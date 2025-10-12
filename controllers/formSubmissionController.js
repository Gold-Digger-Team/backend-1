const { FormSubmission, sequelize } = require('../models')
const { Op } = require('sequelize')

function csvEscape(val) {
  if (val === null || val === undefined) return ''
  const s = String(val).replace(/"/g, '""')
  // jika ada koma/kutip/linebreak → bungkus dengan kutip ganda
  return /[",\n]/.test(s) ? `"${s}"` : s
}

exports.createFormSubmission = async (req, res) => {
  try {
    const { nama, no_telepon, email, gramase_diinginkan, tenor_diinginkan, kuantitas_diinginkan } =
      req.body

    // validasi sederhana
    if (!nama || !email) {
      return res.status(400).json({ error: 'nama dan email wajib diisi' })
    }

    // buat tanggal submit otomatis (format YYYY-MM-DD)
    const submit_date = new Date().toISOString().split('T')[0]

    const form = await FormSubmission.create({
      submit_date,
      nama,
      no_telepon,
      email,
      gramase_diinginkan,
      tenor_diinginkan,
      kuantitas_diinginkan
    })

    return res.status(201).json({
      message: 'Form berhasil disimpan',
      data: form
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'internal server error' })
  }
}

exports.getFormSubmissions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Query params
    const from = req.query.from
    const to = req.query.to
    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '50', 10), 1), 500)

    const ALLOWED_SORT = new Set([
      'submit_date',
      'nama',
      'email',
      'gramase_diinginkan',
      'tenor_diinginkan'
    ])
    const sortBy = req.query.sortBy || 'submit_date'
    const sortDir = (req.query.sortDir || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const sortField = ALLOWED_SORT.has(sortBy) ? sortBy : 'submit_date'

    const where = {}
    if (from || to) {
      where.submit_date = {}
      if (from) where.submit_date[Op.gte] = from
      if (to) where.submit_date[Op.lte] = to
    }

    const offset = (page - 1) * pageSize

    const { rows, count } = await FormSubmission.findAndCountAll({
      where,
      order: [[sortField, sortDir]],
      offset,
      limit: pageSize,
      raw: true
    })

    res.json({
      data: rows,
      meta: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize),
        sortBy: sortField,
        sortDir,
        from: from || undefined,
        to: to || undefined
      }
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'internal server error' })
  }
}
/**
 * Contoh pemakaian get all dengan filter, pagination, sorting:
 * Semua form submission (default 50 baris, terbaru dulu):
GET /api/admin/forms

Filter berdasarkan tanggal submit:
GET /api/admin/forms?from=2025-10-01&to=2025-10-12

Pagination:
GET /api/admin/forms?page=2&pageSize=25

Urutkan berdasarkan nama:
GET /api/admin/forms?sortBy=nama&sortDir=ASC
 */

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
