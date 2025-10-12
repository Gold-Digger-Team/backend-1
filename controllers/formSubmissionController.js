const { FormSubmission } = require('../models')

exports.createFormSubmission = async (req, res) => {
  try {
    const { nama, no_telepon, email, gramase_diinginkan, tenor_diinginkan, kuantitas_diinginkan } =
      req.body

    // validasi sederhana
    if (!nama || !email) {
      return res.status(400).json({ error: 'nama dan email wajib diisi' })
    }

    // buat tanggal submit otomatis (format YYYY-MM-DD)
    const submit_date = new Date().toISOString().split('T')[0]

    const form = await FormSubmission.create({
      submit_date,
      nama,
      no_telepon,
      email,
      gramase_diinginkan,
      tenor_diinginkan,
      kuantitas_diinginkan
    })

    return res.status(201).json({
      message: 'Form berhasil disimpan',
      data: form
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'internal server error' })
  }
}
