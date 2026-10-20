// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** The public address of the site; canonical links, the sitemap and JSON-LD point here. */
const PRODUCTION_SITE = 'https://www.pololasbeautystudio.com';

// Where the site is served from (absolute URLs, and the prefix of every internal link):
// 1. SITE and BASE_PATH env vars win (the Dockerfile sets them).
// 2. On Vercel, at the root: production builds use PRODUCTION_SITE; preview builds use their
//    own deployment URL. Vercel exposes VERCEL, VERCEL_ENV and VERCEL_BRANCH_URL / VERCEL_URL
//    to builds ("system environment variables", on by default).
// 3. Otherwise (local dev, CI, tests): the site's original GitHub Pages address, no longer
//    deployed. Its /PololasBeautyStudio/ sub-path makes the tests catch links that skip withBase().
const onVercel = Boolean(process.env.VERCEL);
const previewHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
const vercelSite =
  process.env.VERCEL_ENV === 'production' || !previewHost
    ? PRODUCTION_SITE
    : `https://${previewHost}`;
const site = process.env.SITE || (onVercel ? vercelSite : 'https://krisyupher.github.io');
const base = process.env.BASE_PATH || (onVercel ? '/' : '/PololasBeautyStudio');

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
  // No Markdown code blocks on this site; Shiki's inline styles would also conflict with the CSP.
  markdown: { syntaxHighlight: false },
  // Never inline assets as data: URIs (small font subsets would be), so the CSP can stay 'self'.
  vite: { build: { assetsInlineLimit: 0 } },
  security: {
    // Emits a <meta http-equiv="content-security-policy"> with hashes for every
    // inline/bundled script and style. Directives a meta tag can't carry (frame-ancestors)
    // are sent as headers by vercel.json and docker/security-headers.conf.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self'",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
    },
  },
});
