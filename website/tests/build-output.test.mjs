// Static checks over the built site (run `npm run build` first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const pages = {
  '/': 'index.html',
  '/beta': 'beta/index.html',
  '/setup': 'setup/index.html',
  '/privacy': 'privacy/index.html',
  '/permissions': 'permissions/index.html',
  '/help': 'help/index.html',
  '/changelog': 'changelog/index.html',
  '/roadmap': 'roadmap/index.html',
};
const read = (f) => readFileSync(join(dist, f), 'utf8');
const allHtml = () => {
  const out = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.html')) out.push(p);
    }
  };
  walk(dist);
  return out.map((p) => [p, readFileSync(p, 'utf8')]);
};

test('every route exists', () => {
  for (const f of Object.values(pages)) assert.ok(existsSync(join(dist, f)), f);
});

test('download and pricing are not generated without configuration', () => {
  assert.ok(!existsSync(join(dist, 'download')) && !existsSync(join(dist, 'download.html')));
  assert.ok(!existsSync(join(dist, 'pricing')) && !existsSync(join(dist, 'pricing.html')));
  for (const [p, html] of allHtml()) {
    assert.ok(!/href="\/download"/.test(html), `${p} links to /download`);
    assert.ok(!/href="\/pricing"/.test(html), `${p} links to /pricing`);
  }
});

test('one h1, a title and a description per page', () => {
  for (const [route, f] of Object.entries(pages)) {
    const html = read(f);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${route} h1 count`);
    assert.match(html, /<title>[^<]{5,}<\/title>/, `${route} title`);
    assert.match(html, /<meta name="description" content="[^"]{30,}"/, `${route} description`);
  }
});

test('preview build is not indexable and has no sitemap', () => {
  for (const f of Object.values(pages)) assert.match(read(f), /<meta name="robots" content="noindex, nofollow"/);
  assert.match(readFileSync(join(dist, 'robots.txt'), 'utf8'), /Disallow: \//);
  assert.ok(!existsSync(join(dist, 'sitemap.xml')));
});

test('no private data patterns in the output', () => {
  const banned = [
    /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // private IPv4
    /\b192\.168\.\d{1,3}\.\d{1,3}\b/,
    /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/,
    /BEGIN [A-Z ]*PRIVATE KEY/,
    /MCowBQYDK2VwAyEA/, // trial public key prefix — no token material on the site
    /Chetan/i,
    /\+\d{1,3}[\s-]?\d{3,}[\s-]?\d{3,}/, // phone numbers
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, // any email address (none approved yet)
  ];
  for (const [p, html] of allHtml()) {
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '');
    for (const re of banned) assert.ok(!re.test(text), `${p} matches ${re}`);
  }
});

test('no unsupported claims', () => {
  const banned = [
    /coming soon/i,
    /works with (every|all|any) android/i,
    /notari[sz]ed/i,
    /(App Store|Google Play) badge/i,
    /testimonial/i,
    /blazing/i,
    /military-grade/i,
    /revolutioni[sz]e/i,
    /native swift/i,
    /\b\d+\s?ms latency\b/i,
    /zero setup/i,
  ];
  for (const [p, html] of allHtml()) {
    const text = html.replace(/<[^>]+>/g, ' ');
    for (const re of banned) {
      if (re.source.startsWith('notari') && /isn’t notarized|not notarized/i.test(text)) continue;
      assert.ok(!re.test(text), `${p} matches ${re}`);
    }
  }
});

test('without an endpoint there is no form at all, only an honest closed state', () => {
  for (const route of ['/', '/beta']) {
    const html = read(pages[route]);
    assert.ok(!/<form[\s>]/.test(html), `${route} renders a <form>`);
    assert.ok(!/<input[\s>]/.test(html), `${route} renders an input`);
    assert.match(html, /Requests aren’t open on this page yet/);
    assert.ok(!/Request received/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), `${route} shows success text`);
  }
});

test('privacy page is marked as a draft', () => {
  assert.match(read(pages['/privacy']), /Draft — not yet the effective privacy policy/);
});

test('illustrations are labelled', () => {
  const html = read(pages['/']);
  assert.ok((html.match(/class="illus-label/g) || []).length >= 5);
  assert.match(html, /fictional data/);
});
