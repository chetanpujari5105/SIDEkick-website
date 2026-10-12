# Website launch checklist

Status on 2026-10-12: **preview only.** Built and tested locally; not deployed, no domain, no endpoints.

## Blockers — must be resolved before the site is public

| # | Item | Owner | Why |
|---|---|---|---|
| B1 | Publisher legal name, postal address, contact, effective date, change-notice method | owner | `/privacy` can't become the effective policy without them (draft banner stays until `privacyPublicationStatus: 'published'`) |
| B2 | Decide: may phone diagnostic logs move in an Android device-to-device transfer; rewrite or disclose pre-`219cb76` Activity history | owner | Both change a sentence in the privacy text |
| B3 | Choose a host; name it and its log retention in `/privacy#website` | owner | Website hosting is described generically today |
| B4 | Connect the beta form to the Google Sheet: make the sheet **Restricted**, install and deploy `integrations/google-sheets/Code.gs` (SETUP.md), paste the `/exec` URL into `site.ts`, approve the retention sentence, then one real submission | owner | No form is rendered until the URL is set |
| B4a | Google Play testing track exists for the Android app (signed build; check the SMS / Call Log permission declaration requirements first) | owner | The form, `/beta`, `/setup` and `/privacy` now say Android testers install from Google Play (`androidBetaDistribution`). Switch it to `apk` if Play isn't ready |
| B5 | Approve a support address (or confirm none) | owner | `/help` currently points testers to their invitation |
| B6 | Production domain → `SIDEKICK_SITE_URL`, `SIDEKICK_INDEXABLE=true` | owner | Enables canonical, sitemap, indexing |
| B7 | Owner review of every claim against `docs/content-audit.md` — especially files phone → Mac (defect 137 open), pairing v2 (hardware run partial), clipboard stage D (partial) | owner | No feature is verified on a signed release build yet |

## Assets still needed

| Asset | Replaces | Notes |
|---|---|---|
| Sanitized screenshots: Notifications, Messages, Mirror, Files send sheet, Clipboard, Calls, pairing screen | the HTML illustrations | Synthetic contacts and content only; no IPs, device serials, real names, pairing codes or tokens. Add to `approvedScreenshots` |
| A short sanitized recording (notification → reply → send file → mirror) with captions (`.vtt`) and poster | the illustrated walkthrough | Set `demoVideo`; the dialog and the hero's secondary CTA switch to it automatically |
| Android app screenshots (Devices, scan, transfers) | phone illustrations | The existing `Sidekick android ui/*.png` mockups contain personal-looking data and an unshipped image-clipboard item — do not use |
| Confirm the favicon / app tile derived from `LOGOS/head_logo.png` | — | |

## Before switching `releaseMode` to `public`

- Developer ID-signed and notarized Mac build; signed APK. Only then add `publicDownloadLinks` with `signed: true` and SHA-256s.
- Intel build run on an Intel Mac, or the Intel download dropped / labelled.
- Commercial model decided → `pricing`, and the privacy text updated if licensing makes any network call.
- A notices/licences page for both apps' third-party components.
- Re-run the content audit against the release build.

## Verified locally (2026-10-12)

- `npm run check`: 0 errors, 0 warnings.
- `npm test`: 18/18 — 9 static checks on the build plus 9 `Code.gs` tests against a stand-in for Apps Script.
- `npm run test:browser`: no horizontal overflow on 9 routes × 6 widths (360–1440); axe-core WCAG 2.2 A/AA rules clean on every route at 1440 and 390; keyboard tabs, menu Escape/focus return, no-JS rendering, blocked images and reduced motion pass.
- `npm run test:form`: 28/28 — validation and focus, axe clean with errors showing, long input at 360px, error states for HTTP 500, a 200 with `{ok:false}`, a 200 HTML error page and a dropped connection, success only on `{ok:true}`, and the real submission stored by `Code.gs` as the expected row.
- Homepage HTML ≈ 21 KB gzipped; no external requests; no client framework.

## Not performed

- Lighthouse / Core Web Vitals on a real host and network.
- Manual screen-reader pass (VoiceOver, TalkBack), Safari and Firefox testing, real 200% browser zoom (approximated by the 640/768px widths).
- `Code.gs` running on Google's servers, and a submission from the live site into the real sheet (needs your deployment).
- Any deployment.
