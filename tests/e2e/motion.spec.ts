import { expect, test, type Locator } from '@playwright/test';
import { categories } from './helpers';

// The rest of the suite runs with reduced motion (see playwright.config.ts). This smoke test
// turns the animations on and checks that scroll-driven reveals finish once content is passed.
test.use({ reducedMotion: 'no-preference' });

/** The lowest effective opacity (own opacity times every ancestor's) among `locator`'s elements and their descendants. */
function minEffectiveOpacity(locator: Locator): Promise<number> {
  return locator.evaluateAll((roots) => {
    const effective = (element: Element): number => {
      let value = 1;
      for (let node: Element | null = element; node; node = node.parentElement) {
        value *= Number(getComputedStyle(node).opacity);
      }
      return value;
    };
    const elements = roots.flatMap((root) => [root, ...root.querySelectorAll('*')]);
    return elements.length === 0 ? 0 : Math.min(...elements.map(effective));
  });
}

test('con animaciones, al bajar hasta el final todo queda visible', async ({ page }) => {
  await page.goto('./');
  expect(
    await page.evaluate(() => matchMedia('(prefers-reduced-motion: no-preference)').matches),
  ).toBe(true);

  // Precondition: far below the fold, the badges wait in their hidden starting state. This proves
  // the scroll-driven reveal is active and that the opacity probe can see it.
  const lastCategory = categories.at(-1)!;
  const badges = page.locator(`section#${lastCategory.id} .value-badges`);
  await expect(badges.getByRole('listitem')).toHaveCount(lastCategory.values.length);
  expect(await minEffectiveOpacity(badges)).toBeLessThan(1);

  // Scroll like a reader, most of a viewport at a time, until the bottom of the page. "instant"
  // because the site sets `scroll-behavior: smooth` when motion is allowed.
  await page.evaluate(async () => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    let previous = -1;
    while (window.scrollY !== previous) {
      previous = window.scrollY;
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'instant' });
      await frame();
      await frame();
    }
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1,
      ),
    )
    .toBe(true);

  // Scrolled past (the footer sits below), the reveals must hold their final, opaque state.
  const contactHeading = page.locator('#contacto').getByRole('heading', { level: 2 });
  await expect.poll(() => minEffectiveOpacity(contactHeading)).toBe(1);
  const contactPanel = page
    .locator('#contacto')
    .getByRole('list')
    .filter({ has: page.getByRole('link', { name: /^Agenda tu cita/ }) });
  await expect.poll(() => minEffectiveOpacity(contactPanel)).toBe(1);

  await expect.poll(() => minEffectiveOpacity(badges)).toBe(1);
});
