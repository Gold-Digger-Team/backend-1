// cron/angsuranCron.js
const cron = require('node-cron')
const {
  isTodayPriceReady,
  refreshAngsuranToday,
  todayYMDJakarta
} = require('../services/angsuranService')

function startAngsuranCron() {
  // Jam 08:00 tiap hari waktu Jakarta
  cron.schedule(
    '0 8 * * *',
    async () => {
      const today = todayYMDJakarta()
      console.log(`[CRON] ${today} start refresh DP=10%`)
      try {
        const ready = await isTodayPriceReady()
        if (!ready) {
          console.warn(`[CRON] ${today} harga emas belum diinput — skip refresh`)
          return
        }
        await refreshAngsuranToday()
        console.log(`[CRON] ${today} refresh DP=10% done`)
      } catch (e) {
        console.error('[CRON] refresh failed:', e.message)
      }
    },
    { timezone: 'Asia/Jakarta' }
  )
}

module.exports = { startAngsuranCron }
