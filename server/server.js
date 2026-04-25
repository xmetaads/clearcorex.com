// ============================================
// ClearCorex backend
// - Captures download email subscriptions
// - Sends welcome / download email via Amazon SES SMTP
// - Serves the Windows installer
// - Hosts the static frontend
// ============================================

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const PORT = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const DOWNLOAD_FILENAME = process.env.DOWNLOAD_FILENAME || 'ClearCorex-Setup.exe';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const SUBSCRIBERS_FILE = path.join(__dirname, 'data', 'subscribers.json');
const DOWNLOAD_PATH = path.join(__dirname, 'downloads', DOWNLOAD_FILENAME);
const FRONTEND_DIR = process.env.FRONTEND_DIR || path.join(__dirname, '..');

// --- Sanity checks for SES config ---
const requiredEnv = ['SES_HOST', 'SES_USER', 'SES_PASS', 'MAIL_FROM_ADDRESS'];
const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length) {
  console.error('[clearcorex] Missing required env vars:', missing.join(', '));
  console.error('[clearcorex] Copy .env.example to .env and fill in real values.');
  process.exit(1);
}

// --- Nodemailer transport (AWS SES SMTP) ---
const transporter = nodemailer.createTransport({
  host: process.env.SES_HOST,
  port: parseInt(process.env.SES_PORT || '587', 10),
  secure: parseInt(process.env.SES_PORT || '587', 10) === 465,
  auth: {
    user: process.env.SES_USER,
    pass: process.env.SES_PASS,
  },
});

transporter.verify().then(
  () => console.log('[clearcorex] SES SMTP transport ready'),
  (err) => console.error('[clearcorex] SES SMTP verify failed:', err.message)
);

// --- Subscriber storage (simple JSON; swap for a DB in prod) ---
function ensureDataDir() {
  const dir = path.dirname(SUBSCRIBERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SUBSCRIBERS_FILE)) fs.writeFileSync(SUBSCRIBERS_FILE, '[]', 'utf8');
}
function loadSubscribers() {
  ensureDataDir();
  try { return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8')); }
  catch { return []; }
}
function saveSubscribers(list) {
  ensureDataDir();
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(list, null, 2), 'utf8');
}
function addSubscriber(record) {
  const list = loadSubscribers();
  const existing = list.find(s => s.email.toLowerCase() === record.email.toLowerCase());
  if (existing) {
    existing.lastSeen = record.createdAt;
    existing.downloads = (existing.downloads || 0) + 1;
  } else {
    list.push({ ...record, downloads: 1 });
  }
  saveSubscribers(list);
}

// --- Validation helpers ---
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const DISPOSABLE = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com',
  '10minutemail.com', 'throwaway.email', 'trash-mail.com',
  'yopmail.com', 'sharklasers.com', 'maildrop.cc'
]);
function validateEmail(raw) {
  if (typeof raw !== 'string') return { ok: false, error: 'Email is required.' };
  const email = raw.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) return { ok: false, error: 'Invalid email format.' };
  const domain = email.split('@')[1];
  if (DISPOSABLE.has(domain)) return { ok: false, error: 'Disposable email addresses are not allowed.' };
  return { ok: true, email };
}

// --- Email templates ---
function htmlEmail({ downloadUrl, lang }) {
  const isVi = lang === 'vi';
  const t = isVi ? {
    subject: 'Tải ClearCorex Desktop',
    headline: 'Cảm ơn bạn đã chọn ClearCorex',
    intro: 'Link tải ClearCorex Desktop cho Windows của bạn đã sẵn sàng:',
    btn: 'Tải về cho Windows',
    sub: 'Nếu nút không hoạt động, copy link sau vào trình duyệt:',
    promise: 'Chúng tôi sẽ gửi email cho bạn khi có phiên bản mới hoặc cập nhật bảo mật. Bạn có thể hủy đăng ký bất cứ lúc nào.',
    footer: 'Bạn nhận được email này vì đã yêu cầu tải ClearCorex Desktop.'
  } : {
    subject: 'Download ClearCorex Desktop',
    headline: 'Thanks for choosing ClearCorex',
    intro: 'Your download link for ClearCorex Desktop (Windows) is ready:',
    btn: 'Download for Windows',
    sub: 'If the button does not work, copy this link into your browser:',
    promise: "We'll email you when a new version or security update ships. You can unsubscribe any time.",
    footer: 'You received this email because you requested ClearCorex Desktop.'
  };

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${t.subject}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.06)">
      <tr><td style="padding:32px 40px 0">
        <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#22d3a4);color:#fff;padding:8px 14px;border-radius:8px;font-weight:700;letter-spacing:-0.01em">ClearCorex</div>
      </td></tr>
      <tr><td style="padding:24px 40px 8px">
        <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#0f172a">${t.headline}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569">${t.intro}</p>
        <a href="${downloadUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">${t.btn}</a>
        <p style="margin:24px 0 8px;font-size:13px;color:#64748b">${t.sub}</p>
        <p style="margin:0 0 24px;font-size:13px;color:#3b82f6;word-break:break-all"><a href="${downloadUrl}" style="color:#3b82f6;text-decoration:none">${downloadUrl}</a></p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
        <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#475569">${t.promise}</p>
      </td></tr>
      <tr><td style="padding:20px 40px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5">${t.footer}<br/>© ${new Date().getFullYear()} SmartCore LLC</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
  return { subject: t.subject, html, text: `${t.headline}\n\n${t.intro}\n${downloadUrl}\n\n${t.promise}` };
}

async function sendDownloadEmail(toEmail, lang) {
  const downloadUrl = `${PUBLIC_URL}/download`;
  const { subject, html, text } = htmlEmail({ downloadUrl, lang });

  const fromName = process.env.MAIL_FROM_NAME || 'ClearCorex';
  const fromAddr = process.env.MAIL_FROM_ADDRESS;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: toEmail,
    subject,
    html,
    text,
  });

  return downloadUrl;
}

// ============================================
// Express app
// ============================================
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));

// CORS (only if frontend is served from a different origin)
if (CORS_ORIGINS.length) {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && CORS_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
}

// --- Rate limit the subscribe endpoint ---
const subscribeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5,                   // 5 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again later.' },
});

// --- API: subscribe + send email ---
app.post('/api/subscribe', subscribeLimiter, async (req, res) => {
  try {
    const { email, lang } = req.body || {};
    const v = validateEmail(email);
    if (!v.ok) return res.status(400).json({ ok: false, error: v.error });

    const language = lang === 'vi' ? 'vi' : 'en';
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const now = new Date().toISOString();

    addSubscriber({ email: v.email, lang: language, ip, userAgent, createdAt: now, lastSeen: now });

    const downloadUrl = await sendDownloadEmail(v.email, language);

    res.json({ ok: true, downloadUrl });
  } catch (err) {
    console.error('[clearcorex] /api/subscribe failed:', err.message);
    res.status(500).json({ ok: false, error: 'Could not send confirmation email. Please try again.' });
  }
});

// --- Download endpoint ---
app.get('/download', (req, res) => {
  if (!fs.existsSync(DOWNLOAD_PATH)) {
    return res.status(404).type('text').send(
      `Installer not found at ${DOWNLOAD_PATH}.\n` +
      `Place ${DOWNLOAD_FILENAME} into /server/downloads/ — or update DOWNLOAD_FILENAME in .env.`
    );
  }
  res.download(DOWNLOAD_PATH, DOWNLOAD_FILENAME);
});

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0', uptime: process.uptime() });
});

// --- Static frontend (serve the landing page from project root) ---
app.use(express.static(FRONTEND_DIR, {
  index: 'index.html',
  extensions: ['html'],
}));

// --- Start ---
app.listen(PORT, () => {
  console.log(`[clearcorex] running on ${PUBLIC_URL}`);
  console.log(`[clearcorex] frontend: ${FRONTEND_DIR}`);
  console.log(`[clearcorex] installer: ${DOWNLOAD_PATH} ${fs.existsSync(DOWNLOAD_PATH) ? '(found)' : '(MISSING — place the .exe here)'}`);
});
