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

if (sameSite === 'none' && !secure) {
  console.warn('[WARN] COOKIE_SAMESITE=none but secure cookies disabled; forcing sameSite=lax')
  sameSite = 'lax'
}

module.exports = {
  secure,
  sameSite
}
