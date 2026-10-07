import { expect, test } from '@playwright/test';
import { collectErrors, openOrder } from './helpers';

test.describe('páginas', () => {
  test('inicio: hero, destacados y datos de contacto', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('./');
    await expect(page).toHaveTitle('Pololas Beauty Studio');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Descubre tu');
    await expect(page.getByRole('link', { name: 'Ver catálogo' }).first()).toBeVisible();

    const contact = page.locator('#contacto');
    await expect(contact.getByRole('link', { name: '+57 320 207 8089' })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\/573202078089\?text=/,
    );
    await expect(contact.getByRole('link', { name: 'pololasbs@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:pololasbs@gmail.com',
    );
    await expect(contact.getByRole('link', { name: '@pololasbeautystudio' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(errors).toEqual([]);
  });

  test('los círculos destacados llevan a cada tratamiento', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Labios', exact: true }).click();
    await expect(page).toHaveURL(/servicios\/labios\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Definición de labios');
  });

  test('detalle de tratamiento con datos estructurados', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('servicios/botox/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Botox (toxina botulínica)');
    await expect(page.getByRole('heading', { name: 'Antes de tu procedimiento' })).toBeVisible();

    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')));
    expect(jsonLd.map((data) => data['@type'])).toEqual(['Service', 'BreadcrumbList']);
    expect(jsonLd[0].url).toBe('https://krisyupher.github.io/PololasBeautyStudio/servicios/botox/');

    const ask = page.getByRole('link', { name: 'Preguntar por WhatsApp' });
    const text = new URL((await ask.getAttribute('href')) ?? '').searchParams.get('text');
    expect(text).toContain('Botox (toxina botulínica)');
    expect(errors).toEqual([]);
  });

  test('no hay errores de consola ni de CSP al usar el pedido', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('catalogo/');
    await page.getByRole('searchbox', { name: 'Buscar tratamiento' }).fill('masaje');
    await page.getByRole('button', { name: 'Agregar al pedido: Masaje tailandés' }).first().click();
    await openOrder(page);
    expect(errors).toEqual([]);
  });

  test('página 404 propia', async ({ page }) => {
    const response = await page.goto('esta-pagina-no-existe/');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('se fue a');
  });

  test('menú móvil', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo en teléfonos');
    await page.goto('./');
    const menu = page.getByRole('navigation', { name: 'Menú principal' });
    await expect(menu).toBeHidden();
    await page.locator('summary[aria-label="Menú"]').click();
    await menu.getByRole('link', { name: 'Catálogo' }).click();
    await expect(page).toHaveURL(/catalogo\/$/);
  });
});
