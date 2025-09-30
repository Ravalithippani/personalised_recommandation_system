const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true", // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

async function sendMail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER
  if (!from) {
    throw new Error("EMAIL_FROM or SMTP_USER not set")
  }
  return transporter.sendMail({ from, to, subject, html, text })
}

module.exports = sendMail
