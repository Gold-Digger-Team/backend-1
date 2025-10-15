const router = require('express').Router()
const ctrl = require('../controllers/simulasiCilemController')

router.post('/simulasi-cilem', ctrl.simulasiCilem)
router.get('/prediksi-emas', ctrl.getPrediksiEmas)

module.exports = router