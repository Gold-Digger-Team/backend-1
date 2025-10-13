const { get25ForToday, toDictionary, nearestK, DP_FIXED } = require('../services/angsuranService')

exports.rekomendasiCicilEmas = async (req, res) => {
  try {
    const { penghasilan, pengeluaran } = req.body || {}
    const income = Number(penghasilan)
    const expense = Number(pengeluaran)
    if (!Number.isFinite(income) || !Number.isFinite(expense)) {
      return res.status(400).json({ error: 'penghasilan & pengeluaran wajib angka' })
    }
    const disposable = Math.max(income - expense, 0)

    const rows = await get25ForToday({ warmupIfMissing: false })
    if (rows.length !== 25) {
      return res.status(503).json({
        error: 'Cache angsuran hari ini belum tersedia',
        hint: 'Pastikan harga emas hari ini sudah diinput dan tunggu cron 08:00 atau trigger refresh manual.'
      })
    }

    const dict = toDictionary(rows)
    const caps = {
      konservatif: +(disposable * 0.4).toFixed(2),
      moderat: +(disposable * 0.6).toFixed(2),
      agresif: +(disposable * 0.8).toFixed(2)
    }

    return res.json({
      dp_pct: DP_FIXED,
      input: { penghasilan: income, pengeluaran: expense, disposable },
      risk_caps: caps,
      dictionary: dict, // { "5g x 12": angsuranBulanan, ... }
      rekomendasi: {
        konservatif: nearestK(caps.konservatif, rows, 3),
        moderat: nearestK(caps.moderat, rows, 3),
        agresif: nearestK(caps.agresif, rows, 3)
      }
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'internal server error' })
  }
}
