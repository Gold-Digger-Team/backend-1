// services/flaskClient.js
const axios = require('axios')
const { Emas } = require('../models')

const flask = axios.create({
  baseURL: process.env.FLASK_BASE_URL,
  timeout: 8000
})

const MARGIN = 0.0925 // 9.25%

async function hitungSimulasiCilem({ gramase, tenor, dp, is_percentage = true }) {
  console.log('Input:', { gramase, tenor, dp, is_percentage, MARGIN })

  // const harga_emas_harian = 2000000
  const today = new Date().toISOString().split('T')[0]
  console.log("Tanggal hari ini:", today)

  let latestGold = await Emas.findOne({
    where: { tanggal: today },
    attributes: ['harga_pergram_idr', 'tanggal']
  })

  if (!latestGold) {
    console.warn(`Tidak ada data emas untuk tanggal ${today}, ambil data terbaru.`)
    latestGold = await Emas.findOne({
      order: [['tanggal', 'DESC']],
      attributes: ['harga_pergram_idr', 'tanggal']
    })
  }

  if (!latestGold) {
    throw new Error(`Harga emas belum tersedia untuk tanggal ${today}`)
  }

  const harga_emas_harian = latestGold.harga_pergram_idr

  const total_harga_emas = harga_emas_harian * gramase

  if (is_percentage) {
    dp_rp = total_harga_emas * (dp / 100)
  } else {
    dp_rp = dp
  }

  console.log('Calculated dp_rp:', dp_rp)

  const margin_bulanan = MARGIN / 12
  const pokokPembiayaan = total_harga_emas - dp_rp // pokok pinjaman

  console.log('pokokPembiayaan:', pokokPembiayaan, 'margin_bulanan:', margin_bulanan)

  const faktor = Math.pow(1 + margin_bulanan, tenor)
  const nominal_angsuran = pokokPembiayaan * ((margin_bulanan * faktor) / (faktor - 1))
  const total_angsuran = nominal_angsuran * tenor + dp_rp

  return {
    nominal_angsuran,
    total_angsuran,
    dp_rp
  }
}

module.exports = { hitungSimulasiCilem }
