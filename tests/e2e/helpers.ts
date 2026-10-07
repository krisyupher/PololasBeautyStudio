import { expect, type Page } from '@playwright/test';
import services from '../../src/data/services.json' with { type: 'json' };

export { services };

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
    .getByRole('button', { name: `Agregar al pedido: ${serviceName}` })
    .filter({ visible: true })
    .first();
  await button.click();
  await expect(
    page
      .getByRole('button', { name: new RegExp(`En tu pedido: ${escapeRegExp(serviceName)}`) })
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
