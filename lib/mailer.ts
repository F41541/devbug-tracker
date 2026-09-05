import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendVerificationEmail(toEmail: string, otpCode: string) {
  const from = process.env.SMTP_FROM || `"DevBug Tracker" <${process.env.SMTP_USER}>`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
          .card { background-color: #ffffff; max-width: 480px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .badge { display: inline-block; padding: 6px 12px; background-color: #e0e7ff; color: #4338ca; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
          .desc { font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0; }
          .code-box { background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
          .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #4f46e5; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.4; border-top: 1px solid #f1f5f9; padding-top: 18px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">DevBug Tracker</div>
          <h1 class="title">Verify Your Developer Account</h1>
          <p class="desc">Use the following verification code to complete your registration for DevBug Tracker. This code expires in <strong>10 minutes</strong>.</p>
          <div class="code-box">
            <span class="code">${otpCode}</span>
          </div>
          <p class="desc" style="font-size: 12px; margin-bottom: 24px;">If you did not request this registration, you can safely ignore this email.</p>
          <div class="footer">
            DevBug Tracker &bull; Solo Dev Bug Fix
          </div>
        </div>
      </body>
    </html>
  `

  return await transporter.sendMail({
    from,
    to: toEmail,
    subject: `[DevBug Tracker] Verification Code: ${otpCode}`,
    text: `Your DevBug Tracker verification code is: ${otpCode}. This code expires in 10 minutes.`,
    html: htmlContent,
  })
}
