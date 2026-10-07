import type { APIRoute } from 'astro';
import { withBase } from '../lib/paths';

/** Generated (not in public/) so the sitemap URL follows the configured site and base path. */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(withBase('/sitemap-index.xml'), site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
