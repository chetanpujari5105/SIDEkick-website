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
  releaseMode: 'invited-beta',
  betaAccessDuration: { days: 45 },
  betaAccessDescription:
    'Each tester receives a signed access token by hand. It runs for 45 days from the start date written in the token — normally the day it is issued, not the day you first open the app — and is checked on your Mac without contacting any server.',
  supportEmail: clean(env.PUBLIC_SUPPORT_EMAIL),
  betaFormEndpoint: endpoint,
  betaFormDestination: destination,
  betaDataRetention:
    'Kept until the beta ends, then deleted. Ask to be removed at any time and your row is deleted.',
  androidBetaDistribution: 'google-play-testing',
  publicDownloadLinks: [],
  pricing: null,
  siteUrl: clean(env.SIDEKICK_SITE_URL),
  indexable: env.SIDEKICK_INDEXABLE === 'true',
  demoVideo: null,
  approvedScreenshots: [],
  privacyPublicationStatus: 'draft',
  currentBuild: {
    version: '2.0.0',
    date: '2026-10-12',
    status: 'Release candidate for a small invited beta.',
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
  site.releaseMode === 'public' && site.publicDownloadLinks.length > 0 && site.publicDownloadLinks.every((d) => d.signed);

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

export const statusLabel =
  site.releaseMode === 'invited-beta' ? 'Invited beta' : site.releaseMode === 'waitlist' ? 'Waitlist' : null;

export const shouldIndex = site.indexable && site.siteUrl !== null;
