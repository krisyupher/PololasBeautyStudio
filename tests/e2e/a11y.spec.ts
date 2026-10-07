import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addToOrder, openOrder } from './helpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function violations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
}

test.describe('accesibilidad (WCAG 2.2 AA, axe)', () => {
  for (const path of ['./', 'catalogo/', 'servicios/botox/', 'privacidad/']) {
    test(`sin violaciones en ${path}`, async ({ page }) => {
      await page.goto(path);
      expect(await violations(page)).toEqual([]);
    });
  }

  test('sin violaciones con el pedido abierto', async ({ page }) => {
    await page.goto('catalogo/');
    await addToOrder(page, 'Masaje relajante');
    await openOrder(page);
    expect(await violations(page)).toEqual([]);
  });
});
