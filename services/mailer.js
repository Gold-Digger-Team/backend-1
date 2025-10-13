// services/mailer.js
const nodemailer = require('nodemailer')

const {
  SMTP_HOST,
  SMTP_PORT = 587,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM = 'no-reply@example.com'
} = process.env

// Pooling biar efisien bila ada banyak email
// services/mailer.js (sudah compatible)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  pool: true
})

async function sendMail({ to, subject, html, text }) {
  if (!to) throw new Error('recipient email is required')
  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html
  })
  return info
}

module.exports = { sendMail }
