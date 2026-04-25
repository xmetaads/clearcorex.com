# Deploying ClearCorex to Vercel + GitHub

End-to-end production deployment using **Vercel** (frontend + serverless API) and **GitHub Releases** (installer hosting).

```
┌───────────────────────┐      ┌─────────────────────────┐      ┌────────────────────────┐
│  Browser              │ ───► │  Vercel                 │ ───► │  GitHub Releases       │
│  clearcorex.com       │ POST │  - static frontend      │ 302  │  - ClearCorex-Setup-…  │
│  /download click      │      │  - /api/subscribe (SES) │      │    .exe (78 MB)        │
│                       │      │  - /api/download (302)  │      │                        │
└───────────────────────┘      └─────────────────────────┘      └────────────────────────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │  Amazon SES  │  → welcome email to user
                                   └──────────────┘
```

---

## Why this architecture

GitHub repos block files >100 MB, and Vercel's free serverless tier has a 4.5 MB request body limit — so the 78 MB installer can't live in either place. **GitHub Releases** allow up to 2 GB per asset, are CDN-served, and give a stable public URL. The Vercel serverless function just **redirects** to that URL.

---

## Step 1 — Push the repo to GitHub

```bash
cd C:\Users\admin\Documents\ClearCorex
git init
git add .
git commit -m "Initial ClearCorex landing + backend"
git branch -M main
git remote add origin https://github.com/<your-username>/clearcorex.git
git push -u origin main
```

The `.gitignore` at the repo root already excludes `.env`, `node_modules`, and `*.exe`, so no secrets or installer binaries will end up on GitHub.

---

## Step 2 — Create a GitHub Release for the installer

1. On GitHub: open the repo → **Releases** → **Draft a new release**
2. **Tag**: `v4.0.2` (matches the version in `desktop/package.json`)
3. **Title**: `ClearCorex Desktop 4.0.2`
4. **Description**: short changelog (optional)
5. **Attach binaries**: drag `desktop/dist/ClearCorex-Setup-4.0.2.exe` into the upload zone
6. Click **Publish release**

You now have a permanent, CDN-backed download URL:

```
https://github.com/<your-username>/clearcorex/releases/download/v4.0.2/ClearCorex-Setup-4.0.2.exe
```

Copy it — you'll paste it into Vercel's env vars in step 4.

For new versions: bump `desktop/package.json` version, run `npm run dist`, create a new GitHub Release with the new `.exe`, and update `DOWNLOAD_URL` in Vercel.

---

## Step 3 — Connect the repo to Vercel

1. Go to <https://vercel.com/new>
2. **Import** your `clearcorex` repo from GitHub
3. **Framework preset**: Other (Vercel auto-detects everything)
4. Leave build settings empty — there's nothing to build (static files + serverless functions only)
5. Click **Deploy**

First deploy will succeed but the form won't work yet — env vars are next.

---

## Step 4 — Configure environment variables on Vercel

Project Settings → **Environment Variables** → add these (Production + Preview):

| Key                  | Value                                                                                |
|----------------------|--------------------------------------------------------------------------------------|
| `SES_HOST`           | `email-smtp.us-east-1.amazonaws.com` (your SES region)                               |
| `SES_PORT`           | `587`                                                                                |
| `SES_USER`           | your SMTP username (the **rotated** one, ideally — the one in chat is leaked)        |
| `SES_PASS`           | your SMTP password (the **rotated** one)                                             |
| `MAIL_FROM_NAME`     | `ClearCorex`                                                                         |
| `MAIL_FROM_ADDRESS`  | `noreply@clearcorex.com`                                                             |
| `PUBLIC_URL`         | `https://clearcorex.com`                                                             |
| `DOWNLOAD_URL`       | the GitHub Releases asset URL from step 2                                            |

After saving, click **Redeploy** on the latest deployment for the env to take effect.

---

## Step 5 — Point your domain

1. Vercel project → **Settings** → **Domains** → add `clearcorex.com` and `www.clearcorex.com`
2. Vercel will show DNS records to add at your registrar (Namecheap, Cloudflare, GoDaddy…). Typically:

   | Type  | Name | Value                |
   |-------|------|----------------------|
   | A     | @    | `76.76.21.21`        |
   | CNAME | www  | `cname.vercel-dns.com` |

3. Wait 1–10 minutes for DNS to propagate. Vercel auto-issues a Let's Encrypt cert.

---

## Step 6 — Smoke test

```bash
curl -sI https://clearcorex.com/
# → 200, valid Vercel cert

curl -sI https://clearcorex.com/download
# → 302 Location: https://github.com/.../releases/download/v4.0.2/ClearCorex-Setup-4.0.2.exe
```

Then open https://clearcorex.com in a browser → scroll **Download** → click → enter your real email → confirm:
1. Welcome email arrives from `noreply@clearcorex.com`
2. The `.exe` download starts (you're being redirected from `/download` to GitHub Releases)
3. Run the installer — it should auto-create Desktop and Start Menu shortcuts

---

## Step 7 — Improve email deliverability (recommended)

SES domain verification handled DKIM. Add SPF and DMARC at your DNS:

| Type | Name    | Value                                                                     |
|------|---------|---------------------------------------------------------------------------|
| TXT  | @       | `v=spf1 include:amazonses.com ~all`                                       |
| TXT  | _dmarc  | `v=DMARC1; p=quarantine; rua=mailto:dmarc@clearcorex.com; pct=100`        |

Test the result at <https://www.mail-tester.com/> — aim for 9/10+.

---

## Repo layout

```
ClearCorex/
├── index.html               # landing page
├── styles.css
├── script.js
├── package.json             # root — declares nodemailer for Vercel
├── vercel.json              # Vercel config (headers, rewrites)
├── api/                     # Vercel serverless functions
│   ├── subscribe.js         #   POST /api/subscribe — sends welcome email
│   └── download.js          #   GET  /api/download  — 302 to GH Releases
├── desktop/                 # Electron app (builds the .exe)
│   ├── package.json
│   ├── main.js
│   ├── preload.js
│   ├── src/                 # app UI
│   ├── build/               # icon source + generated .ico/.png
│   ├── scripts/             # build helpers
│   └── dist/                # built installer (gitignored — upload to GH Releases)
├── server/                  # Optional Node Express server for self-hosted deployments
│   ├── server.js            # used by Docker / VPS
│   ├── README.md
│   └── ...
└── DEPLOY.md                # this file
```

---

## Releasing a new version

```bash
# 1. Bump version
cd desktop
npm version patch         # 4.0.2 → 4.0.3 (also updates package-lock if present)

# 2. Build new installer
npm run dist              # generates desktop/dist/ClearCorex-Setup-4.0.3.exe

# 3. Create GitHub Release
#    - Tag: v4.0.3
#    - Attach desktop/dist/ClearCorex-Setup-4.0.3.exe

# 4. Update DOWNLOAD_URL in Vercel env vars to the new asset URL
#    Then click Redeploy on the latest Vercel deployment.
```

That's it — the website now serves the new version.

---

## Local development

If you want to run everything locally before deploying (frontend + API + welcome email):

```bash
cd server
cp .env.example .env       # fill SES creds + DOWNLOAD_URL=http://localhost:3000/local-installer
npm install
npm start                  # http://localhost:3000
```

The Express server in `/server` mirrors what `/api/*.js` does on Vercel, plus it can serve the `.exe` from `server/downloads/` when `DOWNLOAD_URL` is unset.
