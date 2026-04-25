# ClearCorex Desktop

Windows desktop app — Electron-based — that wraps the same engine demoed on the website.

## Build the installer

```bash
cd desktop
npm install        # one-time, ~80 MB of Electron binaries
npm run dist       # builds dist/ClearCorex-Setup-4.0.2.exe (~80 MB) and copies it into ../server/downloads/
```

That's it. The website's `/download` endpoint will now serve the real installer.

## Run in dev (no install needed)

```bash
npm start
```

Hot-reload isn't wired up — restart `npm start` after edits.

## What's inside

| File              | Purpose                                                       |
|-------------------|---------------------------------------------------------------|
| `main.js`         | Electron main process — window, file dialogs                  |
| `preload.js`      | Safe IPC bridge exposed to the renderer                       |
| `src/index.html`  | UI layout                                                     |
| `src/styles.css`  | Dark, enterprise-grade theme (mirrors web brand tokens)       |
| `src/renderer.js` | Validation engine + UI logic (all in-memory)                  |
| `scripts/copy-installer.js` | Post-build: drops the .exe into the web server folder |

## What it does

- Drag-drop or open: `.csv .txt .tsv .json .log` (up to 50 MB)
- Or paste emails into the textarea
- Runs 6 stages: syntax → domain heuristics → disposable → role/free tagging → dedup → risk score
- Tabs: Valid / Invalid / Risky / Disposable / Duplicates
- Export valid only (CSV) or full report with status + score + reason

## What it does NOT do (yet)

- No real DNS/SMTP probes (offline only). The visual pipeline runs heuristics, not network calls.
- No persistent storage — history is session-only, nothing is written to disk.

## Add a custom icon (optional)

Drop a 256×256 PNG into `build/icon.png`. electron-builder will pick it up automatically and convert to `.ico`.

## Code-sign for production

Without code signing, Windows SmartScreen will warn the first few hundred users. To sign:

```bash
# in .env or shell
CSC_LINK=path/to/cert.pfx
CSC_KEY_PASSWORD=...
npm run dist
```

Buy a code signing cert from DigiCert, Sectigo, etc.
