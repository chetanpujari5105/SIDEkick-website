/**
 * Release and publication configuration.
 *
 * Every public claim that depends on a business decision is driven from here, so the site cannot
 * drift ahead of the product. Values below reflect the 2026-10-12 release candidate
 * (see docs/content-audit.md). Change them only with the evidence that changed them.
 */

export type ReleaseMode = 'invited-beta' | 'waitlist' | 'public';

export interface DownloadLink {
  label: string;
  /** e.g. "Apple silicon", "Intel", "Android" */
  platform: string;
  href: string;
  /** Must be true only for a Developer ID-signed + notarized Mac build or a signed APK. */
  signed: boolean;
  sha256?: string;
  /** File size, as shown beside the link. */
  size?: string;
}

/**
 * Paste the Google Apps Script web-app URL here (ends in /exec) to open beta requests.
 * See integrations/google-sheets/SETUP.md. Leave empty to keep the form closed.
 * The PUBLIC_BETA_FORM_ENDPOINT environment variable, if set, takes precedence.
 */
const BETA_FORM_ENDPOINT = '';

export type AndroidBetaDistribution = 'google-play-testing' | 'apk';

export interface SiteConfig {
  name: string;
  releaseMode: ReleaseMode;
  /** Only stated as a number together with its meaning (`betaAccessDescription`). */
  betaAccessDuration: { days: number } | null;
  betaAccessDescription: string;
  supportEmail: string | null;
  betaFormEndpoint: string | null;
  /** Plain-language name for where form answers go, shown beside the form and on /privacy. */
  betaFormDestination: string | null;
  /** How long beta sign-up details are kept. Owner to approve before the form opens. */
  betaDataRetention: string;
  /** How Android testers get the app: a Google Play testing track (by Google account email) or a sideloaded APK. */
  androidBetaDistribution: AndroidBetaDistribution;
  publicDownloadLinks: DownloadLink[];
  /**
   * Lets /download render links whose `signed` is false — a beta build that is not notarized.
   *
   * `signed` keeps its meaning and stays false for such a build; this is the separate, deliberate
   * decision to offer it anyway. While it is true, /download must say the build is not notarized and
   * show how to open it, and tests/build-output.test.mjs holds it to that. Owner decision, 2026-11-11.
   * Set it back to false the day every link is notarized.
   */
  allowUnnotarizedDownloads: boolean;
  /** Null until a commercial model is decided. Renders no pricing route while null. */
  pricing: null | { summary: string; href: string };
  siteUrl: string | null;
  /** Emit index/follow only when true AND siteUrl is set. */
  indexable: boolean;
  demoVideo: null | { src: string; poster: string; captions: string; title: string };
  approvedScreenshots: string[];
  privacyPublicationStatus: 'draft' | 'published';
  currentBuild: { version: string; date: string; status: string };
  minimumRequirements: { mac: string; android: string; network: string };
  macBuilds: { arch: string; verified: boolean; note: string }[];
  testedPlatforms: { primary: string[]; partial: string[]; note: string };
}

const env = import.meta.env;
const clean = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s.length ? s : null;
};

/**
 * Only an absolute https URL is accepted as a form destination. Plain http is allowed for
 * localhost alone, so the form's real submit paths can be exercised in tests (npm run test:form).
 */
const endpoint = (() => {
  const v = clean(env.PUBLIC_BETA_FORM_ENDPOINT) ?? clean(BETA_FORM_ENDPOINT);
  if (!v) return null;
  try {
    const u = new URL(v);
    const local = u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
    return u.protocol === 'https:' || local ? v : null;
  } catch {
    return null;
  }
})();

const destination = (() => {
  if (!endpoint) return null;
  const host = new URL(endpoint).hostname;
  return host === 'script.google.com' ? 'Sidekick’s private beta sign-up sheet in Google Sheets' : host;
})();

export const site: SiteConfig = {
  name: 'Sidekick',
  // 2026-11-11, owner decision: the Mac beta build is offered for download. The app still opens only
  // with a beta access token, and the Android app is still an invited Google Play test — /download
  // says both, because a download without them does nothing.
  releaseMode: 'public',
  betaAccessDuration: { days: 45 },
  betaAccessDescription:
    'Each tester receives a signed access token by hand. It runs for 45 days from the start date written in the token — normally the day it is issued, not the day you first open the app — and is checked on your Mac without contacting any server.',
  supportEmail: clean(env.PUBLIC_SUPPORT_EMAIL),
  betaFormEndpoint: endpoint,
  betaFormDestination: destination,
  betaDataRetention:
    'Kept until the beta ends, then deleted. Ask to be removed at any time and your row is deleted.',
  androidBetaDistribution: 'google-play-testing',
  // `href` is a path on this site that vercel.json redirects to the release asset, so no page carries
  // the hosting account's name (tests → "no private data patterns"). The asset:
  // github.com/…/SIDEkick-website/releases/download/v2.0.1/Sidekick-2.0.1-arm64.dmg
  publicDownloadLinks: [
    {
      label: 'Download for Mac (Apple silicon)',
      platform: 'Apple silicon',
      href: '/get/Sidekick-2.0.1-arm64.dmg',
      // Ad-hoc signed, not Developer ID signed and not notarized. See allowUnnotarizedDownloads.
      signed: false,
      sha256: '7da914fad7e46f9c8efad2dc6240d592368e872a48362fc4f7c8bf8ef01212b1',
      size: '122 MB',
    },
  ],
  allowUnnotarizedDownloads: true,
  pricing: null,
  siteUrl: clean(env.SIDEKICK_SITE_URL),
  indexable: env.SIDEKICK_INDEXABLE === 'true',
  demoVideo: null,
  approvedScreenshots: [],
  privacyPublicationStatus: 'draft',
  // 2026-11-10: the Mac build 2.0.1 from app commit 3031eee. Apple silicon only, ad-hoc signed and not
  // notarized. The Android changes in that commit are not in a test build yet.
  currentBuild: {
    version: '2.0.1',
    date: '2026-11-10',
    status: 'Invited-beta Mac build with pairing and network reachability fixes.',
  },
  minimumRequirements: {
    mac: 'macOS 11 Big Sur or later',
    android: 'Android 10 or later',
    network: 'Both devices on the same Wi-Fi network, or the Mac joined to the phone’s hotspot',
  },
  macBuilds: [
    { arch: 'Apple silicon', verified: true, note: 'The build used throughout testing.' },
    {
      arch: 'Intel',
      verified: false,
      note: 'Built, but not yet run on an Intel Mac. Testers with one are especially welcome.',
    },
  ],
  testedPlatforms: {
    primary: ['Samsung Galaxy (SM-S938B), Android 16', 'One Apple silicon Mac'],
    partial: ['Motorola moto g34 and moto g45 5G', 'realme P1 5G', 'a vivo handset'],
    note: 'Most testing so far has used one phone and one Mac. Other phones had some install, permission and battery checks only. Android makers handle background apps differently, so behaviour on your phone may differ.',
  },
};

export const isPublic = site.releaseMode === 'public';
export const hasValidDownloads =
  site.releaseMode === 'public' &&
  site.publicDownloadLinks.length > 0 &&
  site.publicDownloadLinks.every((d) => d.signed || site.allowUnnotarizedDownloads);

/** True while /download offers at least one build that is not notarized. */
export const offersUnnotarizedDownload = hasValidDownloads && site.publicDownloadLinks.some((d) => !d.signed);

/** The one primary action, everywhere. */
export const primaryCta = (() => {
  switch (site.releaseMode) {
    case 'public':
      return hasValidDownloads
        ? { label: 'Download Sidekick', href: '/download' }
        : { label: 'Request beta access', href: '/beta' };
    case 'waitlist':
      return { label: 'Join the waitlist', href: '/beta' };
    default:
      return { label: 'Request beta access', href: '/beta' };
  }
})();

// A downloadable build that is not notarized is still a beta, and the label says so: 'public' with
// no label would read as a finished release.
export const statusLabel =
  site.releaseMode === 'invited-beta'
    ? 'Invited beta'
    : site.releaseMode === 'waitlist'
      ? 'Waitlist'
      : offersUnnotarizedDownload
        ? 'Beta'
        : null;

export const shouldIndex = site.indexable && site.siteUrl !== null;
