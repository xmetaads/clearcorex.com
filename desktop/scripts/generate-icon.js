// ============================================
// Generate icon.png (512x512) and icon.ico (multi-resolution)
// from build/icon.svg using pure-WASM renderers — no native deps.
// Run automatically before `npm run dist` via the predist script.
// ============================================
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const pngToIco = require('png-to-ico').default;

const buildDir = path.join(__dirname, '..', 'build');
const svgPath  = path.join(buildDir, 'icon.svg');
const pngPath  = path.join(buildDir, 'icon.png');
const icoPath  = path.join(buildDir, 'icon.ico');

if (!fs.existsSync(svgPath)) {
  console.error(`[icon] missing source: ${svgPath}`);
  process.exit(1);
}
const svg = fs.readFileSync(svgPath);

// ---- 512x512 PNG (electron-builder picks this up for macOS / general use) ----
const pngBuf = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } }).render().asPng();
fs.writeFileSync(pngPath, pngBuf);
console.log(`[icon] ✓ icon.png  ${(pngBuf.length / 1024).toFixed(1)} KB · 512×512`);

// ---- Multi-res ICO for Windows (16/32/48/64/128/256) ----
const sizes = [16, 32, 48, 64, 128, 256];
const pngs = sizes.map(size =>
  new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
);

(async () => {
  const icoBuf = await pngToIco(pngs);
  fs.writeFileSync(icoPath, icoBuf);
  console.log(`[icon] ✓ icon.ico  ${(icoBuf.length / 1024).toFixed(1)} KB · ${sizes.join('/')} px`);
})().catch(err => {
  console.error('[icon] failed:', err);
  process.exit(1);
});
