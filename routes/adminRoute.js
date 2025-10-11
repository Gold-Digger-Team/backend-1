const router = require('express').Router()
const ctrl = require('../controllers/adminController')

router.post('/', ctrl.create) // POST /api/admins
router.get('/', ctrl.list) // (opsional) GET /api/admins

module.exports = router
