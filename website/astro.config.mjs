// @ts-check
import { defineConfig } from 'astro/config';

// `site` stays undefined until a real production domain is approved (see src/config/site.ts → siteUrl).
// Without it, no sitemap is generated and canonical / og:url tags are omitted.
const site = process.env.SIDEKICK_SITE_URL || undefined;

export default defineConfig({
  site,
  compressHTML: true,
  devToolbar: { enabled: false },
});
