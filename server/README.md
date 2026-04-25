# ClearCorex Backend

Node.js server that captures download-request emails, sends a download link via **Amazon SES SMTP**, and serves the Windows installer. Also serves the static landing page so you can run the entire site from a single process.

---

## ⚠️ Security first

You shared SMTP credentials in plaintext earlier. **Rotate them now**:

1. Open **AWS Console → SES → SMTP settings**
2. Find user `ses-smtp-user.20260327-091702`, **delete the existing access key**
3. Click **Create SMTP credentials** → save the new password into `.env` (never paste it anywhere else)

Once rotated, the credentials live **only** in `server/.env`, which is gitignored.

---

## Setup

### 1. Install Node.js 18+

If you don't have it: <https://nodejs.org/>

### 2. Install dependencies

```bash
cd server
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

- `SES_HOST` — your SES SMTP endpoint (e.g. `email-smtp.us-east-1.amazonaws.com`)
- `SES_USER` — your **new** SMTP username (rotate the old one!)
- `SES_PASS` — your **new** SMTP password
- `MAIL_FROM_ADDRESS` — must be a **verified identity** in SES (a verified email or a verified domain)
- `PUBLIC_URL` — public URL where the site is reachable (in dev: `http://localhost:3000`)

### 4. Place the installer

Drop your Windows installer file into `server/downloads/` and make sure its filename matches `DOWNLOAD_FILENAME` in `.env`. Default expected:

```
server/downloads/ClearCorex-Setup-4.0.2.exe
```

### 5. Run

```bash
npm start
```

Open http://localhost:3000 — the landing page is served and the download flow is wired up.

---

## How it works

1. User clicks **Download for Windows** → modal opens
2. User enters email → frontend POSTs to `/api/subscribe`
3. Backend validates email, rejects disposables, rate-limits abuse (5 reqs / 10 min / IP)
4. Backend appends `{ email, lang, ip, userAgent, createdAt }` to `data/subscribers.json`
5. Backend sends a branded HTML email via SES SMTP with the download link
6. Backend responds `{ ok: true, downloadUrl }` → frontend auto-triggers the download

---

## SES gotchas

- **Sandbox mode**: a brand-new SES account is in sandbox — you can only send to verified addresses. Open a [Production access request](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html) before you launch.
- **From address must be verified**: verify either a single email or your whole domain in SES, then put it in `MAIL_FROM_ADDRESS`.
- **Region matters**: `SES_HOST` must match the AWS region where your sender identity is verified.
- **TLS**: port 587 uses STARTTLS (default here). Port 465 uses implicit TLS — server.js handles both.

---

## Endpoints

| Method | Path              | Purpose                                |
|--------|-------------------|----------------------------------------|
| POST   | `/api/subscribe`  | Capture email + send download email    |
| GET    | `/download`       | Serve the Windows installer            |
| GET    | `/api/health`     | Liveness check                         |
| GET    | `/`               | Serves the static landing page         |

---

## File layout

```
ClearCorex/
├── index.html           # frontend
├── styles.css
├── script.js
├── .gitignore
└── server/
    ├── package.json
    ├── server.js        # Express app
    ├── .env             # YOUR SECRETS (gitignored)
    ├── .env.example     # template
    ├── data/
    │   └── subscribers.json   # auto-created
    └── downloads/
        └── ClearCorex-Setup-4.0.2.exe   # YOU place this here
```

---

## Production checklist

- [ ] Rotate the SMTP credentials you exposed earlier
- [ ] Move `MAIL_FROM_ADDRESS` to a verified domain (better deliverability than verified single email)
- [ ] Set up SPF, DKIM, DMARC for that domain
- [ ] Request SES production access (out of sandbox)
- [ ] Replace JSON storage with a real DB (Postgres, SQLite, or DynamoDB)
- [ ] Put the app behind HTTPS (Caddy, Nginx, or a PaaS that terminates TLS)
- [ ] Set `PUBLIC_URL` to your real https URL
- [ ] Set `CORS_ORIGINS` if frontend is on a different domain
