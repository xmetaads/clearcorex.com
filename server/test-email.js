// ============================================
// Quick SES test send
// Usage:
//   cd server
//   node test-email.js you@example.com
// ============================================

require('dotenv').config();
const nodemailer = require('nodemailer');

const recipient = process.argv[2];
if (!recipient) {
  console.error('Usage: node test-email.js <recipient@example.com>');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SES_HOST,
  port: parseInt(process.env.SES_PORT || '587', 10),
  secure: parseInt(process.env.SES_PORT || '587', 10) === 465,
  auth: { user: process.env.SES_USER, pass: process.env.SES_PASS },
});

(async () => {
  try {
    console.log(`[test] Verifying SMTP to ${process.env.SES_HOST}…`);
    await transporter.verify();
    console.log('[test] ✓ SMTP authenticated');

    console.log(`[test] Sending test email from ${process.env.MAIL_FROM_ADDRESS} to ${recipient}…`);
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: recipient,
      subject: 'ClearCorex SES test — it works ✓',
      text: 'This is a test email from your ClearCorex backend.\n\nIf you can read this, AWS SES is fully wired up and your verified domain is sending correctly.',
      html: `<div style="font-family:-apple-system,sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="margin:0 0 12px;color:#0f172a">ClearCorex SES test ✓</h2>
        <p style="color:#475569;line-height:1.6">If you can read this in your inbox, the ClearCorex backend is fully wired to AWS SES — verified domain, SMTP credentials, and sender identity all working.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent from <code>${process.env.MAIL_FROM_ADDRESS}</code> via <code>${process.env.SES_HOST}</code></p>
      </div>`,
    });

    console.log('[test] ✓ Sent. Message ID:', info.messageId);
    console.log('[test] SES response:', info.response);
    console.log('\n[test] Check your inbox at', recipient);
  } catch (err) {
    console.error('[test] ✕ FAILED:', err.message);
    if (err.code === 'EAUTH')        console.error('       → Check SES_USER / SES_PASS');
    else if (err.code === 'ECONNECTION') console.error('       → Check SES_HOST and network');
    else if (/not verified/i.test(err.message)) console.error('       → MAIL_FROM_ADDRESS must be a verified identity in SES');
    else if (/Email address is not verified/.test(err.message)) console.error('       → Recipient is not verified — your SES account is still in sandbox');
    process.exit(1);
  }
})();
