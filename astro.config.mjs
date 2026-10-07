// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Defaults target GitHub Pages: https://krisyupher.github.io/PololasBeautyStudio/
// SITE and BASE_PATH override them; the Dockerfile builds for the root of any domain.
// For a custom domain on Pages: change these defaults to the domain and '/', and add public/CNAME.
const site = process.env.SITE || 'https://krisyupher.github.io';
const base = process.env.BASE_PATH || '/PololasBeautyStudio';

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
    // inline/bundled script and style. GitHub Pages cannot set response headers.
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
