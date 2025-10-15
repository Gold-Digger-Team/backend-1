const { hitungSimulasiCilem } = require('../services/flaskClient')
const { PrediksiEmas, sequelize } = require('../models')
const { Op } = require('sequelize');


exports.simulasiCilem = async (req, res) => {
    try {
        const { gramase, tenor, dp_pct } = req.body || {}
        const g = Number(gramase)
        const t = Number(tenor)
        const dp = Number(dp_pct)
        
        const today = new Date().toISOString().slice(0, 10);
        const tenor_in_yr = Math.ceil(t / 12);

        if (!Number.isFinite(g) || !Number.isFinite(t) || !Number.isFinite(dp)) {
            return res.status(400).json({ error: 'gramase, tenor & dp_pct wajib angka' })
        }
        if (g <= 0 || t <= 0 || dp < 0) {
            return res.status(400).json({ error: 'gramase & tenor harus > 0, dp_pct >= 0' })
        }
        if (g > 100 || t > 120) {
            return res.status(400).json({ error: 'gramase max 100g, tenor max 36bln, dp_pct max 100%' })
        }

        const prediksi = await PrediksiEmas.findOne({
            where: { 
                tanggal_prediksi: today,
                tahun_ke: tenor_in_yr
            },
            order: [['tanggal_prediksi', 'DESC']],
        });

        if (!prediksi) {
            return res.status(404).json({
                error: `Data prediksi emas tidak ditemukan untuk tanggal ${today} & tahun_ke ${tahun_ke}`,
            });
        }

        const result = await hitungSimulasiCilem({ gramase: g, tenor: t, dp: dp , is_percentage: false})

        const hargaPrediksi = prediksi.harga_prediksi;
        const profit_rp = hargaPrediksi * g - result.total_angsuran;
        const profit_pct = (profit_rp / result.total_angsuran) * 100;

        return res.json({
            input: { gramase: g, tenor: t, dp_pct: dp, tanggal: today, tahun_ke: tenor_in_yr },
            result: {
                ...result,
                harga_prediksi: hargaPrediksi,
                profit_rp,
                profit_pct
        },
    });
    } catch (e) {
        console.error(e)
        return res.status(500).json({ error: 'internal server error' })
    }
}

exports.getPrediksiEmas = async (req, res) => {
    try {
        const { tahun_ke } = req.query || {}
        // Jika tahun_ke tidak diberikan, default ke 1
        const tk = tahun_ke ? Number(tahun_ke) : 1
        const today = new Date().toISOString().slice(0, 10);
        if (!Number.isFinite(tk) || tk <= 0) {
            return res.status(400).json({ error: 'tahun_ke wajib angka > 0' })
        }
        const prediksi = await PrediksiEmas.findOne({
            where: { 
                tanggal_prediksi: { [Op.lte]: today } ,
                tahun_ke: tk
            },
            order: [['tanggal_prediksi', 'DESC']],
            limit: 30
        });

        if (!prediksi || prediksi.length === 0) {
            return res.status(404).json({
                error: `Data prediksi emas tidak ditemukan untuk tahun_ke ${tk}`,
            });
        }
        return res.json({ data: prediksi });
    } catch (e) {
        console.error(e)
        return res.status(500).json({ error: 'internal server error' })
    }
}

exports.getAllPrediksiEmas = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const prediksi = await PrediksiEmas.findAll({
        where: { 
            tanggal_prediksi: today
        },
        order: [['tanggal_prediksi', 'DESC']],
        });

        if (!prediksi || prediksi.length === 0) {
        return res.status(404).json({
            error: `Data prediksi emas tidak ditemukan untuk tanggal ${today}`,
        });
        }
        return res.json({ data: prediksi });
    } catch (e) {
        console.error(e)
        return res.status(500).json({ error: 'internal server error' })
    }
}