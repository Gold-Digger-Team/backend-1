// services/angsuranCalc.js
const { Emas } = require('../models')
const { hitungAngsuranFlask } = require('./flaskClient')

function todayYMDJakarta() {
  const now = new Date()
  const tzOffsetMs = 7 * 60 * 60 * 1000
  const jkt = new Date(now.getTime() + tzOffsetMs)
  return jkt.toISOString().slice(0, 10)
}

/**
 * Hitung angsuran berbasis dp_rupiah (bukan dp_pct)
 * - Ambil harga emas hari ini
 * - Konversi dp_rupiah => dp_pct dari total harga (gramase * qty * harga_pergram)
 * - Panggil Flask dengan dp_pct (dinamis)
 * - Kembalikan angka untuk ditampilkan / disimpan
 */
async function calcByDpRupiah({ gramase, tenor, qty = 1, dp_rupiah }) {
  if (!Number.isFinite(gramase) || gramase <= 0) throw new Error('gramase invalid')
  if (!Number.isFinite(tenor) || tenor <= 0) throw new Error('tenor invalid')
  if (!Number.isFinite(qty) || qty <= 0) throw new Error('kuantitas invalid')
  if (!Number.isFinite(dp_rupiah) || dp_rupiah < 0) throw new Error('dp_rupiah invalid')

  const today = todayYMDJakarta()
  const hargaToday = await Emas.findByPk(today, { attributes: ['harga_pergram'], raw: true })
  if (!hargaToday) throw new Error(`Harga emas ${today} belum tersedia`)

  const harga_pergram = Number(hargaToday.harga_pergram)
  const hargaBruto = harga_pergram * gramase * qty

  // clamp DP 0..hargaBruto
  const dpClamped = Math.min(Math.max(dp_rupiah, 0), hargaBruto)
  const dp_pct = (dpClamped / hargaBruto) * 100

  // Call Flask untuk dapat angsuran bulanan per unit (asumsi per unit; kalau Flask sudah support qty, sesuaikan)
  const nominalPerUnit = await hitungAngsuranFlask({ gramase, tenor, dp_pct })
  const angsuran_bulanan = Math.round(nominalPerUnit * qty) // total per bulan (kalikan qty)

  const nominal_pembiayaan = Math.max(Math.round(hargaBruto - dpClamped), 0)
  const total_angsuran = Math.round(angsuran_bulanan * tenor + dpClamped)

  return {
    meta: {
      today,
      harga_pergram,
      hargaBruto,
      dp_pct: +dp_pct.toFixed(4), // buat info ke FE
      dp_rupiah: dpClamped
    },
    result: {
      angsuran_bulanan,
      nominal_pembiayaan,
      total_angsuran
    }
  }
}

module.exports = { calcByDpRupiah, todayYMDJakarta }
