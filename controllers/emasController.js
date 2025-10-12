// controllers/emasController.js
const XLSX = require('xlsx')
const { Emas, sequelize } = require('../models')
const { Op } = require('sequelize')

/** =========================
 * Configurable behavior
 * ========================== */
const MODES = { UPSERT: 'upsert', SKIP: 'skip', ERROR: 'error' }
// Ubah default mode di sini (atau baca dari ENV)

/**
 * atau override via url:
 * POST /api/admin/emas/upload?mode=skip
 * POST /api/admin/emas/upload?mode=error
 * POST /api/admin/emas/upload?mode=upsert
 */

const DEFAULT_MODE = MODES.UPSERT

/** =========================
 * Helpers
 * ========================== */

// Normalisasi tanggal ke 'YYYY-MM-DD'
function toYMD(val) {
  if (val === null || val === undefined) return null

  // Excel serial number → Date
  if (typeof val === 'number') {
    const ms = Math.round((val - 25569) * 86400 * 1000)
    const jsDate = new Date(ms)
    const iso = new Date(jsDate.getTime() - jsDate.getTimezoneOffset() * 60000).toISOString()
    return iso.slice(0, 10)
  }

  // JS Date
  if (val instanceof Date) return val.toISOString().slice(0, 10)

  // String
  const s = String(val).trim()
  if (!s) return null
  const norm = s.replace(/\//g, '-').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(norm)) return null
  return norm
}

// Parse XLSX buffer → rows (array of objects) + errors
function parseXlsxToRows(fileBuffer) {
  const wb = XLSX.read(fileBuffer, { type: 'buffer' })
  if (!wb.SheetNames?.length) return { rows: [], err: 'Tidak ada sheet di file XLSX' }
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null })
  return { rows, err: null }
}

// Validasi & bentuk payload dari rows
function buildPayload(rows) {
  const errors = []
  const payload = []

  rows.forEach((r, idx) => {
    const rowNo = idx + 2 // asumsi header di baris 1
    const tanggal = toYMD(r.tanggal)
    const harga = r.harga_pergram

    if (!tanggal) {
      errors.push(`Baris ${rowNo}: kolom "tanggal" tidak valid (YYYY-MM-DD atau date Excel)`)
      return
    }
    if (harga === null || harga === undefined || isNaN(Number(harga))) {
      errors.push(`Baris ${rowNo}: kolom "harga_pergram" harus angka`)
      return
    }

    payload.push({
      tanggal,
      harga_pergram: Math.round(Number(harga)),
      input_date: new Date() // cap waktu upload
    })
  })

  return { payload, errors }
}

/** =========================
 * Controller
 * ========================== */
exports.bulkUpsertEmas = async (req, res) => {
  try {
    // Auth: admin only
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // File required
    if (!req.file) {
      return res.status(400).json({ error: 'File .xlsx wajib diunggah (field: file)' })
    }

    // Mode: query ?mode=upsert|skip|error (fallback to DEFAULT_MODE)
    const modeQ = String(req.query.mode || '').toLowerCase()
    const MODE = [MODES.UPSERT, MODES.SKIP, MODES.ERROR].includes(modeQ) ? modeQ : DEFAULT_MODE

    // Parse file
    const { rows, err: parseErr } = parseXlsxToRows(req.file.buffer)
    if (parseErr) return res.status(400).json({ error: parseErr })
    if (!rows.length)
      return res.status(400).json({ error: 'Sheet kosong atau header tidak ditemukan' })

    // Build payload
    const { payload, errors } = buildPayload(rows)
    if (!payload.length) {
      return res.status(400).json({ error: 'Tidak ada baris valid untuk diimport', errors })
    }

    // Cek data existing untuk ringkasan & handling mode
    const dates = payload.map((p) => p.tanggal)
    const existing = await Emas.findAll({
      where: { tanggal: { [Op.in]: dates } },
      attributes: ['tanggal'],
      raw: true
    })
    const existingSet = new Set(existing.map((e) => e.tanggal))

    if (MODE === MODES.ERROR && existingSet.size > 0) {
      return res.status(409).json({
        error: 'Duplikat tanggal terdeteksi',
        duplicates: [...existingSet]
      })
    }

    // Tentukan data yang akan diproses sesuai mode
    let dataToProcess = payload.map((p) => ({ ...p, input_date: new Date() }))
    if (MODE === MODES.SKIP) {
      dataToProcess = dataToProcess.filter((p) => !existingSet.has(p.tanggal))
    }

    if (!dataToProcess.length) {
      return res.status(200).json({
        mode: MODE,
        inserted: 0,
        updated: 0,
        skipped: payload.length,
        totalRows: rows.length,
        errors,
        message: 'Semua baris duplikat, tidak ada perubahan'
      })
    }

    // Eksekusi: UPSERT (atau INSERT-only saat SKIP)
    await sequelize.transaction(async (t) => {
      await Emas.bulkCreate(dataToProcess, {
        updateOnDuplicate: MODE === MODES.UPSERT ? ['harga_pergram', 'input_date'] : [],
        transaction: t
      })
    })

    // Ringkasan hasil
    const inserted = dataToProcess.filter((p) => !existingSet.has(p.tanggal)).length
    const updated =
      MODE === MODES.UPSERT ? dataToProcess.filter((p) => existingSet.has(p.tanggal)).length : 0
    const skipped = MODE === MODES.SKIP ? payload.length - inserted : 0

    return res.json({
      mode: MODE,
      inserted,
      updated,
      skipped,
      totalRows: rows.length,
      errors
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'internal server error' })
  }
}

exports.getAllEmas = async (req, res) => {
  try {
    // query params
    const from = req.query.from // YYYY-MM-DD (opsional)
    const to = req.query.to // YYYY-MM-DD (opsional)

    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '100', 10), 1), 500)

    // whitelist kolom sortable
    const ALLOWED_SORT = new Set(['tanggal', 'harga_pergram', 'input_date'])
    const sortBy = req.query.sortBy || 'tanggal'
    const sortDir = (req.query.sortDir || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const sortField = ALLOWED_SORT.has(sortBy) ? sortBy : 'tanggal'

    // where clause
    const where = {}
    if (from || to) {
      where.tanggal = {}
      if (from) where.tanggal[Op.gte] = from
      if (to) where.tanggal[Op.lte] = to
    }

    const offset = (page - 1) * pageSize

    const { rows, count } = await Emas.findAndCountAll({
      where,
      attributes: ['tanggal', 'harga_pergram', 'input_date'],
      order: [[sortField, sortDir]],
      offset,
      limit: pageSize,
      raw: true
    })

    return res.json({
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
    return res.status(500).json({ error: 'internal server error' })
  }
  /**
   * Contoh Query
   
   * Semua data (default 100 baris, terbaru dulu):
   * GET /api/emas

   * Rentang tanggal:
   * GET /api/emas?from=2025-10-01&to=2025-10-12

   * Pagination:
   * GET /api/emas?page=2&pageSize=50

   * Sort by harga naik:
   * GET /api/emas?sortBy=harga_pergram&sortDir=ASC
   */
}
