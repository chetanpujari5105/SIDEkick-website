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

test('pricing is not generated without configuration', () => {
  assert.ok(!existsSync(join(dist, 'pricing')) && !existsSync(join(dist, 'pricing.html')));
  for (const [p, html] of allHtml()) {
    assert.ok(!/href="\/pricing"/.test(html), `${p} links to /pricing`);
  }
});

/*
 * /download, as configured on 2026-11-11: releaseMode 'public' with one Mac build that is NOT
 * notarized, offered through `allowUnnotarizedDownloads`. These hold the page to what that decision
 * requires — it says what the build is, what else a person needs, and how to open it.
 */
const downloadPage = () => {
  const f = existsSync(join(dist, 'download/index.html')) ? 'download/index.html' : 'download.html';
  return read(f);
};
const downloadText = () => downloadPage().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('the download page exists and the primary action leads to it', () => {
  assert.ok(existsSync(join(dist, 'download/index.html')) || existsSync(join(dist, 'download.html')));
  assert.match(read(pages['/']), /href="\/download"/);
  assert.equal((downloadPage().match(/<h1[\s>]/g) || []).length, 1);
});

test('an un-notarized download says so, and says how to open it', () => {
  const text = downloadText();
  assert.match(text, /not notarized by Apple/);
  assert.match(text, /Privacy &amp; Security|Privacy & Security/);
  assert.ok((text.match(/Open Anyway/g) || []).length >= 2, 'both Open Anyway steps');
  assert.match(text, /Never turn off Gatekeeper/);
  // The right-click shortcut is offered only for the macOS versions where it still works.
  assert.match(text, /macOS 14 and earlier[^.]*right-click/);
});

test('the download page says the download alone is not enough', () => {
  const text = downloadText();
  assert.match(text, /You also need the Sidekick Android app/);
  assert.match(text, /Google Play test and not a public listing/);
  assert.match(text, /Intel Macs aren’t covered/);
  // 2.0.2 removed the token. The page offering that build must not send anyone looking for one.
  assert.match(text, /asks for no access token/);
  assert.ok(!/opens only with a beta access token/.test(text));
});

test('every download carries its SHA-256 and resolves through a redirect this site declares', () => {
  const html = downloadPage();
  const links = [...html.matchAll(/href="(\/get\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(links.length >= 1, 'at least one download link');
  assert.match(html, /\b[0-9a-f]{64}\b/, 'a SHA-256 is shown');
  const { redirects } = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  for (const href of links) {
    const rule = redirects.find((r) => r.source === href);
    assert.ok(rule, `${href} has no redirect in vercel.json`);
    assert.match(rule.destination, /^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/download\//);
    assert.equal(rule.permanent, false, 'a build link must be repointable');
  }
  // The link's path carries no version, so every redirect has to serve the build the site says is
  // current — including the versioned path an earlier page handed out.
  const version = read(pages['/']).match(/Build (\d+\.\d+\.\d+) · /)[1];
  for (const rule of redirects) {
    assert.ok(rule.destination.endsWith(`/v${version}/Sidekick-${version}-arm64.dmg`), `${rule.source} does not serve ${version}`);
  }
  // No page links to the hosting account directly — the privacy test below depends on it.
  assert.ok(!/github\.com/.test(html));
});

test('a build that is not notarized is labelled a beta wherever the status shows', () => {
  assert.match(read(pages['/']), /brand__status[^>]*>Beta</);
  assert.match(read(pages['/']).replace(/<[^>]+>/g, ' '), /Beta build — not notarized by Apple/);
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
