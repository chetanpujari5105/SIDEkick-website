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
import { makeEnv } from '../tests/apps-script-env.mjs';

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

/**
 * Mock receiver modes, mirroring what a Google Apps Script web app can return:
 * 'ok' → 200 {"ok":true} · 'refused' → 200 {"ok":false,"error":"invalid"} · 'crash' → 200 HTML error
 * page · 'fail' → 500 · 'drop' → socket destroyed (network failure).
 */
let mode = 'ok';
const received = [];
// In 'ok' mode the reply comes from the real Code.gs (run against a stand-in sheet), so this also
// proves the website and the Apps Script agree on field names and values.
const sheetEnv = makeEnv();
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = createServer((req, res) => {
  const url = new URL(req.url, BASE).pathname;
  if (url === '/__beta' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      if (mode === 'drop') return req.socket.destroy();
      received.push({ type: req.headers['content-type'] ?? '', params: new URLSearchParams(body) });
      if (mode === 'crash') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end('<html><body>TypeError: Cannot read properties of null</body></html>');
      }
      res.writeHead(mode === 'fail' ? 500 : 200, { 'Content-Type': 'application/json' });
      if (mode === 'ok') {
        return res.end(sheetEnv.ctx.doPost({ parameter: Object.fromEntries(new URLSearchParams(body)) }).content);
      }
      res.end(mode === 'refused' ? '{"ok":false,"error":"invalid"}' : '{"error":"test"}');
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
check(s.errors.length === 6, `six errors on empty submit (${s.errors.length})`);
check(s.focus === 'bf-name', 'focus moves to the first invalid field');
check(received.length === 0, 'nothing sent while invalid');
check((await page.getAttribute('#bf-email', 'aria-invalid')) === 'true', 'aria-invalid set');
await page.fill('#bf-name', 'Maya Chen');
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
await page.fill('#bf-email', 'maya.chen@gmail.com');
await page.check('input[name="mac"][value="intel"]');
await page.selectOption('#bf-android', '14');
await page.fill('#bf-country', 'India');
await page.check('#bf-consent');
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

console.log('Receiver says no (HTTP 200, ok:false)');
mode = 'refused';
await submit();
s = await state();
check(s.error && !s.ok, 'error state shown when the receiver refuses');
check(/weren’t accepted/.test(s.result ?? ''), 'refusal explained as a field problem');

console.log('Receiver crashed (HTTP 200, HTML error page)');
mode = 'crash';
await submit();
s = await state();
check(s.error && !s.ok, 'error state shown for a 200 that isn’t {ok:true}');

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
const last = received.at(-1);
check(last?.type.startsWith('application/x-www-form-urlencoded'), `sent URL-encoded, no preflight needed (${last?.type})`);
const got = Object.fromEntries(last?.params ?? []);
check(got.name === 'Maya Chen' && got.email === 'maya.chen@gmail.com', 'name and email sent');
check(got.mac === 'intel' && got.android_version === '14' && got.country === 'India', 'Mac type, Android version and country sent');
check(got.phone_model?.length === 120 && got.consent === 'yes' && got._js === '1', 'phone model, consent and _js sent');
check(got.website === '', 'honeypot sent empty');
check(s.submitDisabled === true, 'form locked after success');
const sheetRows = sheetEnv.rows();
check(sheetRows.length === 2, `Code.gs stored exactly one row (${sheetRows.length - 1})`);
const row = sheetRows[1] ?? [];
check(
  row[1] === 'Maya Chen' && row[2] === 'maya.chen@gmail.com' && row[3] === 'Intel' && row[5] === 'Android 14' && row[6] === 'India' && row[9] === 'New',
  'stored row matches what was typed',
);

await browser.close();
server.close();
rmSync(out, { recursive: true, force: true });
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll form checks passed');
process.exit(failures.length ? 1 : 0);
