const nodemailer = require('nodemailer')
const logger     = require('./logger')

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
})

// ─── Email Templates ─────────────────────────────────────
const templates = {
  welcome: (data) => ({
    subject: '🎉 Welcome to Promptment!',
    html: `
      <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0e0f1e;color:#f0f1ff;border-radius:16px">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#6271f4,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
            Promptment
          </h1>
        </div>
        <h2 style="font-size:22px;margin-bottom:12px">Welcome, ${data.name}! 👋</h2>
        <p style="color:#9195b3;line-height:1.6;margin-bottom:24px">
          You've successfully joined the smartest assignment marketplace. 
          Post your first assignment or browse available work to get started.
        </p>
        <a href="${process.env.CLIENT_URL}/dashboard" 
           style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#6271f4,#a855f7);color:#fff;text-decoration:none;border-radius:12px;font-weight:700">
          Go to Dashboard →
        </a>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:32px 0">
        <p style="color:#5a5e7a;font-size:12px;text-align:center">© 2024 Promptment. Secure & trusted.</p>
      </div>
    `,
  }),

  resetPassword: (data) => ({
    subject: '🔐 Reset Your Promptment Password',
    html: `
      <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0e0f1e;color:#f0f1ff;border-radius:16px">
        <h2 style="margin-bottom:12px">Password Reset Request</h2>
        <p style="color:#9195b3;line-height:1.6;margin-bottom:8px">Hi ${data.name},</p>
        <p style="color:#9195b3;line-height:1.6;margin-bottom:24px">
          Click the button below to reset your password. This link expires in <strong style="color:#f0f1ff">${data.expiresIn}</strong>.
        </p>
        <a href="${data.resetUrl}"
           style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#6271f4,#a855f7);color:#fff;text-decoration:none;border-radius:12px;font-weight:700">
          Reset Password →
        </a>
        <p style="color:#5a5e7a;font-size:12px;margin-top:24px">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  }),

  paymentReceived: (data) => ({
    subject: `💰 Payment of ₨ ${data.amount} received`,
    html: `
      <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0e0f1e;color:#f0f1ff;border-radius:16px">
        <h2 style="margin-bottom:12px">Payment Received 🎉</h2>
        <p style="color:#9195b3">Hi ${data.name},</p>
        <p style="color:#9195b3;margin-bottom:24px">
          ₨ <strong style="color:#10b981;font-size:20px">${data.amount}</strong> has been credited to your wallet 
          for completing "<strong style="color:#f0f1ff">${data.assignmentTitle}</strong>".
        </p>
        <a href="${process.env.CLIENT_URL}/executor/wallet"
           style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:12px;font-weight:700">
          View Wallet →
        </a>
      </div>
    `,
  }),
}

// ─── Send Email Function ──────────────────────────────────
exports.sendEmail = async ({ to, subject, template, data, html }) => {
  try {
    const tpl    = template ? templates[template]?.(data) : null
    const mailHtml = tpl?.html || html || '<p>No content</p>'
    const mailSubject = tpl?.subject || subject

    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || 'Promptment <noreply@promptment.app>',
      to,
      subject: mailSubject,
      html:    mailHtml,
    })

    logger.info(`📧 Email sent to ${to}: ${mailSubject}`)
  } catch (err) {
    logger.error(`📧 Email failed to ${to}: ${err.message}`)
    // Don't throw — email failures should not crash the app
  }
}
