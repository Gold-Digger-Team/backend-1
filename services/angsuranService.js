// services/angsuranService.js
const { Angsuran, Emas, sequelize } = require('../models')
const { Op } = require('sequelize')
const { hitungAngsuranFlask } = require('./flaskClient')

const DP_FIXED = 10
const GRAMASE = [5, 10, 25, 50, 100]
const TENOR = [12, 24, 36, 48, 60]

function combos() {
  const arr = []
  for (const g of GRAMASE) for (const t of TENOR) arr.push({ gramase: g, tenor: t })
  return arr
}

function todayYMDJakarta() {
  // ambil tanggal Asia/Jakarta sebagai YYYY-MM-DD
  const now = new Date()
  const tzOffsetMs = 7 * 60 * 60 * 1000 // WIB +07:00 (cukup untuk date-only)
  const jkt = new Date(now.getTime() + tzOffsetMs)
  return jkt.toISOString().slice(0, 10)
}

async function isTodayPriceReady() {
  const today = todayYMDJakarta()
  const row = await Emas.findOne({ where: { tanggal: today }, raw: true })
  return !!row
}

async function refreshAngsuranToday() {
  const dp_pct = DP_FIXED
  const pairs = combos()
  const now = new Date()
  const results = []

  const BATCH = 5
  for (let i = 0; i < pairs.length; i += BATCH) {
    const chunk = await Promise.all(
      pairs.slice(i, i + BATCH).map(async ({ gramase, tenor }) => {
        const nominal = await hitungAngsuranFlask({ gramase, tenor, dp_pct })
        return { gramase, tenor, dp_pct, nominal, updated_at: now }
      })
    )
    results.push(...chunk)
  }

  await sequelize.transaction(async (t) => {
    await Angsuran.bulkCreate(results, {
      updateOnDuplicate: ['nominal', 'updated_at'],
      transaction: t
    })
  })

  return results
}

async function get25ForToday({ warmupIfMissing = false } = {}) {
  const rows = await Angsuran.findAll({
    where: { dp_pct: DP_FIXED },
    order: [
      ['gramase', 'ASC'],
      ['tenor', 'ASC']
    ],
    raw: true
  })
  if (rows.length === 25 || !warmupIfMissing) return rows
  await refreshAngsuranToday()
  return Angsuran.findAll({
    where: { dp_pct: DP_FIXED },
    order: [
      ['gramase', 'ASC'],
      ['tenor', 'ASC']
    ],
    raw: true
  })
}

function toDictionary(rows) {
  return Object.fromEntries(rows.map((r) => [`${r.gramase}g x ${r.tenor}`, r.nominal]))
}

function nearestK(target, rows, k = 3) {
  return rows
    .map((r) => ({ ...r, diff: Math.abs(r.nominal - target) }))
    .sort((a, b) => a.diff - b.diff || a.nominal - b.nominal)
    .slice(0, k)
    .map(({ gramase, tenor, nominal, diff }) => ({
      key: `${gramase}g x ${tenor}`,
      gramase,
      tenor,
      nominal,
      diff
    }))
}

module.exports = {
  DP_FIXED,
  GRAMASE,
  TENOR,
  isTodayPriceReady,
  refreshAngsuranToday,
  get25ForToday,
  toDictionary,
  nearestK,
  todayYMDJakarta
}
