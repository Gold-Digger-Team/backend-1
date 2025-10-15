const isProd = process.env.NODE_ENV === 'production'

const coerceBoolean = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return defaultValue
}

let secure = coerceBoolean(process.env.COOKIE_SECURE, isProd)

const sameSiteEnv = (process.env.COOKIE_SAMESITE || '').trim().toLowerCase()
const defaultSameSite = secure ? 'none' : 'lax'
let sameSite = sameSiteEnv || defaultSameSite

// PENTING: Untuk HTTP cross-origin (beda port atau domain),
// Chrome/Firefox akan blokir cookie dengan sameSite=none jika secure=false.
// Solusi: gunakan sameSite=false (disable SameSite) untuk HTTP
if (sameSite === 'none' && !secure) {
  console.warn('[HTTP] Using sameSite=false for HTTP cross-origin (secure=false with sameSite=none not allowed by browsers)')
  sameSite = false  // Disable SameSite untuk HTTP
}

module.exports = {
  secure,
  sameSite
}
