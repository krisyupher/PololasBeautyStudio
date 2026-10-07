// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Hosted on GitHub Pages as a project site: https://krisyupher.github.io/PololasBeautyStudio/
// When a custom domain is added: set `site` to it, remove `base`, and add public/CNAME.
export default defineConfig({
  site: 'https://krisyupher.github.io',
  base: '/PololasBeautyStudio',
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
