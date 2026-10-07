import { expect, test } from '@playwright/test';
import { services, visibleCards } from './helpers';

const countWhere = (predicate: (service: (typeof services)[number]) => boolean) =>
  services.filter(predicate).length;

test.describe('catálogo', () => {
  test('muestra todos los tratamientos agrupados por categoría', async ({ page }) => {
    await page.goto('catalogo/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Catálogo');
    await expect(visibleCards(page)).toHaveCount(services.length);
    await expect(page.locator('[data-results-count]')).toHaveText(
      `${services.length} tratamientos`,
    );
  });

  test('busca sin importar tildes y sincroniza la URL', async ({ page }) => {
    await page.goto('catalogo/');
    await page.getByRole('searchbox', { name: 'Buscar tratamiento' }).fill('depilacion');

    const expected = countWhere((service) => service.category === 'depilacion');
    await expect(visibleCards(page)).toHaveCount(expected);
    await expect(page.getByRole('heading', { name: 'Depilación por zonas' })).toBeVisible();
    await expect(page.locator('[data-results-count]')).toHaveText(`${expected} tratamientos`);
    await expect(page).toHaveURL(/catalogo\/\?q=depilacion$/);
  });

  test('filtra por categoría y modalidad, con estado vacío', async ({ page }) => {
    await page.goto('catalogo/');
    await page
      .getByRole('group', { name: 'Categoría' })
      .getByRole('button', { name: 'Armonización' })
      .click();
    await expect(visibleCards(page)).toHaveCount(
      countWhere((service) => service.category === 'armonizacion-facial'),
    );

    await page
      .getByRole('group', { name: 'Modalidad' })
      .getByRole('button', { name: 'A domicilio' })
      .click();
    const atHome = countWhere(
      (service) =>
        service.category === 'armonizacion-facial' && service.modalities.includes('domicilio'),
    );
    await expect(visibleCards(page)).toHaveCount(atHome);
    if (atHome === 0) {
      await expect(page.getByText('No encontramos tratamientos con esos filtros')).toBeVisible();
      await page.getByRole('button', { name: 'Ver todos' }).click();
      await expect(visibleCards(page)).toHaveCount(services.length);
    }
  });

  test('lee filtros desde la URL e ignora valores desconocidos', async ({ page }) => {
    await page.goto('catalogo/?cat=spa-masajes&modo=hackeo&q=');
    const expected = countWhere((service) => service.category === 'spa-masajes');
    await expect(visibleCards(page)).toHaveCount(expected);
    await expect(page.locator('[data-results-count]')).toHaveText(`${expected} tratamientos`, {
      timeout: 200,
    });
    await expect(
      page.getByRole('group', { name: 'Categoría' }).getByRole('button', { name: 'Spa' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page
        .getByRole('group', { name: 'Modalidad' })
        .getByRole('button', { name: 'Estudio y domicilio' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
