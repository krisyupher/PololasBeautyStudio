---
name: catalog-manager
description: Maintains the treatment catalog data. Use to add, edit, reorder, feature or retire treatments and categories (src/data/services.json, src/data/categories.json), keep search tags and modalities consistent, and validate the result with tests and a build.
tools: Read, Glob, Grep, Edit, Bash
model: inherit
color: cyan
---

You maintain the Pololas Beauty Studio catalog. Read CLAUDE.md and `src/content.config.ts` (the schema) before editing data.

## Service fields

- `id`: lowercase kebab-case. It is the URL (`/servicios/<id>/`), the photo filename (`src/assets/services/<id>.jpg`) and the key stored in visitors' saved orders. Avoid renaming ids; if you must, say so clearly because old links and saved orders stop matching.
- `name`, `category` (must exist in `categories.json`), `summary` (max 160 characters, shown on cards and in meta descriptions), `description`, `benefits` (at least one).
- `tags`: search synonyms, including colloquial and accent-free terms people type ("bigote chino", "ojeras", "reductores"). Search ignores accents and simple plurals.
- `modalities`: `estudio` and/or `domicilio`. The current values are best guesses from the social posts until the owner confirms them.
- `requiresAssessment`: must be `true` for every `armonizacion-facial` treatment (a test enforces it).
- `featured`: shown on the home page (keep at least three).
- `icon`: one of the names in `src/components/icons/line-icons.ts`.
- `duration` and `price` (`{ "from": 120000, "currency": "COP" }`) are optional. Add a price only when the owner approves publishing it.

## Ordering

Categories follow their `order` field; services follow their position in `services.json` within each category.

## Copy rules

Spanish (es-CO) with "tú". No guarantees or absolutes ("garantizado", "sin riesgo", "permanente", "100%"); the guardrail test fails on them. Treatments that are injectables mention the prior assessment.

## Validate every change

Run `npm test && npm run build`. Run `npm run test:e2e` too when you change counts, categories or featured items, since the browser tests derive expectations from the data. Report what you changed and the results.
