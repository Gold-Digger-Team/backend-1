// services/emailTemplates.js
function rupiah(n) {
  if (n === null || n === undefined || isNaN(n)) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n)
}

function formSubmissionSubject({ nama }) {
  return `Terima kasih, ${nama || 'Sahabat Emas'} — Form kamu sudah kami terima`
}

function formSubmissionHtml(payload) {
  const {
    nama,
    email,
    no_telepon,
    submit_date,
    gramase_diinginkan,
    tenor_diinginkan,
    kuantitas_diinginkan,
    nominal_pembiayaan,
    total_angsuran
  } = payload

  return `
  <div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2>Terima kasih, ${nama || 'Sahabat Emas'}!</h2>
    <p>Form pengajuan cicil emas kamu sudah kami terima pada <b>${submit_date}</b>.</p>

    <h3>Rangkuman Pengajuan</h3>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      <tr><td><b>Nama</b></td><td>${nama || '-'}</td></tr>
      <tr><td><b>Email</b></td><td>${email || '-'}</td></tr>
      <tr><td><b>No. Telepon</b></td><td>${no_telepon || '-'}</td></tr>
      <tr><td><b>Gramase</b></td><td>${gramase_diinginkan ?? '-'} gram</td></tr>
      <tr><td><b>Tenor</b></td><td>${tenor_diinginkan ?? '-'} bulan</td></tr>
      <tr><td><b>Kuantitas</b></td><td>${kuantitas_diinginkan ?? '-'}</td></tr>
      <tr><td><b>Nominal Pembiayaan</b></td><td>${rupiah(nominal_pembiayaan)}</td></tr>
      <tr><td><b>Total Angsuran</b></td><td>${rupiah(total_angsuran)}</td></tr>
      <tr><td><b>DP</b></td><td>${rupiah(payload.dp_rupiah)}</td></tr>
      <tr><td><b>Angsuran / Bulan</b></td><td>${rupiah(payload.angsuran_bulanan)}</td></tr>

    </table>

    <p>Tim kami akan segera menghubungi kamu untuk langkah selanjutnya.</p>
    <hr/>
    <p style="font-size:12px;color:#666">Email ini dikirim otomatis. Mohon tidak membalas email ini.</p>
  </div>`
}

function formSubmissionText(payload) {
  const {
    nama,
    email,
    no_telepon,
    submit_date,
    gramase_diinginkan,
    tenor_diinginkan,
    kuantitas_diinginkan,
    nominal_pembiayaan,
    total_angsuran
  } = payload

  return [
    `Terima kasih, ${nama || 'Sahabat Emas'}!`,
    `Form pengajuan cicil emas kamu sudah kami terima pada ${submit_date}.`,
    ``,
    `Rangkuman:`,
    `- Nama: ${nama || '-'}`,
    `- Email: ${email || '-'}`,
    `- No. Telepon: ${no_telepon || '-'}`,
    `- Gramase: ${gramase_diinginkan ?? '-'} gram`,
    `- Tenor: ${tenor_diinginkan ?? '-'} bulan`,
    `- Kuantitas: ${kuantitas_diinginkan ?? '-'}`,
    `- Nominal Pembiayaan: ${rupiah(nominal_pembiayaan)}`,
    `- Total Angsuran: ${rupiah(total_angsuran)}`,
    `- DP: ${rupiah(payload.dp_rupiah)}`,
    `- Angsuran / Bulan: ${rupiah(payload.angsuran_bulanan)}`,
    ``,
    `Tim kami akan segera menghubungi kamu.`
  ].join('\n')
}

module.exports = {
  formSubmissionSubject,
  formSubmissionHtml,
  formSubmissionText
}
