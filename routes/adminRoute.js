const router = require('express').Router()
const ctrl = require('../controllers/adminController')
const requireAuth = require('../middlewares/requireAuth')

router.post('/signup', ctrl.create) // POST /api/admin untuk create admin baru

router.get('/', ctrl.list) // (opsional) GET /api/admin
// POST /api/auth/login  (butuh CSRF header + cookie _csrf)

router.post('/login', ctrl.login)

// POST /api/auth/logout (butuh CSRF + token cookie)
router.post('/logout', ctrl.logout)

// GET  /api/auth/me     (butuh token cookie; CSRF TIDAK wajib karena GET)
router.get('/me', requireAuth, ctrl.me)

module.exports = router
