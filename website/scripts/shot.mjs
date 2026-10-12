// Screenshot helper for design review. Usage: node scripts/shot.mjs <baseUrl> <outDir> <path> [widths...] [--full]
import { chromium } from 'playwright-core';
const [base, out, path = '/', ...rest] = process.argv.slice(2);
const full = rest.includes('--full');
const widths = rest.filter((w) => /^\d+$/.test(w)).map(Number);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const w of widths.length ? widths : [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const name = `${out}/${path.replace(/\W+/g, '_') || 'home'}-${w}${full ? '-full' : ''}.png`;
  await page.screenshot({ path: name, fullPage: full });
  console.log(name);
  await page.close();
}
await browser.close();
