# Deploying ClearCorex to clearcorex.com

End-to-end production deployment using **Docker + Caddy** (auto-HTTPS via Let's Encrypt).

---

## Prerequisites

- A Linux server with a public IP (any cheap VPS: Hetzner, DigitalOcean, Vultr, AWS Lightsail, etc.). 1 vCPU / 1 GB RAM is plenty.
- DNS managed for `clearcorex.com`
- AWS SES domain `clearcorex.com` already verified (✓ done)
- Your real Windows installer file

---

## Step 1 — Point DNS at the server

In your domain DNS panel, create:

| Type | Name | Value                              | TTL |
|------|------|------------------------------------|-----|
| A    | @    | `<your server's public IPv4>`      | 300 |
| A    | www  | `<your server's public IPv4>`      | 300 |

Wait 1–5 minutes, then confirm with:
```bash
dig +short clearcorex.com
dig +short www.clearcorex.com
```
Both should return your server's IP.

---

## Step 2 — Prepare the server

SSH into the server and install Docker + Compose:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in so the group takes effect
```

Open ports **80** and **443** in your firewall (Caddy needs both).

---

## Step 3 — Copy the project

From your local machine:
```bash
# Replace with your server's user@ip
rsync -av --exclude=node_modules --exclude=.env \
  ~/Documents/ClearCorex/ user@your-server:/srv/clearcorex/
```

Then SSH in and create the production `.env`:
```bash
cd /srv/clearcorex/server
cp .env.example .env
nano .env
```

Fill in (use the **rotated** SMTP credentials, not the ones from the chat):
```ini
SES_HOST=email-smtp.us-east-1.amazonaws.com
SES_USER=<your new SMTP username>
SES_PASS=<your new SMTP password>
MAIL_FROM_NAME=ClearCorex
MAIL_FROM_ADDRESS=updates@clearcorex.com
DOWNLOAD_FILENAME=ClearCorex-Setup-4.0.2.exe
```
(`PUBLIC_URL` is overridden by docker-compose to `https://clearcorex.com`, so leave it alone here.)

---

## Step 4 — Drop in the real installer

```bash
# From your local machine, upload the signed Windows installer
scp ClearCorex-Setup-4.0.2.exe user@your-server:/srv/clearcorex/server/downloads/
```

Make sure the filename matches `DOWNLOAD_FILENAME` in `.env`.

---

## Step 5 — Launch

```bash
cd /srv/clearcorex
docker compose up -d --build
```

Watch the logs come up:
```bash
docker compose logs -f
```

You should see:
```
clearcorex-app    | [clearcorex] running on http://localhost:3000
clearcorex-app    | [clearcorex] SES SMTP transport ready
clearcorex-caddy  | {"level":"info","msg":"certificate obtained successfully"...}
```

---

## Step 6 — Smoke test

From any machine:
```bash
curl -sI https://clearcorex.com/
# → HTTP/2 200, valid Let's Encrypt cert

curl -s https://clearcorex.com/api/health
# → {"ok":true,"version":"1.0.0",...}

curl -sI https://clearcorex.com/download
# → 200, Content-Disposition: attachment; filename="ClearCorex-Setup-4.0.2.exe"
```

Then open https://clearcorex.com in a browser, scroll to **Download**, enter your real email, and confirm:
1. Email arrives in your inbox (from `updates@clearcorex.com`)
2. The installer download starts automatically
3. New row appears in `/srv/clearcorex/server/data/subscribers.json`

---

## Step 7 — Improve email deliverability (recommended)

SES domain verification handled DKIM. **Add SPF and DMARC** so big providers (Gmail, Outlook) trust your sender:

| Type | Name              | Value                                                               |
|------|-------------------|---------------------------------------------------------------------|
| TXT  | @                 | `v=spf1 include:amazonses.com ~all`                                 |
| TXT  | _dmarc            | `v=DMARC1; p=quarantine; rua=mailto:dmarc@clearcorex.com; pct=100` |

(Already verified domain → DKIM CNAMEs are present from SES verification — confirm in SES → Verified identities → clearcorex.com → DKIM.)

After adding these, test with: <https://www.mail-tester.com/> — aim for 9/10+.

---

## Operational commands

```bash
# Update site after editing files locally + rsync'ing them up
docker compose up -d --build app

# Update only Caddy (or restart it after editing Caddyfile)
docker compose restart caddy

# Tail logs
docker compose logs -f app
docker compose logs -f caddy

# Stop everything
docker compose down

# Stop AND wipe the Caddy cert cache (avoid unless you have to)
docker compose down -v
```

---

## Backups

Two things worth backing up nightly:
- `/srv/clearcorex/server/data/subscribers.json` — your email list
- The Caddy data volume (`caddy_data`) — avoids re-issuing certs after a wipe

Quick example:
```bash
0 3 * * * tar czf /backups/clearcorex-$(date +\%F).tgz /srv/clearcorex/server/data /var/lib/docker/volumes/clearcorex_caddy_data
```

---

## When you grow up

`subscribers.json` is fine for the first few thousand sign-ups. Once you outgrow it:
- Swap the storage layer in `server/server.js` (the `addSubscriber` / `loadSubscribers` functions) for Postgres, SQLite, or DynamoDB.
- Move email sending to a queue (BullMQ + Redis) so a slow SES call doesn't block the request.
- Add an unsubscribe endpoint backed by a per-email token.
