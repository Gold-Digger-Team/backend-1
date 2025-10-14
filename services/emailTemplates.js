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
  return `Terima kasih, ${
    nama || 'Sahabat Emas'
  } — Form Pengajuan Cicil Emas Kamu Telah Kami Terima`
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
    total_angsuran,
    dp_rupiah,
    angsuran_bulanan
  } = payload

  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;background-color:#f7f8fa;padding:30px;color:#333;">
    <div style="max-width:600px;margin:auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
      <div style="background-color:#1da69d;padding:20px;text-align:center;">
        <img src="cid:bsiLogo" alt="Bank Syariah Indonesia" style="max-height:50px;">
      </div>

      <div style="padding:25px;">
        <h2 style="color:#1da69d;margin-top:0;">Terima kasih, ${nama || 'Sahabat Emas'}!</h2>
        <p>Form pengajuan <b>Cicil Emas</b> kamu telah kami terima pada <b>${submit_date}</b>.</p>

        <div style="margin:20px 0;">
          <h3 style="border-bottom:2px solid #1da69d;padding-bottom:5px;color:#1da69d;">Rangkuman Pengajuan</h3>
          <table cellpadding="6" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px;">
            <tr><td style="width:40%;color:#555;">Nama</td><td>${nama || '-'}</td></tr>
            <tr><td>Email</td><td>${email || '-'}</td></tr>
            <tr><td>No. Telepon</td><td>${no_telepon || '-'}</td></tr>
            <tr><td>Gramase</td><td>${gramase_diinginkan ?? '-'} gram</td></tr>
            <tr><td>Tenor</td><td>${tenor_diinginkan ?? '-'} bulan</td></tr>
            <tr><td>Kuantitas</td><td>${kuantitas_diinginkan ?? '-'}</td></tr>
            <tr><td>Nominal Pembiayaan</td><td>${rupiah(nominal_pembiayaan)}</td></tr>
            <tr><td>Total Angsuran</td><td>${rupiah(total_angsuran)}</td></tr>
            <tr><td>DP</td><td>${rupiah(dp_rupiah)}</td></tr>
            <tr><td>Angsuran / Bulan</td><td>${rupiah(angsuran_bulanan)}</td></tr>
          </table>
        </div>

        <p>Tim kami akan segera menghubungi kamu untuk proses selanjutnya. 
        Terima kasih telah mempercayakan layanan pembiayaan syariah bersama <b>Bank Syariah Indonesia</b>.</p>

        <div style="margin-top:30px;text-align:center;">
          <a href="https://www.bankbsi.co.id" style="background-color:#1da69d;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-weight:600;">Kunjungi Situs BSI</a>
        </div>

        <hr style="margin:30px 0;border:none;border-top:1px solid #ddd;">
        <p style="font-size:12px;color:#777;text-align:center;">Email ini dikirim secara otomatis. Mohon tidak membalas email ini.<br/>
        &copy; ${new Date().getFullYear()} Bank Syariah Indonesia. All rights reserved.</p>
      </div>
    </div>
  </div>
  `
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
    total_angsuran,
    dp_rupiah,
    angsuran_bulanan
  } = payload

  return [
    `Terima kasih, ${nama || 'Sahabat Emas'}!`,
    `Form pengajuan Cicil Emas kamu telah kami terima pada ${submit_date}.`,
    ``,
    `Rangkuman Pengajuan:`,
    `- Nama: ${nama || '-'}`,
    `- Email: ${email || '-'}`,
    `- No. Telepon: ${no_telepon || '-'}`,
    `- Gramase: ${gramase_diinginkan ?? '-'} gram`,
    `- Tenor: ${tenor_diinginkan ?? '-'} bulan`,
    `- Kuantitas: ${kuantitas_diinginkan ?? '-'}`,
    `- Nominal Pembiayaan: ${rupiah(nominal_pembiayaan)}`,
    `- Total Angsuran: ${rupiah(total_angsuran)}`,
    `- DP: ${rupiah(dp_rupiah)}`,
    `- Angsuran per Bulan: ${rupiah(angsuran_bulanan)}`,
    ``,
    `Tim kami akan segera menghubungi kamu untuk proses selanjutnya.`,
    ``,
    `Bank Syariah Indonesia`
  ].join('\n')
}

module.exports = {
  formSubmissionSubject,
  formSubmissionHtml,
  formSubmissionText
}
