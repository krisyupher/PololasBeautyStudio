# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Catalog website for **Pololas Beauty Studio**, a beauty, aesthetics and spa studio in Modelia, Bogotá (Instagram @pololasbeautystudio and a Facebook page). The design, treatment list and copy follow the owner's printed catalog, `src/assets/Pololas/Catalogo Pololas.pdf`; that folder holds the owner's original design files and is gitignored, so the site uses copies prepared from it (see **Images**). Visitors browse treatments, collect them in "Mi pedido" and send the order as a prefilled WhatsApp message; an advisor confirms price, availability and logistics, at the studio or at the client's home. There is no backend, no prices are shown, and no personal data is stored.

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
- **Images** are looked up by file name in `src/lib/images.ts` (`import.meta.glob`): `src/assets/services/<service-id>.*`, `categories/<category-id>.*`, `highlights/<name>.*` (the Instagram highlight covers), `brand/logo.*` and `brand/logo-white.*` (for purple backgrounds), `hero.*` and `gracias.*`. They were cut out of the PDF, so they are small (service photos about 220 px wide); replace any of them with a higher-resolution original under the same name. Missing photos fall back to line-art icons (`src/components/icons/line-icons.ts`) and a text wordmark.
- **Design system:** `src/styles/tokens.css` holds the PDF palette (purple `#640064`, hot pink `#FF2489`, icon circles `#FDDDF0`) and the fonts (Montserrat Variable, Ms Madi for handwritten accents). Brand motifs are components: `TwoToneTitle` (purple/pink two-line headings), `ScriptAccent` (script + heart + swoosh), `Kicker`, `IconCircle`, `ValueBadges`, `WaveBand`, `Petals`. Each category in `categories.json` carries the text of its PDF page (`titleLines`, `script`, `note`, four `values`, `closing`).
- **Animations** are CSS only. Every hidden starting state sits inside `@media (prefers-reduced-motion: no-preference)`, and scroll reveals also inside `@supports (animation-timeline: view())`, so content is never left invisible. Looping or ambient motion must stop within five seconds (WCAG 2.2.2). Playwright runs with reduced motion so axe never scans half-faded text.

## Conventions and constraints

- **Base path and site URL** come from the `SITE` and `BASE_PATH` environment variables; on Vercel (`VERCEL` set) they default to `https://$VERCEL_PROJECT_PRODUCTION_URL` and `/`; otherwise (local dev, CI, tests) to the site's original GitHub Pages address under `/PololasBeautyStudio/`. Nothing is deployed there any more; the sub-path is kept so the tests fail on links that skip `withBase()`. The Dockerfile builds with `BASE_PATH=/`. `trailingSlash` is `'always'`. Never hardcode the base or the site: build every internal URL with `withBase()`, `serviceUrl()` or `catalogUrl()`, and absolute URLs from `import.meta.env.SITE` (as `schema.ts` and the `robots.txt.ts` endpoint do). In Playwright, navigate with relative paths (`page.goto('catalogo/')`). A build with the wrong base renders unstyled with 404s for every asset (this broke the first Vercel deploy), so check `dist/index.html` links when touching this.
- **Hosting headers:** `vercel.json` adds trailing-slash redirects and the same security headers as `docker/security-headers.conf`; keep the two in sync.
- **Docker serving:** `docker/nginx.conf` serves `dist/` from `/srv/www` with the custom 404, `no-cache` for pages and immutable caching for `/_astro/`. Security headers live in `docker/security-headers.conf` and must be re-included in every `location` that sets its own `add_header`, because nginx drops inherited headers there.
- **CSP:** `security.csp` in `astro.config.mjs` emits a hashed meta CSP (`default-src 'self'`, `form-action 'none'`). Don't add inline `style=""` attributes, inline event handlers, `define:vars`, third-party scripts/fonts/iframes or `data:` assets; `vite.build.assetsInlineLimit` is 0 so small font files are never inlined. Write dynamic text with `textContent`. JSON placed inside `<script>` must escape `<`.
- **Language:** UI copy is Spanish (es-CO, "tú"); code, comments and commit messages are English.
- **Prices** are not shown ("Precio a consultar"). `price` is an optional field the owner may enable per treatment.
- **Health-advertising guardrails:** `tests/unit/catalog-data.test.ts` scans treatments, categories and FAQs for claims such as "garantizado", "sin riesgo", "permanente", "100%", "procedimientos seguros", "resultados visibles", "expertos" or "Botox" (a trademark and prescription medicine: the treatment is "Toxina botulínica"; "botox" may appear only in search `tags`). It requires every `estetica-facial` treatment and `depilacion-laser` to need an assessment and be studio-only, and facial summaries to say "a cargo de un profesional de la salud, previa valoración". Run the `health-compliance-advisor` agent on new copy, badges and promotions.
- **Accessibility** target is WCAG 2.2 AA, enforced by axe in `tests/e2e/a11y.spec.ts`. Add-to-order buttons keep an explicit `aria-label` synced by `order-ui.ts`, because Chrome inserts a space in names built from flex children.
- When writing regexes, use Unicode property escapes (`\p{M}`, `\p{Cc}`) rather than `\uXXXX` sequences; an earlier edit had `\uXXXX` turned into literal combining characters.

## Agents

Project subagents live in `.claude/agents/`: `frontend-expert`, `ux-ui-designer`, `business-strategist`, `marketing-specialist`, `qa-test-engineer`, `security-reviewer`, `seo-local-specialist`, `health-compliance-advisor` and `catalog-manager`.

## Pending owner input

Higher-resolution originals of the photos, and confirmation that the PDF photos may be used on the web; exact address and opening hours; which treatments are offered at home (`modalities` are best guesses); whether home visits are free; testimonials with consent; a custom domain. Compliance facts to confirm before relying on the copy: the facial injectables are performed by a physician registered in ReTHUS, in a service registered in REPS, with INVIMA-registered products; who operates the laser, its INVIMA registration and whether "Trionda" names it; the techniques used in the body treatments; what the "hilos de colágeno" are made of. The privacy page should be reviewed by a lawyer.
