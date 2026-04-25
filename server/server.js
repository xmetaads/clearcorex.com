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
function htmlEmail({ lang }) {
  const isVi = lang === 'vi';
  const t = isVi ? {
    subject: 'Chào mừng đến với ClearCorex 👋',
    preheader: 'Cảm ơn bạn đã tải ClearCorex Desktop. Đây là cách bắt đầu trong 30 giây.',
    welcome: 'Chào mừng đến với ClearCorex',
    intro: 'Bạn vừa tham gia cùng <strong>12.000+ team</strong> đang làm sạch danh sách email với engine xác thực chính xác nhất thị trường. ClearCorex Desktop hiện đã được tải xuống máy của bạn.',
    quickStartTitle: 'Bắt đầu trong 30 giây',
    qs1: 'Mở file <strong>ClearCorex-Setup-4.0.2.exe</strong> vừa tải về để cài đặt — installer sẽ tự tạo shortcut trên Desktop và Start Menu',
    qs2: 'Khởi động ClearCorex, kéo thả file CSV / TXT / JSON (lên đến 50 MB) vào cửa sổ',
    qs3: 'Bấm <strong>Run cleanup</strong> — engine chạy 6 tầng kiểm tra → xuất CSV sạch chỉ trong 1 click',
    troubleTitle: 'Cài đặt chưa thành công?',
    troubleBody: 'Nếu installer không tự khởi động hoặc bạn lỡ đóng, hãy tìm file <code>ClearCorex-Setup-4.0.2.exe</code> trong thư mục Downloads và mở lại. Tải lại bất cứ lúc nào tại <a href="https://clearcorex.com" style="color:#3b82f6;text-decoration:none">clearcorex.com</a>.',
    promiseTitle: 'Chúng tôi sẽ chỉ gửi email cho bạn khi:',
    p1: 'Có phiên bản mới ra mắt',
    p2: 'Có bản vá bảo mật quan trọng',
    p3: 'Không marketing, không spam, không upsell — bao giờ cũng vậy.',
    helpLine: 'Cần hỗ trợ? Trả lời email này — sẽ có người thật đọc.',
    signoff: 'Thân,',
    team: 'Team ClearCorex',
    footer: 'Bạn nhận được email này vì đã tải ClearCorex Desktop tại clearcorex.com.',
    unsub: 'Hủy đăng ký'
  } : {
    subject: 'Welcome to ClearCorex 👋',
    preheader: "Thanks for downloading ClearCorex Desktop. Here's how to get going in 30 seconds.",
    welcome: 'Welcome to ClearCorex',
    intro: 'You just joined <strong>12,000+ teams</strong> who clean their email lists with the most accurate verification engine on the market. ClearCorex Desktop is now on your machine.',
    quickStartTitle: 'Get started in 30 seconds',
    qs1: 'Open the <strong>ClearCorex-Setup-4.0.2.exe</strong> file you just downloaded — the installer creates Desktop and Start Menu shortcuts automatically',
    qs2: 'Launch ClearCorex and drag any CSV / TXT / JSON file (up to 50 MB) into the window',
    qs3: 'Hit <strong>Run cleanup</strong> — the engine runs 6 verification layers and exports a clean CSV in one click',
    troubleTitle: "Couldn't find the installer?",
    troubleBody: 'If the installer didn\'t auto-launch or you closed it by accident, look for <code>ClearCorex-Setup-4.0.2.exe</code> in your Downloads folder and open it. You can re-download anytime at <a href="https://clearcorex.com" style="color:#3b82f6;text-decoration:none">clearcorex.com</a>.',
    promiseTitle: "We'll only email you when:",
    p1: 'A new version ships',
    p2: 'A critical security patch is available',
    p3: "No marketing, no spam, no upsell — ever.",
    helpLine: 'Need help? Just reply to this email — a real person reads them.',
    signoff: 'Cheers,',
    team: 'The ClearCorex team',
    footer: 'You received this email because you downloaded ClearCorex Desktop at clearcorex.com.',
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

      <tr><td style="padding:0"><div style="height:4px;background:linear-gradient(90deg,#3b82f6 0%,#8b5cf6 50%,#22d3a4 100%)"></div></td></tr>

      <tr><td style="padding:32px 40px 0">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#22d3a4);width:36px;height:36px;border-radius:9px;text-align:center;vertical-align:middle">
            <span style="color:#fff;font-weight:800;font-size:14px;font-family:Helvetica,Arial,sans-serif">CC</span>
          </td>
          <td style="padding-left:10px;font-weight:700;font-size:17px;color:#0f172a;letter-spacing:-0.01em">ClearCorex</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:28px 40px 0">
        <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;letter-spacing:-0.025em;color:#0f172a;line-height:1.2">${escapeHtmlEmail(t.welcome)}</h1>
        <p style="margin:0 0 26px;font-size:15px;line-height:1.65;color:#475569">${t.intro}</p>
      </td></tr>

      <tr><td style="padding:0 40px"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0"></td></tr>

      <tr><td style="padding:24px 40px 0">
        <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em">${escapeHtmlEmail(t.quickStartTitle)}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:0 0 12px;vertical-align:top;width:30px"><span style="display:inline-block;width:22px;height:22px;background:rgba(34,211,164,0.12);color:#0f172a;border-radius:50%;text-align:center;line-height:22px;font-weight:700;font-size:12px">1</span></td><td style="padding:0 0 12px;font-size:14px;color:#475569;line-height:1.55">${t.qs1}</td></tr>
          <tr><td style="padding:0 0 12px;vertical-align:top"><span style="display:inline-block;width:22px;height:22px;background:rgba(59,130,246,0.12);color:#0f172a;border-radius:50%;text-align:center;line-height:22px;font-weight:700;font-size:12px">2</span></td><td style="padding:0 0 12px;font-size:14px;color:#475569;line-height:1.55">${t.qs2}</td></tr>
          <tr><td style="padding:0 0 12px;vertical-align:top"><span style="display:inline-block;width:22px;height:22px;background:rgba(139,92,246,0.12);color:#0f172a;border-radius:50%;text-align:center;line-height:22px;font-weight:700;font-size:12px">3</span></td><td style="padding:0 0 12px;font-size:14px;color:#475569;line-height:1.55">${t.qs3}</td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:14px 40px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fefbf3;border:1px solid #fde9b6;border-radius:10px">
          <tr><td style="padding:14px 18px">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e">⚠️  ${escapeHtmlEmail(t.troubleTitle)}</p>
            <p style="margin:0;font-size:13px;color:#78350f;line-height:1.55">${t.troubleBody}</p>
          </td></tr>
        </table>
      </td></tr>

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

      <tr><td style="padding:24px 40px 0">
        <p style="margin:0 0 22px;font-size:14px;color:#475569;line-height:1.6">${escapeHtmlEmail(t.helpLine)}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#475569">${escapeHtmlEmail(t.signoff)}</p>
        <p style="margin:0 0 32px;font-size:14px;color:#0f172a;font-weight:600">${escapeHtmlEmail(t.team)}</p>
      </td></tr>

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
    t.quickStartTitle.toUpperCase(),
    `1. ${t.qs1.replace(/<[^>]+>/g, '')}`,
    `2. ${t.qs2.replace(/<[^>]+>/g, '')}`,
    `3. ${t.qs3.replace(/<[^>]+>/g, '')}`,
    '',
    `${t.troubleTitle}`,
    `  ${t.troubleBody.replace(/<[^>]+>/g, '')}`,
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

async function sendWelcomeEmail(toEmail, lang) {
  const { subject, html, text } = htmlEmail({ lang });

  const fromName = process.env.MAIL_FROM_NAME || 'ClearCorex';
  const fromAddr = process.env.MAIL_FROM_ADDRESS;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: toEmail,
    subject,
    html,
    text,
  });
}

// External download URL (e.g. GitHub Releases). If set, /download 302-redirects there.
// Falls back to serving the local file from /server/downloads/ when unset.
const DOWNLOAD_URL = (process.env.DOWNLOAD_URL || '').trim();

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
// Email sending is BEST-EFFORT — if SES fails (rate limit, transient error,
// recipient bounce), we still return the download URL so the user can install.
// This avoids blocking installs on email infrastructure quirks.
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

    // Fire-and-forget: don't block the response on email send.
    sendWelcomeEmail(v.email, language).catch(err => {
      console.error('[clearcorex] welcome email failed (non-fatal) for', v.email, '-', err.message);
    });

    const downloadUrl = DOWNLOAD_URL || `${PUBLIC_URL}/download`;
    res.json({ ok: true, downloadUrl });
  } catch (err) {
    console.error('[clearcorex] /api/subscribe failed:', err.message);
    res.status(500).json({ ok: false, error: 'Subscription failed. Please try again.' });
  }
});

// --- Download endpoint ---
// In production: redirect to GitHub Releases (DOWNLOAD_URL env var).
// Locally: stream the file from /server/downloads/.
app.get('/download', (req, res) => {
  if (DOWNLOAD_URL) return res.redirect(302, DOWNLOAD_URL);
  if (!fs.existsSync(DOWNLOAD_PATH)) {
    return res.status(404).type('text').send(
      `Installer not found at ${DOWNLOAD_PATH}.\n` +
      `Place ${DOWNLOAD_FILENAME} into /server/downloads/ — or set DOWNLOAD_URL in .env to a GitHub Releases URL.`
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
