// services/mailer.js
const nodemailer = require('nodemailer')
const path = require('path') // <== penting!

const {
  SMTP_HOST,
  SMTP_PORT = 587,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM = 'no-reply@example.com'
} = process.env

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  pool: true
})

async function sendMail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: 'bsi-logo.png', // bebas, cuma nama tampil
        path: path.join(__dirname, '../assets/BSI-(Bank-Syariah-Indonesia)-Logo.png'), // sesuaikan dengan lokasi kamu
        cid: 'bsiLogo' // sesuai <img src="cid:bsiLogo">
      }
    ]
  })
}

module.exports = { sendMail }
