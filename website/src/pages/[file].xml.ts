import type { APIRoute, GetStaticPaths } from 'astro';
import { site, shouldIndex, hasValidDownloads } from '../config/site';

// sitemap.xml exists only once a real production domain is configured and indexing is enabled.
export const getStaticPaths: GetStaticPaths = () => (shouldIndex ? [{ params: { file: 'sitemap' } }] : []);

export const GET: APIRoute = () => {
  const base = site.siteUrl!.replace(/\/$/, '');
  const paths = ['/', '/beta', '/setup', '/privacy', '/permissions', '/help', '/changelog', '/roadmap'];
  if (hasValidDownloads) paths.push('/download');
  if (site.pricing) paths.push('/pricing');
  const urls = paths.map((p) => `  <url><loc>${base}${p}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
