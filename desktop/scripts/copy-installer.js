// ============================================
// Post-build: copy the built installer into ../server/downloads/
// so the website's /download endpoint serves the latest build.
// ============================================
const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const distDir   = path.join(__dirname, '..', 'dist');
const target    = path.join(__dirname, '..', '..', 'server', 'downloads');
const installer = `ClearCorex-Setup-${pkg.version}.exe`;
const src       = path.join(distDir, installer);
const dst       = path.join(target, installer);

if (!fs.existsSync(src)) {
  console.warn(`[copy-installer] Skipped — installer not found at ${src}`);
  process.exit(0);
}

if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
fs.copyFileSync(src, dst);

const sizeMb = (fs.statSync(dst).size / (1024 * 1024)).toFixed(1);
console.log(`[copy-installer] ✓ ${installer} (${sizeMb} MB) → ${dst}`);
