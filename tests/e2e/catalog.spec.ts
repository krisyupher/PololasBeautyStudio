import { expect, test } from '@playwright/test';
import {
  categories,
  categoryById,
  serviceById,
  services,
  servicesMatching,
  twoToneName,
  visibleCards,
  type ServiceData,
} from './helpers';

const countWhere = (predicate: (service: ServiceData) => boolean) =>
  services.filter(predicate).length;

test.describe('catálogo', () => {
  test('muestra todos los tratamientos agrupados por categoría', async ({ page }) => {
    await page.goto('catalogo/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Catálogo de tratamientos',
    );
    await expect(page.getByRole('searchbox', { name: 'Buscar tratamiento' })).toHaveAttribute(
      'placeholder',
      'Busca: toxina, labios, masaje…',
    );
    await expect(visibleCards(page)).toHaveCount(services.length);
    await expect(page.locator('[data-results-count]')).toHaveText(
      `${services.length} tratamientos`,
    );

    for (const category of categories) {
      const group = page.locator(`[data-category-group="${category.id}"]`);
      await expect(
        group.getByRole('heading', { level: 2, name: twoToneName(category), exact: true }),
      ).toBeVisible();
      await expect(group.locator('[data-service-card]')).toHaveCount(
        countWhere((service) => service.category === category.id),
      );
    }
  });

  test('busca sin importar tildes y sincroniza la URL', async ({ page }) => {
    await page.goto('catalogo/');
    await page.getByRole('searchbox', { name: 'Buscar tratamiento' }).fill('depilacion');

    const expected = servicesMatching('depilacion');
    expect(expected.map((service) => service.id)).toContain('depilacion-laser');
    await expect(visibleCards(page)).toHaveCount(expected.length);
    await expect(
      visibleCards(page).getByRole('heading', { name: serviceById('depilacion-laser').name }),
    ).toBeVisible();
    await expect(page.locator('[data-results-count]')).toHaveText(
      `${expected.length} ${expected.length === 1 ? 'tratamiento' : 'tratamientos'}`,
    );
    await expect(page).toHaveURL(/catalogo\/\?q=depilacion$/);
  });

  test('filtra por categoría y modalidad', async ({ page }) => {
    await page.goto('catalogo/');
    const bienestar = categoryById('bienestar');
    await page
      .getByRole('group', { name: 'Categoría' })
      .getByRole('button', { name: bienestar.shortName, exact: true })
      .click();
    await expect(visibleCards(page)).toHaveCount(
      countWhere((service) => service.category === bienestar.id),
    );
    await expect(page).toHaveURL(/catalogo\/\?cat=bienestar$/);

    await page
      .getByRole('group', { name: 'Modalidad' })
      .getByRole('button', { name: 'A domicilio' })
      .click();
    const atHome = services.filter(
      (service) => service.category === bienestar.id && service.modalities.includes('domicilio'),
    );
    expect(atHome.length).toBeGreaterThan(0);
    await expect(visibleCards(page)).toHaveCount(atHome.length);
    for (const service of atHome) {
      await expect(visibleCards(page).getByRole('heading', { name: service.name })).toBeVisible();
    }
    await expect(page).toHaveURL(/catalogo\/\?cat=bienestar&modo=domicilio$/);
  });

  test('muestra un estado vacío cuando ningún tratamiento cumple los filtros', async ({ page }) => {
    // A category with no home-visit treatments, if the data has one.
    const studioOnly = categories.find(
      (category) =>
        !services.some(
          (service) => service.category === category.id && service.modalities.includes('domicilio'),
        ),
    );
    test.skip(!studioOnly, 'Todas las categorías tienen algún tratamiento a domicilio');

    await page.goto(`catalogo/?cat=${studioOnly!.id}&modo=domicilio`);
    await expect(visibleCards(page)).toHaveCount(0);
    await expect(page.getByText('No encontramos tratamientos con esos filtros')).toBeVisible();
    await page.getByRole('button', { name: 'Ver todos' }).click();
    await expect(visibleCards(page)).toHaveCount(services.length);
  });

  test('lee filtros desde la URL e ignora valores desconocidos', async ({ page }) => {
    await page.goto('catalogo/?cat=estetica-corporal&modo=hackeo&q=');
    const corporal = categoryById('estetica-corporal');
    const expected = countWhere((service) => service.category === corporal.id);
    await expect(visibleCards(page)).toHaveCount(expected);
    await expect(page.locator('[data-results-count]')).toHaveText(`${expected} tratamientos`, {
      timeout: 200,
    });
    await expect(
      page
        .getByRole('group', { name: 'Categoría' })
        .getByRole('button', { name: corporal.shortName, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page
        .getByRole('group', { name: 'Modalidad' })
        .getByRole('button', { name: 'Cualquier lugar' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('las categorías antiguas de la URL se ignoran', async ({ page }) => {
    await page.goto('catalogo/?cat=armonizacion-facial');
    await expect(visibleCards(page)).toHaveCount(services.length);
    await expect(
      page.getByRole('group', { name: 'Categoría' }).getByRole('button', { name: 'Todas' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
