/* ============================================
   ClearCorex — Enterprise SaaS Landing
   script.js
   ============================================ */

(function () {
  'use strict';

  /* ========================================
     i18n — English (default) & Vietnamese
     ======================================== */
  const I18N = {
    en: {
      'announce.tag': 'NEW',
      'announce.text': 'ClearCorex 4.0 is here — AI-powered email risk scoring, now in beta.',
      'announce.cta': 'Read the changelog →',

      'nav.product': 'Product',
      'nav.solutions': 'Solutions',
      'nav.download': 'Download',
      'nav.customers': 'Customers',
      'nav.resources': 'Resources',
      'nav.docs': 'Docs',
      'nav.cta': 'Download',
      'nav.mega.validation': 'Email Validation',
      'nav.mega.validation_d': 'Real-time SMTP & MX checks',
      'nav.mega.dedup': 'Deduplication',
      'nav.mega.dedup_d': 'Smart fuzzy matching engine',
      'nav.mega.extract': 'Data Extraction',
      'nav.mega.extract_d': 'Pull emails from any source',
      'nav.mega.normalize': 'Normalization',
      'nav.mega.normalize_d': 'Clean & standardize at scale',

      'hero.eyebrow_tag': 'v4.0',
      'hero.eyebrow': 'AI-powered email risk scoring is live',
      'hero.title_1': 'The email data platform',
      'hero.title_2': 'built for',
      'hero.title_3': 'modern teams',
      'hero.sub': 'Validate, deduplicate, extract, and clean millions of email addresses in minutes — with the speed, accuracy, and security trusted by 12,000+ growth teams worldwide.',
      'hero.cta_primary': 'Start for free',
      'hero.cta_secondary': 'Watch the demo',
      'hero.meta_1': 'Free for up to 1,000 emails/mo',
      'hero.meta_2': 'No credit card required',
      'hero.meta_3': 'SOC 2 & GDPR compliant',
      'hero.trusted': 'Trusted by 12,000+ teams at',
      'hero.product.live': 'Live',
      'hero.product.workspace': 'Workspace',
      'hero.product.dashboard': 'Dashboard',
      'hero.product.lists': 'Lists',
      'hero.product.jobs': 'Jobs',
      'hero.product.analytics': 'Analytics',
      'hero.product.settings': 'Settings',
      'hero.product.search': 'Search emails…',
      'hero.product.processing': 'Processing',
      'hero.product.kpi_valid': 'Valid',
      'hero.product.kpi_invalid': 'Invalid',
      'hero.product.kpi_dup': 'Duplicates',
      'hero.product.kpi_acc': 'Accuracy %',
      'hero.product.col_email': 'Email',
      'hero.product.col_status': 'Status',
      'hero.product.col_score': 'Score',
      'hero.product.col_provider': 'Provider',
      'hero.product.toast_title': 'Job completed',
      'hero.product.toast_sub': '1.2M emails cleaned in',
      'hero.product.deliv': 'Delivery rate',

      'stats.companies': 'Companies worldwide',
      'stats.processed': 'Emails processed',
      'stats.accuracy': 'Accuracy rate',
      'stats.deliverability': 'Avg. deliverability lift',

      'features.kicker': 'PLATFORM',
      'features.title_1': 'Everything you need to keep email data',
      'features.title_2': 'healthy',
      'features.sub': 'A unified platform that replaces a half-dozen point tools — built on a Rust engine that scales from your laptop to your data warehouse.',
      'features.f1.badge': 'Deep Verification',
      'features.f1.title': '20+ verification layers per email',
      'features.f1.desc': 'DNS lookups (MX, SPF, DKIM, DMARC), real SMTP handshakes, mailbox-existence probes, catch-all detection, spam-trap & abuse lists, role-based filtering, and AI bounce-risk scoring — combined into a single 0–100 confidence score per address.',
      'features.f1.c1': 'Syntax & format (RFC 5322)',
      'features.f1.c2': 'DNS / MX record verification',
      'features.f1.c3': 'SMTP-level mailbox check',
      'features.f1.c4': 'Catch-all & greylist handling',
      'features.f1.c5': 'Disposable & spam-trap detection',
      'features.f1.c6': 'AI risk scoring (0–100)',
      'features.f2.badge': 'Deduplication',
      'features.f2.title': 'Smart dedup engine',
      'features.f2.desc': 'Catches Gmail aliases, dot variants, casing, and fuzzy duplicates other tools miss.',
      'features.f3.badge': 'Extraction',
      'features.f3.title': 'Pull emails from anywhere',
      'features.f3.desc': 'Parse CSV, JSON, HTML, PDF, log files. Custom regex supported.',
      'features.f4.badge': 'AI Risk',
      'features.f4.title': 'AI-powered risk scoring',
      'features.f4.desc': 'A 0–100 score per email, predicting bounce risk before send.',
      'features.f5.badge': 'Integrations',
      'features.f5.title': 'Connects to your entire stack',
      'features.f5.desc': 'Native integrations with Mailchimp, HubSpot, Salesforce, Snowflake, Postgres, and 60+ more. REST API and webhooks included.',

      'how.kicker': 'HOW IT WORKS',
      'how.title_1': 'From messy data to clean lists',
      'how.title_2': 'in three steps',
      'how.s1.title': 'Connect or upload',
      'how.s1.desc': 'Drag-and-drop a file, paste a list, or connect your CRM, ESP, or warehouse with one click.',
      'how.s2.title': 'Clean & enrich',
      'how.s2.desc': 'Our Rust engine validates, dedupes, normalizes, and scores every email — at millions per minute.',
      'how.s3.title': 'Export & sync',
      'how.s3.desc': 'Push the clean list back into your tools automatically, or export as CSV / JSON / Parquet.',

      'demo.kicker': 'LIVE VERIFICATION ENGINE',
      'demo.title_1': 'Watch 20+ checks per email',
      'demo.title_2': 'running live',
      'demo.sub': 'From syntax and DNS lookups to SMTP handshakes, mailbox verification, catch-all detection, and AI risk scoring — every email goes through 20+ checks before it ever leaves your list.',
      'demo.engine_live': 'Live · Auto-playing',
      'demo.engine_running': 'Running',
      'demo.col_queue': 'Incoming queue',
      'demo.col_pipeline': 'Verification pipeline',
      'demo.col_results': 'Live results',
      'demo.now_checking': 'Now checking',
      'demo.processed': 'processed',
      'demo.recent': 'Recently verified',
      'demo.s_valid': 'Valid',
      'demo.s_invalid': 'Invalid',
      'demo.s_risky': 'Risky / Catch-all',
      'demo.s_dispo': 'Disposable / Spam trap',
      'demo.stage.syntax': 'Syntax & format check',
      'demo.stage.mx': 'DNS / MX record lookup',
      'demo.stage.smtp': 'SMTP handshake',
      'demo.stage.mailbox': 'Mailbox exists',
      'demo.stage.catchall': 'Catch-all detection',
      'demo.stage.disposable': 'Disposable / spam trap',
      'demo.stage.ai': 'AI bounce-risk score',
      'demo.foot.checks': '20+ checks per email',
      'demo.foot.dns': 'MX / SPF / DKIM / DMARC',
      'demo.foot.smtp': 'Real SMTP verification',
      'demo.foot.spam': 'Spam trap & abuse detection',
      'demo.foot.catch': 'Catch-all & greylist handling',

      'sol.kicker': 'SOLUTIONS',
      'sol.title_1': 'Built for every team that',
      'sol.title_2': 'touches email',
      'sol.learn': 'Learn more →',
      'sol.s1.title': 'Marketing',
      'sol.s1.desc': 'Lift open rates and protect sender reputation across every campaign.',
      'sol.s2.title': 'Sales & RevOps',
      'sol.s2.desc': 'Verify leads at the point of capture; keep your CRM clean automatically.',
      'sol.s3.title': 'Data Engineering',
      'sol.s3.desc': 'Process billions of records in your data warehouse with our SDK & API.',
      'sol.s4.title': 'Growth & Lifecycle',
      'sol.s4.desc': 'Run experiments on truly clean cohorts, not noise from bad addresses.',
      'sol.s5.title': 'Agencies',
      'sol.s5.desc': 'Manage many clients & lists from one workspace, with white-label exports.',
      'sol.s6.title': 'Enterprise',
      'sol.s6.desc': 'SSO, SOC 2 Type II, custom DPA, and 24/7 dedicated support.',

      'int.kicker': 'INTEGRATIONS',
      'int.title_1': '60+ integrations.',
      'int.title_2': 'Zero friction.',
      'int.sub': 'Connect ClearCorex to the tools your team already uses — in seconds.',
      'int.cta': 'Browse all integrations',

      'test.kicker': 'CUSTOMERS',
      'test.title_1': 'Loved by teams',
      'test.title_2': 'at every scale',
      'test.feat.quote': 'ClearCorex paid for itself in the first week. Our deliverability went from 71% to 96%, and the team stopped manually scrubbing lists in spreadsheets. It\'s now a critical part of our growth stack.',
      'test.feat.role': 'VP of Growth, NovaMail',
      'test.t1.quote': 'We process 40M emails a quarter through ClearCorex. The Rust engine is unreal — it\'s the fastest tool in our entire stack.',
      'test.t1.role': 'Data Lead, Brightly',
      'test.t2.quote': 'Switched from three other tools to one. Cleaner data, fewer integrations to maintain, half the cost. Easy decision.',
      'test.t2.role': 'Head of Lifecycle, Reachly',
      'test.t3.quote': 'The API and webhook setup took 20 minutes. We now validate every signup in real time. Bounce rate dropped 64%.',
      'test.t3.role': 'Engineering Manager, CampaignLab',

      'dl.kicker': 'DOWNLOAD',
      'dl.title_1': '100% free.',
      'dl.title_2': 'Forever.',
      'dl.sub': 'Download ClearCorex Desktop for Windows. Every feature unlocked. No paywalls, no upsells, no credit card.',
      'dl.os': 'Windows 10 / 11 (64-bit)',
      'dl.heading': 'ClearCorex Desktop',
      'dl.desc': 'The full verification engine, on your machine. Process millions of emails offline — your data never leaves your computer.',
      'dl.f1': 'All 20+ verification checks included',
      'dl.f2': 'Unlimited email processing',
      'dl.f3': 'Works fully offline — your data stays local',
      'dl.f4': 'Free updates for life',
      'dl.f5': 'No account, no telemetry, no nonsense',
      'dl.size': 'Size',
      'dl.version': 'Version',
      'dl.updated': 'Updated',
      'dl.btn': 'Download for Windows',
      'dl.note': "We'll ask for your email so we can notify you about new versions and security updates. No marketing spam — unsubscribe anytime.",
      'dl.trust1': 'Code-signed',
      'dl.trust2': 'Virus-free (VirusTotal verified)',

      'modal.title': 'Almost ready',
      'modal.sub': "Enter your email — we'll send you the download link plus a heads-up whenever a new version ships. No marketing emails, ever.",
      'modal.placeholder': 'you@company.com',
      'modal.submit': 'Download',
      'modal.fine': 'By continuing, you agree to receive product update emails. We use your address only for these notifications.',
      'modal.ok_title': 'Your download is starting',
      'modal.ok_sub': "Check your inbox in a moment — we've sent the download link plus a confirmation. The download should also begin automatically.",
      'modal.ok_btn': "Click here if it didn't start",

      'price.kicker': 'PRICING',
      'price.title_1': 'Simple, transparent',
      'price.title_2': 'pricing',
      'price.sub': 'Start free. Scale as you grow. Cancel anytime.',
      'price.monthly': 'Monthly',
      'price.yearly': 'Yearly',
      'price.save': 'Save 20%',
      'price.per_mo': '/month',
      'price.popular': 'Most popular',
      'price.custom': 'Custom',
      'price.cta_free': 'Start free',
      'price.cta_pro': 'Start 14-day trial',
      'price.cta_ent': 'Talk to sales',
      'price.p1.name': 'Free',
      'price.p1.desc': 'For individuals getting started',
      'price.p1.f1': '1,000 emails/month',
      'price.p1.f2': 'Email validation',
      'price.p1.f3': 'Deduplication',
      'price.p1.f4': 'CSV import / export',
      'price.p1.f5': 'Community support',
      'price.p2.name': 'Pro',
      'price.p2.desc': 'For growing teams and campaigns',
      'price.p2.f1': '<strong>250,000 emails/month</strong>',
      'price.p2.f2': 'Everything in Free',
      'price.p2.f3': 'AI risk scoring',
      'price.p2.f4': 'REST API & webhooks',
      'price.p2.f5': 'All integrations',
      'price.p2.f6': 'Priority email support',
      'price.p3.name': 'Enterprise',
      'price.p3.desc': 'For mission-critical scale',
      'price.p3.f1': '<strong>Unlimited volume</strong>',
      'price.p3.f2': 'Everything in Pro',
      'price.p3.f3': 'SSO / SAML',
      'price.p3.f4': 'SOC 2 Type II report',
      'price.p3.f5': 'Custom DPA',
      'price.p3.f6': '24/7 dedicated CSM',
      'price.p3.f7': '99.99% SLA',

      'comp.kicker': 'COMPARISON',
      'comp.title_1': 'Why teams switch',
      'comp.title_2': 'to ClearCorex',
      'comp.legacy': 'Legacy validators',
      'comp.scripts': 'In-house scripts',
      'comp.r1': 'Speed (1M emails)',
      'comp.r2': 'Accuracy',
      'comp.r3': 'AI risk scoring',
      'comp.r4': '60+ integrations',
      'comp.r5': 'SOC 2 Type II',
      'comp.r6': 'Self-hosted option',
      'comp.r7': 'Setup time',

      'sec.kicker': 'SECURITY & COMPLIANCE',
      'sec.title_1': 'Enterprise-grade security,',
      'sec.title_2': 'built in from day one',
      'sec.sub': 'Your data is encrypted at rest with AES-256 and in transit with TLS 1.3. We undergo annual third-party SOC 2 Type II audits and never train models on customer data.',
      'sec.f1': 'SOC 2 Type II audited',
      'sec.f2': 'GDPR & CCPA compliant',
      'sec.f3': 'ISO 27001 certified',
      'sec.f4': 'HIPAA-ready (Enterprise)',
      'sec.f5': 'Data residency: US, EU, APAC',
      'sec.f6': '99.99% uptime SLA',
      'sec.cta': 'View Trust Center →',

      'faq.kicker': 'FAQ',
      'faq.title_1': 'Frequently asked',
      'faq.title_2': 'questions',
      'faq.q1': "How accurate is ClearCorex's email verification?",
      'faq.a1': 'We benchmark at 99.7% accuracy across a 50M-email evaluation set. We perform syntax checks, MX record lookups, SMTP-level handshakes, disposable-domain detection, role-based filtering, and AI risk scoring — combined into a single 0–100 confidence score per address.',
      'faq.q2': 'Is my data secure?',
      'faq.a2': 'Yes. Data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are SOC 2 Type II audited and ISO 27001 certified. We never train models on customer data, and we offer self-hosted and on-prem deployments for the most regulated environments.',
      'faq.q3': 'How fast can I get started?',
      'faq.a3': 'Under two minutes. Sign up, drag in a CSV (or paste a list), and click Clean. For ongoing automation, our REST API and 60+ integrations get you wired into your stack within an hour.',
      'faq.q4': 'Which platforms does ClearCorex support?',
      'faq.a4': "ClearCorex Desktop is available for Windows 10 and 11 (64-bit). It's a 78 MB native installer, runs fully offline, and never uploads your data anywhere. macOS and Linux versions are on the roadmap.",
      'faq.q5': "Is it really 100% free? What's the catch?",
      'faq.a5': 'No catch. ClearCorex Desktop is free forever, with every feature unlocked, no email or volume caps, no upsell. We ask for your email only so we can notify you about new versions and security patches — and you can unsubscribe any time.',
      'faq.q6': 'Why do you need my email to download?',
      'faq.a6': 'So we can send you the download link and notify you when a new version is released — including critical security updates. We never share your email, never use it for marketing, and you can opt out at any time with one click.',

      'cta.kicker': 'GET STARTED',
      'cta.title_1': 'Ready to clean',
      'cta.title_2': 'your email data?',
      'cta.sub': 'Join 12,000+ teams shipping cleaner campaigns with ClearCorex. 100% free, forever.',
      'cta.dl': 'Download for Windows — Free',
      'cta.meta_1': '100% free',
      'cta.meta_2': 'No account required',
      'cta.meta_3': 'Works offline',

      'footer.desc': 'The enterprise email data platform. A product by SmartCore LLC.',
      'footer.status': 'All systems operational',
      'footer.product': 'Product',
      'footer.features': 'Features',
      'footer.download': 'Download',
      'footer.solutions': 'Solutions',
      'footer.integrations': 'Integrations',
      'footer.changelog': 'Changelog',
      'footer.roadmap': 'Roadmap',
      'footer.company': 'Company',
      'footer.about': 'About',
      'footer.customers': 'Customers',
      'footer.careers': 'Careers',
      'footer.press': 'Press',
      'footer.contact': 'Contact',
      'footer.resources': 'Resources',
      'footer.blog': 'Blog',
      'footer.docs': 'Documentation',
      'footer.api': 'API Reference',
      'footer.guides': 'Guides',
      'footer.community': 'Community',
      'footer.support': 'Support',
      'footer.legal': 'Legal & Trust',
      'footer.privacy': 'Privacy Policy',
      'footer.terms': 'Terms of Service',
      'footer.dpa': 'DPA',
      'footer.security': 'Security',
      'footer.trust': 'Trust Center',
      'footer.cookies': 'Cookie Settings',

      'cookie.text': 'We use cookies to improve your experience and analyze usage. See our <a href="#">cookie policy</a>.',
      'cookie.decline': 'Decline',
      'cookie.accept': 'Accept all'
    },
    vi: {
      'announce.tag': 'MỚI',
      'announce.text': 'ClearCorex 4.0 đã ra mắt — Tính năng chấm điểm rủi ro email bằng AI, đang trong giai đoạn beta.',
      'announce.cta': 'Xem changelog →',

      'nav.product': 'Sản phẩm',
      'nav.solutions': 'Giải pháp',
      'nav.download': 'Tải về',
      'nav.customers': 'Khách hàng',
      'nav.resources': 'Tài nguyên',
      'nav.docs': 'Tài liệu',
      'nav.cta': 'Tải về',
      'nav.mega.validation': 'Xác thực email',
      'nav.mega.validation_d': 'Kiểm tra SMTP & MX thời gian thực',
      'nav.mega.dedup': 'Loại bỏ trùng lặp',
      'nav.mega.dedup_d': 'Engine fuzzy matching thông minh',
      'nav.mega.extract': 'Trích xuất dữ liệu',
      'nav.mega.extract_d': 'Lấy email từ mọi nguồn',
      'nav.mega.normalize': 'Chuẩn hóa',
      'nav.mega.normalize_d': 'Làm sạch & chuẩn hóa quy mô lớn',

      'hero.eyebrow_tag': 'v4.0',
      'hero.eyebrow': 'Chấm điểm rủi ro email bằng AI đã có',
      'hero.title_1': 'Nền tảng dữ liệu email',
      'hero.title_2': 'dành cho',
      'hero.title_3': 'team hiện đại',
      'hero.sub': 'Xác thực, loại trùng, trích xuất và làm sạch hàng triệu email chỉ trong vài phút — với tốc độ, độ chính xác và bảo mật được hơn 12.000 team growth toàn cầu tin dùng.',
      'hero.cta_primary': 'Dùng miễn phí',
      'hero.cta_secondary': 'Xem demo',
      'hero.meta_1': 'Miễn phí 1.000 email/tháng',
      'hero.meta_2': 'Không cần thẻ tín dụng',
      'hero.meta_3': 'Tuân thủ SOC 2 & GDPR',
      'hero.trusted': 'Hơn 12.000 team đang dùng',
      'hero.product.live': 'Trực tiếp',
      'hero.product.workspace': 'Workspace',
      'hero.product.dashboard': 'Tổng quan',
      'hero.product.lists': 'Danh sách',
      'hero.product.jobs': 'Tác vụ',
      'hero.product.analytics': 'Phân tích',
      'hero.product.settings': 'Cài đặt',
      'hero.product.search': 'Tìm email…',
      'hero.product.processing': 'Đang xử lý',
      'hero.product.kpi_valid': 'Hợp lệ',
      'hero.product.kpi_invalid': 'Lỗi',
      'hero.product.kpi_dup': 'Trùng',
      'hero.product.kpi_acc': 'Độ chính xác %',
      'hero.product.col_email': 'Email',
      'hero.product.col_status': 'Trạng thái',
      'hero.product.col_score': 'Điểm',
      'hero.product.col_provider': 'Nhà cung cấp',
      'hero.product.toast_title': 'Hoàn tất',
      'hero.product.toast_sub': 'Đã làm sạch 1,2 triệu email trong',
      'hero.product.deliv': 'Tỷ lệ gửi thành công',

      'stats.companies': 'Công ty toàn cầu',
      'stats.processed': 'Email đã xử lý',
      'stats.accuracy': 'Tỷ lệ chính xác',
      'stats.deliverability': 'Tăng deliverability TB',

      'features.kicker': 'NỀN TẢNG',
      'features.title_1': 'Mọi thứ bạn cần để giữ dữ liệu email',
      'features.title_2': 'sạch sẽ',
      'features.sub': 'Một nền tảng hợp nhất thay thế hàng loạt công cụ rời rạc — chạy trên engine Rust, mở rộng từ laptop đến data warehouse.',
      'features.f1.badge': 'Xác thực sâu',
      'features.f1.title': '20+ lớp xác thực cho mỗi email',
      'features.f1.desc': 'Tra cứu DNS (MX, SPF, DKIM, DMARC), bắt tay SMTP thực sự, kiểm tra mailbox tồn tại, phát hiện catch-all, danh sách spam-trap & abuse, lọc role-based, và chấm điểm rủi ro bounce bằng AI — kết hợp thành một điểm tin cậy 0–100 cho mỗi địa chỉ.',
      'features.f1.c1': 'Cú pháp & định dạng (RFC 5322)',
      'features.f1.c2': 'Xác minh DNS / MX record',
      'features.f1.c3': 'Kiểm tra mailbox qua SMTP',
      'features.f1.c4': 'Xử lý catch-all & greylist',
      'features.f1.c5': 'Phát hiện disposable & spam-trap',
      'features.f1.c6': 'Chấm điểm rủi ro AI (0–100)',
      'features.f2.badge': 'Loại trùng',
      'features.f2.title': 'Engine khử trùng thông minh',
      'features.f2.desc': 'Bắt được alias Gmail, biến thể dấu chấm, viết hoa và các bản trùng mờ mà công cụ khác bỏ qua.',
      'features.f3.badge': 'Trích xuất',
      'features.f3.title': 'Lấy email từ mọi nguồn',
      'features.f3.desc': 'Phân tích CSV, JSON, HTML, PDF, log file. Hỗ trợ regex tùy chỉnh.',
      'features.f4.badge': 'AI Risk',
      'features.f4.title': 'Chấm điểm rủi ro bằng AI',
      'features.f4.desc': 'Mỗi email một điểm 0–100, dự đoán nguy cơ bounce trước khi gửi.',
      'features.f5.badge': 'Tích hợp',
      'features.f5.title': 'Kết nối với toàn bộ stack của bạn',
      'features.f5.desc': 'Tích hợp sẵn với Mailchimp, HubSpot, Salesforce, Snowflake, Postgres và 60+ công cụ khác. REST API và webhook đi kèm.',

      'how.kicker': 'CÁCH HOẠT ĐỘNG',
      'how.title_1': 'Từ dữ liệu lộn xộn đến danh sách sạch',
      'how.title_2': 'chỉ trong 3 bước',
      'how.s1.title': 'Kết nối hoặc tải lên',
      'how.s1.desc': 'Kéo thả file, dán danh sách, hoặc kết nối CRM, ESP, warehouse chỉ với 1 cú nhấp.',
      'how.s2.title': 'Làm sạch & làm giàu',
      'how.s2.desc': 'Engine Rust xác thực, loại trùng, chuẩn hóa và chấm điểm mỗi email — hàng triệu email mỗi phút.',
      'how.s3.title': 'Xuất & đồng bộ',
      'how.s3.desc': 'Đẩy danh sách sạch về tool của bạn tự động, hoặc xuất CSV / JSON / Parquet.',

      'demo.kicker': 'ENGINE XÁC THỰC TRỰC TIẾP',
      'demo.title_1': 'Xem 20+ lớp kiểm tra mỗi email',
      'demo.title_2': 'chạy trực tiếp',
      'demo.sub': 'Từ kiểm tra cú pháp, tra DNS, bắt tay SMTP, xác minh mailbox, phát hiện catch-all đến chấm điểm rủi ro AI — mỗi email phải vượt qua 20+ kiểm tra trước khi rời danh sách của bạn.',
      'demo.engine_live': 'Trực tiếp · Tự phát',
      'demo.engine_running': 'Đang chạy',
      'demo.col_queue': 'Hàng đợi',
      'demo.col_pipeline': 'Pipeline xác thực',
      'demo.col_results': 'Kết quả trực tiếp',
      'demo.now_checking': 'Đang kiểm tra',
      'demo.processed': 'đã xử lý',
      'demo.recent': 'Vừa xác thực',
      'demo.s_valid': 'Hợp lệ',
      'demo.s_invalid': 'Lỗi',
      'demo.s_risky': 'Rủi ro / Catch-all',
      'demo.s_dispo': 'Tạm thời / Spam trap',
      'demo.stage.syntax': 'Cú pháp & định dạng',
      'demo.stage.mx': 'Tra DNS / MX record',
      'demo.stage.smtp': 'Bắt tay SMTP',
      'demo.stage.mailbox': 'Mailbox tồn tại',
      'demo.stage.catchall': 'Phát hiện catch-all',
      'demo.stage.disposable': 'Disposable / spam trap',
      'demo.stage.ai': 'Điểm rủi ro AI',
      'demo.foot.checks': '20+ kiểm tra mỗi email',
      'demo.foot.dns': 'MX / SPF / DKIM / DMARC',
      'demo.foot.smtp': 'Xác thực SMTP thực tế',
      'demo.foot.spam': 'Phát hiện spam trap & abuse',
      'demo.foot.catch': 'Xử lý catch-all & greylist',

      'sol.kicker': 'GIẢI PHÁP',
      'sol.title_1': 'Phù hợp với mọi team',
      'sol.title_2': 'làm việc với email',
      'sol.learn': 'Tìm hiểu thêm →',
      'sol.s1.title': 'Marketing',
      'sol.s1.desc': 'Tăng open rate và bảo vệ uy tín domain qua mỗi chiến dịch.',
      'sol.s2.title': 'Sales & RevOps',
      'sol.s2.desc': 'Xác thực lead ngay tại điểm thu thập; giữ CRM luôn sạch tự động.',
      'sol.s3.title': 'Data Engineering',
      'sol.s3.desc': 'Xử lý hàng tỷ bản ghi trong data warehouse với SDK & API.',
      'sol.s4.title': 'Growth & Lifecycle',
      'sol.s4.desc': 'Chạy thí nghiệm trên cohort thật sạch, không nhiễu từ địa chỉ xấu.',
      'sol.s5.title': 'Agency',
      'sol.s5.desc': 'Quản lý nhiều khách hàng & danh sách trong 1 workspace, xuất white-label.',
      'sol.s6.title': 'Doanh nghiệp',
      'sol.s6.desc': 'SSO, SOC 2 Type II, DPA tùy chỉnh, hỗ trợ chuyên trách 24/7.',

      'int.kicker': 'TÍCH HỢP',
      'int.title_1': '60+ tích hợp.',
      'int.title_2': 'Không rườm rà.',
      'int.sub': 'Kết nối ClearCorex với các công cụ team bạn đang dùng — chỉ trong vài giây.',
      'int.cta': 'Xem tất cả tích hợp',

      'test.kicker': 'KHÁCH HÀNG',
      'test.title_1': 'Được yêu thích bởi team',
      'test.title_2': 'ở mọi quy mô',
      'test.feat.quote': 'ClearCorex hoàn vốn trong tuần đầu tiên. Tỷ lệ deliverability của chúng tôi tăng từ 71% lên 96%, và team không còn phải scrub list thủ công trong spreadsheet nữa. Đây giờ là một phần thiết yếu trong growth stack.',
      'test.feat.role': 'VP of Growth, NovaMail',
      'test.t1.quote': 'Chúng tôi xử lý 40 triệu email mỗi quý qua ClearCorex. Engine Rust thật sự không tưởng — đây là công cụ nhanh nhất trong toàn bộ stack.',
      'test.t1.role': 'Data Lead, Brightly',
      'test.t2.quote': 'Chuyển từ 3 tool khác sang 1. Dữ liệu sạch hơn, ít tích hợp phải bảo trì, chi phí giảm một nửa. Quyết định dễ dàng.',
      'test.t2.role': 'Head of Lifecycle, Reachly',
      'test.t3.quote': 'Setup API và webhook chỉ mất 20 phút. Giờ chúng tôi xác thực mọi đăng ký theo thời gian thực. Bounce rate giảm 64%.',
      'test.t3.role': 'Engineering Manager, CampaignLab',

      'dl.kicker': 'TẢI VỀ',
      'dl.title_1': '100% miễn phí.',
      'dl.title_2': 'Mãi mãi.',
      'dl.sub': 'Tải ClearCorex Desktop cho Windows. Mở khóa toàn bộ tính năng. Không paywall, không upsell, không cần thẻ tín dụng.',
      'dl.os': 'Windows 10 / 11 (64-bit)',
      'dl.heading': 'ClearCorex Desktop',
      'dl.desc': 'Toàn bộ engine xác thực, ngay trên máy bạn. Xử lý hàng triệu email offline — dữ liệu không bao giờ rời khỏi máy tính.',
      'dl.f1': 'Bao gồm tất cả 20+ kiểm tra xác thực',
      'dl.f2': 'Xử lý email không giới hạn',
      'dl.f3': 'Hoạt động hoàn toàn offline — dữ liệu ở lại máy bạn',
      'dl.f4': 'Cập nhật miễn phí trọn đời',
      'dl.f5': 'Không tài khoản, không telemetry, không phiền hà',
      'dl.size': 'Dung lượng',
      'dl.version': 'Phiên bản',
      'dl.updated': 'Cập nhật',
      'dl.btn': 'Tải về cho Windows',
      'dl.note': 'Chúng tôi sẽ hỏi email để thông báo phiên bản mới và cập nhật bảo mật. Không spam marketing — hủy đăng ký bất cứ lúc nào.',
      'dl.trust1': 'Đã ký số',
      'dl.trust2': 'Sạch virus (xác minh qua VirusTotal)',

      'modal.title': 'Sắp xong rồi',
      'modal.sub': 'Nhập email — chúng tôi sẽ gửi link tải kèm thông báo mỗi khi có phiên bản mới. Không bao giờ gửi email marketing.',
      'modal.placeholder': 'ban@congty.com',
      'modal.submit': 'Tải về',
      'modal.fine': 'Khi tiếp tục, bạn đồng ý nhận email cập nhật sản phẩm. Chúng tôi chỉ dùng email cho các thông báo này.',
      'modal.ok_title': 'Đang bắt đầu tải về',
      'modal.ok_sub': 'Kiểm tra inbox trong giây lát — chúng tôi đã gửi link tải kèm xác nhận. Quá trình tải cũng sẽ tự động bắt đầu.',
      'modal.ok_btn': 'Bấm vào đây nếu chưa tải',

      'price.kicker': 'BẢNG GIÁ',
      'price.title_1': 'Giá đơn giản,',
      'price.title_2': 'minh bạch',
      'price.sub': 'Bắt đầu miễn phí. Mở rộng khi cần. Hủy bất kỳ lúc nào.',
      'price.monthly': 'Hàng tháng',
      'price.yearly': 'Hàng năm',
      'price.save': 'Tiết kiệm 20%',
      'price.per_mo': '/tháng',
      'price.popular': 'Phổ biến nhất',
      'price.custom': 'Liên hệ',
      'price.cta_free': 'Dùng miễn phí',
      'price.cta_pro': 'Dùng thử 14 ngày',
      'price.cta_ent': 'Liên hệ sales',
      'price.p1.name': 'Free',
      'price.p1.desc': 'Cho cá nhân mới bắt đầu',
      'price.p1.f1': '1.000 email/tháng',
      'price.p1.f2': 'Xác thực email',
      'price.p1.f3': 'Loại trùng',
      'price.p1.f4': 'Import / export CSV',
      'price.p1.f5': 'Hỗ trợ cộng đồng',
      'price.p2.name': 'Pro',
      'price.p2.desc': 'Cho team và chiến dịch đang phát triển',
      'price.p2.f1': '<strong>250.000 email/tháng</strong>',
      'price.p2.f2': 'Toàn bộ tính năng Free',
      'price.p2.f3': 'Chấm điểm rủi ro AI',
      'price.p2.f4': 'REST API & webhook',
      'price.p2.f5': 'Tất cả tích hợp',
      'price.p2.f6': 'Hỗ trợ email ưu tiên',
      'price.p3.name': 'Enterprise',
      'price.p3.desc': 'Cho quy mô mission-critical',
      'price.p3.f1': '<strong>Khối lượng không giới hạn</strong>',
      'price.p3.f2': 'Toàn bộ tính năng Pro',
      'price.p3.f3': 'SSO / SAML',
      'price.p3.f4': 'Báo cáo SOC 2 Type II',
      'price.p3.f5': 'DPA tùy chỉnh',
      'price.p3.f6': 'CSM chuyên trách 24/7',
      'price.p3.f7': 'SLA 99,99%',

      'comp.kicker': 'SO SÁNH',
      'comp.title_1': 'Vì sao team chuyển',
      'comp.title_2': 'sang ClearCorex',
      'comp.legacy': 'Validator cũ',
      'comp.scripts': 'Script tự viết',
      'comp.r1': 'Tốc độ (1 triệu email)',
      'comp.r2': 'Độ chính xác',
      'comp.r3': 'Chấm điểm rủi ro AI',
      'comp.r4': '60+ tích hợp',
      'comp.r5': 'SOC 2 Type II',
      'comp.r6': 'Tự host',
      'comp.r7': 'Thời gian setup',

      'sec.kicker': 'BẢO MẬT & TUÂN THỦ',
      'sec.title_1': 'Bảo mật cấp doanh nghiệp,',
      'sec.title_2': 'tích hợp ngay từ ngày đầu',
      'sec.sub': 'Dữ liệu của bạn được mã hóa bằng AES-256 khi lưu trữ và TLS 1.3 khi truyền tải. Chúng tôi audit SOC 2 Type II hàng năm bởi bên thứ ba và không bao giờ train model trên dữ liệu khách hàng.',
      'sec.f1': 'Đã audit SOC 2 Type II',
      'sec.f2': 'Tuân thủ GDPR & CCPA',
      'sec.f3': 'Chứng nhận ISO 27001',
      'sec.f4': 'Sẵn sàng HIPAA (Enterprise)',
      'sec.f5': 'Lưu trữ tại US, EU, APAC',
      'sec.f6': 'SLA uptime 99,99%',
      'sec.cta': 'Xem Trust Center →',

      'faq.kicker': 'HỎI ĐÁP',
      'faq.title_1': 'Câu hỏi',
      'faq.title_2': 'thường gặp',
      'faq.q1': 'ClearCorex xác thực email chính xác đến mức nào?',
      'faq.a1': 'Chúng tôi đạt mức 99,7% độ chính xác trên tập đánh giá 50 triệu email. Hệ thống thực hiện kiểm tra cú pháp, tra MX record, bắt tay SMTP, phát hiện disposable domain, lọc role-based và chấm điểm rủi ro AI — kết hợp thành một điểm tin cậy 0–100 cho mỗi địa chỉ.',
      'faq.q2': 'Dữ liệu của tôi có an toàn không?',
      'faq.a2': 'Có. Dữ liệu được mã hóa khi lưu trữ (AES-256) và truyền tải (TLS 1.3). Chúng tôi đã audit SOC 2 Type II và đạt chứng nhận ISO 27001. Chúng tôi không train model trên dữ liệu khách hàng và cung cấp tùy chọn tự host hoặc on-prem cho môi trường nghiêm ngặt nhất.',
      'faq.q3': 'Tôi có thể bắt đầu nhanh thế nào?',
      'faq.a3': 'Dưới 2 phút. Đăng ký, kéo file CSV vào (hoặc dán danh sách), bấm Clean. Để tự động hóa lâu dài, REST API và 60+ tích hợp giúp bạn kết nối vào stack trong vòng 1 giờ.',
      'faq.q4': 'ClearCorex hỗ trợ nền tảng nào?',
      'faq.a4': 'ClearCorex Desktop có sẵn cho Windows 10 và 11 (64-bit). File installer native 78 MB, chạy hoàn toàn offline và không bao giờ tải dữ liệu lên đâu. Phiên bản macOS và Linux đang trong roadmap.',
      'faq.q5': 'Thực sự miễn phí 100% à? Có "bẫy" gì không?',
      'faq.a5': 'Không có "bẫy". ClearCorex Desktop miễn phí trọn đời, mở khóa toàn bộ tính năng, không giới hạn email hay khối lượng, không upsell. Chúng tôi chỉ xin email để báo phiên bản mới và bản vá bảo mật — và bạn có thể hủy đăng ký bất cứ lúc nào.',
      'faq.q6': 'Sao phải nhập email mới được tải?',
      'faq.a6': 'Để chúng tôi gửi link tải và thông báo khi có phiên bản mới — bao gồm các bản vá bảo mật quan trọng. Chúng tôi không bao giờ chia sẻ email của bạn, không dùng cho marketing, và bạn có thể opt-out chỉ với 1 click.',

      'cta.kicker': 'BẮT ĐẦU',
      'cta.title_1': 'Sẵn sàng làm sạch',
      'cta.title_2': 'dữ liệu email của bạn?',
      'cta.sub': 'Tham gia cùng 12.000+ team đang ship chiến dịch sạch hơn với ClearCorex. Miễn phí 100%, mãi mãi.',
      'cta.dl': 'Tải về cho Windows — Miễn phí',
      'cta.meta_1': 'Miễn phí 100%',
      'cta.meta_2': 'Không cần tài khoản',
      'cta.meta_3': 'Hoạt động offline',

      'footer.desc': 'Nền tảng dữ liệu email cấp doanh nghiệp. Sản phẩm của SmartCore LLC.',
      'footer.status': 'Tất cả hệ thống đang hoạt động',
      'footer.product': 'Sản phẩm',
      'footer.features': 'Tính năng',
      'footer.download': 'Tải về',
      'footer.solutions': 'Giải pháp',
      'footer.integrations': 'Tích hợp',
      'footer.changelog': 'Changelog',
      'footer.roadmap': 'Roadmap',
      'footer.company': 'Công ty',
      'footer.about': 'Về chúng tôi',
      'footer.customers': 'Khách hàng',
      'footer.careers': 'Tuyển dụng',
      'footer.press': 'Báo chí',
      'footer.contact': 'Liên hệ',
      'footer.resources': 'Tài nguyên',
      'footer.blog': 'Blog',
      'footer.docs': 'Tài liệu',
      'footer.api': 'Tham chiếu API',
      'footer.guides': 'Hướng dẫn',
      'footer.community': 'Cộng đồng',
      'footer.support': 'Hỗ trợ',
      'footer.legal': 'Pháp lý & Trust',
      'footer.privacy': 'Chính sách bảo mật',
      'footer.terms': 'Điều khoản dịch vụ',
      'footer.dpa': 'DPA',
      'footer.security': 'Bảo mật',
      'footer.trust': 'Trust Center',
      'footer.cookies': 'Cài đặt cookie',

      'cookie.text': 'Chúng tôi sử dụng cookie để cải thiện trải nghiệm và phân tích sử dụng. Xem <a href="#">chính sách cookie</a>.',
      'cookie.decline': 'Từ chối',
      'cookie.accept': 'Đồng ý'
    }
  };

  const STORAGE_LANG = 'cc_lang';
  const STORAGE_THEME = 'cc_theme';
  const STORAGE_COOKIE = 'cc_cookie';

  function getLang() {
    return localStorage.getItem(STORAGE_LANG) || 'en';
  }
  function setLang(lang) {
    if (!I18N[lang]) lang = 'en';
    localStorage.setItem(STORAGE_LANG, lang);
    document.documentElement.lang = lang;
    const dict = I18N[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] != null) el.innerHTML = dict[key];
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const pairs = el.dataset.i18nAttr.split(',');
      pairs.forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (dict[key] != null) el.setAttribute(attr, dict[key]);
      });
    });

    const langCurrent = document.getElementById('langCurrent');
    if (langCurrent) langCurrent.textContent = lang.toUpperCase();

    window.dispatchEvent(new CustomEvent('cc:lang', { detail: { lang } }));
  }

  /* ========================================
     Theme toggle
     ======================================== */
  function getTheme() {
    return localStorage.getItem(STORAGE_THEME) || 'light';
  }
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_THEME, theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0e1a' : '#ffffff');
  }

  /* ========================================
     Init on DOM ready
     ======================================== */
  document.addEventListener('DOMContentLoaded', () => {
    // Apply persisted theme & language
    setTheme(getTheme());
    setLang(getLang());

    initNav();
    initLangSwitch();
    initThemeToggle();
    initReveal();
    initCounters();
    initDemo();
    initDownloadModal();
    initCookieBanner();
    initBackToTop();
    initScrollProgress();
    initAnnounce();
    initSmoothScroll();
  });

  /* ========================================
     Navigation
     ======================================== */
  function initNav() {
    const navWrap = document.getElementById('navWrap');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
      navLinks.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => navLinks.classList.remove('open'))
      );
    }

    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      navWrap.classList.toggle('scrolled', y > 8);
      lastY = y;
    }, { passive: true });
  }

  /* ========================================
     Language switcher
     ======================================== */
  function initLangSwitch() {
    const wrap = document.getElementById('langSwitch');
    const btn = document.getElementById('langBtn');
    const menu = document.getElementById('langMenu');
    if (!wrap || !btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      wrap.classList.toggle('open');
    });

    menu.querySelectorAll('button[data-lang]').forEach(b => {
      b.addEventListener('click', () => {
        setLang(b.dataset.lang);
        wrap.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) wrap.classList.remove('open');
    });
  }

  /* ========================================
     Theme toggle
     ======================================== */
  function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }

  /* ========================================
     Reveal on scroll
     ======================================== */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ========================================
     Animated counters
     ======================================== */
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length || !('IntersectionObserver' in window)) return;

    const animate = (el) => {
      const target = parseFloat(el.dataset.counter);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = (decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-US')) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  }

  /* ========================================
     Auto-playing Verification Engine Demo
     ======================================== */
  // Each scenario: pre-determined per-stage outcomes so the animation
  // can showcase the full breadth of checks without real network calls.
  const ENGINE_STAGES = ['syntax', 'mx', 'smtp', 'mailbox', 'catchall', 'disposable', 'ai'];
  const SCENARIOS = [
    { email: 'anna.chen@stripe.com',     final: 'valid',   tag: 'VALID',      score: 98,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'pass', ai:98 } },
    { email: 'jordan@notion.so',         final: 'valid',   tag: 'VALID',      score: 96,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'pass', ai:96 } },
    { email: 'maya.adler@reachly.io',    final: 'valid',   tag: 'VALID',      score: 94,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'pass', ai:94 } },
    { email: 'john.doe@@gmail',          final: 'invalid', tag: 'BAD SYNTAX', score: 0,
      stages: { syntax:'fail' } },
    { email: 'sales@shop.vn',            final: 'valid',   tag: 'VALID',      score: 92,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'pass', ai:92 } },
    { email: 'user@notrealdomain.xyz',   final: 'invalid', tag: 'NO MX',      score: 0,
      stages: { syntax:'pass', mx:'fail' } },
    { email: 'info@bigcorp.com',         final: 'risky',   tag: 'CATCH-ALL',  score: 62,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'warn', catchall:'warn', disposable:'pass', ai:62 } },
    { email: 'hello@mailinator.com',     final: 'dispo',   tag: 'DISPOSABLE', score: 8,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'fail' } },
    { email: 'david.kim@brightly.co',    final: 'valid',   tag: 'VALID',      score: 95,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'pass', ai:95 } },
    { email: 'noreply@deleted',          final: 'invalid', tag: 'NO MX',      score: 0,
      stages: { syntax:'pass', mx:'fail' } },
    { email: 'contact@gmial.com',        final: 'invalid', tag: 'TYPO',       score: 0,
      stages: { syntax:'pass', mx:'fail' } },
    { email: 'admin@oldserver.net',      final: 'invalid', tag: 'NO MAILBOX', score: 4,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'fail' } },
    { email: 'team@linear.app',          final: 'valid',   tag: 'VALID',      score: 97,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'pass', ai:97 } },
    { email: 'spam.trap@blocklist.io',   final: 'dispo',   tag: 'SPAM TRAP',  score: 2,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'fail' } },
    { email: 'sarah@novamail.io',        final: 'valid',   tag: 'VALID',      score: 99,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'pass', ai:99 } },
    { email: 'support@old-co.biz',       final: 'risky',   tag: 'GREYLIST',   score: 58,
      stages: { syntax:'pass', mx:'pass', smtp:'warn', mailbox:'warn', catchall:'pass', disposable:'pass', ai:58 } },
    { email: 'jordan.park@campaignlab.com', final: 'valid', tag: 'VALID',     score: 93,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'pass', ai:93 } },
    { email: 'tom@yopmail.com',          final: 'dispo',   tag: 'DISPOSABLE', score: 6,
      stages: { syntax:'pass', mx:'pass', smtp:'pass', mailbox:'pass', catchall:'pass', disposable:'fail' } }
  ];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function initDemo() {
    const root = document.getElementById('adStages');
    if (!root) return;

    const queueEl = document.getElementById('adQueue');
    const currentEl = document.getElementById('adCurrent');
    const streamEl = document.getElementById('adStream');
    const stages = root.querySelectorAll('li');
    const queueCountEl = document.getElementById('adQueueCount');
    const processedEl = document.getElementById('adProcessed');

    const counters = {
      valid:   { num: document.getElementById('adValid'),   fill: document.getElementById('adFillValid'),   value: 0 },
      invalid: { num: document.getElementById('adInvalid'), fill: document.getElementById('adFillInvalid'), value: 0 },
      risky:   { num: document.getElementById('adRisky'),   fill: document.getElementById('adFillRisky'),   value: 0 },
      dispo:   { num: document.getElementById('adDispo'),   fill: document.getElementById('adFillDispo'),   value: 0 }
    };

    let scenarioIdx = 0;
    let totalProcessed = 0;
    let queueRemaining = 14293;
    let timers = [];
    let running = true;

    // Pause when not visible (saves CPU and respects user attention)
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { running = e.isIntersecting; });
      }, { threshold: 0.15 });
      io.observe(document.getElementById('demo'));
    }

    function clearTimers() { timers.forEach(t => clearTimeout(t)); timers = []; }
    function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }

    function resetStages() {
      stages.forEach(li => {
        li.classList.remove('running', 'pass', 'fail', 'warn', 'score');
        const ico = li.querySelector('.ad-stage-icon');
        if (ico) ico.textContent = '';
      });
    }

    function renderQueue(highlightIdx) {
      const upcoming = [];
      for (let i = 0; i < 9; i++) {
        upcoming.push(SCENARIOS[(scenarioIdx + i) % SCENARIOS.length]);
      }
      queueEl.innerHTML = upcoming.map((s, i) =>
        `<div class="ad-q-item ${i === highlightIdx ? 'active' : ''}" style="animation-delay:${i * 30}ms">${escapeHtml(s.email)}</div>`
      ).join('');
    }

    function bumpCounter(key, weightForBar = 1) {
      const c = counters[key];
      if (!c) return;
      c.value += 1;
      c.num.textContent = c.value.toLocaleString('en-US');
      // Bar reflects share of total
      const total = Object.values(counters).reduce((a, b) => a + b.value, 0);
      Object.values(counters).forEach(cc => {
        const pct = total ? Math.round((cc.value / total) * 100) : 0;
        cc.fill.style.width = pct + '%';
      });
    }

    function pushResult(scn) {
      const div = document.createElement('div');
      div.className = 'ad-result ' + scn.final;
      div.innerHTML = `
        <span class="ad-result-email">${escapeHtml(scn.email)}</span>
        <span class="ad-result-tag">${escapeHtml(scn.tag)}</span>
        ${scn.score > 0 ? `<span class="ad-result-score">${scn.score}</span>` : ''}
      `;
      streamEl.insertBefore(div, streamEl.firstChild);
      while (streamEl.children.length > 8) streamEl.removeChild(streamEl.lastChild);
    }

    function runScenario(scn) {
      currentEl.textContent = scn.email;
      resetStages();
      renderQueue(0);

      // Stage timing — 280ms per stage, 200ms gap before result
      let delay = 0;
      const STAGE_MS = 280;
      let aborted = false;

      stages.forEach((li, i) => {
        const stageKey = li.dataset.stage;
        const outcome = scn.stages[stageKey];

        // Skip remaining stages if we already failed earlier
        if (aborted) return;

        later(() => {
          if (!running) return;
          li.classList.add('running');
        }, delay);

        delay += STAGE_MS;

        later(() => {
          if (!running) return;
          li.classList.remove('running');
          if (outcome === 'pass') li.classList.add('pass');
          else if (outcome === 'fail') li.classList.add('fail');
          else if (outcome === 'warn') li.classList.add('warn');
          else if (typeof outcome === 'number') {
            li.classList.add('score');
            li.querySelector('.ad-stage-icon').textContent = outcome;
          } else {
            // Outcome undefined → stage skipped (because earlier stage failed)
            li.classList.remove('running');
          }
        }, delay);

        if (outcome === 'fail') aborted = true;
      });

      // Push result after all stages settle
      later(() => {
        if (!running) return;
        pushResult(scn);
        bumpCounter(scn.final);
        totalProcessed += 1;
        queueRemaining = Math.max(0, queueRemaining - 1);
        processedEl.textContent = totalProcessed.toLocaleString('en-US');
        queueCountEl.textContent = (queueRemaining + totalProcessed).toLocaleString('en-US');
      }, delay + 200);
    }

    function loop() {
      if (!running) {
        later(loop, 800);
        return;
      }
      const scn = SCENARIOS[scenarioIdx % SCENARIOS.length];
      runScenario(scn);
      scenarioIdx += 1;

      // Total per-email cycle = stages * STAGE_MS + buffer
      const cycleMs = ENGINE_STAGES.length * 280 + 700;
      later(loop, cycleMs);
    }

    // Initial render & start
    renderQueue(-1);
    Object.values(counters).forEach(c => { c.num.textContent = '0'; c.fill.style.width = '0%'; });
    later(loop, 600);

    // Restart loop if user changes language (so result tags update)
    window.addEventListener('cc:lang', () => {
      clearTimers();
      streamEl.innerHTML = '';
      Object.values(counters).forEach(c => { c.value = 0; c.num.textContent = '0'; c.fill.style.width = '0%'; });
      totalProcessed = 0;
      queueRemaining = 14293;
      scenarioIdx = 0;
      later(loop, 400);
    });
  }

  /* ========================================
     Download modal — email capture + API call
     ======================================== */
  // Override the API base if your backend is hosted elsewhere.
  // Defaults to same-origin (works when served by the Node backend in /server).
  const API_BASE = (window.CC_API_BASE || '').replace(/\/$/, '');

  function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  function initDownloadModal() {
    const modal = document.getElementById('dlModal');
    if (!modal) return;

    const openBtns = [
      document.getElementById('dlOpenBtn'),
      document.getElementById('ctaDlBtn')
    ].filter(Boolean);
    const closeBtn = document.getElementById('dlModalClose');
    const formView = document.getElementById('dlModalForm');
    const successView = document.getElementById('dlModalSuccess');
    const form = document.getElementById('dlForm');
    const emailInput = document.getElementById('dlEmail');
    const submitBtn = document.getElementById('dlSubmit');
    const submitLabel = submitBtn.querySelector('.dl-submit-label');
    const spinner = submitBtn.querySelector('.dl-spinner');
    const errorEl = document.getElementById('dlError');
    const manualLink = document.getElementById('dlManualLink');

    let lastDownloadUrl = '';

    function open() {
      modal.hidden = false;
      // Force reflow so transition triggers
      void modal.offsetWidth;
      modal.classList.add('show');
      setTimeout(() => emailInput.focus(), 200);
      document.body.style.overflow = 'hidden';
    }
    function close() {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      setTimeout(() => {
        modal.hidden = true;
        // Reset to form view for next open
        formView.hidden = false;
        successView.hidden = true;
        emailInput.value = '';
        emailInput.classList.remove('invalid');
        errorEl.hidden = true;
      }, 280);
    }

    function setLoading(loading) {
      submitBtn.disabled = loading;
      submitBtn.classList.toggle('is-loading', loading);
    }

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
      emailInput.classList.add('invalid');
    }

    function showSuccess(downloadUrl) {
      lastDownloadUrl = downloadUrl;
      manualLink.href = downloadUrl;
      formView.hidden = true;
      successView.hidden = false;
      // Auto-trigger download after a short delay
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.rel = 'noopener';
        // No `download` attr — server will send Content-Disposition
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, 600);
    }

    openBtns.forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    }));
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      errorEl.hidden = true;
      emailInput.classList.remove('invalid');

      const lang = getLang();
      const T = (en, vi) => lang === 'vi' ? vi : en;

      if (!isValidEmail(email)) {
        showError(T('Please enter a valid email address.', 'Vui lòng nhập email hợp lệ.'));
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(API_BASE + '/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, lang })
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          showError(data.error || T('Something went wrong. Please try again.', 'Có lỗi xảy ra. Vui lòng thử lại.'));
          return;
        }

        showSuccess(data.downloadUrl || (API_BASE + '/download'));
      } catch (err) {
        showError(T(
          'Could not reach the server. Please try again in a moment.',
          'Không kết nối được đến máy chủ. Vui lòng thử lại sau.'
        ));
      } finally {
        setLoading(false);
      }
    });
  }

  /* ========================================
     Cookie banner
     ======================================== */
  function initCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    const accept = document.getElementById('cookieAccept');
    const decline = document.getElementById('cookieDecline');
    if (!banner) return;

    if (!localStorage.getItem(STORAGE_COOKIE)) {
      setTimeout(() => banner.classList.add('show'), 1200);
    }
    const close = (val) => {
      localStorage.setItem(STORAGE_COOKIE, val);
      banner.classList.remove('show');
    };
    accept.addEventListener('click', () => close('accepted'));
    decline.addEventListener('click', () => close('declined'));
  }

  /* ========================================
     Back to top
     ======================================== */
  function initBackToTop() {
    const btn = document.getElementById('backTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ========================================
     Scroll progress bar
     ======================================== */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      bar.style.width = scrolled + '%';
    }, { passive: true });
  }

  /* ========================================
     Announcement bar
     ======================================== */
  function initAnnounce() {
    const bar = document.getElementById('announceBar');
    const close = document.getElementById('announceClose');
    if (!bar || !close) return;
    if (sessionStorage.getItem('cc_announce_closed')) {
      bar.style.display = 'none';
    }
    close.addEventListener('click', () => {
      bar.style.display = 'none';
      sessionStorage.setItem('cc_announce_closed', '1');
    });
  }

  /* ========================================
     Smooth scroll with header offset
     ======================================== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (id.length < 2 || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

})();
