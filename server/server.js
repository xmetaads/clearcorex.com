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
    subject: 'Chào mừng đến với ClearCorex — Bản tải về của bạn đã sẵn sàng',
    preheader: 'Cảm ơn bạn đã chọn ClearCorex. Đây là link tải Windows installer của bạn.',
    welcome: 'Chào mừng đến với ClearCorex',
    intro: 'Bạn vừa tham gia cùng <strong>12.000+ team</strong> đang làm sạch danh sách email với engine xác thực chính xác nhất thị trường. Installer Windows của bạn đã sẵn sàng:',
    btn: 'Tải ClearCorex cho Windows',
    altLink: 'Hoặc copy link sau vào trình duyệt:',
    quickStartTitle: 'Bắt đầu nhanh trong 3 bước',
    qs1: 'Kéo thả file CSV / TXT / JSON (lên đến 50 MB) vào ứng dụng',
    qs2: 'Bấm <strong>Run cleanup</strong> — engine chạy 6 tầng kiểm tra trên mỗi email',
    qs3: 'Xuất danh sách sạch về CSV chỉ trong 1 click',
    promiseTitle: 'Chúng tôi chỉ gửi email cho bạn khi:',
    p1: 'Có phiên bản mới ra mắt',
    p2: 'Có bản vá bảo mật quan trọng',
    p3: 'Không marketing, không spam, không upsell — bao giờ cũng vậy.',
    helpLine: 'Cần hỗ trợ? Trả lời email này — sẽ có người thật đọc.',
    signoff: 'Thân,',
    team: 'Team ClearCorex',
    footer: 'Bạn nhận được email này vì đã yêu cầu tải ClearCorex Desktop tại clearcorex.com.',
    unsub: 'Hủy đăng ký'
  } : {
    subject: 'Welcome to ClearCorex — your download is ready',
    preheader: 'Thanks for choosing ClearCorex. Your Windows installer download link is inside.',
    welcome: 'Welcome to ClearCorex',
    intro: 'You just joined <strong>12,000+ teams</strong> who clean their email lists with the most accurate verification engine on the market. Your Windows installer is ready:',
    btn: 'Download ClearCorex for Windows',
    altLink: 'Or copy this link into your browser:',
    quickStartTitle: 'Quick start in 3 steps',
    qs1: 'Drag any CSV / TXT / JSON file (up to 50 MB) into the app',
    qs2: 'Hit <strong>Run cleanup</strong> — the engine runs 6 verification layers per email',
    qs3: 'Export the cleaned list back to CSV in one click',
    promiseTitle: "We'll only email you when:",
    p1: 'A new version ships',
    p2: 'A critical security patch is available',
    p3: "No marketing, no spam, no upsell — ever.",
    helpLine: 'Need help? Just reply to this email — a real person reads them.',
    signoff: 'Cheers,',
    team: 'The ClearCorex team',
    footer: 'You received this email because you requested ClearCorex Desktop at clearcorex.com.',
    unsub: 'Unsubscribe'
  };

  const unsubUrl = `${PUBLIC_URL}/unsubscribe`;
  const year = new Date().getFullYear();

  const html = `<!doctype html>
<html lang="${isVi ? 'vi' : 'en'}"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtmlEmail(t.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtmlEmail(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08)">

      <!-- Header strip -->
      <tr><td style="padding:0">
        <div style="height:4px;background:linear-gradient(90deg,#3b82f6 0%,#8b5cf6 50%,#22d3a4 100%)"></div>
      </td></tr>

      <!-- Brand -->
      <tr><td style="padding:32px 40px 0">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#22d3a4);width:36px;height:36px;border-radius:9px;text-align:center;vertical-align:middle">
            <span style="color:#fff;font-weight:800;font-size:14px;font-family:Helvetica,Arial,sans-serif">CC</span>
          </td>
          <td style="padding-left:10px;font-weight:700;font-size:17px;color:#0f172a;letter-spacing:-0.01em">ClearCorex</td>
        </tr></table>
      </td></tr>

      <!-- Headline -->
      <tr><td style="padding:28px 40px 0">
        <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;letter-spacing:-0.025em;color:#0f172a;line-height:1.2">${escapeHtmlEmail(t.welcome)}</h1>
        <p style="margin:0 0 26px;font-size:15px;line-height:1.65;color:#475569">${t.intro}</p>
      </td></tr>

      <!-- CTA Button -->
      <tr><td style="padding:0 40px">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="left">
          <a href="${downloadUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:-0.01em">
            ⬇ ${escapeHtmlEmail(t.btn)}
          </a>
        </td></tr></table>
      </td></tr>

      <!-- Alt link -->
      <tr><td style="padding:18px 40px 0">
        <p style="margin:0 0 4px;font-size:12.5px;color:#64748b">${escapeHtmlEmail(t.altLink)}</p>
        <p style="margin:0 0 26px;font-size:12.5px;word-break:break-all"><a href="${downloadUrl}" style="color:#3b82f6;text-decoration:none">${downloadUrl}</a></p>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 40px"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0"></td></tr>

      <!-- Quick start -->
      <tr><td style="padding:24px 40px 0">
        <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em">${escapeHtmlEmail(t.quickStartTitle)}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:0 0 10px;vertical-align:top;width:30px"><span style="display:inline-block;width:22px;height:22px;background:rgba(34,211,164,0.12);color:#0f172a;border-radius:50%;text-align:center;line-height:22px;font-weight:700;font-size:12px">1</span></td><td style="padding:0 0 10px;font-size:14px;color:#475569;line-height:1.5">${t.qs1}</td></tr>
          <tr><td style="padding:0 0 10px;vertical-align:top"><span style="display:inline-block;width:22px;height:22px;background:rgba(59,130,246,0.12);color:#0f172a;border-radius:50%;text-align:center;line-height:22px;font-weight:700;font-size:12px">2</span></td><td style="padding:0 0 10px;font-size:14px;color:#475569;line-height:1.5">${t.qs2}</td></tr>
          <tr><td style="padding:0 0 10px;vertical-align:top"><span style="display:inline-block;width:22px;height:22px;background:rgba(139,92,246,0.12);color:#0f172a;border-radius:50%;text-align:center;line-height:22px;font-weight:700;font-size:12px">3</span></td><td style="padding:0 0 10px;font-size:14px;color:#475569;line-height:1.5">${t.qs3}</td></tr>
        </table>
      </td></tr>

      <!-- Promise box -->
      <tr><td style="padding:18px 40px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
          <tr><td style="padding:16px 18px">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#0f172a">${escapeHtmlEmail(t.promiseTitle)}</p>
            <p style="margin:0 0 4px;font-size:13.5px;color:#475569;line-height:1.55">✓ ${escapeHtmlEmail(t.p1)}</p>
            <p style="margin:0 0 8px;font-size:13.5px;color:#475569;line-height:1.55">✓ ${escapeHtmlEmail(t.p2)}</p>
            <p style="margin:0;font-size:12.5px;color:#64748b;line-height:1.5;font-style:italic">${escapeHtmlEmail(t.p3)}</p>
          </td></tr>
        </table>
      </td></tr>

      <!-- Help -->
      <tr><td style="padding:24px 40px 0">
        <p style="margin:0 0 22px;font-size:14px;color:#475569;line-height:1.6">${escapeHtmlEmail(t.helpLine)}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#475569">${escapeHtmlEmail(t.signoff)}</p>
        <p style="margin:0 0 32px;font-size:14px;color:#0f172a;font-weight:600">${escapeHtmlEmail(t.team)}</p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 40px 28px;background:#f8fafc;border-top:1px solid #e2e8f0">
        <p style="margin:0 0 8px;font-size:11.5px;color:#94a3b8;line-height:1.6">${escapeHtmlEmail(t.footer)}</p>
        <p style="margin:0;font-size:11.5px;color:#94a3b8">© ${year} SmartCore LLC · <a href="https://clearcorex.com" style="color:#94a3b8;text-decoration:underline">clearcorex.com</a> · <a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline">${escapeHtmlEmail(t.unsub)}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = [
    t.welcome,
    '',
    t.intro.replace(/<[^>]+>/g, ''),
    '',
    `→ ${t.btn}: ${downloadUrl}`,
    '',
    t.quickStartTitle.toUpperCase(),
    `1. ${t.qs1.replace(/<[^>]+>/g, '')}`,
    `2. ${t.qs2.replace(/<[^>]+>/g, '')}`,
    `3. ${t.qs3.replace(/<[^>]+>/g, '')}`,
    '',
    t.promiseTitle,
    `  ✓ ${t.p1}`,
    `  ✓ ${t.p2}`,
    `  ${t.p3}`,
    '',
    t.helpLine,
    '',
    t.signoff,
    t.team,
    '',
    '---',
    t.footer,
    `© ${year} SmartCore LLC · clearcorex.com`,
  ].join('\n');

  return { subject: t.subject, html, text };
}

function escapeHtmlEmail(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
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
