// @ts-check
import { defineConfig } from 'astro/config';

// `site` stays undefined until a real production domain is approved (see src/config/site.ts → siteUrl).
// Without it, no sitemap is generated and canonical / og:url tags are omitted.
const site = process.env.SIDEKICK_SITE_URL || undefined;

export default defineConfig({
  site,
  // Lets the form test build into a separate folder without touching dist/.
  outDir: process.env.SIDEKICK_OUT_DIR || './dist',
  compressHTML: true,
  devToolbar: { enabled: false },
});
