// services/angsuranCalc.js
const { hitungSimulasiCilem } = require('../services/flaskClient')
const { Emas } = require('../models') // opsional hanya untuk meta display

function todayYMDJakarta() {
  const now = new Date()
  const jkt = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return jkt.toISOString().slice(0, 10)
}

// helper validasi
function isNum(x) {
  return Number.isFinite(Number(x))
}
function toNum(x) {
  return Number(x)
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('items harus array minimal 1')
  return items.map((it, idx) => {
    const gram = toNum(it.gramase)
    const qty = Math.max(1, Math.floor(toNum(it.qty ?? it.kuantitas ?? 1)))
    if (!isNum(gram) || gram <= 0) throw new Error(`items[${idx}].gramase invalid`)
    if (!isNum(qty) || qty <= 0) throw new Error(`items[${idx}].qty invalid`)
    return { gramase: gram, qty }
  })
}

/**
 * Preview/Hitung angsuran berbasis DP % untuk banyak item:
 * - items: [{ gramase, qty }, ...]
 * - tenor: bulan
 * - dp_pct: persen (10..40) → di-CLAMP agar aman
 *
 * NOTE: Menggunakan hitungSimulasiCilem (Flask) dengan is_percentage: true
 *       dan total_gramase = sum(gramase_i * qty_i).
 */
async function calcByDpPercentMulti({ items, tenor, dp_pct }) {
  const normItems = normalizeItems(items)
  const ten = toNum(tenor)
  if (!isNum(ten) || ten <= 0) throw new Error('tenor invalid')

  // clamp DP% (server-side safety)
  let dp = toNum(dp_pct)
  if (!isNum(dp)) throw new Error('dp_pct invalid')
  dp = Math.max(10, Math.min(40, dp)) // 10..40%

  // total gramase (semua item)
  const totalGramase = normItems.reduce((acc, it) => acc + it.gramase * it.qty, 0)

  // opsional: ambil harga emas hari ini hanya untuk meta (display)
  const today = todayYMDJakarta()
  let harga_pergram = null
  try {
    const hargaToday = await Emas.findByPk(today, { attributes: ['harga_pergram'], raw: true })
    if (hargaToday) harga_pergram = Number(hargaToday.harga_pergram)
  } catch {}

  // panggil Flask SEKALI dengan total gramase & dp % (percent mode)
  const resp = await hitungSimulasiCilem({
    gramase: totalGramase,
    tenor: ten,
    dp,
    is_percentage: true
  })
  const angsuran_bulanan = Math.round(Number(resp?.nominal_angsuran) || 0)
  const total_angsuran = Math.round(Number(resp?.total_angsuran) || 0)
  const dp_rupiah = Math.round(Number(resp?.dp_rp) || 0)

  // buat breakdown opsional per item (proporsional by berat, kalau mau dipakai FE)
  const breakdown = normItems.map((it) => {
    const p = (it.gramase * it.qty) / totalGramase
    return {
      gramase: it.gramase,
      qty: it.qty,
      proporsi: +p.toFixed(6),
      // angsuran & dp per item (hanya untuk display, tidak dipakai hitungan final)
      angsuran_bulanan_item: Math.round(angsuran_bulanan * p),
      dp_rupiah_item: Math.round(dp_rupiah * p)
    }
  })

  return {
    meta: {
      today,
      harga_pergram: harga_pergram ?? undefined,
      dp_pct: dp,
      tenor: ten,
      total_gramase: totalGramase,
      items: normItems
    },
    result: {
      angsuran_bulanan,
      total_angsuran,
      dp_rupiah,
      breakdown
    }
  }
}

/**
 * BACKWARD-COMPAT:
 * versi lama (single item, dp_rupiah) — tetap disediakan jika ada endpoint lama yang pakai.
 * Disarankan migrasi FE ke calcByDpPercentMulti untuk kasus multi-item + dp%.
 */
async function calcByDpRupiah({ gramase, tenor, qty = 1, dp_rupiah }) {
  if (!Number.isFinite(gramase) || gramase <= 0) throw new Error('gramase invalid')
  if (!Number.isFinite(tenor) || tenor <= 0) throw new Error('tenor invalid')
  if (!Number.isFinite(qty) || qty <= 0) throw new Error('kuantitas invalid')
  if (!Number.isFinite(dp_rupiah) || dp_rupiah < 0) throw new Error('dp_rupiah invalid')

  // untuk menjaga kompatibilitas lama, kita panggil Flask per total gramase juga (qty digabung ke gramase)
  const totalGramase = gramase * qty
  const today = todayYMDJakarta()
  let harga_pergram = null
  try {
    const hargaToday = await Emas.findByPk(today, { attributes: ['harga_pergram'], raw: true })
    if (hargaToday) harga_pergram = Number(hargaToday.harga_pergram)
  } catch {}

  // konversi dp_rupiah -> dp_pct relatif ke total (pakai harga per gram jika ada; kalau tidak, tetap kirim dp % dari nilai dp/total_harga_emas versi Flask)
  // karena hitungSimulasiCilem juga punya harga internal, paling aman: kirim dp sebagai PERSEN relatif terhadap harga internal.
  // maka kita transform dp_rupiah → dp_pct dengan basis harga_internal di Flask tidak diketahui — sulit konsisten.
  // **saran**: untuk jalur lama ini, lebih aman *langsung* kirim dp sebagai NOMINAL (is_percentage:false).
  const resp = await hitungSimulasiCilem({
    gramase: totalGramase,
    tenor,
    dp: dp_rupiah,
    is_percentage: false
  })

  const angsuran_bulanan = Math.round(Number(resp?.nominal_angsuran) || 0)
  const total_angsuran = Math.round(Number(resp?.total_angsuran) || 0)
  const dp_rp_used = Math.round(Number(resp?.dp_rp) || 0)

  return {
    meta: {
      today,
      harga_pergram: harga_pergram ?? undefined,
      tenor,
      total_gramase: totalGramase,
      dp_rupiah: dp_rp_used
    },
    result: {
      angsuran_bulanan,
      total_angsuran
    }
  }
}

module.exports = { calcByDpPercentMulti, calcByDpRupiah, todayYMDJakarta }
