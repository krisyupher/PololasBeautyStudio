// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Where the site is served from (absolute URLs, and the prefix of every internal link):
// 1. SITE and BASE_PATH env vars win (the Dockerfile sets them).
// 2. On Vercel: the production domain, at the root. Vercel exposes VERCEL and
//    VERCEL_PROJECT_PRODUCTION_URL to builds ("system environment variables", on by default).
// 3. Otherwise (local dev, CI, tests): the site's original GitHub Pages address, no longer
//    deployed. Its /PololasBeautyStudio/ sub-path makes the tests catch links that skip withBase().
const onVercel = Boolean(process.env.VERCEL);
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const site =
  process.env.SITE ||
  (onVercel && vercelHost ? `https://${vercelHost}` : 'https://krisyupher.github.io');
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
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
    },
  },
});
