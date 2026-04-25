// ============================================
// Vercel serverless function: POST /api/subscribe
// Validates email → sends welcome email via Amazon SES → returns
// the GitHub Releases download URL.
// ============================================
const nodemailer = require('nodemailer');

const PUBLIC_URL    = (process.env.PUBLIC_URL || 'https://clearcorex.com').replace(/\/$/, '');
const DOWNLOAD_URL  = (process.env.DOWNLOAD_URL || '').trim();
const MAIL_FROM     = process.env.MAIL_FROM_ADDRESS;
const MAIL_FROM_NM  = process.env.MAIL_FROM_NAME || 'ClearCorex';

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const DISPOSABLE = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com',
  'throwaway.email', 'trash-mail.com', 'yopmail.com', 'sharklasers.com',
  'maildrop.cc', 'getnada.com'
]);

// In-memory rate limit (per cold-start instance — best-effort, not strict).
const HITS = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const window = 10 * 60 * 1000;
  const max = 5;
  const arr = (HITS.get(ip) || []).filter(t => now - t < window);
  if (arr.length >= max) return true;
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 5000) HITS.clear();
  return false;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function welcomeEmail(lang) {
  const isVi = lang === 'vi';
  const t = isVi ? {
    subject: 'Chào mừng đến với ClearCorex 👋',
    preheader: 'Cảm ơn bạn đã tải ClearCorex Desktop. Đây là cách bắt đầu trong 30 giây.',
    welcome: 'Chào mừng đến với ClearCorex',
    intro: 'Bạn vừa tham gia cùng <strong>12.000+ team</strong> đang làm sạch danh sách email với engine xác thực chính xác nhất thị trường. ClearCorex Desktop hiện đã được tải xuống máy của bạn.',
    quickStartTitle: 'Bắt đầu trong 30 giây',
    qs1: 'Mở file <strong>ClearCorex-Setup-4.0.4.exe</strong> vừa tải về để cài đặt — installer sẽ tự tạo shortcut trên Desktop và Start Menu',
    qs2: 'Khởi động ClearCorex, kéo thả file CSV / TXT / JSON (lên đến 50 MB) vào cửa sổ',
    qs3: 'Bấm <strong>Run cleanup</strong> — engine chạy 6 tầng kiểm tra → xuất CSV sạch chỉ trong 1 click',
    troubleTitle: 'Cài đặt chưa thành công?',
    troubleBody: 'Nếu installer không tự khởi động hoặc bạn lỡ đóng, hãy tìm file <code>ClearCorex-Setup-4.0.4.exe</code> trong thư mục Downloads và mở lại. Tải lại bất cứ lúc nào tại <a href="https://clearcorex.com" style="color:#3b82f6;text-decoration:none">clearcorex.com</a>.',
    promiseTitle: 'Chúng tôi sẽ chỉ gửi email cho bạn khi:',
    p1: 'Có phiên bản mới ra mắt',
    p2: 'Có bản vá bảo mật quan trọng',
    p3: 'Không marketing, không spam, không upsell — bao giờ cũng vậy.',
    helpLine: 'Cần hỗ trợ? Trả lời email này — sẽ có người thật đọc.',
    signoff: 'Thân,', team: 'Team ClearCorex',
    footer: 'Bạn nhận được email này vì đã tải ClearCorex Desktop tại clearcorex.com.',
    unsub: 'Hủy đăng ký'
  } : {
    subject: 'Welcome to ClearCorex 👋',
    preheader: "Thanks for downloading ClearCorex Desktop. Here's how to get going in 30 seconds.",
    welcome: 'Welcome to ClearCorex',
    intro: 'You just joined <strong>12,000+ teams</strong> who clean their email lists with the most accurate verification engine on the market. ClearCorex Desktop is now on your machine.',
    quickStartTitle: 'Get started in 30 seconds',
    qs1: 'Open the <strong>ClearCorex-Setup-4.0.4.exe</strong> file you just downloaded — the installer creates Desktop and Start Menu shortcuts automatically',
    qs2: 'Launch ClearCorex and drag any CSV / TXT / JSON file (up to 50 MB) into the window',
    qs3: 'Hit <strong>Run cleanup</strong> — the engine runs 6 verification layers and exports a clean CSV in one click',
    troubleTitle: "Couldn't find the installer?",
    troubleBody: 'If the installer didn\'t auto-launch or you closed it by accident, look for <code>ClearCorex-Setup-4.0.4.exe</code> in your Downloads folder and open it. You can re-download anytime at <a href="https://clearcorex.com" style="color:#3b82f6;text-decoration:none">clearcorex.com</a>.',
    promiseTitle: "We'll only email you when:",
    p1: 'A new version ships', p2: 'A critical security patch is available',
    p3: "No marketing, no spam, no upsell — ever.",
    helpLine: 'Need help? Just reply to this email — a real person reads them.',
    signoff: 'Cheers,', team: 'The ClearCorex team',
    footer: 'You received this email because you downloaded ClearCorex Desktop at clearcorex.com.',
    unsub: 'Unsubscribe'
  };

  const year = new Date().getFullYear();
  const unsubUrl = `${PUBLIC_URL}/unsubscribe`;

  const html = `<!doctype html>
<html lang="${isVi ? 'vi' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(t.subject)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08)">
<tr><td style="padding:0"><div style="height:4px;background:linear-gradient(90deg,#3b82f6 0%,#8b5cf6 50%,#22d3a4 100%)"></div></td></tr>
<tr><td style="padding:32px 40px 0"><table cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#3b82f6,#22d3a4);width:36px;height:36px;border-radius:9px;text-align:center;vertical-align:middle"><span style="color:#fff;font-weight:800;font-size:14px">CC</span></td><td style="padding-left:10px;font-weight:700;font-size:17px;color:#0f172a">ClearCorex</td></tr></table></td></tr>
<tr><td style="padding:28px 40px 0"><h1 style="margin:0 0 14px;font-size:26px;font-weight:800;letter-spacing:-0.025em;color:#0f172a;line-height:1.2">${escapeHtml(t.welcome)}</h1><p style="margin:0 0 26px;font-size:15px;line-height:1.65;color:#475569">${t.intro}</p></td></tr>
<tr><td style="padding:0 40px"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0"></td></tr>
<tr><td style="padding:24px 40px 0"><p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em">${escapeHtml(t.quickStartTitle)}</p><table cellpadding="0" cellspacing="0" width="100%">
<tr><td style="padding:0 0 12px;vertical-align:top;width:30px"><span style="display:inline-block;width:22px;height:22px;background:rgba(34,211,164,0.12);color:#0f172a;border-radius:50%;text-align:center;line-height:22px;font-weight:700;font-size:12px">1</span></td><td style="padding:0 0 12px;font-size:14px;color:#475569;line-height:1.55">${t.qs1}</td></tr>
<tr><td style="padding:0 0 12px;vertical-align:top"><span style="display:inline-block;width:22px;height:22px;background:rgba(59,130,246,0.12);color:#0f172a;border-radius:50%;text-align:center;line-height:22px;font-weight:700;font-size:12px">2</span></td><td style="padding:0 0 12px;font-size:14px;color:#475569;line-height:1.55">${t.qs2}</td></tr>
<tr><td style="padding:0 0 12px;vertical-align:top"><span style="display:inline-block;width:22px;height:22px;background:rgba(139,92,246,0.12);color:#0f172a;border-radius:50%;text-align:center;line-height:22px;font-weight:700;font-size:12px">3</span></td><td style="padding:0 0 12px;font-size:14px;color:#475569;line-height:1.55">${t.qs3}</td></tr>
</table></td></tr>
<tr><td style="padding:14px 40px 0"><table cellpadding="0" cellspacing="0" width="100%" style="background:#fefbf3;border:1px solid #fde9b6;border-radius:10px"><tr><td style="padding:14px 18px"><p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e">⚠️  ${escapeHtml(t.troubleTitle)}</p><p style="margin:0;font-size:13px;color:#78350f;line-height:1.55">${t.troubleBody}</p></td></tr></table></td></tr>
<tr><td style="padding:18px 40px 0"><table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px"><tr><td style="padding:16px 18px"><p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#0f172a">${escapeHtml(t.promiseTitle)}</p><p style="margin:0 0 4px;font-size:13.5px;color:#475569;line-height:1.55">✓ ${escapeHtml(t.p1)}</p><p style="margin:0 0 8px;font-size:13.5px;color:#475569;line-height:1.55">✓ ${escapeHtml(t.p2)}</p><p style="margin:0;font-size:12.5px;color:#64748b;line-height:1.5;font-style:italic">${escapeHtml(t.p3)}</p></td></tr></table></td></tr>
<tr><td style="padding:24px 40px 0"><p style="margin:0 0 22px;font-size:14px;color:#475569;line-height:1.6">${escapeHtml(t.helpLine)}</p><p style="margin:0 0 4px;font-size:14px;color:#475569">${escapeHtml(t.signoff)}</p><p style="margin:0 0 32px;font-size:14px;color:#0f172a;font-weight:600">${escapeHtml(t.team)}</p></td></tr>
<tr><td style="padding:20px 40px 28px;background:#f8fafc;border-top:1px solid #e2e8f0"><p style="margin:0 0 8px;font-size:11.5px;color:#94a3b8;line-height:1.6">${escapeHtml(t.footer)}</p><p style="margin:0;font-size:11.5px;color:#94a3b8">© ${year} SmartCore LLC · <a href="https://clearcorex.com" style="color:#94a3b8;text-decoration:underline">clearcorex.com</a> · <a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline">${escapeHtml(t.unsub)}</a></p></td></tr>
</table></td></tr></table></body></html>`;

  const text = `${t.welcome}\n\n${t.intro.replace(/<[^>]+>/g, '')}\n\n${t.quickStartTitle.toUpperCase()}\n1. ${t.qs1.replace(/<[^>]+>/g, '')}\n2. ${t.qs2.replace(/<[^>]+>/g, '')}\n3. ${t.qs3.replace(/<[^>]+>/g, '')}\n\n${t.troubleTitle}\n  ${t.troubleBody.replace(/<[^>]+>/g, '')}\n\n${t.promiseTitle}\n  ✓ ${t.p1}\n  ✓ ${t.p2}\n  ${t.p3}\n\n${t.helpLine}\n\n${t.signoff}\n${t.team}\n\n---\n${t.footer}\n© ${year} SmartCore LLC · clearcorex.com`;

  return { subject: t.subject, html, text };
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' });

  // Sanity check env
  if (!process.env.SES_HOST || !process.env.SES_USER || !process.env.SES_PASS || !MAIL_FROM) {
    console.error('[subscribe] SES env vars missing');
    return res.status(500).json({ ok: false, error: 'Email service is not configured.' });
  }
  if (!DOWNLOAD_URL) {
    console.error('[subscribe] DOWNLOAD_URL missing');
    return res.status(500).json({ ok: false, error: 'Download URL is not configured.' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const email = (body && body.email || '').trim().toLowerCase();
  const lang  = (body && body.lang) === 'vi' ? 'vi' : 'en';

  if (!EMAIL_RE.test(email))                   return res.status(400).json({ ok: false, error: 'Invalid email format.' });
  if (DISPOSABLE.has(email.split('@')[1]))     return res.status(400).json({ ok: false, error: 'Disposable email addresses are not allowed.' });

  // Email send is BEST-EFFORT — never block the install on transient SES issues.
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SES_HOST,
      port: parseInt(process.env.SES_PORT || '587', 10),
      secure: parseInt(process.env.SES_PORT || '587', 10) === 465,
      auth: { user: process.env.SES_USER, pass: process.env.SES_PASS },
    });

    const { subject, html, text } = welcomeEmail(lang);
    await transporter.sendMail({
      from: `"${MAIL_FROM_NM}" <${MAIL_FROM}>`,
      to: email,
      subject, html, text,
    });
  } catch (err) {
    console.error('[subscribe] welcome email failed (non-fatal) for', email, '-', err.message);
  }

  return res.status(200).json({ ok: true, downloadUrl: DOWNLOAD_URL });
};
