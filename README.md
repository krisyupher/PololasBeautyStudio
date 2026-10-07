# Pololas Beauty Studio

Website and treatment catalog for **Pololas Beauty Studio**, a beauty, aesthetics and spa studio in Modelia, Bogotá ([Instagram](https://www.instagram.com/pololasbeautystudio/) · [Facebook](https://www.facebook.com/profile.php?id=61552028553001)).

Visitors browse the treatments, add them to **"Mi pedido"**, choose whether they want them at the studio or at home, and send the order as a prefilled WhatsApp message. An advisor then confirms price, availability and details. There is no backend, no prices are shown, and no personal data is stored.

**Live site** (once GitHub Pages is enabled): https://krisyupher.github.io/PololasBeautyStudio/

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
| Logo                                                                         | `src/assets/brand/logo.svg` (or `.png`/`.webp`) |
| Treatment photos                                                             | `src/assets/services/<treatment-id>.jpg`        |
| Home page photo                                                              | `src/assets/hero.jpg`                           |
| Colors and fonts                                                             | `src/styles/tokens.css`                         |

Images are picked up automatically at build time; until they exist, the site shows line-art icons and a text logo. Treatment order follows the order in `services.json`. The tests check the catalog data and block risky health claims such as "garantizado" or "sin riesgos".

## Deployment

`.github/workflows/ci.yml` runs lint, type checks and all tests on every push and pull request. On `main` it then builds the site and deploys it to GitHub Pages.

One-time setup: in the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.

To use a custom domain on GitHub Pages later: add `public/CNAME` and change the `SITE` and `BASE_PATH` defaults at the top of `astro.config.mjs` to the domain and `/`.

### Docker

The `Dockerfile` builds the site with Node and serves it with an unprivileged nginx on port 8080, from the root of the domain:

```sh
docker build -t pololas-beauty-studio .
docker run --rm -p 8080:8080 pololas-beauty-studio
# open http://localhost:8080/
```

For a real deployment, pass the public URL so canonical links, the sitemap, `robots.txt` and structured data point to it:

```sh
docker build --build-arg SITE=https://www.example.com -t pololas-beauty-studio .
```

nginx adds the security headers GitHub Pages can't send (including clickjacking protection), long-term caching for fingerprinted assets, gzip and the custom 404 page; its config is in `docker/`. The container has a health check. Put a TLS-terminating proxy or load balancer in front of it for HTTPS.

## Project agents

`.claude/agents/` defines Claude Code subagents for this project: `frontend-expert`, `ux-ui-designer`, `business-strategist`, `marketing-specialist`, `qa-test-engineer`, `security-reviewer`, `seo-local-specialist`, `health-compliance-advisor` and `catalog-manager`. Ask Claude Code to use one by name (for example "use the security-reviewer agent to review the last change").
