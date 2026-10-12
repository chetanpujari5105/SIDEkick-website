// Exercises the beta form's real submit paths against a local mock receiver.
// Builds the site into .form-test-dist/ with PUBLIC_BETA_FORM_ENDPOINT pointing at this script's
// server, so dist/ (the preview build, with the form closed) is untouched.
// Usage: npm run test:form
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (!existsSync(exe)) {
  console.error(`No Chromium at ${exe}. Set CHROMIUM_PATH.`);
  process.exit(2);
}
const PORT = 4398;
const BASE = `http://localhost:${PORT}`;
const root = new URL('..', import.meta.url).pathname;
const out = join(root, '.form-test-dist');

console.log('Building with a local form endpoint…');
execFileSync('npx', ['astro', 'build'], {
  cwd: root,
  stdio: 'ignore',
  env: { ...process.env, SIDEKICK_OUT_DIR: out, PUBLIC_BETA_FORM_ENDPOINT: `${BASE}/__beta` },
});

/** 'ok' → 201, 'fail' → 500, 'drop' → socket destroyed (network failure). */
let mode = 'ok';
const received = [];
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = createServer((req, res) => {
  const url = new URL(req.url, BASE).pathname;
  if (url === '/__beta' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      if (mode === 'drop') return req.socket.destroy();
      received.push(body);
      res.writeHead(mode === 'ok' ? 201 : 500, { 'Content-Type': 'application/json' });
      res.end(mode === 'ok' ? '{"ok":true}' : '{"error":"test"}');
    });
    return;
  }
  let file = join(out, decodeURIComponent(url));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(PORT);

const failures = [];
const check = (ok, msg) => {
  console.log(`  ${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failures.push(msg);
};

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
const state = () =>
  page.evaluate(() => {
    const r = document.querySelector('[data-result]');
    return {
      result: r && !r.hidden ? r.textContent.trim() : null,
      ok: r?.classList.contains('is-ok'),
      error: r?.classList.contains('is-error'),
      submitDisabled: document.querySelector('[data-submit]')?.matches(':disabled'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      errors: [...document.querySelectorAll('.field__err')].filter((e) => !e.hidden).map((e) => e.textContent),
      focus: document.activeElement?.id,
    };
  });
const submit = async () => {
  await page.click('[data-submit]');
  await page.waitForTimeout(400);
};

await page.goto(BASE + '/beta', { waitUntil: 'load' });
console.log('Form renders');
check((await page.$('form[data-beta-form]')) !== null, 'form present when an endpoint is configured');
check((await page.textContent('#beta-form-status-note')).includes('localhost'), 'destination host is named');

console.log('Validation');
await submit();
let s = await state();
check(s.errors.length === 3, `three errors on empty submit (${s.errors.length})`);
check(s.focus === 'bf-email', 'focus moves to the first invalid field');
check(received.length === 0, 'nothing sent while invalid');
check((await page.getAttribute('#bf-email', 'aria-invalid')) === 'true', 'aria-invalid set');
await page.fill('#bf-email', 'maya@');
await submit();
s = await state();
check(s.errors.some((e) => e.includes('doesn’t look complete')), 'incomplete email explained');
check(s.overflow <= 0, 'no overflow at 360px with every error showing');
await page.addScriptTag({ content: axeSource });
const axeViolations = await page.evaluate(async () =>
  // @ts-ignore
  (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })).violations.map((v) => v.id),
);
check(axeViolations.length === 0, `axe clean with errors showing${axeViolations.length ? ': ' + axeViolations.join(', ') : ''}`);

console.log('Long input');
const longModel = 'Samsung Galaxy Z Fold6 Enterprise Edition (SM-F956B/DS) international dual-SIM variant '.repeat(4);
await page.fill('#bf-email', 'maya.chen@example.com');
await page.check('input[name="mac"][value="intel"]');
await page.fill('#bf-phone', longModel);
await page.fill('#bf-wish', 'Mirror my phone while I present. '.repeat(60));
const modelLen = (await page.inputValue('#bf-phone')).length;
check(modelLen === 120, `model name capped at 120 characters (${modelLen})`);
check((await state()).overflow <= 0, 'no overflow with very long values');

console.log('Server error');
mode = 'fail';
await submit();
s = await state();
check(s.error && !s.ok, 'error state shown on HTTP 500');
check(!/received/i.test(s.result ?? ''), 'no success wording on failure');
check(s.submitDisabled === false, 'submit re-enabled to retry');

console.log('Network failure');
mode = 'drop';
await submit();
s = await state();
check(s.error && !s.ok, 'error state shown when the connection drops');

console.log('Success');
mode = 'ok';
const before = received.length;
await submit();
s = await state();
check(s.ok && /Request received/.test(s.result ?? ''), 'success shown only after a 2xx');
check(received.length === before + 1, 'exactly one submission received');
const last = received.at(-1) ?? '';
check(/name="email"\r\n\r\nmaya.chen@example.com/.test(last), 'email sent');
check(/name="mac"\r\n\r\nintel/.test(last), 'Mac type sent');
check(/name="phone_model"/.test(last), 'phone model sent');
check(s.submitDisabled === true, 'form locked after success');

await browser.close();
server.close();
rmSync(out, { recursive: true, force: true });
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll form checks passed');
process.exit(failures.length ? 1 : 0);
