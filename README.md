# Pololas Beauty Studio

Website and treatment catalog for **Pololas Beauty Studio**, a beauty, aesthetics and spa studio in Modelia, Bogotá ([Instagram](https://www.instagram.com/pololasbeautystudio/) · [Facebook](https://www.facebook.com/profile.php?id=61552028553001)).

Visitors browse the treatments, add them to **"Mi pedido"**, choose whether they want them at the studio or at home, and send the order as a prefilled WhatsApp message. An advisor then confirms price, availability and details. There is no backend, no prices are shown, and no personal data is stored.

**Live site:** https://www.pololasbeautystudio.com/

## Development

Requires Node 22.12 or newer (see `.nvmrc`).

```sh
npm install
npm run dev        # http://localhost:4321/PololasBeautyStudio/
npm run build      # static site in dist/
npm run preview    # serve dist/
```

Quality checks:

```sh
npm run check      # TypeScript and Astro diagnostics
npm run lint       # ESLint
npm run format     # Prettier
npm test           # unit tests (Vitest)
npm run test:e2e   # browser and accessibility tests (Playwright + axe)
```

The first time on a new machine, run `npx playwright install chromium` if Google Chrome is not installed.

## Updating content

| What                                                                         | Where                                           |
| ---------------------------------------------------------------------------- | ----------------------------------------------- |
| Phone, email, location, social links, hours                                  | `src/data/business.ts`                          |
| Treatments (name, description, benefits, search tags, studio/home, featured) | `src/data/services.json`                        |
| Categories                                                                   | `src/data/categories.json`                      |
| Frequently asked questions                                                   | `src/data/faq.ts`                               |
| Testimonials (only with the client's written consent)                        | `src/data/testimonials.ts`                      |
| Logo (white version for purple backgrounds: `logo-white.png`)                | `src/assets/brand/logo.png` (or `.svg`/`.webp`) |
| Treatment photos                                                             | `src/assets/services/<treatment-id>.jpg`        |
| Category photos                                                              | `src/assets/categories/<category-id>.jpg`       |
| Instagram highlight covers                                                   | `src/assets/highlights/`                        |
| Home page and "Gracias" photos                                               | `src/assets/hero.jpg`, `src/assets/gracias.jpg` |
| Colors and fonts                                                             | `src/styles/tokens.css`                         |

The design and the treatment list follow the owner's printed catalog. Its original files (`src/assets/Pololas/`) are not committed; the images above were cut out of the PDF and are small, so replace any of them with a higher-resolution original under the same name. Images are picked up automatically at build time. Treatment order follows the order in `services.json`. The tests check the catalog data and block risky health claims such as "garantizado", "permanente" or "procedimientos seguros".

## Deployment

### Vercel

Vercel deploys the site from GitHub through its Git integration (by default, pushes to `main` go to production). The build detects Vercel and serves from the root; production builds use `https://www.pololasbeautystudio.com` (`PRODUCTION_SITE` in `astro.config.mjs`) for canonical links, the sitemap and structured data, and preview builds use their own URL. Keep **Settings → Environment Variables → "Automatically expose System Environment Variables"** enabled (it is by default). `vercel.json` redirects URLs without a trailing slash and adds the security and caching headers.

One-time setup in the Vercel dashboard:

1. **Settings → Domains:** add `www.pololasbeautystudio.com`, then add `pololasbeautystudio.com` and set it to redirect (308) to `www`. Optionally redirect `pololas-beauty-studio.vercel.app` to `www` too.
2. At the domain registrar, create the DNS records Vercel shows for each domain (usually an `A` record for `@` and a `CNAME` for `www`). Vercel issues the HTTPS certificate once they resolve.
3. **Speed Insights** tab: enable it. The site already includes `@vercel/speed-insights`, only in Vercel builds.

`.github/workflows/ci.yml` runs lint, type checks and all tests on every push and pull request; it does not deploy.

Local development and the tests still use the base path `/PololasBeautyStudio/` (the site's original GitHub Pages address, see `astro.config.mjs`), which keeps every link checked under a sub-path.

### Docker

The `Dockerfile` builds the site with Node and serves it with an unprivileged nginx on port 8080, from the root of the domain:

```sh
docker build -t pololas-beauty-studio .
docker run --rm -p 8080:8080 pololas-beauty-studio   # use another host port, e.g. -p 8089:8080, if 8080 is taken
# open http://localhost:8080/
```

Canonical links, the sitemap, `robots.txt` and structured data point to `https://www.pololasbeautystudio.com` by default. To serve the image under another domain, pass its URL:

```sh
docker build --build-arg SITE=https://www.example.com -t pololas-beauty-studio .
```

nginx adds the same security headers as Vercel (including clickjacking protection), long-term caching for fingerprinted assets, gzip and the custom 404 page; its config is in `docker/`. The container has a health check. Put a TLS-terminating proxy or load balancer in front of it for HTTPS.

## Project agents

`.claude/agents/` defines Claude Code subagents for this project: `frontend-expert`, `ux-ui-designer`, `business-strategist`, `marketing-specialist`, `qa-test-engineer`, `security-reviewer`, `seo-local-specialist`, `health-compliance-advisor` and `catalog-manager`. Ask Claude Code to use one by name (for example "use the security-reviewer agent to review the last change").
