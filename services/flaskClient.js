// services/flaskClient.js
const axios = require('axios')

const flask = axios.create({
  baseURL: process.env.FLASK_BASE_URL,
  timeout: 8000
})

async function hitungAngsuranFlask({ gramase, tenor, dp_pct = 10 }) {
  // Sesuaikan endpoint Flask kamu (misal: /hitung-angsuran)
  const { data } = await flask.post('/hitung-angsuran', {
    gramase,
    tenor,
    dp_pct
  })

  if (typeof data?.nominal !== 'number') {
    throw new Error(`Flask response tidak valid untuk ${gramase}g-${tenor}bln`)
  }

  return data.nominal
}

module.exports = { hitungAngsuranFlask }
