const router = require('express').Router()
const ctrl = require('../controllers/simulasiCilemController')

router.post('/simulasi-cilem', ctrl.simulasiCilem)

module.exports = router