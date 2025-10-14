// controllers/formSubmissionController.js
const { FormSubmission, FormSubmissionItem, sequelize } = require('../models')
const { Op } = require('sequelize')
const { calcByDpPercentMulti, todayYMDJakarta } = require('../services/angsuranCalc')

const { sendMail } = require('../services/mailer')
const {
  formSubmissionSubject,
  formSubmissionHtml,
  formSubmissionText
} = require('../services/emailTemplates')

// --- helpers ---
function csvEscape(val) {
  if (val === null || val === undefined) return ''
  const s = String(val).replace(/"/g, '""')
  return /[",\n]/.test(s) ? `"${s}"` : s
}
function isNum(x) {
  return Number.isFinite(Number(x))
}
function toNum(x) {
  return Number(x)
}

// --- CREATE: user submit form ---
// controllers/formSubmissionController.js (create)

// helper num

exports.createFormSubmission = async (req, res) => {
  try {
    const { nama, no_telepon, email, items, tenor, dp_pct } = req.body || {}

    if (!email) return res.status(400).json({ error: 'email wajib diisi' })
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items wajib array minimal 1' })
    }
    if (!isNum(tenor) || !isNum(dp_pct)) {
      return res.status(400).json({ error: 'tenor/dp_pct wajib angka' })
    }

    // Hitung simulasi SEKALI untuk total gramase dengan DP%
    const { meta, result } = await calcByDpPercentMulti({
      items,
      tenor: toNum(tenor),
      dp_pct: toNum(dp_pct)
    })

    // Ringkasan
    const total_keping = items.reduce((a, it) => a + Math.max(1, Math.floor(toNum(it.qty ?? 1))), 0)

    // Simpan master + detail dalam transaksi
    const today = todayYMDJakarta()
    let saved
    await sequelize.transaction(async (t) => {
      const master = await FormSubmission.create(
        {
          submit_date: today,
          nama,
          no_telepon,
          email,

          tenor_diinginkan: meta.tenor,
          dp_pct_submit: meta.dp_pct,

          total_gramase: meta.total_gramase,
          total_keping,
          harga_pergram_submit: meta.harga_pergram ?? null,

          dp_rupiah: result.dp_rupiah,
          angsuran_bulanan: result.angsuran_bulanan,
          total_angsuran: result.total_angsuran
        },
        { transaction: t, returning: true }
      )

      const details = items.map((it) => ({
        SubmissionID: master.SubmissionsID,
        gramase: toNum(it.gramase),
        qty: Math.max(1, Math.floor(toNum(it.qty ?? 1)))
      }))

      await FormSubmissionItem.bulkCreate(details, { transaction: t })
      saved = master
    })

    // (opsional) kirim email ringkasan
    let emailSent = false
    try {
      const payloadEmail = {
        nama,
        email,
        no_telepon,
        submit_date: today,
        gramase_diinginkan: meta.total_gramase, // untuk email lama (ringkas)
        tenor_diinginkan: meta.tenor,
        kuantitas_diinginkan: total_keping,
        nominal_pembiayaan: undefined, // kalau mau, bisa dihitung di Flask lalu ditampilkan
        total_angsuran: result.total_angsuran,
        dp_rupiah: result.dp_rupiah,
        angsuran_bulanan: result.angsuran_bulanan
      }
      await sendMail({
        to: email,
        subject: formSubmissionSubject(payloadEmail),
        html: formSubmissionHtml(payloadEmail),
        text: formSubmissionText(payloadEmail)
      })
      emailSent = true
    } catch (err) {
      console.error('Email gagal:', err?.message || err)
    }

    return res.status(201).json({
      message: 'Form berhasil disimpan',
      email_sent: emailSent,
      data: saved
    })
  } catch (e) {
    console.error(e)
    const msg = e.message || 'internal server error'
    const code = /Harga emas .* belum tersedia/.test(msg) ? 503 : 400
    return res.status(code).json({ error: msg })
  }
}

// --- GET (admin): list dengan filter & pagination ---
exports.getFormSubmissions = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const from = req.query.from
    const to = req.query.to
    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '50', 10), 1), 500)

    // tambahkan kolom2 finansial baru ke daftar yang boleh di-sort
    const ALLOWED_SORT = new Set([
      'submit_date',
      'nama',
      'email',
      'gramase_diinginkan',
      'tenor_diinginkan',
      'kuantitas_diinginkan',
      'dp_rupiah',
      'angsuran_bulanan',
      'nominal_pembiayaan',
      'total_angsuran'
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
Contoh:
GET /api/admin/forms
GET /api/admin/forms?from=2025-10-01&to=2025-10-12
GET /api/admin/forms?page=2&pageSize=25
GET /api/admin/forms?sortBy=nama&sortDir=ASC
*/

// --- EXPORT CSV (admin) ---
exports.exportFormSubmissionsCsv = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

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

    // sertakan kolom2 finansial baru
    const header = [
      'SubmissionsID',
      'submit_date',
      'nama',
      'no_telepon',
      'email',
      'gramase_diinginkan',
      'tenor_diinginkan',
      'kuantitas_diinginkan',
      'dp_rupiah',
      'angsuran_bulanan',
      'harga_pergram_submit',
      // 'dp_pct_submit', // kalau kamu tambah kolom ini
      'nominal_pembiayaan',
      'total_angsuran'
    ]

    const lines = []
    lines.push(header.join(','))

    for (const r of rows) {
      lines.push(
        [
          csvEscape(r.SubmissionsID),
          csvEscape(r.submit_date),
          csvEscape(r.nama),
          csvEscape(r.no_telepon),
          csvEscape(r.email),
          csvEscape(r.gramase_diinginkan),
          csvEscape(r.tenor_diinginkan),
          csvEscape(r.kuantitas_diinginkan),
          csvEscape(r.dp_rupiah),
          csvEscape(r.angsuran_bulanan),
          csvEscape(r.harga_pergram_submit),
          // csvEscape(r.dp_pct_submit),
          csvEscape(r.nominal_pembiayaan),
          csvEscape(r.total_angsuran)
        ].join(',')
      )
    }

    const csv = '\uFEFF' + lines.join('\n') // BOM untuk Excel
    const filename = `form_submissions-${todayYMDJakarta()}.csv`

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

// --- PREVIEW (FE live) ---
exports.previewAngsuran = async (req, res) => {
  try {
    const body = req.body || {}

    // ====== JALUR BARU: multi item + dp_pct ======
    if (Array.isArray(body.items)) {
      const tenor = toNum(body.tenor)
      const dp_pct = toNum(body.dp_pct)
      if (!isNum(tenor) || !isNum(dp_pct)) {
        return res.status(400).json({ error: 'tenor/dp_pct invalid' })
      }
      // clamp dp_pct 10..40 di service
      const { meta, result } = await calcByDpPercentMulti({
        items: body.items,
        tenor,
        dp_pct
      })
      return res.json({ ...meta, ...result })
    }

    // ====== BACKWARD-COMPAT: single item + dp_rupiah ======
    const { gramase, tenor, kuantitas, dp_rupiah } = body
    const gram = toNum(gramase)
    const ten = toNum(tenor)
    const qty = isNum(kuantitas) ? Math.max(1, Math.floor(toNum(kuantitas))) : 1
    const dp = toNum(dp_rupiah)

    if (![gram, ten, dp].every(isNum) || gram <= 0 || ten <= 0 || qty <= 0) {
      return res.status(400).json({ error: 'gramase/tenor/dp_rupiah/kuantitas invalid' })
    }

    const { meta, result } = await calcByDpRupiah({ gramase: gram, tenor: ten, qty, dp_rupiah: dp })
    return res.json({ ...meta, ...result })
  } catch (e) {
    console.error(e)
    const msg = e.message || 'internal server error'
    const code = /Harga emas .* belum tersedia/.test(msg) ? 503 : 400
    return res.status(code).json({ error: msg })
  }
}
