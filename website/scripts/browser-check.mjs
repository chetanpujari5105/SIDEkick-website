// Browser checks against the built site: overflow, axe-core (WCAG 2.2 AA rules), keyboard tabs,
// mobile menu, and no-JS rendering. Usage: npm run build && npm run test:browser
// Needs a Chromium binary: CHROMIUM_PATH, or the Playwright-managed one at /opt/pw-browsers.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (!existsSync(exe)) {
  console.error(`No Chromium at ${exe}. Set CHROMIUM_PATH.`);
  process.exit(2);
}
const PORT = 4399;
const BASE = `http://localhost:${PORT}`;
// Minimal static server for dist/ (mirrors a static host: /path → /path/index.html, else 404.html).
const dist = new URL('../dist/', import.meta.url).pathname;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, BASE).pathname);
  let file = join(dist, url);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    return res.end(readFileSync(join(dist, '404.html')));
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(PORT);
const stop = () => server.close();

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE + '/');
      if (r.ok) return;
      await r.text();
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('preview server did not start');
}

const routes = ['/', '/beta', '/setup', '/privacy', '/permissions', '/help', '/changelog', '/roadmap', '/404'];
const widths = [360, 390, 640, 768, 1024, 1440];
const failures = [];
const fail = (m) => {
  failures.push(m);
  console.log('  ✗ ' + m);
};
const pass = (m) => console.log('  ✓ ' + m);

await waitForServer();
const browser = await chromium.launch({ executablePath: exe });

console.log('Horizontal overflow');
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  for (const r of routes) {
    await page.goto(BASE + r, { waitUntil: 'load' });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 0) fail(`${r} @${w}px overflows by ${over}px`);
  }
  await page.close();
}
if (!failures.length) pass(`${routes.length} routes × ${widths.length} widths, no overflow`);

console.log('axe-core (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa)');
for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  for (const r of routes) {
    await page.goto(BASE + r, { waitUntil: 'load' });
    await page.waitForTimeout(700); // let entrance animations finish so contrast is measured at rest
    await page.addScriptTag({ content: axeSource });
    const res = await page.evaluate(async () =>
      // @ts-ignore
      (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })).violations.map(
        (v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(' ')}`,
      ),
    );
    if (res.length) fail(`${r} @${w}px: ${res.join('; ')}`);
    else pass(`${r} @${w}px`);
  }
  await page.close();
}

console.log('Workflow tabs keyboard');
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.focus('#tab-mirror');
  await page.keyboard.press('ArrowRight');
  const state = await page.evaluate(() => ({
    sel: document.querySelector('#tab-notifications')?.getAttribute('aria-selected'),
    focus: document.activeElement?.id,
    shown: !document.querySelector('#panel-notifications')?.hasAttribute('hidden'),
    hidden: document.querySelector('#panel-mirror')?.hasAttribute('hidden'),
  }));
  state.sel === 'true' && state.focus === 'tab-notifications' && state.shown && state.hidden
    ? pass('ArrowRight moves selection, focus and panel')
    : fail(`tabs: ${JSON.stringify(state)}`);
  await page.keyboard.press('End');
  const end = await page.evaluate(() => document.activeElement?.id);
  end === 'tab-clipboard' ? pass('End selects the last tab') : fail(`End → ${end}`);
  await page.close();
}

console.log('Mobile menu');
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.click('[data-menu-toggle]');
  const open = await page.evaluate(() => ({
    exp: document.querySelector('[data-menu-toggle]')?.getAttribute('aria-expanded'),
    vis: getComputedStyle(document.querySelector('#site-nav')).display !== 'none',
  }));
  open.exp === 'true' && open.vis ? pass('opens') : fail(`menu open: ${JSON.stringify(open)}`);
  await page.keyboard.press('Escape');
  const closed = await page.evaluate(() => ({
    exp: document.querySelector('[data-menu-toggle]')?.getAttribute('aria-expanded'),
    focus: document.activeElement?.hasAttribute('data-menu-toggle'),
  }));
  closed.exp === 'false' && closed.focus ? pass('Escape closes and returns focus') : fail(`menu close: ${JSON.stringify(closed)}`);
  await page.close();
}

console.log('Without JavaScript');
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const r = await page.evaluate(() => ({
    panels: [...document.querySelectorAll('[data-panel]')].filter((p) => p.getBoundingClientRect().height > 0).length,
    navLinks: [...document.querySelectorAll('#site-nav a')].filter((a) => a.getBoundingClientRect().height > 0).length,
    h1: document.querySelector('h1')?.getBoundingClientRect().height,
  }));
  r.panels === 4 ? pass('all four workflow panels visible') : fail(`no-JS panels visible: ${r.panels}`);
  r.navLinks >= 5 ? pass('navigation reachable') : fail(`no-JS nav links visible: ${r.navLinks}`);
  r.h1 > 0 ? pass('hero heading visible') : fail('no-JS hero heading hidden');
  await ctx.close();
}

console.log('Missing media');
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/\.(png|webp|jpg|jpeg|svg|ico)$/, (r) => r.abort());
  const page = await ctx.newPage();
  for (const r of ['/', '/beta']) {
    await page.goto(BASE + r, { waitUntil: 'load' });
    const res = await page.evaluate(() => ({
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      brand: document.querySelector('.brand__word')?.getBoundingClientRect().width ?? 0,
      altless: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
    }));
    res.over <= 0 && res.brand > 0 && res.altless === 0
      ? pass(`${r}: layout and brand hold with images blocked; every image has alt`)
      : fail(`${r} missing media: ${JSON.stringify(res)}`);
  }
  await ctx.close();
}

console.log('Reduced motion');
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const anims = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  anims === 0 ? pass('no running animations') : fail(`${anims} animations running with reduced motion`);
  await ctx.close();
}

await browser.close();
stop();
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll browser checks passed');
process.exit(failures.length ? 1 : 0);
