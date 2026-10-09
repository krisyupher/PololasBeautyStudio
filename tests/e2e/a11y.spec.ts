import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addToOrder, openOrder } from './helpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Scan the settled page: no element should sit mid-animation (half-faded text skews contrast).
// Also the suite default in playwright.config.ts; repeated so these scans never depend on it.
test.use({ reducedMotion: 'reduce' });

async function violations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
}

test.describe('accesibilidad (WCAG 2.2 AA, axe)', () => {
  for (const path of [
    './',
    'catalogo/',
    'servicios/toxina-botulinica/',
    'servicios/masaje-relajante/',
    'privacidad/',
    'esta-pagina-no-existe/',
  ]) {
    test(`sin violaciones en ${path}`, async ({ page }) => {
      await page.goto(path);
      expect(await violations(page)).toEqual([]);
    });
  }

  test('sin violaciones con el pedido vacío abierto', async ({ page }) => {
    await page.goto('./');
    const dialog = await openOrder(page);
    await expect(dialog.getByRole('heading', { name: 'Te puede interesar' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('sin violaciones con el pedido abierto', async ({ page }) => {
    await page.goto('catalogo/');
    await addToOrder(page, 'Masaje relajante');
    await openOrder(page);
    expect(await violations(page)).toEqual([]);
  });
});
