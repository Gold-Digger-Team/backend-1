// services/angsuranService.js
const { hitungSimulasiCilem } = require('../services/flaskClient')
const { Angsuran, Emas, sequelize } = require('../models')
const { Op } = require('sequelize')

const DP_FIXED = 10
const GRAMASE = [5, 10, 25, 50, 100]
const TENOR = [12, 24, 36, 48, 60]

function combos() {
  const arr = []
  for (const g of GRAMASE) for (const t of TENOR) arr.push({ gramase: g, tenor: t })
  return arr
}

function todayYMDJakarta() {
  const now = new Date()
  const tzOffsetMs = 7 * 60 * 60 * 1000
  const jkt = new Date(now.getTime() + tzOffsetMs)
  return jkt.toISOString().slice(0, 10)
}

async function isTodayPriceReady() {
  const today = todayYMDJakarta()
  const row = await Emas.findOne({ where: { tanggal: today }, raw: true })
  return !!row
}

async function refreshAngsuranToday() {
  const dp = DP_FIXED //dp tetap 10% dalam percent
  const pairs = combos()
  const now = new Date()
  const results = []

  const BATCH = 5
  for (let i = 0; i < pairs.length; i += BATCH) {
    const chunk = await Promise.all(
      pairs.slice(i, i + BATCH).map(async ({ gramase, tenor }) => {
        // Kirim is_percentage:true  → Flask balikin angsuran_bulanan, dp_rupiah, total_angsuran
        const resp = await hitungSimulasiCilem({ gramase, tenor, dp, is_percentage: true })
        const angsuran_bulanan = Number(resp?.nominal_angsuran) || 0
        const dp_rupiah = Number(resp?.dp_rp) || 0
        const total_angsuran = Number(resp?.total_angsuran)
        const totalSafe = Number.isFinite(total_angsuran)
          ? total_angsuran
          : Math.round(angsuran_bulanan * tenor + dp_rupiah)

        return {
          gramase,
          tenor,
          dp,
          nominal: angsuran_bulanan, // cache angsuran per bulan
          dp_rupiah,
          total_angsuran: totalSafe,
          updated_at: now
        }
      })
    )
    results.push(...chunk)
  }

  await sequelize.transaction(async (t) => {
    await Angsuran.bulkCreate(results, {
      updateOnDuplicate: ['nominal', 'dp_rupiah', 'total_angsuran', 'updated_at'],
      transaction: t
    })
  })

  return results
}

async function get25ForToday({ warmupIfMissing = false } = {}) {
  const where = { dp_pct: DP_FIXED }
  const order = [
    ['gramase', 'ASC'],
    ['tenor', 'ASC']
  ]
  const attrs = ['gramase', 'tenor', 'dp_pct', 'nominal', 'dp_rupiah', 'total_angsuran']

  let rows = await Angsuran.findAll({ where, order, attributes: attrs, raw: true })
  if (rows.length === 25 || !warmupIfMissing) return rows

  await refreshAngsuranToday()
  rows = await Angsuran.findAll({ where, order, attributes: attrs, raw: true })
  return rows
}

function toDictionary(rows) {
  // dictionary tetap: key → angsuran bulanan
  return Object.fromEntries(rows.map((r) => [`${r.gramase}g x ${r.tenor}`, r.nominal]))
}

function nearestK(target, rows, k = 3) {
  return rows
    .map((r) => ({ ...r, diff: Math.abs(r.nominal - target) }))
    .sort((a, b) => a.diff - b.diff || a.nominal - b.nominal)
    .slice(0, k)
    .map(({ gramase, tenor, nominal, diff, dp_rupiah, total_angsuran }) => ({
      key: `${gramase}g x ${tenor}`,
      gramase,
      tenor,
      nominal, // angsuran per bulan
      dp_rupiah: dp_rupiah || 0, // dari Flask yang dicache
      total_angsuran: total_angsuran, // dari Flask (fallback sudah saat refresh)
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
