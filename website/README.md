# Sidekick website

Marketing and support site for Sidekick, the Android ↔ Mac companion apps. It's a static Astro site:
TypeScript, plain CSS custom properties, and no UI framework. The only client JavaScript is a few small
inline scripts for the mobile menu, the workflow tabs, the beta form and the (inactive) demo dialog.

This folder is separate from the app repository (`chetanpujari5105/ConnectSuite`). Nothing here changes
app behaviour, protocol, signing, pairing or trial verification.

## Run it

```sh
cd website
npm install
npm run dev            # http://localhost:4321
npm run build          # static output in dist/
npm run preview        # serve dist/
```

Needs Node 22.12 or newer.

## Checks

```sh
npm run check          # astro check (TypeScript + .astro diagnostics)
npm run build && npm test          # static assertions over dist/ (routes, no private data, no banned claims, gating)
npm run build && npm run test:browser
                       # Chromium: overflow at 360–1440px on every route, axe-core WCAG 2.2 AA rules,
                       # keyboard tabs, mobile menu + Escape, no-JS rendering, reduced motion.
                       # Set CHROMIUM_PATH if Chromium isn't at /opt/pw-browsers/chromium-1194/…
```

## Routes

| Route | Content |
|---|---|
| `/` | Homepage: hero, illustrated walkthrough, workflow tabs, two stories, how it works, connection model, compatibility, roadmap preview, beta, FAQ |
| `/beta` | Beta expectations and request form |
| `/setup` | Install, pair, permissions, token, removal |
| `/privacy` | Privacy explanation — **marked as a draft** until publisher details exist |
| `/permissions` | Every Android and Mac permission and what it's for |
| `/help` | Common issues and how to report |
| `/changelog` | Notable pre-release changes |
| `/roadmap` | Direction without dates |
| `/download`, `/pricing` | **Not generated** until configured (`src/pages/[gated].astro`) |

## Configuration

Everything that depends on a business decision lives in `src/config/site.ts`:

| Field | Now | Effect |
|---|---|---|
| `releaseMode` | `invited-beta` | Primary CTA, status label. `public` + signed `publicDownloadLinks` generates `/download` |
| `betaAccessDuration` / `betaAccessDescription` | 45 days, from the token's start date | Shown with its meaning, never as a bare number |
| `betaFormEndpoint` | `PUBLIC_BETA_FORM_ENDPOINT` env (https only) | Empty → form disabled with an honest notice; nothing is sent |
| `supportEmail` | `PUBLIC_SUPPORT_EMAIL` env | Empty → no support link or address anywhere |
| `siteUrl` / `indexable` | `SIDEKICK_SITE_URL`, `SIDEKICK_INDEXABLE` env | Both required for canonical URLs, `index,follow`, `sitemap.xml` and an allowing `robots.txt` |
| `pricing` | `null` | Set to generate `/pricing` |
| `demoVideo` | `null` | Set to an approved recording to enable the demo dialog |
| `privacyPublicationStatus` | `draft` | Draft banner on `/privacy` |

See `.env.example`. The form endpoint must accept a `multipart/form-data` POST and return a 2xx only when the
submission was stored; the page shows success only on a 2xx.

## Content sources

- `docs/content-audit.md` — every public claim traced to the app repository, plus what was left out and why.
- `docs/design-plan.md` — the visual concept.
- `docs/launch-checklist.md` — what's still needed before launch.
- Copy lives in `src/content/*.ts` and the page components.

## Assets

- Brand mark and favicons are derived from `LOGOS/head_logo.png` in the app repo (`public/mark-*.png|webp`,
  `favicon*`, `apple-touch-icon.png`, `icon-512.png`). `public/og-image.png` is rendered from `scripts/og.html`.
- All product views are **HTML/CSS illustrations with fictional data**, labelled on the page. No screenshots
  from the app repository were used.
- Fonts: Geist and Geist Mono (SIL OFL 1.1) via `@fontsource-variable`, self-hosted in the build.
- Icons: Lucide (ISC), copied into `src/components/icons.ts` by `scripts/gen-icons.cjs`.

## Deploying (not done)

The build is plain static files in `dist/`. Any static host works (Cloudflare Pages, Netlify, Vercel static,
GitHub Pages, S3 + CloudFront):

1. Set build command `npm run build`, output `dist`, Node 22.
2. For a **preview** deployment set no env vars: the site is `noindex` and `robots.txt` disallows everything.
3. For **production**, only after the launch checklist is complete: set `SIDEKICK_SITE_URL`,
   `SIDEKICK_INDEXABLE=true`, and the approved `PUBLIC_*` values, then rebuild.
4. Configure the host to serve `404.html` for unknown paths.
