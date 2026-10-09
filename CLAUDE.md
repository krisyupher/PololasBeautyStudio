# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Catalog website for **Pololas Beauty Studio**, a beauty, aesthetics and spa studio in Modelia, Bogotá (Instagram @pololasbeautystudio and a Facebook page, which are the source of the brand style and treatment list). Visitors browse treatments, collect them in "Mi pedido" and send the order as a prefilled WhatsApp message; an advisor confirms price, availability and logistics, at the studio or at the client's home. There is no backend, no prices are shown, and no personal data is stored.

Stack: Astro 7 (static output) + strict TypeScript, vanilla TypeScript client scripts, scoped CSS with design tokens. Deployed on Vercel at `https://pololas-beauty-studio.vercel.app/` (Git integration, served from the root). `.github/workflows/ci.yml` only runs lint, type checks and tests; it does not deploy. The `Dockerfile` packages the site as an unprivileged nginx image (port 8080) served from the domain root.

## Commands

```sh
npm run dev            # http://localhost:4321/PololasBeautyStudio/
npm run build          # static site in dist/
npm run preview        # serve dist/
npm run check          # astro check (TypeScript + .astro diagnostics)
npm run lint           # ESLint (innerHTML/outerHTML are banned)
npm run format         # Prettier; CI runs format:check
npm test               # Vitest: src/**/*.test.ts and tests/unit/
npx vitest run src/lib/whatsapp.test.ts          # one unit test file
npx vitest run -t "buildOrderMessage"            # tests by name
npm run test:e2e       # Playwright: builds, serves on :4321, runs desktop + Pixel 7 projects
npx playwright test tests/e2e/order.spec.ts --project=desktop   # one e2e file and project
docker build -t pololas-beauty-studio .                          # image (SITE build arg = public URL)
docker run --rm -p 8080:8080 pololas-beauty-studio               # http://localhost:8080/
```

Locally Playwright uses the installed Google Chrome (`channel: 'chrome'` in `playwright.config.ts`); CI installs Chromium. The e2e tests assume the default base path (`/PololasBeautyStudio/`), so don't run them with `SITE`/`BASE_PATH` set.

## Architecture

- **Data is the single source of truth.** `src/data/business.ts` (name, WhatsApp number in E.164, email, location, social links, hours note), `src/data/services.json` and `categories.json` (validated with zod in `src/content.config.ts` via the content layer `file()` loader), `faq.ts`, and `testimonials.ts` (its section stays hidden while the list is empty).
- **Pure logic in `src/lib/`, unit-tested:**
  - `search.ts`: accent-insensitive matching with naive plural handling, and allow-listed URL filter parsing (`?q`, `?cat`, `?modo`).
  - `cart.ts`: the order store. It persists only `{id, modality, people}` under `pololas:pedido:v1` and rebuilds orders from storage with `sanitizeOrder`.
  - `whatsapp.ts`: builds the message and the `wa.me` URL, with a short order code so web-originated orders can be counted without tracking.
  - `paths.ts` (`withBase`, `serviceUrl`, `catalogUrl`), `schema.ts` (JSON-LD), `images.ts` (`import.meta.glob` photo and logo lookup), `format.ts` (price label).
  - `catalog.ts`: collection access. The content layer returns entries sorted by id, so it re-sorts by category `order` and then position in `services.json`.
- **Pages:** `index.astro` (home sections), `catalogo/` (every card rendered at build time; filters only toggle `hidden`), `servicios/[id].astro` (one page per treatment via `getStaticPaths`), `privacidad.astro`, `404.astro`.
- **Client scripts:** `BaseLayout.astro` embeds a slim catalog as `<script type="application/json" id="catalog-data">` and loads `src/scripts/order-ui.ts`, which drives the counters, the add buttons, the `<dialog>` drawer, the toast and the live announcer through the singleton store in `order-store.ts`. The catalog page also loads `catalog-filters.ts`, which reads `data-search`, `data-category` and `data-modalities` attributes computed at build time with the same `normalize()`.
- **Progressive enhancement:** JS-only controls carry `data-needs-js` (invisible but space-reserving) until `order-ui.ts` removes it. Without JS the catalog, detail pages and WhatsApp links still work.
- **Images:** files dropped in `src/assets/services/<service-id>.{jpg,png,webp,avif}`, `src/assets/brand/logo.{svg,png,webp}` and `src/assets/hero.{jpg,png,webp}` are picked up automatically; otherwise line-art icons (`src/components/icons/line-icons.ts`) and a text wordmark are shown.

## Conventions and constraints

- **Base path and site URL** come from the `SITE` and `BASE_PATH` environment variables; on Vercel (`VERCEL` set) they default to `https://$VERCEL_PROJECT_PRODUCTION_URL` and `/`; otherwise (local dev, CI, tests) to the site's original GitHub Pages address under `/PololasBeautyStudio/`. Nothing is deployed there any more; the sub-path is kept so the tests fail on links that skip `withBase()`. The Dockerfile builds with `BASE_PATH=/`. `trailingSlash` is `'always'`. Never hardcode the base or the site: build every internal URL with `withBase()`, `serviceUrl()` or `catalogUrl()`, and absolute URLs from `import.meta.env.SITE` (as `schema.ts` and the `robots.txt.ts` endpoint do). In Playwright, navigate with relative paths (`page.goto('catalogo/')`). A build with the wrong base renders unstyled with 404s for every asset (this broke the first Vercel deploy), so check `dist/index.html` links when touching this.
- **Hosting headers:** `vercel.json` adds trailing-slash redirects and the same security headers as `docker/security-headers.conf`; keep the two in sync.
- **Docker serving:** `docker/nginx.conf` serves `dist/` from `/srv/www` with the custom 404, `no-cache` for pages and immutable caching for `/_astro/`. Security headers live in `docker/security-headers.conf` and must be re-included in every `location` that sets its own `add_header`, because nginx drops inherited headers there.
- **CSP:** `security.csp` in `astro.config.mjs` emits a hashed meta CSP (`default-src 'self'`, `form-action 'none'`). Don't add inline `style=""` attributes, inline event handlers, `define:vars`, third-party scripts/fonts/iframes or `data:` assets; `vite.build.assetsInlineLimit` is 0 so small font files are never inlined. Write dynamic text with `textContent`. JSON placed inside `<script>` must escape `<`.
- **Language:** UI copy is Spanish (es-CO, "tú"); code, comments and commit messages are English.
- **Prices** are not shown ("Precio a consultar"). `price` is an optional field the owner may enable per treatment.
- **Health-advertising guardrails:** `tests/unit/catalog-data.test.ts` fails on claims such as "garantizado", "sin riesgo", "permanente" or "100%", and requires `requiresAssessment: true` for every `armonizacion-facial` treatment. Keep "previa valoración" wording for injectables.
- **Accessibility** target is WCAG 2.2 AA, enforced by axe in `tests/e2e/a11y.spec.ts`. Add-to-order buttons keep an explicit `aria-label` synced by `order-ui.ts`, because Chrome inserts a space in names built from flex children.
- When writing regexes, use Unicode property escapes (`\p{M}`, `\p{Cc}`) rather than `\uXXXX` sequences; an earlier edit had `\uXXXX` turned into literal combining characters.

## Agents

Project subagents live in `.claude/agents/`: `frontend-expert`, `ux-ui-designer`, `business-strategist`, `marketing-specialist`, `qa-test-engineer`, `security-reviewer`, `seo-local-specialist`, `health-compliance-advisor` and `catalog-manager`.

## Pending owner input

Real logo and photos; exact address and opening hours; which treatments are offered at home (the `modalities` in `services.json` are best guesses from the social posts); whether home visits are free; a credentials statement for injectables; testimonials with consent; an Open Graph image (`business.ogImage`); a custom domain. The privacy page should be reviewed by a lawyer.
