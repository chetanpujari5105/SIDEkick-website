import type { APIRoute } from 'astro';
import { site, shouldIndex } from '../config/site';

// Preview builds (no approved domain, or indexing not enabled) ask crawlers to stay away entirely.
export const GET: APIRoute = () => {
  const body = shouldIndex
    ? `User-agent: *\nAllow: /\n\nSitemap: ${site.siteUrl!.replace(/\/$/, '')}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
