# Sidekick website — content audit (internal, not published)

Audited 2026-10-12 against `chetanpujari5105/ConnectSuite` at `0b078a5` (shallow clone, read-only).
Nothing in the app repository was changed, built or launched.

## How conflicts were resolved

| Priority | Source | Used for |
|---|---|---|
| 1 | `docs/release-candidate-2026-10-12.md` (RC `83c4096`) + release gates in `desktop/src` | what is enabled in the distributed build |
| 2 | `docs/release-tracker.md` feature table (opened 2026-10-06, later notes to 10-07) | implementation / hardware-evidence status per feature |
| 3 | `docs/beta-tester-guide.md` (updated 2026-10-12), `docs/beta-launch-checklist-2026-10-11.md` | user-facing flow, release mode |
| 4 | `docs/sidekick-figma-handoff.md`, `desktop/src/renderer/tokens.css` | visual identity |
| — | `README.md`, `docs/status.md` (self-declared stale), `PRODUCT.md` "behavioural target" | **not** treated as proof of availability |

### Conflicts recorded

| Conflict | Resolution on the website |
|---|---|
| `README.md` says "Setup: None" for mirroring; tester guide and privacy draft list the accessibility service and per-session consent | Site states the permissions; never says "no setup" |
| `README.md` lists 720p/1080p presets with bitrates; current `mirror.ts` takes `maxResolution` + `frameRate` and no current doc confirms the README table | Site says "quality presets that request a resolution and frame rate"; no numbers |
| `README.md` describes v1 Sync (UDP broadcast, 8-group fingerprint confirm) | Superseded by the QR pairing in `PRODUCT.md`, the guide and `protocol.md` Pairing v2. Site uses QR pairing only |
| `docs/permissions.md` originally recommended Bluetooth for call audio | Retracted in the same file (measured 2026-09-14, SCO never opened). Site: call audio stays on the phone, no remedy offered |
| Release tracker P3 "ML Kit sends usage metrics" | Resolved 2026-10-08: ML Kit removed, ZXing on-device (privacy draft §2, RC 10-11). Site may say the QR scan is read on the phone |
| `PRODUCT.md` "Camera: unbuilt" vs tracker rows 20–21 (camera v1 implemented, webcam partial) | Both are gated **off** in release (`WEBCAM_RELEASE = false`). Site lists webcam only under "Exploring", never as available |
| Android design PNGs (`Sidekick android ui/`) show an image clipboard item, a latency figure and a real-looking Mac name/IP | Not used. They are mockups, show unshipped capability, and contain personal-looking data |

## Release status (drives `releaseMode`)

- RC `83c4096`, 2026-10-12: **release candidate, not launched.** Mac `.dmg` ad-hoc signed (Gatekeeper rejects;
  testers use Open Anyway). Android APK **unsigned — cannot be installed** until the owner signs it.
- **The Intel build has never run on an Intel Mac.**
- Beta: 3–5 named testers, invited. Access by **hand-issued signed tokens, 45 days from the token's issue/start
  date** (default start = day of issue, not first launch), Mac-only, offline check, not bound to one Mac, no revoke.
- No public download, no price, no publisher identity, no support email, no hosted policy.

→ Website default: `releaseMode: 'invited-beta'`, no download or pricing routes, beta form disabled until an
endpoint is approved.

## Features

Legend — **Impl**: implemented in source. **HW**: hardware evidence exists (dev builds; one Samsung SM-S938B on
Android 16 + one Apple-silicon Mac unless stated). **Release-verified**: no feature is (no signed build exists).

| Feature | User benefit | Impl / HW | In RC 2026-10-12 | Permissions | Limitations | Sources | Approved website wording | Media needed |
|---|---|---|---|---|---|---|---|---|
| Pairing | One-time, trusted link | v2 in source; v2 hardware run partial | on | Mac: Local Network prompt; phone: camera to scan | Every earlier pairing must be redone; both apps needed | tracker #1, guide, protocol.md Pairing v2 | "Scan the code on your Mac with your phone, once." | Real Mac QR screen (code blurred) + phone scan |
| Reconnect & discovery | Comes back after sleep/Wi-Fi change | yes / 2026-09-03 | on | battery-optimisation exemption helps | One phone per Mac; other OEMs' background limits untested | tracker #2, PRODUCT.md | "Reconnects on its own after sleep or a network change, on the phones we tested." | — |
| Screen mirroring | See the phone on the Mac, floating window | yes / 2026-09-10 | on | Android consent **every session**; foreground service | `FLAG_SECURE` apps (banking, DRM, lock screen) show black; quality is requested, not guaranteed | tracker #17, README Module 2 | "Mirror your phone's screen in a window you can keep on top." | **Recording** of a mirror session with synthetic content |
| Remote control | Click, scroll, type on the phone | yes / 2026-08-27 | on | Accessibility service (granted by hand) | Only tap/swipe/scroll/text/keys + back, home, recents, notifications, quick settings, lock, power menu. No power-button press | protocol.md input.*, PRODUCT.md walls | "Click, scroll and type into your phone from the Mac." | same recording |
| Notifications | Read & act on phone notifications | yes / 2026-08-31 | on | Notification access (by hand) | Reply/actions only where the notification offers them | tracker #3, protocol notif.* | "Reply from your Mac when the notification offers a reply — including messaging apps that support it." **Never** "WhatsApp integration" | Screenshot, synthetic notifications |
| Mac native notifications | Banners when the window is hidden | yes / 2026-09-04 | on | macOS notification permission | — | tracker #4 | "Phone notifications can appear as Mac notifications." | — |
| Text messages | Read threads, reply | yes / 2026-08-31 | on (reply) | SMS read/send | Starting a **new** conversation is conditional (defect 30) → not claimed. RCS not claimed | tracker #5–6 | "Read your text message threads and reply from the Mac." | Synthetic thread screenshot |
| Calls | See, answer, decline, dial | yes / 2026-08-31 | on | Call log, phone state, call phone, answer calls | **Audio stays on the phone** (platform wall; Bluetooth remedy retracted). Incoming-call banner gated off | tracker #7–9, permissions.md | "See who's calling and answer or decline from the Mac — you talk on the phone." | Synthetic calls pane |
| Contacts | Names beside numbers | yes | on | Contacts | — | tracker #10 | "Contact names beside messages and calls." | — |
| Media remote | Control phone playback | yes / 2026-08-28 | on | (notification access for media session) | Phone-side volume changes don't reach the Mac | tracker #11 | "Play, pause and skip what your phone is playing." | — |
| Files Mac → phone | Send without cables | yes / 2026-09-01 (+10-11 run) | on | none for `Download/ConnectSuite`; folder grants otherwise | Shows what and where before sending; phone verifies digest | tracker #12, transfer-speed doc | "Send files to your phone. Sidekick shows where they'll land before anything moves." | Send sheet screenshot |
| Files phone → Mac | Browse & pull | yes; defect 137 (granted folders listed empty, not reproduced since 10-06) | on, **conditional** | Folder grants (SAF) | Only folders you grant; storage root and `Download/` itself cannot be granted; pulls > 64 MiB not block-verified (UI says unverified) | tracker #13–14, PRODUCT.md | "Browse the folders you share with Sidekick and drag files into Finder." | Files pane, synthetic folder |
| Photos & video | Browse library, save to Mac | yes / 2026-09-23 | on | Photos/videos (partial access honoured) | Depth on very large libraries unmeasured | tracker #15 | "Browse your phone's photos and videos and save the ones you need." | Photos grid with stock-free synthetic images |
| Clipboard | Copy here, paste there | yes; stage D partial 10-07 | on | — | Mac→phone automatic; phone→Mac only while Sidekick is open or via Share; selections need **Copy** on the Mac; history in memory, 20 items | tracker #16, PRODUCT.md walls, privacy draft | "Text you copy on your Mac is ready on your phone. Going the other way, send it from Sidekick on the phone." | Clipboard pane |
| Apps | Open a phone app from the Mac | yes / 2026-09-03 | on | Notification permission (prompt) | Mac **asks**; phone shows a prompt you tap (never "launch") | tracker #18, phase-7-apps-proposal | "Pick an app on your Mac and your phone offers to open it." | — |
| Phone → Mac share sheet | Share from any phone app | partial | single file only; multi-file off | — | `SHARE_V3_RELEASE` false | tracker #19 | Help only: "Share a file to Sidekick on the phone." No multi-file claim | — |
| Camera / webcam | Phone as Mac camera | partial | **off** | — | Needs signing + camera extension | tracker #20–21, RC gates | **Roadmap only**, "exploring" | — |
| Call audio on Mac | — | wall | n/a | — | Not possible today | permissions.md | Stated as a limitation, roadmap "research only, not promised" | — |
| Beta token | Time-boxed invited access | yes; walked on dev build | on | — | 45 days from start date in token; no revoke; offline | trial summary | "45-day invited beta access, checked on your Mac" | Token screen screenshot |

## Compatibility facts

| Fact | Value | Source |
|---|---|---|
| macOS minimum | 11.0 | `electron-builder.yml` `LSMinimumSystemVersion` |
| Android minimum | Android 10 (API 29) | `app/build.gradle.kts` `minSdk = 29` |
| Mac builds | Apple silicon (arm64) and Intel (x64) | RC 2026-10-12 §1 |
| Intel verified? | **No** — never run on an Intel Mac | RC §2 x64 note |
| Primary test hardware | Samsung SM-S938B (Android 16) + one Apple-silicon Mac | RC §5, tracker U-3 |
| Partial readings | Motorola moto g34 & g45 5G, realme RMX3870, vivo (some install/permission/battery checks) | device docs |
| Desktop tech | Electron + TypeScript (not native Swift) | PRODUCT.md |
| Network | Same local network or phone hotspot; nothing outside the LAN | PRODUCT.md, guide |

## Privacy facts (app only)

- TLS 1.3 both ends, self-signed certs, SHA-256 fingerprints pinned at QR pairing; no plaintext fallback.
- Phone listens, Mac connects out; no relay, no account.
- No analytics/ads/crash reporting in either app (release classpath + dex readings, privacy draft §2).
- Clipboard history in memory only (20). Activity history ≤ 2,000 events on the Mac. Logs ≈ 1 MB, no content.
- Beta token checked offline; nothing sent.
- **Not claimed:** independent audit, certification, "nothing ever leaves your network" for the business.

## Claims intentionally omitted

Throughput / latency / battery figures (one device, one reading each); "works with every Android"; WhatsApp
integration; call audio; automatic two-way clipboard; image clipboard; new SMS conversations; RCS; webcam;
USB; remote over internet (Tailscale never measured); iPhone/iPad/Windows; notarized/signed; App Store /
Play; user counts, ratings, testimonials.

## Roadmap content (user-supplied planning, 2026-10-12)

Published only as direction, with no dates, under "Planned next" (improvements to existing features) and
"Exploring" (separate projects, not promised). The competitor named in the planning notes is **not**
mentioned publicly. Cellular call audio through the Mac is listed as research only.

## Assets

| Asset | Source | Status |
|---|---|---|
| Brand mark | `LOGOS/head_logo.png` (RGBA) → resized WebP/PNG | used |
| App icon / favicon | derived from the same mark on `#0A0A0A` | used — owner should confirm |
| Product visuals | Built in HTML/CSS from the Figma handoff tokens with **fictional data**, labelled "Illustration" | used as placeholders |
| Real sanitized screenshots | none approved | **needed** (see launch checklist) |
| Demo recording | none | **needed** |
| `docs/evidence/**`, `Sidekick android ui/*.png`, mockup `uploads/` | contain or imitate personal data | **not used, not opened for selection** |
