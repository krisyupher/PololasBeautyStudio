import { expect, type Page } from '@playwright/test';
import categories from '../../src/data/categories.json' with { type: 'json' };
import services from '../../src/data/services.json' with { type: 'json' };

export { categories, services };

export type ServiceData = (typeof services)[number];
export type CategoryData = (typeof categories)[number];

export function serviceById(id: string): ServiceData {
  const service = services.find((item) => item.id === id);
  if (!service) throw new Error(`services.json has no treatment "${id}"`);
  return service;
}

export function categoryById(id: string): CategoryData {
  const category = categories.find((item) => item.id === id);
  if (!category) throw new Error(`categories.json has no category "${id}"`);
  return category;
}

/** Treatments in site order: by category `order`, then position in services.json. */
export const servicesInSiteOrder: ServiceData[] = [...services].sort(
  (a, b) => categoryById(a.category).order - categoryById(b.category).order,
);

/** The accessible name of a two-tone heading: its two lines joined by a space. */
export function twoToneName(category: CategoryData): string {
  return category.titleLines.join(' ');
}

/** Lowercase, accent-free copy of `text`; an independent oracle for the catalog search. */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Treatments whose name, summary, category name or tags contain the single word `query`. */
export function servicesMatching(query: string): ServiceData[] {
  const needle = fold(query);
  return services.filter((service) =>
    fold(
      [service.name, service.summary, categoryById(service.category).name, ...service.tags].join(
        ' ',
      ),
    ).includes(needle),
  );
}

/** The "Mi pedido" opener that is visible on this viewport (header on desktop, bottom bar on phones). */
export function orderButton(page: Page) {
  return page
    .getByRole('button', { name: /Mi pedido/ })
    .filter({ visible: true })
    .first();
}

export function visibleCards(page: Page) {
  return page.locator('[data-service-card]:visible');
}

export async function addToOrder(page: Page, serviceName: string) {
  const button = page
    .getByRole('button', { name: `Agregar al pedido: ${serviceName}`, exact: true })
    .filter({ visible: true })
    .first();
  await button.click();
  await expect(
    page
      .getByRole('button', { name: new RegExp(`^En tu pedido: ${escapeRegExp(serviceName)}\\.`) })
      .first(),
  ).toBeVisible();
}

export async function openOrder(page: Page) {
  await orderButton(page).click();
  const dialog = page.getByRole('dialog', { name: 'Mi pedido' });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Collects console errors (including CSP violations) and uncaught exceptions. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
